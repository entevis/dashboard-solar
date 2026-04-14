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
import WarningAmberOutlinedIcon from "@mui/icons-material/WarningAmberOutlined";
import ArrowForwardOutlinedIcon from "@mui/icons-material/ArrowForwardOutlined";

async function getMaestroDashboardData() {
  const [portfolios, openContingencies, generationReports] = await Promise.all([
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
    prisma.contingency.findMany({
      where: { active: 1, status: { in: ["OPEN", "IN_PROGRESS"] } },
      select: { powerPlant: { select: { portfolioId: true } } },
    }),
    prisma.generationReport.findMany({
      where: { active: 1, powerPlantId: { not: null } },
      select: { co2Avoided: true, powerPlant: { select: { portfolioId: true } } },
    }),
  ]);

  const contingenciesByPortfolio = new Map<number, number>();
  for (const c of openContingencies) {
    const pid = c.powerPlant.portfolioId;
    contingenciesByPortfolio.set(pid, (contingenciesByPortfolio.get(pid) ?? 0) + 1);
  }

  const co2ByPortfolio = new Map<number, number>();
  for (const r of generationReports) {
    if (!r.powerPlant || r.co2Avoided == null) continue;
    const pid = r.powerPlant.portfolioId;
    co2ByPortfolio.set(pid, (co2ByPortfolio.get(pid) ?? 0) + r.co2Avoided);
  }

  return { portfolios, contingenciesByPortfolio, co2ByPortfolio };
}

async function getClienteDashboardData(customerId: number) {
  const [plants, generationReports] = await Promise.all([
    prisma.powerPlant.findMany({
      where: { customerId, active: 1 },
      select: { id: true, name: true, status: true, capacityKw: true, location: true },
    }),
    prisma.generationReport.aggregate({
      where: {
        active: 1,
        OR: [
          { powerPlant: { customerId, active: 1 } },
          { powerPlantId: null, customerId },
        ],
      },
      _sum: { kwhGenerated: true, co2Avoided: true },
    }),
  ]);

  const totalKwh = generationReports._sum.kwhGenerated ?? 0;
  const totalCo2 = generationReports._sum.co2Avoided ?? 0;

  return { plants, totalKwh, totalCo2 };
}

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
              openContingencies={data.contingenciesByPortfolio.get(portfolio.id) ?? 0}
              co2Avoided={data.co2ByPortfolio.get(portfolio.id) ?? 0}
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
          <KpiCard label="Generación Total" value={`${Math.round(data.totalKwh).toLocaleString("es-CL")} kWh`} icon={<BoltOutlinedIcon sx={{ fontSize: 20 }} />} />
          <KpiCard label="CO2 Evitado" value={`${data.totalCo2.toFixed(1)} ton`} icon={<EnergySavingsLeafOutlinedIcon sx={{ fontSize: 20 }} />} />
        </Box>

        <EnvironmentalImpact
          co2Tonnes={data.totalCo2}
          equivalentTrees={calculateEquivalentTrees(data.totalCo2)}
          equivalentCars={calculateEquivalentCars(data.totalCo2)}
        />
      </Box>
    );
  }

  // OPERATIVO
  const opPid = user.assignedPortfolioId;
  const quickLinks = [
    { href: `/${opPid}/power-plants`, icon: <BoltOutlinedIcon sx={{ fontSize: 18, color: "#004ac6" }} />, iconBg: "#dbe1ff", label: "Plantas", sublabel: "Ver plantas asignadas", hoverBorder: "#004ac6" },
    { href: `/${opPid}/contingencies`, icon: <WarningAmberOutlinedIcon sx={{ fontSize: 18, color: "#a16207" }} />, iconBg: "#fef9c3", label: "Contingencias", sublabel: "Revisar alertas activas", hoverBorder: "#a16207" },
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
