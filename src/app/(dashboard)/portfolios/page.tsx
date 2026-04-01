import { requireAuth } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";
import { redirect } from "next/navigation";
import { PortfolioVerticalCard } from "@/components/dashboard/portfolio-vertical-card";
import { getPortfolioLogo } from "@/lib/portfolio-logos";

export default async function PortfoliosPage() {
  const user = await requireAuth();

  // Roles con portafolio fijo → redirigir directamente sin mostrar selección
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
      where: { active: 1 },
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
    const pid = r.powerPlant.portfolioId;
    co2ByPortfolio.set(pid, (co2ByPortfolio.get(pid) ?? 0) + r.co2Avoided);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-bold text-[var(--color-foreground)]">Portafolios</h1>
        <p className="text-[13px] text-[var(--color-muted-foreground)]">
          Selecciona un portafolio para acceder a sus módulos
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
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
      </div>
    </div>
  );
}
