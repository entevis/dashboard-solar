import { requireAuth, getAccessiblePowerPlantIds } from "@/lib/auth/guards";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";
import { calculateEquivalentTrees, calculateEquivalentCars } from "@/lib/utils/co2";
import { MaestroDashboard } from "@/components/dashboard/maestro-dashboard";
import { ClientDashboard } from "@/components/dashboard/client-dashboard";
import Link from "next/link";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import BoltOutlinedIcon from "@mui/icons-material/BoltOutlined";
import ArrowForwardOutlinedIcon from "@mui/icons-material/ArrowForwardOutlined";

function getCurrentYearRange() {
  const now = new Date();
  return { year: now.getFullYear() };
}

async function getMaestroDashboardData() {
  const currentYear = getCurrentYearRange();

  const [portfolios, reportsYear, invoicesYear] = await Promise.all([
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
    prisma.generationReport.findMany({
      where: { active: 1, periodYear: currentYear.year },
      select: {
        kwhGenerated: true, co2Avoided: true, periodMonth: true,
        powerPlantId: true,
        powerPlant: { select: { portfolioId: true } },
        plantNameRef: { select: { powerPlant: { select: { portfolioId: true } } } },
      },
    }),
    prisma.invoice.findMany({
      where: {
        active: 1,
        issueDate: { gte: new Date(currentYear.year, 0, 1), lt: new Date(currentYear.year + 1, 0, 1) },
      },
      select: { total: true, statusCode: true, issueDate: true, portfolioId: true },
    }),
  ]);

  const totalPlants = portfolios.reduce((s, p) => s + p.powerPlants.length, 0);
  const totalCapacityKw = portfolios.reduce((s, p) => s + p.powerPlants.reduce((ss, pp) => ss + pp.capacityKw, 0), 0);
  const allCustomerIds = new Set<number>();
  portfolios.forEach((p) => p.powerPlants.forEach((pp) => allCustomerIds.add(pp.customerId)));

  // Monthly generation by portfolio
  type MKey = string;
  const monthlyMap = new Map<MKey, { kwh: number; co2: number }>();
  let totalKwh = 0;
  let totalCo2 = 0;

  for (const r of reportsYear) {
    const pid = r.powerPlant?.portfolioId ?? r.plantNameRef?.powerPlant?.portfolioId;
    if (!pid) continue;
    const key: MKey = `${r.periodMonth}-${pid}`;
    const entry = monthlyMap.get(key) ?? { kwh: 0, co2: 0 };
    entry.kwh += r.kwhGenerated ?? 0;
    entry.co2 += r.co2Avoided ?? 0;
    monthlyMap.set(key, entry);
    totalKwh += r.kwhGenerated ?? 0;
    totalCo2 += r.co2Avoided ?? 0;
  }

  const monthlyByPortfolio = [...monthlyMap.entries()].map(([key, d]) => {
    const [month, portfolioId] = key.split("-").map(Number);
    return { month, portfolioId, kwh: d.kwh, co2: d.co2 };
  });

  // Per-portfolio generation totals
  const portfolioKwh = new Map<number, number>();
  const portfolioCo2 = new Map<number, number>();
  for (const m of monthlyByPortfolio) {
    portfolioKwh.set(m.portfolioId, (portfolioKwh.get(m.portfolioId) ?? 0) + m.kwh);
    portfolioCo2.set(m.portfolioId, (portfolioCo2.get(m.portfolioId) ?? 0) + m.co2);
  }

  // Billing
  const billingSummary = { pagadas: { total: 0, count: 0 }, porVencer: { total: 0, count: 0 }, vencidas: { total: 0, count: 0 }, notasCredito: { total: 0, count: 0 } };
  const portfolioBilling = new Map<number, number>();
  const portfolioPorVencer = new Map<number, number>();
  const portfolioVencidas = new Map<number, number>();
  const billingMonthlyMap = new Map<number, { pagadas: number; porVencer: number; vencidas: number }>();

  for (const inv of invoicesYear) {
    const t = inv.total ?? 0;
    const m = inv.issueDate ? inv.issueDate.getMonth() + 1 : null;
    const pid = inv.portfolioId;

    switch (inv.statusCode) {
      case 1:
        billingSummary.pagadas.total += t; billingSummary.pagadas.count++;
        if (pid) portfolioBilling.set(pid, (portfolioBilling.get(pid) ?? 0) + t);
        if (m) { const e = billingMonthlyMap.get(m) ?? { pagadas: 0, porVencer: 0, vencidas: 0 }; e.pagadas += t; billingMonthlyMap.set(m, e); }
        break;
      case 2:
        billingSummary.porVencer.total += t; billingSummary.porVencer.count++;
        if (pid) {
          portfolioBilling.set(pid, (portfolioBilling.get(pid) ?? 0) + t);
          portfolioPorVencer.set(pid, (portfolioPorVencer.get(pid) ?? 0) + 1);
        }
        if (m) { const e = billingMonthlyMap.get(m) ?? { pagadas: 0, porVencer: 0, vencidas: 0 }; e.porVencer += t; billingMonthlyMap.set(m, e); }
        break;
      case 3:
        billingSummary.vencidas.total += t; billingSummary.vencidas.count++;
        if (pid) {
          portfolioBilling.set(pid, (portfolioBilling.get(pid) ?? 0) + t);
          portfolioVencidas.set(pid, (portfolioVencidas.get(pid) ?? 0) + 1);
        }
        if (m) { const e = billingMonthlyMap.get(m) ?? { pagadas: 0, porVencer: 0, vencidas: 0 }; e.vencidas += t; billingMonthlyMap.set(m, e); }
        break;
      case 4:
        billingSummary.notasCredito.total += t; billingSummary.notasCredito.count++;
        break;
    }
  }

  const monthlyBilling = [...billingMonthlyMap.entries()].map(([month, d]) => ({ month, ...d })).sort((a, b) => a.month - b.month);

  const portfolioRows = portfolios.map((p) => {
    return {
      id: p.id,
      name: p.name,
      plantsCount: p.powerPlants.length,
      capacityKw: p.powerPlants.reduce((s, pp) => s + pp.capacityKw, 0),
      kwhYear: portfolioKwh.get(p.id) ?? 0,
      co2Year: portfolioCo2.get(p.id) ?? 0,
      billingYear: portfolioBilling.get(p.id) ?? 0,
      porVencerCount: portfolioPorVencer.get(p.id) ?? 0,
      vencidasCount: portfolioVencidas.get(p.id) ?? 0,
    };
  });

  const portfolioDistribution = portfolioRows.map((p) => ({ name: p.name, total: p.billingYear }));

  return {
    year: currentYear.year,
    totalPlants,
    totalCapacityKw,
    totalKwhYear: totalKwh,
    totalCo2Year: totalCo2,
    totalClients: allCustomerIds.size,
    equivalentTrees: calculateEquivalentTrees(totalCo2),
    equivalentCars: calculateEquivalentCars(totalCo2),
    portfolios: portfolioRows,
    monthlyByPortfolio,
    billingSummary,
    monthlyBilling,
    portfolioDistribution,
  };
}

