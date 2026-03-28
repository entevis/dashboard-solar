import { requireAuth } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { PortfolioSummaryCard } from "@/components/dashboard/portfolio-summary-card";
import { AlertsPanel } from "@/components/dashboard/alerts-panel";
import { EnvironmentalImpact } from "@/components/dashboard/environmental-impact";
import { calculateEquivalentTrees, calculateEquivalentCars } from "@/lib/utils/co2";
import { formatDate } from "@/lib/utils/formatters";
import { Zap, Building2, AlertTriangle, Leaf } from "lucide-react";
import { getPortfolioLogo } from "@/lib/portfolio-logos";

async function getMaestroDashboardData() {
  const [portfolios, totalPlants, openContingencies, generationReports] =
    await Promise.all([
      prisma.portfolio.findMany({
        where: { active: 1 },
        include: {
          powerPlants: {
            where: { active: 1 },
            select: { id: true, capacityKw: true, status: true, customerId: true },
          },
        },
      }),
      prisma.powerPlant.count({ where: { active: 1 } }),
      prisma.contingency.findMany({
        where: { active: 1, status: { in: ["OPEN", "IN_PROGRESS"] } },
        include: { powerPlant: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      prisma.generationReport.aggregate({
        where: { active: 1 },
        _sum: { kwhGenerated: true, co2Avoided: true },
      }),
    ]);

  const totalKwh = generationReports._sum.kwhGenerated ?? 0;
  const totalCo2 = generationReports._sum.co2Avoided ?? 0;

  return { portfolios, totalPlants, openContingencies, totalKwh, totalCo2 };
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

    const alerts = data.openContingencies.map((c) => ({
      id: c.id,
      plantName: c.powerPlant.name,
      type: c.type,
      description: c.description,
      status: c.status,
      createdAt: formatDate(c.createdAt),
    }));

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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {data.portfolios.map((portfolio) => (
            <PortfolioSummaryCard
              key={portfolio.id}
              name={portfolio.name}
              plantCount={portfolio.powerPlants.length}
              totalCapacityKw={portfolio.powerPlants.reduce(
                (sum, p) => sum + p.capacityKw,
                0
              )}
              activePlants={
                portfolio.powerPlants.filter((p) => p.status === "active").length
              }
              logoUrl={getPortfolioLogo(portfolio.id)}
              href={`/power-plants?portfolioId=${portfolio.id}`}
              customerCount={new Set(portfolio.powerPlants.map((p) => p.customerId)).size}
            />
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            label="Total Plantas"
            value={String(data.totalPlants)}
            sublabel="en 3 portafolios"
            icon={<Zap className="w-5 h-5" />}
          />
          <KpiCard
            label="Portafolios"
            value={String(data.portfolios.length)}
            icon={<Building2 className="w-5 h-5" />}
          />
          <KpiCard
            label="Contingencias Abiertas"
            value={String(data.openContingencies.length)}
            icon={<AlertTriangle className="w-5 h-5" />}
          />
          <KpiCard
            label="CO2 Evitado"
            value={`${data.totalCo2.toFixed(1)} ton`}
            sublabel="acumulado total"
            icon={<Leaf className="w-5 h-5" />}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <AlertsPanel alerts={alerts} />
          <EnvironmentalImpact
            co2Tonnes={data.totalCo2}
            equivalentTrees={calculateEquivalentTrees(data.totalCo2)}
            equivalentCars={calculateEquivalentCars(data.totalCo2)}
          />
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
