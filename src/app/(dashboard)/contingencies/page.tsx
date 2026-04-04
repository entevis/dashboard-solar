import { requireAuth, buildPlantAccessFilter } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { UserRole, ContingencyStatus } from "@prisma/client";
import { ContingencyTable } from "@/components/contingencies/contingency-table";
import { CreateContingencyDialog } from "@/components/contingencies/create-contingency-dialog";
import { StatusTabs } from "@/components/contingencies/status-tabs";
import { ContingencyFilterBar } from "@/components/contingencies/contingency-filter-bar";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Card from "@mui/material/Card";

interface Props {
  searchParams: Promise<{ status?: string; type?: string; powerPlantId?: string }>;
}

export default async function ContingenciesPage({ searchParams }: Props) {
  const user = await requireAuth();
  const params = await searchParams;

  const plantFilter = await buildPlantAccessFilter(user);

  const where: Record<string, unknown> = { active: 1, powerPlant: plantFilter };
  if (params.status)       where.status       = params.status as ContingencyStatus;
  if (params.type)         where.type         = params.type;
  if (params.powerPlantId) where.powerPlantId = parseInt(params.powerPlantId);

  const [contingencies, openCount, inProgressCount, closedCount, accessiblePlants] = await Promise.all([
    prisma.contingency.findMany({
      where,
      include: {
        powerPlant: { select: { name: true, portfolio: { select: { name: true } } } },
        createdBy: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.contingency.count({ where: { active: 1, powerPlant: plantFilter, status: "OPEN" } }),
    prisma.contingency.count({ where: { active: 1, powerPlant: plantFilter, status: "IN_PROGRESS" } }),
    prisma.contingency.count({ where: { active: 1, powerPlant: plantFilter, status: "CLOSED" } }),
    prisma.powerPlant.findMany({ where: plantFilter, select: { id: true, name: true }, orderBy: { name: "asc" } }),
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
    <Box sx={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0, gap: 3 }}>
      <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, alignItems: { sm: "flex-end" }, justifyContent: "space-between", gap: 2, flexWrap: "wrap", flexShrink: 0 }}>
        <Box>
          <Typography variant="h5" fontWeight={700} color="text.primary">Contingencias</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
            Gestión de mantenciones preventivas y correctivas
          </Typography>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}>
          <StatusTabs counts={counts} />
          <ContingencyFilterBar plants={accessiblePlants} />
          {canWrite && <CreateContingencyDialog powerPlants={accessiblePlants} />}
        </Box>
      </Box>

      <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", flex: 1, minHeight: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <ContingencyTable contingencies={serialized} canWrite={canWrite} />
      </Card>
    </Box>
  );
}
