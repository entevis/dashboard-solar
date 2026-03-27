import { requireAuth, buildPlantAccessFilter } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { UserRole, ContingencyStatus } from "@prisma/client";
import { Card, CardContent } from "@/components/ui/card";
import { ContingencyTable } from "@/components/contingencies/contingency-table";
import { CreateContingencyDialog } from "@/components/contingencies/create-contingency-dialog";
import { StatusTabs } from "@/components/contingencies/status-tabs";
import { ContingencyFilterBar } from "@/components/contingencies/contingency-filter-bar";

interface Props {
  searchParams: Promise<{ status?: string; type?: string; powerPlantId?: string }>;
}

export default async function ContingenciesPage({ searchParams }: Props) {
  const user = await requireAuth();
  const params = await searchParams;

  const plantFilter = await buildPlantAccessFilter(user);

  // Build where clause
  const where: Record<string, unknown> = {
    active: 1,
    powerPlant: plantFilter,
  };

  if (params.status) {
    where.status = params.status as ContingencyStatus;
  }
  if (params.type) {
    where.type = params.type;
  }
  if (params.powerPlantId) {
    where.powerPlantId = parseInt(params.powerPlantId);
  }

  // Fetch contingencies and counts in parallel
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
      prisma.contingency.count({
        where: { active: 1, powerPlant: plantFilter, status: "OPEN" },
      }),
      prisma.contingency.count({
        where: { active: 1, powerPlant: plantFilter, status: "IN_PROGRESS" },
      }),
      prisma.contingency.count({
        where: { active: 1, powerPlant: plantFilter, status: "CLOSED" },
      }),
      prisma.powerPlant.findMany({
        where: plantFilter,
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      }),
    ]);

  const counts = {
    OPEN: openCount,
    IN_PROGRESS: inProgressCount,
    CLOSED: closedCount,
  };

  const canWrite = user.role === UserRole.MAESTRO || user.role === UserRole.OPERATIVO;

  // Serialize dates for client components
  const serialized = contingencies.map((c) => ({
    ...c,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
    closedAt: c.closedAt?.toISOString() ?? null,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-[var(--color-foreground)]">
            Contingencias
          </h1>
          <p className="text-[13px] text-[var(--color-muted-foreground)]">
            Gestión de mantenciones preventivas y correctivas
          </p>
        </div>
        {canWrite && (
          <CreateContingencyDialog powerPlants={accessiblePlants} />
        )}
      </div>

      <StatusTabs counts={counts} />

      <ContingencyFilterBar plants={accessiblePlants} />

      <Card className="border-[var(--color-border)] shadow-sm">
        <CardContent className="p-0">
          <ContingencyTable contingencies={serialized} canWrite={canWrite} />
        </CardContent>
      </Card>
    </div>
  );
}
