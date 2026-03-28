import { requireAuth, getAccessiblePowerPlantIds } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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
import { formatCLP } from "@/lib/utils/formatters";
import Link from "next/link";

interface Props {
  params: Promise<{ powerPlantId: string }>;
}

const statusLabels: Record<string, { label: string; className: string }> = {
  PENDING: { label: "Pendiente", className: "bg-[var(--color-warning)]/10 text-[var(--color-warning)]" },
  PAID: { label: "Pagada", className: "bg-[var(--color-success)]/10 text-[var(--color-success)]" },
  OVERDUE: { label: "Vencida", className: "bg-red-500/10 text-red-600" },
  CANCELLED: { label: "Anulada", className: "bg-gray-500/10 text-gray-500" },
};

export default async function PlantBillingPage({ params }: Props) {
  const { powerPlantId } = await params;
  const id = parseInt(powerPlantId);
  const user = await requireAuth();

  const accessibleIds = await getAccessiblePowerPlantIds(user);
  if (accessibleIds !== "all" && !accessibleIds.includes(id)) {
    notFound();
  }

  const [plant, invoices] = await Promise.all([
    prisma.powerPlant.findUnique({
      where: { id, active: 1 },
      select: { id: true, name: true },
    }),
    prisma.invoice.findMany({
      where: { powerPlantId: id, active: 1 },
      include: { customer: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  if (!plant) notFound();

  const totalAmount = invoices.reduce((sum, i) => sum + i.amount, 0);
  const pendingAmount = invoices
    .filter((i) => i.status === "PENDING" || i.status === "OVERDUE")
    .reduce((sum, i) => sum + i.amount, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-bold text-[var(--color-foreground)]">
          {plant.name}
        </h1>
        <p className="text-[13px] text-[var(--color-muted-foreground)]">
          Facturación de la planta
        </p>
      </div>

      <Tabs defaultValue="billing">
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

      <Badge variant="outline" className="text-[11px] bg-[var(--color-warning)]/10 text-[var(--color-warning)] border-[var(--color-warning)]/20">
        Datos Demo — Integración Duemint pendiente
      </Badge>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="border-[var(--color-border)] shadow-sm">
          <CardContent className="pt-4">
            <p className="text-[12px] text-[var(--color-muted-foreground)]">Total facturado</p>
            <p className="text-[18px] font-bold text-[var(--color-foreground)]">
              {formatCLP(totalAmount)}
            </p>
          </CardContent>
        </Card>
        <Card className="border-[var(--color-border)] shadow-sm">
          <CardContent className="pt-4">
            <p className="text-[12px] text-[var(--color-muted-foreground)]">Por cobrar</p>
            <p className="text-[18px] font-bold text-[var(--color-warning)]">
              {formatCLP(pendingAmount)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-[var(--color-border)] shadow-sm">
        <CardHeader className="pb-3">
          <h3 className="text-[14px] font-medium">Facturas</h3>
        </CardHeader>
        <CardContent className="p-0">
          {invoices.length === 0 ? (
            <div className="text-center py-12 text-[13px] text-[var(--color-muted-foreground)]">
              No hay facturas registradas
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-[12px]">Periodo</TableHead>
                  <TableHead className="text-[12px]">Cliente</TableHead>
                  <TableHead className="text-[12px]">Monto</TableHead>
                  <TableHead className="text-[12px]">Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((inv) => {
                  const status = statusLabels[inv.status] ?? statusLabels.PENDING;
                  return (
                    <TableRow key={inv.id}>
                      <TableCell className="text-[13px] font-medium">
                        {inv.period}
                      </TableCell>
                      <TableCell className="text-[13px]">
                        {inv.customer.name}
                      </TableCell>
                      <TableCell className="text-[13px]">
                        {formatCLP(inv.amount)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={`text-[11px] ${status.className}`}>
                          {status.label}
                        </Badge>
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
