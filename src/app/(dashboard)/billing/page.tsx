import { requireAuth, buildPlantAccessFilter } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";
import { Card, CardContent } from "@/components/ui/card";
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
import { EmptyState } from "@/components/ui/empty-state";
import { ClipboardList, ExternalLink, FileText } from "lucide-react";
import { SyncButton } from "@/components/billing/sync-button";
import { BillingPagination } from "@/components/billing/billing-pagination";
import { DEFAULT_PAGE_SIZE } from "@/components/ui/table-pagination";

function formatDate(date: Date | null) {
  if (!date) return "—";
  return new Intl.DateTimeFormat("es-CL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(date));
}

function StatusBadge({ statusName }: { statusName: string | null }) {
  if (!statusName) return <span className="text-(--color-muted-foreground)">—</span>;

  const name = statusName.toLowerCase();
  let className = "bg-gray-100 text-gray-600";

  if (name.includes("pag") || name.includes("paid")) {
    className = "bg-success/10 text-(--color-success)";
  } else if (name.includes("venc") || name.includes("overdue")) {
    className = "bg-destructive/10 text-(--color-destructive)";
  } else if (name.includes("pend") || name.includes("emiti") || name.includes("vencer")) {
    className = "bg-warning/10 text-(--color-warning)";
  } else if (name.includes("nul") || name.includes("cancel")) {
    className = "bg-gray-200/60 text-gray-500";
  }

  return (
    <Badge variant="secondary" className={`text-caption ${className}`}>
      {statusName}
    </Badge>
  );
}

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const user = await requireAuth();
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? "1"));
  const pageSize = DEFAULT_PAGE_SIZE;

  const plantFilter = await buildPlantAccessFilter(user);
  const isMaestro = user.role === UserRole.MAESTRO;

  // Build invoice filter based on role
  let invoiceWhere: Record<string, unknown> = { active: 1 };

  if (user.role === UserRole.CLIENTE || user.role === UserRole.CLIENTE_PERFILADO) {
    invoiceWhere = { active: 1, customerId: user.customerId };
  } else if (user.role === UserRole.OPERATIVO) {
    const plants = await prisma.powerPlant.findMany({
      where: { ...plantFilter, active: 1 },
      select: { customerId: true },
    });
    const customerIds = [...new Set(plants.map((p) => p.customerId))];
    invoiceWhere = { active: 1, customerId: { in: customerIds } };
  }

  const [total, invoices, allInvoices] = await Promise.all([
    prisma.invoice.count({ where: invoiceWhere }),
    prisma.invoice.findMany({
      where: invoiceWhere,
      include: {
        customer: { select: { name: true } },
        portfolio: { select: { name: true } },
      },
      orderBy: { issueDate: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.invoice.findMany({
      where: invoiceWhere,
      select: { total: true, amountDue: true, paidAmount: true },
    }),
  ]);

  const totalFacturado = allInvoices.reduce((s, i) => s + (i.total ?? 0), 0);
  const totalPorCobrar = allInvoices.reduce((s, i) => s + (i.amountDue ?? 0), 0);
  const totalPagado = allInvoices.reduce((s, i) => s + (i.paidAmount ?? 0), 0);

  return (
    <div className="flex flex-col flex-1 min-h-0 gap-4">
      <div className="shrink-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-(--color-foreground)">Facturación</h1>
          <p className="text-label text-(--color-muted-foreground)">
            {total} {total === 1 ? "factura" : "facturas"} registradas
          </p>
        </div>
        {isMaestro && <SyncButton />}
      </div>

      <div className="shrink-0 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-(--color-border) shadow-sm">
          <CardContent className="pt-4">
            <p className="text-caption text-(--color-muted-foreground)">Total facturado</p>
            <p className="text-[20px] font-bold text-(--color-foreground)">{formatCLP(totalFacturado)}</p>
          </CardContent>
        </Card>
        <Card className="border-(--color-border) shadow-sm">
          <CardContent className="pt-4">
            <p className="text-caption text-(--color-muted-foreground)">Por cobrar</p>
            <p className="text-[20px] font-bold text-(--color-warning)">{formatCLP(totalPorCobrar)}</p>
          </CardContent>
        </Card>
        <Card className="border-(--color-border) shadow-sm">
          <CardContent className="pt-4">
            <p className="text-caption text-(--color-muted-foreground)">Cobrado</p>
            <p className="text-[20px] font-bold text-(--color-success)">{formatCLP(totalPagado)}</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex-1 min-h-0 overflow-hidden border border-(--color-border) rounded-xl bg-white shadow-sm flex flex-col">
        {invoices.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title="Sin facturas registradas"
            description={
              isMaestro
                ? "Usa el botón Sincronizar para importar las facturas desde Duemint."
                : "El historial de facturación aparecerá aquí cuando esté disponible."
            }
            size="sm"
          />
        ) : (
          <>
            <div className="flex-1 min-h-0 overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-caption">N° Factura</TableHead>
                    <TableHead className="text-caption">Cliente</TableHead>
                    <TableHead className="text-caption">Portafolio</TableHead>
                    <TableHead className="text-caption">Emisión</TableHead>
                    <TableHead className="text-caption">Vencimiento</TableHead>
                    <TableHead className="text-caption">Total</TableHead>
                    <TableHead className="text-caption">Por cobrar</TableHead>
                    <TableHead className="text-caption">Estado</TableHead>
                    <TableHead className="text-caption w-16">Docs</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((inv) => (
                    <TableRow key={inv.id}>
                      <TableCell className="text-label font-medium font-mono">
                        {inv.number ?? `#${inv.duemintId}`}
                      </TableCell>
                      <TableCell className="text-label">
                        <p className="font-medium">{inv.customer.name}</p>
                        {inv.clientTaxId && (
                          <p className="text-caption text-(--color-muted-foreground)">{inv.clientTaxId}</p>
                        )}
                      </TableCell>
                      <TableCell className="text-label text-(--color-muted-foreground)">
                        {inv.portfolio?.name ?? "—"}
                      </TableCell>
                      <TableCell className="text-label text-(--color-muted-foreground)">
                        {formatDate(inv.issueDate)}
                      </TableCell>
                      <TableCell className="text-label text-(--color-muted-foreground)">
                        {formatDate(inv.dueDate)}
                      </TableCell>
                      <TableCell className="text-label font-medium">
                        {inv.total != null ? formatCLP(inv.total) : "—"}
                      </TableCell>
                      <TableCell className="text-label">
                        {inv.amountDue != null ? formatCLP(inv.amountDue) : "—"}
                      </TableCell>
                      <TableCell>
                        <StatusBadge statusName={inv.statusName} />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {inv.url && (
                            <a href={inv.url} target="_blank" rel="noopener noreferrer" title="Ver en Duemint"
                              className="text-(--color-muted-foreground) hover:text-(--color-primary)">
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                          {inv.pdfUrl && (
                            <a href={inv.pdfUrl} target="_blank" rel="noopener noreferrer" title="Descargar PDF"
                              className="text-(--color-muted-foreground) hover:text-(--color-primary)">
                              <FileText className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <BillingPagination total={total} page={page} />
          </>
        )}
      </div>
    </div>
  );
}
