import { requireAuth } from "@/lib/auth/guards";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";

import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";
import { PortfolioVerticalCard } from "@/components/dashboard/portfolio-vertical-card";
import { calculateEquivalentTrees, calculateEquivalentCars } from "@/lib/utils/co2";
import { getPortfolioLogo } from "@/lib/portfolio-logos";
import { ClientDashboard } from "@/components/dashboard/client-dashboard";
import Link from "next/link";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import BoltOutlinedIcon from "@mui/icons-material/BoltOutlined";
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

async function getClienteDashboardData(customerId: number, customerName: string) {
  const currentYear = getCurrentYearRange();
  const reportWhere = {
    active: 1,
    OR: [
      { powerPlant: { customerId, active: 1 } },
      { powerPlantId: null, customerId },
    ],
  };

  const [plants, reportsYear, invoicesYear] = await Promise.all([
    prisma.powerPlant.findMany({
      where: { customerId, active: 1 },
      select: { id: true, name: true, status: true, capacityKw: true, city: true },
    }),
    prisma.generationReport.findMany({
      where: { ...reportWhere, periodYear: currentYear.year },
      select: {
        kwhGenerated: true, co2Avoided: true, periodMonth: true, periodYear: true,
        powerPlantId: true, duemintId: true,
        plantNameRef: { select: { powerPlantId: true } },
      },
    }),
    prisma.invoice.findMany({
      where: {
        customerId,
        active: 1,
        issueDate: {
          gte: new Date(currentYear.year, 0, 1),
          lt: new Date(currentYear.year + 1, 0, 1),
        },
      },
      select: { total: true, statusCode: true, issueDate: true },
    }),
  ]);

  // Monthly generation aggregation
  const monthlyMap = new Map<number, { kwh: number; co2: number }>();
  for (const r of reportsYear) {
    const m = r.periodMonth;
    const entry = monthlyMap.get(m) ?? { kwh: 0, co2: 0 };
    entry.kwh += r.kwhGenerated ?? 0;
    entry.co2 += r.co2Avoided ?? 0;
    monthlyMap.set(m, entry);
  }
  const monthlyGeneration = [...monthlyMap.entries()]
    .map(([month, d]) => ({ month, kwh: d.kwh, co2: d.co2 }))
    .sort((a, b) => a.month - b.month);

  const totalKwhYear = reportsYear.reduce((s, r) => s + (r.kwhGenerated ?? 0), 0);
  const totalCo2Year = reportsYear.reduce((s, r) => s + (r.co2Avoided ?? 0), 0);

  // Billing summary by status
  const billingSummary = {
    pagadas: { total: 0, count: 0 },
    porVencer: { total: 0, count: 0 },
    vencidas: { total: 0, count: 0 },
    notasCredito: { total: 0, count: 0 },
  };
  let totalBillingYear = 0;

  // Monthly billing aggregation
  const billingMonthlyMap = new Map<number, { pagadas: number; porVencer: number; vencidas: number }>();

  for (const inv of invoicesYear) {
    const t = inv.total ?? 0;
    const m = inv.issueDate ? inv.issueDate.getMonth() + 1 : null;

    switch (inv.statusCode) {
      case 1: // Pagada
        billingSummary.pagadas.total += t;
        billingSummary.pagadas.count++;
        totalBillingYear += t;
        if (m) {
          const entry = billingMonthlyMap.get(m) ?? { pagadas: 0, porVencer: 0, vencidas: 0 };
          entry.pagadas += t;
          billingMonthlyMap.set(m, entry);
        }
        break;
      case 2: // Por vencer
        billingSummary.porVencer.total += t;
        billingSummary.porVencer.count++;
        totalBillingYear += t;
        if (m) {
          const entry = billingMonthlyMap.get(m) ?? { pagadas: 0, porVencer: 0, vencidas: 0 };
          entry.porVencer += t;
          billingMonthlyMap.set(m, entry);
        }
        break;
      case 3: // Vencida
        billingSummary.vencidas.total += t;
        billingSummary.vencidas.count++;
        totalBillingYear += t;
        if (m) {
          const entry = billingMonthlyMap.get(m) ?? { pagadas: 0, porVencer: 0, vencidas: 0 };
          entry.vencidas += t;
          billingMonthlyMap.set(m, entry);
        }
        break;
      case 4: // Nota de crédito
        billingSummary.notasCredito.total += t;
        billingSummary.notasCredito.count++;
        break;
    }
  }

  const monthlyBilling = [...billingMonthlyMap.entries()]
    .map(([month, d]) => ({ month, ...d }))
    .sort((a, b) => a.month - b.month);

  // Per-plant stats — resolve powerPlantId through plantNameRef when direct FK is null
  const plantStatsMap = new Map<number, { kwh: number; co2: number; lastMonth: number; lastYear: number; lastDuemintId: string | null }>();
  for (const r of reportsYear) {
    const resolvedPlantId = r.powerPlantId ?? r.plantNameRef?.powerPlantId;
    if (!resolvedPlantId) continue;
    const entry = plantStatsMap.get(resolvedPlantId) ?? { kwh: 0, co2: 0, lastMonth: 0, lastYear: 0, lastDuemintId: null };
    entry.kwh += r.kwhGenerated ?? 0;
    entry.co2 += r.co2Avoided ?? 0;
    const period = r.periodYear * 12 + r.periodMonth;
    if (period > entry.lastYear * 12 + entry.lastMonth) {
      entry.lastMonth = r.periodMonth;
      entry.lastYear = r.periodYear;
      entry.lastDuemintId = r.duemintId;
    }
    plantStatsMap.set(resolvedPlantId, entry);
  }

  const plantRows = plants.map((p) => {
    const stats = plantStatsMap.get(p.id);
    return {
      name: p.name,
      city: p.city,
      status: p.status,
      capacityKw: p.capacityKw,
      kwhYear: stats?.kwh ?? 0,
      co2Year: stats?.co2 ?? 0,
      lastReportMonth: stats?.lastMonth || null,
      lastReportYear: stats?.lastYear || null,
      lastReportDuemintId: stats?.lastDuemintId ?? null,
    };
  });

  // Top 5 plants by kWh
  const topPlants = [...plantRows]
    .sort((a, b) => b.kwhYear - a.kwhYear)
    .slice(0, 5)
    .map((p) => ({ name: p.name, kwh: p.kwhYear }));

  return {
    customerName,
    year: currentYear.year,
    plants: plantRows,
    plantsCount: plants.filter((p) => p.status === "active").length,
    plantsTotal: plants.length,
    kwhYear: totalKwhYear,
    co2Year: totalCo2Year,
    equivalentTrees: calculateEquivalentTrees(totalCo2Year),
    equivalentCars: calculateEquivalentCars(totalCo2Year),
    totalBillingYear,
    invoicesPorVencerCount: billingSummary.porVencer.count,
    monthlyGeneration,
    monthlyBilling,
    billingSummary,
    topPlants,
  };
}

const MONTH_NAMES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

export default async function DashboardPage() {
  const user = await requireAuth();

  if (user.role === UserRole.TECNICO) redirect("/contingencies");

  // MAESTRO
  if (user.role === UserRole.MAESTRO) {
    const data = await getMaestroDashboardData();
    const cookieStore = await cookies();
    const selectedPortfolioId = parseInt(cookieStore.get("portfolio_id")?.value ?? "") || null;

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
              portfolioId={portfolio.id}
              isSelected={portfolio.id === selectedPortfolioId}
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
    const customer = await prisma.customer.findUnique({ where: { id: user.customerId }, select: { name: true } });
    const data = await getClienteDashboardData(user.customerId, customer?.name ?? "");
    return <ClientDashboard {...data} />;
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
