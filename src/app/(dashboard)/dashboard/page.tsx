import { requireAuth } from "@/lib/auth/guards";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { PortfolioVerticalCard } from "@/components/dashboard/portfolio-vertical-card";
import { EnvironmentalImpact } from "@/components/dashboard/environmental-impact";
import { calculateEquivalentTrees, calculateEquivalentCars } from "@/lib/utils/co2";
import { getPortfolioLogo } from "@/lib/portfolio-logos";
import Link from "next/link";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import BoltOutlinedIcon from "@mui/icons-material/BoltOutlined";
import EnergySavingsLeafOutlinedIcon from "@mui/icons-material/EnergySavingsLeafOutlined";
import ArrowForwardOutlinedIcon from "@mui/icons-material/ArrowForwardOutlined";

function getLastMonthPeriod() {
  const now = new Date();
  const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  return { month: prev.getMonth() + 1, year: prev.getFullYear() };
}

function getCurrentYearRange() {
  const now = new Date();
  return { year: now.getFullYear() };
}

async function getMaestroDashboardData() {
  const lastMonth = getLastMonthPeriod();
  const currentYear = getCurrentYearRange();

  const [portfolios, reportsLastMonth, reportsYear] = await Promise.all([
    prisma.portfolio.findMany({
      where: { active: 1 },
      include: {
        powerPlants: {
          where: { active: 1 },
          select: { id: true, capacityKw: true, status: true, customerId: true },
        },
      },
      orderBy: { id: "asc" },
    }),
    // Last month CO2 — from GenerationReport (both plant-level and customer-level)
    prisma.generationReport.findMany({
      where: {
        active: 1,
        periodMonth: lastMonth.month,
        periodYear: lastMonth.year,
      },
      select: {
        co2Avoided: true,
        customerId: true,
        powerPlant: { select: { portfolioId: true } },
      },
    }),
    // Current year CO2
    prisma.generationReport.findMany({
      where: {
        active: 1,
        periodYear: currentYear.year,
      },
      select: {
        co2Avoided: true,
        customerId: true,
        powerPlant: { select: { portfolioId: true } },
      },
    }),
  ]);

  // Build a map of customerId → portfolioIds for customer-level reports
  const customerPortfolioMap = new Map<number, Set<number>>();
  for (const p of portfolios) {
    for (const plant of p.powerPlants) {
      if (!customerPortfolioMap.has(plant.customerId)) {
        customerPortfolioMap.set(plant.customerId, new Set());
      }
      customerPortfolioMap.get(plant.customerId)!.add(p.id);
    }
  }

  function aggregateCo2ByPortfolio(reports: typeof reportsLastMonth) {
    const co2Map = new Map<number, number>();
    for (const r of reports) {
      if (r.co2Avoided == null) continue;

      if (r.powerPlant) {
        // Plant-level report → direct portfolio
        const pid = r.powerPlant.portfolioId;
        co2Map.set(pid, (co2Map.get(pid) ?? 0) + r.co2Avoided);
      } else if (r.customerId) {
        // Customer-level report → distribute to all portfolios where this customer has plants
        const pids = customerPortfolioMap.get(r.customerId);
        if (pids) {
          // If customer has plants in multiple portfolios, assign to each
          // (the CO2 is per-customer, but we show it in each portfolio they belong to)
          for (const pid of pids) {
            co2Map.set(pid, (co2Map.get(pid) ?? 0) + r.co2Avoided);
          }
        }
      }
    }
    return co2Map;
  }

  const co2LastMonth = aggregateCo2ByPortfolio(reportsLastMonth);
  const co2Year = aggregateCo2ByPortfolio(reportsYear);

  return { portfolios, co2LastMonth, co2Year, lastMonth };
}

async function getClienteDashboardData(customerId: number) {
  const lastMonth = getLastMonthPeriod();
  const currentYear = getCurrentYearRange();
  const customerReportWhere = {
    active: 1,
    OR: [
      { powerPlant: { customerId, active: 1 } },
      { powerPlantId: null, customerId },
    ],
  };

  const [plants, co2LastMonth, co2Year] = await Promise.all([
    prisma.powerPlant.findMany({
      where: { customerId, active: 1 },
      select: { id: true, name: true, status: true, capacityKw: true, location: true },
    }),
    prisma.generationReport.aggregate({
      where: {
        ...customerReportWhere,
        periodMonth: lastMonth.month,
        periodYear: lastMonth.year,
      },
      _sum: { kwhGenerated: true, co2Avoided: true },
    }),
    prisma.generationReport.aggregate({
      where: {
        ...customerReportWhere,
        periodYear: currentYear.year,
      },
      _sum: { kwhGenerated: true, co2Avoided: true },
    }),
  ]);

  return {
    plants,
    co2LastMonth: co2LastMonth._sum.co2Avoided ?? 0,
    kwhLastMonth: co2LastMonth._sum.kwhGenerated ?? 0,
    co2Year: co2Year._sum.co2Avoided ?? 0,
    kwhYear: co2Year._sum.kwhGenerated ?? 0,
    lastMonth,
  };
}

