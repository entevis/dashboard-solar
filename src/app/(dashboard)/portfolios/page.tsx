import { requireAuth } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";
import { redirect } from "next/navigation";
import { PortfolioVerticalCard } from "@/components/dashboard/portfolio-vertical-card";
import { getPortfolioLogo } from "@/lib/portfolio-logos";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

export default async function PortfoliosPage() {
  const user = await requireAuth();

  if (user.role !== UserRole.MAESTRO) {
    if (user.assignedPortfolioId) {
      redirect(`/${user.assignedPortfolioId}/power-plants`);
    }
    redirect("/dashboard");
  }

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
            name={portfolio.name}
            description={portfolio.description}
            logoUrl={getPortfolioLogo(portfolio.id)}
            customerCount={new Set(portfolio.powerPlants.map((p) => p.customerId)).size}
            activePlants={portfolio.powerPlants.filter((p) => p.status === "active").length}
            totalCapacityKw={portfolio.powerPlants.reduce((sum, p) => sum + p.capacityKw, 0)}
            openContingencies={contingenciesByPortfolio.get(portfolio.id) ?? 0}
            co2Avoided={co2ByPortfolio.get(portfolio.id) ?? 0}
            href={`/${portfolio.id}/power-plants`}
          />
        ))}
      </Box>
    </Box>
  );
}