async function getClienteDashboardData(customerId: number, customerName: string, plantIds?: number[]) {
  const currentYear = getCurrentYearRange();
  // When plantIds is set (CLIENTE_PERFILADO), restrict to those plants — matching both
  // direct powerPlantId and the plantNameRef path (reports/invoices may have null
  // powerPlantId but link through plant_name_id or duemint_id).
  const plantsWhere = plantIds
    ? { id: { in: plantIds }, customerId, active: 1 }
    : { customerId, active: 1 };

  // Pre-fetch duemintIds of reports tied to permitted plants to scope invoices
  // lacking a direct powerPlantId.
  const accessibleDuemintIds = plantIds
    ? await prisma.generationReport.findMany({
        where: {
          active: 1,
          duemintId: { not: null },
          OR: [
            { powerPlantId: { in: plantIds } },
            { plantNameRef: { powerPlantId: { in: plantIds } } },
          ],
        },
        select: { duemintId: true },
      }).then((rows) => rows.map((r) => r.duemintId).filter(Boolean) as string[])
    : [];

  const reportWhere = plantIds
    ? {
        active: 1,
        OR: [
          { powerPlantId: { in: plantIds } },
          { plantNameRef: { powerPlantId: { in: plantIds } } },
        ],
      }
    : {
        active: 1,
        OR: [
          { powerPlant: { customerId, active: 1 } },
          { powerPlantId: null, customerId },
        ],
      };

  const invoiceWhere: Record<string, unknown> = {
    customerId,
    active: 1,
    issueDate: {
      gte: new Date(currentYear.year, 0, 1),
      lt: new Date(currentYear.year + 1, 0, 1),
    },
  };
  if (plantIds) {
    invoiceWhere.OR = [
      { powerPlantId: { in: plantIds } },
      { duemintId: { in: accessibleDuemintIds } },
    ];
  }

  const [plants, reportsYear, invoicesYear] = await Promise.all([
    prisma.powerPlant.findMany({
      where: plantsWhere,
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
      where: invoiceWhere,
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

export default async function DashboardPage() {
  const user = await requireAuth();

  if (user.role === UserRole.TECNICO) redirect("/contingencies");

  // MAESTRO
  if (user.role === UserRole.MAESTRO) {
    const data = await getMaestroDashboardData();
    return <MaestroDashboard {...data} />;
  }

  // CLIENTE / CLIENTE_PERFILADO
  if ((user.role === UserRole.CLIENTE || user.role === UserRole.CLIENTE_PERFILADO) && user.customerId) {
    const customer = await prisma.customer.findUnique({ where: { id: user.customerId }, select: { name: true } });
    let plantIds: number[] | undefined;
    if (user.role === UserRole.CLIENTE_PERFILADO) {
      const accessible = await getAccessiblePowerPlantIds(user);
      plantIds = accessible === "all" ? undefined : accessible;
    }
    const data = await getClienteDashboardData(user.customerId, customer?.name ?? "", plantIds);
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
