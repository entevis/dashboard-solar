import { requireAuth, getAccessiblePowerPlantIds } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { UserRole } from "@prisma/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate, formatCLP } from "@/lib/utils/formatters";
import Link from "next/link";
import { CreateContingencyDialog } from "@/components/contingencies/create-contingency-dialog";

interface Props {
  params: Promise<{ powerPlantId: string }>;
}

const statusConfig: Record<string, { label: string; className: string }> = {
  OPEN: { label: "Abierta", className: "bg-red-500/10 text-red-600" },
  IN_PROGRESS: { label: "En progreso", className: "bg-[var(--color-warning)]/10 text-[var(--color-warning)]" },
  CLOSED: { label: "Cerrada", className: "bg-[var(--color-success)]/10 text-[var(--color-success)]" },
};

const typeLabels: Record<string, string> = {
  PREVENTIVE: "Preventiva",
  CORRECTIVE: "Correctiva",
};

export default async function PlantContingenciesPage({ params }: Props) {
  const { powerPlantId } = await params;
  const id = parseInt(powerPlantId);
  const user = await requireAuth();

  const accessibleIds = await getAccessiblePowerPlantIds(user);
  if (accessibleIds !== "all" && !accessibleIds.includes(id)) {
    notFound();
  }

  const [plant, contingencies] = await Promise.all([
    prisma.powerPlant.findUnique({
      where: { id, active: 1 },
      select: { id: true, name: true },
    }),
    prisma.contingency.findMany({
      where: { powerPlantId: id, active: 1 },
      include: { createdBy: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  if (!plant) notFound();

  const canWrite = user.role === UserRole.MAESTRO || user.role === UserRole.OPERATIVO;
  const openCount = contingencies.filter((c) => c.status !== "CLOSED").length;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-lg font-bold text-[var(--color-foreground)]">
            {plant.name}
          </h1>
          <p className="text-[13px] text-[var(--color-muted-foreground)]">
            Contingencias de la planta · {openCount} abierta{openCount !== 1 ? "s" : ""}
          </p>
        </div>
        {canWrite && (
          <CreateContingencyDialog powerPlants={[{ id: plant.id, name: plant.name }]} />
        )}
      </div>

      <Tabs defaultValue="contingencies">
        <TabsList>
          <TabsTrigger value="overview" asChild>
            <Link href={`/power-plants/${plant.id}`}>General</Link>
          </TabsTrigger>
          <TabsTrigger value="generation" asChild>
            <Link href={`/power-plants/${plant.id}/generation`}>Reportes</Link>
          </TabsTrigger>
          <TabsTrigger value="billing" asChild>
            <Link href={`/power-plants/${plant.id}/billing`}>Facturación</Link>
          </TabsTrigger>
          <TabsTrigger value="contingencies" asChild>
            <Link href={`/power-plants/${plant.id}/contingencies`}>Contingencias</Link>
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <Card className="border-[var(--color-border)] shadow-sm">
        <CardContent className="p-0">
          {contingencies.length === 0 ? (
            <div className="text-center py-12 text-[13px] text-[var(--color-muted-foreground)]">
              No hay contingencias registradas para esta planta
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-[12px]">Tipo</TableHead>
                  <TableHead className="text-[12px]">Descripción</TableHead>
                  <TableHead className="text-[12px]">Estado</TableHead>
                  <TableHead className="text-[12px]">Costo</TableHead>
                  <TableHead className="text-[12px]">Creada por</TableHead>
                  <TableHead className="text-[12px]">Fecha</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contingencies.map((c) => {
                  const status = statusConfig[c.status] ?? statusConfig.OPEN;
                  return (
                    <TableRow key={c.id}>
                      <TableCell>
                        <Badge variant="outline" className="text-[11px]">
                          {typeLabels[c.type] ?? c.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-[13px] max-w-[300px] truncate">
                        <Link
                          href={`/contingencies/${c.id}`}
                          className="text-[var(--color-primary)] hover:underline"
                        >
                          {c.description}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={`text-[11px] ${status.className}`}>
                          {status.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-[13px]">
                        {c.cost != null ? formatCLP(c.cost) : "—"}
                      </TableCell>
                      <TableCell className="text-[13px] text-[var(--color-muted-foreground)]">
                        {c.createdBy.name}
                      </TableCell>
                      <TableCell className="text-[13px] text-[var(--color-muted-foreground)]">
                        {formatDate(c.createdAt)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
