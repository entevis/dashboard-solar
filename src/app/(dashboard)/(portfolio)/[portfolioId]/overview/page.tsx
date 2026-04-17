import { requireAuth } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";
import { redirect } from "next/navigation";
import { calculateEquivalentTrees, calculateEquivalentCars } from "@/lib/utils/co2";
import { getPortfolioLogo } from "@/lib/portfolio-logos";
import { PortfolioOverview } from "@/components/dashboard/portfolio-overview";

interface Props {
  params: Promise<{ portfolioId: string }>;
}

export default async function PortfolioOverviewPage({ params }: Props) {
  const user = await requireAuth();
  if (user.role !== UserRole.MAESTRO) redirect("/dashboard");

  const { portfolioId } = await params;
  const pid = parseInt(portfolioId);
  const year = new Date().getFullYear();

  const portfolio = await prisma.portfolio.findUnique({
    where: { id: pid, active: 1 },
    select: { id: true, name: true },
  });
  if (!portfolio) redirect("/dashboard");

  const [plants, reportsYear, invoicesYear] = await Promise.all([
    prisma.powerPlant.findMany({
      where: { portfolioId: pid, active: 1 },
      select: {
        id: true, name: true, customerId: true, capacityKw: true, city: true,
        customer: { select: { id: true, name: true } },
      },
    }),
    prisma.generationReport.findMany({
      where: {
        active: 1,
        periodYear: year,
        OR: [
          { powerPlant: { portfolioId: pid, active: 1 } },
          { plantNameRef: { powerPlant: { portfolioId: pid, active: 1 } } },
        ],
      },
      select: {
        kwhGenerated: true, co2Avoided: true, periodMonth: true, periodYear: true,
        powerPlantId: true, duemintId: true,
        plantNameRef: { select: { powerPlantId: true } },
      },
    }),
    prisma.invoice.findMany({
      where: {
        portfolioId: pid, active: 1,
        issueDate: { gte: new Date(year, 0, 1), lt: new Date(year + 1, 0, 1) },
      },
      select: {
        total: true, statusCode: true, issueDate: true, dueDate: true,
        customerId: true, customer: { select: { name: true } },
      },
    }),
  ]);

  const clientIds = new Set(plants.map((p) => p.customerId));

  // Monthly generation
  const monthlyMap = new Map<number, { kwh: number; co2: number }>();
  const plantStatsMap = new Map<number, { kwh: number; co2: number; lastMonth: number; lastYear: number; lastDuemintId: string | null }>();
  let totalKwh = 0;
  let totalCo2 = 0;

  for (const r of reportsYear) {
    const resolvedPlantId = r.powerPlantId ?? r.plantNameRef?.powerPlantId;
    const kwh = r.kwhGenerated ?? 0;
    const co2 = r.co2Avoided ?? 0;
    totalKwh += kwh;
    totalCo2 += co2;

    const m = r.periodMonth;
    const mEntry = monthlyMap.get(m) ?? { kwh: 0, co2: 0 };
    mEntry.kwh += kwh;
    mEntry.co2 += co2;
    monthlyMap.set(m, mEntry);

    if (resolvedPlantId) {
      const entry = plantStatsMap.get(resolvedPlantId) ?? { kwh: 0, co2: 0, lastMonth: 0, lastYear: 0, lastDuemintId: null };
      entry.kwh += kwh;
      entry.co2 += co2;
      const period = r.periodYear * 12 + r.periodMonth;
      if (period > entry.lastYear * 12 + entry.lastMonth) {
        entry.lastMonth = r.periodMonth;
        entry.lastYear = r.periodYear;
        entry.lastDuemintId = r.duemintId;
      }
      plantStatsMap.set(resolvedPlantId, entry);
    }
  }

  const monthlyGeneration = [...monthlyMap.entries()].map(([month, d]) => ({ month, kwh: d.kwh, co2: d.co2 })).sort((a, b) => a.month - b.month);

  // Billing
  const billingSummary = { pagadas: { total: 0, count: 0 }, porVencer: { total: 0, count: 0 }, vencidas: { total: 0, count: 0 }, notasCredito: { total: 0, count: 0 } };
  let totalBilling = 0;
  const billingMonthlyMap = new Map<number, { pagadas: number; porVencer: number; vencidas: number }>();
  const customerBilling = new Map<number, number>();
  const customerPending = new Map<number, { count: number; overdue: boolean }>();
  const overdueList: { customerName: string; total: number; daysOverdue: number }[] = [];
  const now = new Date();

  for (const inv of invoicesYear) {
    const t = inv.total ?? 0;
    const m = inv.issueDate ? inv.issueDate.getMonth() + 1 : null;
    const cid = inv.customerId;

    switch (inv.statusCode) {
      case 1:
        billingSummary.pagadas.total += t; billingSummary.pagadas.count++; totalBilling += t;
        customerBilling.set(cid, (customerBilling.get(cid) ?? 0) + t);
        if (m) { const e = billingMonthlyMap.get(m) ?? { pagadas: 0, porVencer: 0, vencidas: 0 }; e.pagadas += t; billingMonthlyMap.set(m, e); }
        break;
      case 2:
        billingSummary.porVencer.total += t; billingSummary.porVencer.count++; totalBilling += t;
        customerBilling.set(cid, (customerBilling.get(cid) ?? 0) + t);
        { const pe = customerPending.get(cid) ?? { count: 0, overdue: false }; pe.count++; customerPending.set(cid, pe); }
        if (m) { const e = billingMonthlyMap.get(m) ?? { pagadas: 0, porVencer: 0, vencidas: 0 }; e.porVencer += t; billingMonthlyMap.set(m, e); }
        break;
      case 3:
        billingSummary.vencidas.total += t; billingSummary.vencidas.count++; totalBilling += t;
        customerBilling.set(cid, (customerBilling.get(cid) ?? 0) + t);
        { const pe = customerPending.get(cid) ?? { count: 0, overdue: false }; pe.count++; pe.overdue = true; customerPending.set(cid, pe); }
        if (m) { const e = billingMonthlyMap.get(m) ?? { pagadas: 0, porVencer: 0, vencidas: 0 }; e.vencidas += t; billingMonthlyMap.set(m, e); }
        if (inv.dueDate) {
          const days = Math.floor((now.getTime() - inv.dueDate.getTime()) / (1000 * 60 * 60 * 24));
          if (days > 0) overdueList.push({ customerName: inv.customer.name, total: t, daysOverdue: days });
        }
        break;
      case 4:
        billingSummary.notasCredito.total += t; billingSummary.notasCredito.count++;
        break;
    }
  }

  const monthlyBilling = [...billingMonthlyMap.entries()].map(([month, d]) => ({ month, ...d })).sort((a, b) => a.month - b.month);
  const overdueInvoices = overdueList.sort((a, b) => b.daysOverdue - a.daysOverdue).slice(0, 10);

  // Client stats
  const clientMap = new Map<number, { name: string; plantsCount: number; capacityKw: number }>();
  for (const p of plants) {
    const entry = clientMap.get(p.customerId) ?? { name: p.customer.name, plantsCount: 0, capacityKw: 0 };
    entry.plantsCount++;
    entry.capacityKw += p.capacityKw;
    clientMap.set(p.customerId, entry);
  }

  // Aggregate plant stats per customer
  const customerKwh = new Map<number, number>();
  const customerCo2 = new Map<number, number>();
  for (const p of plants) {
    const stats = plantStatsMap.get(p.id);
    if (stats) {
      customerKwh.set(p.customerId, (customerKwh.get(p.customerId) ?? 0) + stats.kwh);
      customerCo2.set(p.customerId, (customerCo2.get(p.customerId) ?? 0) + stats.co2);
    }
  }

  const topClients = [...clientMap.entries()]
    .map(([id, c]) => {
      const pending = customerPending.get(id);
      return {
        id,
        name: c.name,
        plantsCount: c.plantsCount,
        capacityKw: c.capacityKw,
        kwhYear: customerKwh.get(id) ?? 0,
        co2Year: customerCo2.get(id) ?? 0,
        billingYear: customerBilling.get(id) ?? 0,
        pendingCount: pending?.count ?? 0,
        pendingLabel: pending?.overdue ? "vencidas" : "por vencer",
      };
    })
    .sort((a, b) => b.kwhYear - a.kwhYear)
    .slice(0, 10);

  const topClientsBilling = [...clientMap.entries()]
    .map(([id, c]) => ({ name: c.name, total: customerBilling.get(id) ?? 0 }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  // Top plants
  const topPlants = plants
    .map((p) => {
      const stats = plantStatsMap.get(p.id);
      return {
        name: p.name,
        customerName: p.customer.name,
        city: p.city,
        capacityKw: p.capacityKw,
        kwhYear: stats?.kwh ?? 0,
        co2Year: stats?.co2 ?? 0,
        lastReportMonth: stats?.lastMonth || null,
        lastReportYear: stats?.lastYear || null,
        lastReportDuemintId: stats?.lastDuemintId ?? null,
      };
    })
    .sort((a, b) => b.kwhYear - a.kwhYear)
    .slice(0, 10);

  return (
    <PortfolioOverview
      portfolioName={portfolio.name}
      logoUrl={getPortfolioLogo(portfolio.id)}
      year={year}
      plantsCount={plants.length}
      clientsCount={clientIds.size}
      totalCapacityKw={plants.reduce((s, p) => s + p.capacityKw, 0)}
      kwhYear={totalKwh}
      co2Year={totalCo2}
      equivalentTrees={calculateEquivalentTrees(totalCo2)}
      equivalentCars={calculateEquivalentCars(totalCo2)}
      totalBillingYear={totalBilling}
      invoicesPorVencerCount={billingSummary.porVencer.count}
      monthlyGeneration={monthlyGeneration}
      monthlyBilling={monthlyBilling}
      billingSummary={billingSummary}
      overdueInvoices={overdueInvoices}
      topClients={topClients}
      topPlants={topPlants}
      topClientsBilling={topClientsBilling}
    />
  );
}
