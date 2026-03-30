import { requireAuth } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { PortfolioVerticalCard } from "@/components/dashboard/portfolio-vertical-card";
import { EnvironmentalImpact } from "@/components/dashboard/environmental-impact";
import { calculateEquivalentTrees, calculateEquivalentCars } from "@/lib/utils/co2";
import { Zap, Leaf } from "lucide-react";
import { getPortfolioLogo } from "@/lib/portfolio-logos";

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
      where: { active: 1 },
      select: { co2Avoided: true, powerPlant: { select: { portfolioId: true } } },
    }),
  ]);

  // Aggregate per portfolio
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
        powerPlant: { customerId, active: 1 },
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

  if (user.role === UserRole.MAESTRO) {
    const data = await getMaestroDashboardData();

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-lg font-bold text-[var(--color-foreground)]">
            Dashboard
          </h1>
          <p className="text-[13px] text-[var(--color-muted-foreground)]">
            Vista consolidada de los portafolios
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
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
              href={`/power-plants?portfolioId=${portfolio.id}`}
            />
          ))}
        </div>
      </div>
    );
  }

  // Cliente / Cliente Perfilado view
  if (
    (user.role === UserRole.CLIENTE ||
      user.role === UserRole.CLIENTE_PERFILADO) &&
    user.customerId
  ) {
    const data = await getClienteDashboardData(user.customerId);

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-lg font-bold text-[var(--color-foreground)]">
            Mis Plantas
          </h1>
          <p className="text-[13px] text-[var(--color-muted-foreground)]">
            Resumen de tus activos solares
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <KpiCard
            label="Plantas"
            value={String(data.plants.length)}
            icon={<Zap className="w-5 h-5" />}
          />
          <KpiCard
            label="Generación Total"
            value={`${Math.round(data.totalKwh).toLocaleString("es-CL")} kWh`}
            icon={<Zap className="w-5 h-5" />}
          />
          <KpiCard
            label="CO2 Evitado"
            value={`${data.totalCo2.toFixed(1)} ton`}
            icon={<Leaf className="w-5 h-5" />}
          />
        </div>

        <EnvironmentalImpact
          co2Tonnes={data.totalCo2}
          equivalentTrees={calculateEquivalentTrees(data.totalCo2)}
          equivalentCars={calculateEquivalentCars(data.totalCo2)}
        />
      </div>
    );
  }

  // Operativo view
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-bold text-[var(--color-foreground)]">
          Dashboard
        </h1>
        <p className="text-[13px] text-[var(--color-muted-foreground)]">
          Portafolio asignado
        </p>
      </div>

      <p className="text-[13px] text-[var(--color-muted-foreground)]">
        Selecciona una planta o revisa las contingencias pendientes.
      </p>
    </div>
  );
}
