import { requireAuth, buildPlantAccessFilter } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { UserRole, ContingencyStatus } from "@prisma/client";
import { ContingencyTable } from "@/components/contingencies/contingency-table";
import { CreateContingencyDialog } from "@/components/contingencies/create-contingency-dialog";
import { StatusTabs } from "@/components/contingencies/status-tabs";
import { ContingencyFilterBar } from "@/components/contingencies/contingency-filter-bar";

interface Props {
  params: Promise<{ portfolioId: string }>;
  searchParams: Promise<{ status?: string; type?: string; powerPlantId?: string }>;
}

export default async function PortfolioContingenciesPage({ params, searchParams }: Props) {
  const { portfolioId } = await params;
  const pid = parseInt(portfolioId);
  const user = await requireAuth();
  const sp = await searchParams;

  const plantFilter = await buildPlantAccessFilter(user);

  // Scope to this portfolio
  const plantWhere = { ...plantFilter, portfolioId: pid };

  const where: Record<string, unknown> = {
    active: 1,
    powerPlant: plantWhere,
  };

  if (sp.status) where.status = sp.status as ContingencyStatus;
  if (sp.type) where.type = sp.type;
  if (sp.powerPlantId) where.powerPlantId = parseInt(sp.powerPlantId);

  const [contingencies, openCount, inProgressCount, closedCount, accessiblePlants] =
    await Promise.all([
      prisma.contingency.findMany({
        where,
        include: {
          powerPlant: { select: { name: true, portfolio: { select: { name: true } } } },
          createdBy: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.contingency.count({ where: { active: 1, powerPlant: plantWhere, status: "OPEN" } }),
      prisma.contingency.count({ where: { active: 1, powerPlant: plantWhere, status: "IN_PROGRESS" } }),
      prisma.contingency.count({ where: { active: 1, powerPlant: plantWhere, status: "CLOSED" } }),
      prisma.powerPlant.findMany({
        where: plantWhere,
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      }),
    ]);

  const counts = { OPEN: openCount, IN_PROGRESS: inProgressCount, CLOSED: closedCount };
  const canWrite = user.role === UserRole.MAESTRO || user.role === UserRole.OPERATIVO;

  const serialized = contingencies.map((c) => ({
    ...c,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
    closedAt: c.closedAt?.toISOString() ?? null,
  }));

  return (
    <div className="flex flex-col flex-1 min-h-0 gap-4">
      <div className="shrink-0 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-lg font-bold text-[var(--color-foreground)]">Contingencias</h1>
            <p className="text-[13px] text-[var(--color-muted-foreground)]">
              Gestión de mantenciones preventivas y correctivas
            </p>
          </div>
          <div className="flex items-center justify-between gap-3 flex-wrap w-full">
            <div className="flex items-center gap-3 flex-wrap">
              <StatusTabs counts={counts} />
              <ContingencyFilterBar plants={accessiblePlants} />
            </div>
            {canWrite && <CreateContingencyDialog powerPlants={accessiblePlants} />}
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-hidden border border-[var(--color-border)] rounded-xl bg-white shadow-sm flex flex-col">
        <ContingencyTable contingencies={serialized} canWrite={canWrite} />
      </div>
    </div>
  );
}
