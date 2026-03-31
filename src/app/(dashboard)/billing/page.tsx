import { requireAuth, buildPlantAccessFilter } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { EmptyState } from "@/components/ui/empty-state";
import { ClipboardList } from "lucide-react";

const statusLabels: Record<string, { label: string; className: string }> = {
  PENDING: {
    label: "Pendiente",
    className: "bg-[var(--color-warning)]/10 text-[var(--color-warning)]",
  },
  PAID: {
    label: "Pagada",
    className: "bg-[var(--color-success)]/10 text-[var(--color-success)]",
  },
  OVERDUE: {
    label: "Vencida",
    className: "bg-[var(--color-destructive)]/10 text-[var(--color-destructive)]",
  },
  CANCELLED: {
    label: "Anulada",
    className: "bg-gray-500/10 text-gray-500",
  },
};

export default async function BillingPage() {
  const user = await requireAuth();

  const plantFilter = await buildPlantAccessFilter(user);

  const invoices = await prisma.invoice.findMany({
    where: {
      active: 1,
      powerPlant: plantFilter,
    },
    include: {
      powerPlant: {
        select: {
          id: true,
          name: true,
          portfolio: { select: { name: true } },
        },
      },
      customer: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const totalAmount = invoices.reduce((sum, i) => sum + i.amount, 0);
  const pendingAmount = invoices
    .filter((i) => i.status === "PENDING" || i.status === "OVERDUE")
    .reduce((sum, i) => sum + i.amount, 0);
  const paidAmount = invoices
    .filter((i) => i.status === "PAID")
    .reduce((sum, i) => sum + i.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-[var(--color-foreground)]">
            Facturación
          </h1>
          <p className="text-[13px] text-[var(--color-muted-foreground)]">
            Historial de facturas del portafolio
          </p>
        </div>
        <Badge
          variant="outline"
          className="text-[12px] bg-[var(--color-warning)]/10 text-[var(--color-warning)] border-[var(--color-warning)]/20"
        >
          Datos Demo — Integración Duemint pendiente
        </Badge>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-[var(--color-border)] shadow-sm">
          <CardContent className="pt-4">
            <p className="text-[12px] text-[var(--color-muted-foreground)]">
              Total facturado
            </p>
            <p className="text-[20px] font-bold text-[var(--color-foreground)]">
              {formatCLP(totalAmount)}
            </p>
          </CardContent>
        </Card>
        <Card className="border-[var(--color-border)] shadow-sm">
          <CardContent className="pt-4">
            <p className="text-[12px] text-[var(--color-muted-foreground)]">
              Por cobrar
            </p>
            <p className="text-[20px] font-bold text-[var(--color-warning)]">
              {formatCLP(pendingAmount)}
            </p>
          </CardContent>
        </Card>
        <Card className="border-[var(--color-border)] shadow-sm">
          <CardContent className="pt-4">
            <p className="text-[12px] text-[var(--color-muted-foreground)]">
              Cobrado
            </p>
            <p className="text-[20px] font-bold text-[var(--color-success)]">
              {formatCLP(paidAmount)}
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
            <EmptyState
              icon={ClipboardList}
              title="Sin facturas registradas"
              description="El historial de facturación de tus plantas aparecerá aquí a medida que se emitan."
              size="sm"
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-[12px]">Planta</TableHead>
                  <TableHead className="text-[12px]">Cliente</TableHead>
                  <TableHead className="text-[12px]">Periodo</TableHead>
                  <TableHead className="text-[12px]">Monto</TableHead>
                  <TableHead className="text-[12px]">Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((inv) => {
                  const status = statusLabels[inv.status] ?? statusLabels.PENDING;
                  return (
                    <TableRow key={inv.id}>
                      <TableCell className="text-[13px]">
                        <Link
                          href={`/power-plants/${inv.powerPlant.id}/billing`}
                          className="font-medium text-[var(--color-primary)] hover:underline"
                        >
                          {inv.powerPlant.name}
                        </Link>
                        <p className="text-[12px] text-[var(--color-muted-foreground)]">
                          {inv.powerPlant.portfolio.name}
                        </p>
                      </TableCell>
                      <TableCell className="text-[13px]">
                        {inv.customer.name}
                      </TableCell>
                      <TableCell className="text-[13px] font-medium">
                        {inv.period}
                      </TableCell>
                      <TableCell className="text-[13px]">
                        {formatCLP(inv.amount)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={`text-[12px] ${status.className}`}
                        >
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
