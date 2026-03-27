import { requireAuth, buildPlantAccessFilter } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PlantRowActions } from "@/components/power-plants/plant-row-actions";
import { PlantFilterBar } from "@/components/power-plants/plant-filter-bar";
import { UserRole } from "@prisma/client";

interface Props {
  searchParams: Promise<{ q?: string; portfolioId?: string; customerId?: string }>;
}

export default async function PowerPlantsPage({ searchParams }: Props) {
  const user = await requireAuth();
  const params = await searchParams;
  const filter = await buildPlantAccessFilter(user);

  const where = {
    ...filter,
    ...(params.q ? { name: { contains: params.q, mode: "insensitive" as const } } : {}),
    ...(params.portfolioId ? { portfolioId: parseInt(params.portfolioId) } : {}),
    ...(params.customerId ? { customerId: parseInt(params.customerId) } : {}),
  };

  const [plants, portfolios, customers] = await Promise.all([
    prisma.powerPlant.findMany({
      where,
      include: {
        portfolio: { select: { name: true } },
        customer: { select: { name: true } },
      },
      orderBy: { name: "asc" },
    }),
    prisma.portfolio.findMany({ where: { active: 1 }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.customer.findMany({ where: { active: 1 }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  const canEdit = user.role === UserRole.MAESTRO;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-bold text-[var(--color-foreground)]">
          Plantas Solares
        </h1>
        <p className="text-[13px] text-[var(--color-muted-foreground)]">
          {plants.length} plantas encontradas
        </p>
      </div>

      <PlantFilterBar portfolios={portfolios} customers={customers} />

      <Card className="border-[var(--color-border)] shadow-sm overflow-hidden">
        <CardContent className="p-0">
          {plants.length === 0 ? (
            <div className="text-center py-12 text-[13px] text-[var(--color-muted-foreground)]">
              No tienes plantas asignadas
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-[12px] whitespace-nowrap">ID</TableHead>
                    <TableHead className="text-[12px] whitespace-nowrap">ID Solcor</TableHead>
                    <TableHead className="text-[12px] whitespace-nowrap">Nombre Planta</TableHead>
                    <TableHead className="text-[12px] whitespace-nowrap">Comuna</TableHead>
                    <TableHead className="text-[12px] whitespace-nowrap">Empresa Distribuidora</TableHead>
                    <TableHead className="text-[12px] whitespace-nowrap">ID Tarifa</TableHead>
                    <TableHead className="text-[12px] whitespace-nowrap">Fecha Inicio (F6)</TableHead>
                    <TableHead className="text-[12px] whitespace-nowrap">Duración (Años)</TableHead>
                    <TableHead className="text-[12px] whitespace-nowrap">Potencia (kWp)</TableHead>
                    <TableHead className="text-[12px] whitespace-nowrap leading-tight text-center">
                      Rendimiento Anual Espec.<br />
                      <span className="text-[11px] font-normal">(kWh/kWp)</span>
                    </TableHead>
                    <TableHead className="text-[12px] whitespace-nowrap">Estado</TableHead>
                    {canEdit && <TableHead className="w-10" />}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {plants.map((plant, idx) => (
                    <TableRow key={plant.id}>
                      <TableCell className="text-[12px] text-[var(--color-muted-foreground)] font-mono">
                        {idx + 1}
                      </TableCell>
                      <TableCell className="text-[13px] text-[var(--color-muted-foreground)] font-mono">
                        {plant.solcorId ?? "—"}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <Link
                          href={`/power-plants/${plant.id}`}
                          className="text-[13px] font-medium text-[var(--color-primary)] hover:underline"
                        >
                          {plant.name}
                        </Link>
                      </TableCell>
                      <TableCell className="text-[13px] text-[var(--color-foreground)] whitespace-nowrap">
                        {plant.city ?? plant.location ?? "—"}
                      </TableCell>
                      <TableCell className="text-[13px] text-[var(--color-foreground)] whitespace-nowrap">
                        {plant.distributorCompany ?? "—"}
                      </TableCell>
                      <TableCell className="text-[13px] text-[var(--color-foreground)] font-mono">
                        {plant.tariffId ?? "—"}
                      </TableCell>
                      <TableCell className="text-[13px] text-[var(--color-foreground)] whitespace-nowrap">
                        {plant.startDate
                          ? new Intl.DateTimeFormat("es-CL").format(new Date(plant.startDate))
                          : "—"}
                      </TableCell>
                      <TableCell className="text-[13px] text-[var(--color-foreground)] text-center">
                        {plant.durationYears ?? "—"}
                      </TableCell>
                      <TableCell className="text-[13px] text-[var(--color-foreground)] text-right">
                        {plant.capacityKw}
                      </TableCell>
                      <TableCell className="text-[13px] text-[var(--color-foreground)] text-right">
                        {plant.specificYield != null
                          ? plant.specificYield.toLocaleString("es-CL")
                          : "—"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={`text-[11px] ${
                            plant.status === "active"
                              ? "bg-[var(--color-success)]/10 text-[var(--color-success)]"
                              : "bg-[var(--color-warning)]/10 text-[var(--color-warning)]"
                          }`}
                        >
                          {plant.status === "active" ? "Activa" : "Mantención"}
                        </Badge>
                      </TableCell>
                      {canEdit && (
                        <TableCell>
                          <PlantRowActions
                            plant={plant}
                            portfolios={portfolios}
                            customers={customers}
                          />
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