const MONTH_NAMES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

export default async function DashboardPage() {
  const user = await requireAuth();

  if (user.role === UserRole.TECNICO) redirect("/contingencies");

  // MAESTRO
  if (user.role === UserRole.MAESTRO) {
    const data = await getMaestroDashboardData();

    return (
      <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={700} color="text.primary">Dashboard</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
            Vista consolidada de los portafolios
          </Typography>
        </Box>

        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" }, gap: 3, alignItems: "start" }}>
          {data.portfolios.map((portfolio) => (
            <PortfolioVerticalCard
              key={portfolio.id}
              name={portfolio.name}
              description={portfolio.description}
              logoUrl={getPortfolioLogo(portfolio.id)}
              customerCount={new Set(portfolio.powerPlants.map((p) => p.customerId)).size}
              activePlants={portfolio.powerPlants.filter((p) => p.status === "active").length}
              totalCapacityKw={portfolio.powerPlants.reduce((sum, p) => sum + p.capacityKw, 0)}
              co2LastMonth={data.co2LastMonth.get(portfolio.id) ?? 0}
              co2Year={data.co2Year.get(portfolio.id) ?? 0}
              lastMonthLabel={`${MONTH_NAMES[data.lastMonth.month - 1]} ${data.lastMonth.year}`}
              href={`/${portfolio.id}/power-plants`}
            />
          ))}
        </Box>
      </Box>
    );
  }

  // CLIENTE / CLIENTE_PERFILADO
  if ((user.role === UserRole.CLIENTE || user.role === UserRole.CLIENTE_PERFILADO) && user.customerId) {
    const data = await getClienteDashboardData(user.customerId);
    const monthLabel = `${MONTH_NAMES[data.lastMonth.month - 1]} ${data.lastMonth.year}`;

    return (
      <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={700} color="text.primary">Mis Plantas</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
            Resumen de tus activos solares
          </Typography>
        </Box>

        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" }, gap: 2 }}>
          <KpiCard label="Plantas" value={String(data.plants.length)} icon={<BoltOutlinedIcon sx={{ fontSize: 20 }} />} />
          <KpiCard label={`CO₂ evitado · ${monthLabel}`} value={`${data.co2LastMonth.toFixed(1)} ton`} icon={<EnergySavingsLeafOutlinedIcon sx={{ fontSize: 20 }} />} />
          <KpiCard label={`CO₂ evitado · ${data.lastMonth.year}`} value={`${data.co2Year.toFixed(1)} ton`} icon={<EnergySavingsLeafOutlinedIcon sx={{ fontSize: 20 }} />} />
        </Box>

        <EnvironmentalImpact
          co2Tonnes={data.co2Year}
          equivalentTrees={calculateEquivalentTrees(data.co2Year)}
          equivalentCars={calculateEquivalentCars(data.co2Year)}
          yearLabel={String(data.lastMonth.year)}
        />
      </Box>
    );
  }

  // OPERATIVO
  const opPid = user.assignedPortfolioId;
  const quickLinks = [
    { href: `/${opPid}/power-plants`, icon: <BoltOutlinedIcon sx={{ fontSize: 18, color: "#004ac6" }} />, iconBg: "#dbe1ff", label: "Plantas", sublabel: "Ver plantas asignadas", hoverBorder: "#004ac6" },
  ];

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <Box>
        <Typography variant="h5" fontWeight={700} color="text.primary">Dashboard</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>Tu portafolio asignado</Typography>
      </Box>

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)" }, gap: 2, maxWidth: 480 }}>
        {quickLinks.map((item) => (
          <Card
            key={item.href}
            component={Link}
            href={item.href}
            elevation={0}
            sx={{
              border: "1px solid", borderColor: "divider", textDecoration: "none", display: "flex",
              transition: "all 150ms", "&:hover": { borderColor: item.hoverBorder, boxShadow: "0 4px 12px rgba(13,28,46,0.08)" },
            }}
          >
            <CardContent sx={{ display: "flex", alignItems: "center", gap: 2, width: "100%" }}>
              <Box sx={{ width: 36, height: 36, borderRadius: 1.5, backgroundColor: item.iconBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                {item.icon}
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography fontSize="0.8125rem" fontWeight={600} color="text.primary">{item.label}</Typography>
                <Typography variant="caption" color="text.secondary">{item.sublabel}</Typography>
              </Box>
              <ArrowForwardOutlinedIcon sx={{ fontSize: 16, color: "text.secondary", flexShrink: 0 }} />
            </CardContent>
          </Card>
        ))}
      </Box>
    </Box>
  );
}
