import { requireAuth } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";
import { redirect } from "next/navigation";
import { PortfolioVerticalCard } from "@/components/dashboard/portfolio-vertical-card";
import { getPortfolioLogo } from "@/lib/portfolio-logos";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

function getLastMonthPeriod() {
  const now = new Date();
  const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  return { month: prev.getMonth() + 1, year: prev.getFullYear() };
}

const MONTH_NAMES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

export default async function PortfoliosPage() {
  const user = await requireAuth();

  if (user.role !== UserRole.MAESTRO) {
    if (user.assignedPortfolioId) {
      redirect(`/${user.assignedPortfolioId}/power-plants`);
    }
    redirect("/dashboard");
  }

  const lastMonth = getLastMonthPeriod();
  const currentYear = new Date().getFullYear();

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
    prisma.generationReport.findMany({
      where: { active: 1, periodMonth: lastMonth.month, periodYear: lastMonth.year },
      select: { co2Avoided: true, customerId: true, powerPlant: { select: { portfolioId: true } } },
    }),
    prisma.generationReport.findMany({
      where: { active: 1, periodYear: currentYear },
      select: { co2Avoided: true, customerId: true, powerPlant: { select: { portfolioId: true } } },
    }),
  ]);

  // Map customerId → portfolio IDs
  const customerPortfolioMap = new Map<number, Set<number>>();
  for (const p of portfolios) {
    for (const plant of p.powerPlants) {
      if (!customerPortfolioMap.has(plant.customerId)) {
        customerPortfolioMap.set(plant.customerId, new Set());
      }
      customerPortfolioMap.get(plant.customerId)!.add(p.id);
    }
  }

  function aggregateCo2(reports: typeof reportsLastMonth) {
    const co2Map = new Map<number, number>();
    for (const r of reports) {
      if (r.co2Avoided == null) continue;
      if (r.powerPlant) {
        const pid = r.powerPlant.portfolioId;
        co2Map.set(pid, (co2Map.get(pid) ?? 0) + r.co2Avoided);
      } else if (r.customerId) {
        const pids = customerPortfolioMap.get(r.customerId);
        if (pids) {
          for (const pid of pids) {
            co2Map.set(pid, (co2Map.get(pid) ?? 0) + r.co2Avoided);
          }
        }
      }
    }
    return co2Map;
  }

  const co2LastMonth = aggregateCo2(reportsLastMonth);
  const co2Year = aggregateCo2(reportsYear);
  const lastMonthLabel = `${MONTH_NAMES[lastMonth.month - 1]} ${lastMonth.year}`;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <Box>
        <Typography variant="h5" fontWeight={700} color="text.primary">Portafolios</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
          Selecciona un portafolio para acceder a sus módulos
        </Typography>
      </Box>

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" }, gap: 3, alignItems: "start" }}>
        {portfolios.map((portfolio) => (
          <PortfolioVerticalCard
            key={portfolio.id}
            portfolioId={portfolio.id}
            name={portfolio.name}
            description={portfolio.description}
            logoUrl={getPortfolioLogo(portfolio.id)}
            customerCount={new Set(portfolio.powerPlants.map((p) => p.customerId)).size}
            activePlants={portfolio.powerPlants.filter((p) => p.status === "active").length}
            totalCapacityKw={portfolio.powerPlants.reduce((sum, p) => sum + p.capacityKw, 0)}
            co2LastMonth={co2LastMonth.get(portfolio.id) ?? 0}
            co2Year={co2Year.get(portfolio.id) ?? 0}
            lastMonthLabel={lastMonthLabel}
            href={`/${portfolio.id}/power-plants`}
          />
        ))}
      </Box>
    </Box>
  );
}
