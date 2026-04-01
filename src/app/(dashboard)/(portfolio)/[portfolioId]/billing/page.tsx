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
import { ClipboardList } from "lucide-react";
import { BillingPagination } from "@/components/billing/billing-pagination";
import { BillingFilters } from "@/components/billing/billing-filters";
import { ImportInvoiceDialog } from "@/components/billing/import-invoice-dialog";
import { SyncSinceDialog } from "@/components/billing/sync-since-dialog";
import { InvoiceRowActions } from "@/components/billing/invoice-row-actions";

const PAGE_SIZE = 15;

const MONTHS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

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

interface Props {
  params: Promise<{ portfolioId: string }>;
  searchParams: Promise<{ page?: string; size?: string; month?: string; year?: string; status?: string }>;
}

export default async function PortfolioBillingPage({ params, searchParams }: Props) {
  const { portfolioId } = await params;
  const pid = parseInt(portfolioId);
  const user = await requireAuth();
  const sp = await searchParams;

  const page = Math.max(1, parseInt(sp.page ?? "1") || 1);
  const VALID_SIZES = [15, 50, 100] as const;
  type PageSize = typeof VALID_SIZES[number];
  const parsedSize = parseInt(sp.size ?? "");
  const pageSize: PageSize = (VALID_SIZES as readonly number[]).includes(parsedSize)
    ? parsedSize as PageSize
    : PAGE_SIZE;

  const now = new Date();
  const month = Math.min(12, Math.max(1, parseInt(sp.month ?? "") || now.getMonth() + 1));
  const year = parseInt(sp.year ?? "") || now.getFullYear();
  const periodStart = new Date(year, month - 1, 1);
  const periodEnd = new Date(year, month, 1);

  const VALID_STATUSES = ["pagada", "porVencer", "vencida", "anulada"];
  const status = VALID_STATUSES.includes(sp.status ?? "") ? sp.status! : "all";

  // Base filter: scoped to this portfolio
  const periodFilter = { gte: periodStart, lt: periodEnd };
  let invoiceWhere: Record<string, unknown> = {
    active: 1,
    portfolioId: pid,
    issueDate: periodFilter,
  };

  // Role-specific filters (portfolioId already narrows the scope)
  if (user.role === UserRole.CLIENTE || user.role === UserRole.CLIENTE_PERFILADO) {
    invoiceWhere = { ...invoiceWhere, customerId: user.customerId };
  } else if (user.role === UserRole.OPERATIVO) {
    const plantFilter = await buildPlantAccessFilter(user);
    const plants = await prisma.powerPlant.findMany({
      where: { ...plantFilter, portfolioId: pid },
      select: { customerId: true },
    });
    const customerIds = [...new Set(plants.map((p) => p.customerId))];
    invoiceWhere = { ...invoiceWhere, customerId: { in: customerIds } };
  }

  const i = "insensitive" as const;
  const statusConditions: Record<string, object> = {
    pagada:    { OR: [{ statusName: { contains: "pag", mode: i } }, { statusName: { contains: "paid", mode: i } }] },
    vencida:   { OR: [{ statusName: { contains: "venc", mode: i } }, { statusName: { contains: "overdue", mode: i } }] },
    anulada:   { OR: [{ statusName: { contains: "nul", mode: i } }, { statusName: { contains: "cancel", mode: i } }] },
    porVencer: { NOT: { OR: [
      { statusName: { contains: "pag", mode: i } }, { statusName: { contains: "paid", mode: i } },
      { statusName: { contains: "venc", mode: i } }, { statusName: { contains: "overdue", mode: i } },
      { statusName: { contains: "nul", mode: i } }, { statusName: { contains: "cancel", mode: i } },
    ]}},
  };
  const tableWhere = status === "all"
    ? invoiceWhere
    : { ...invoiceWhere, ...statusConditions[status] };

  const isMaestro = user.role === UserRole.MAESTRO;

  const [total, invoices, allInvoices, maestroPortfolios] = await Promise.all([
    prisma.invoice.count({ where: tableWhere }),
    prisma.invoice.findMany({
      where: tableWhere,
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
      select: { total: true, statusName: true },
    }),
    isMaestro
      ? prisma.portfolio.findMany({
          where: { active: 1, duemintCompanyId: { not: null } },
          select: { id: true, name: true },
        })
      : Promise.resolve([]),
  ]);

  function categorize(statusName: string | null) {
    const s = (statusName ?? "").toLowerCase();
    if (s.includes("pag") || s.includes("paid")) return "pagada";
    if (s.includes("venc") || s.includes("overdue")) return "vencida";
    if (s.includes("nul") || s.includes("cancel")) return "anulada";
    return "porVencer";
  }

  const kpis = { pagada: 0, porVencer: 0, vencida: 0, anulada: 0 };
  for (const inv of allInvoices) {
    kpis[categorize(inv.statusName)] += inv.total ?? 0;
  }

  return (
    <div className="flex flex-col flex-1 min-h-0 gap-4">
      <div className="shrink-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-(--color-foreground)">Facturación</h1>
          <p className="text-label text-(--color-muted-foreground)">
            {total} {total === 1 ? "factura" : "facturas"} · {MONTHS[month - 1]} {year}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <BillingFilters month={month} year={year} status={status} />
          {isMaestro && maestroPortfolios.length > 0 && (
            <>
              <SyncSinceDialog />
              <ImportInvoiceDialog portfolios={maestroPortfolios} />
            </>
          )}
        </div>
      </div>

      <div className="shrink-0 grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="border-(--color-border) shadow-sm">
          <CardContent className="pt-4">
            <p className="text-caption text-(--color-muted-foreground)">Pagada</p>
            <p className="text-[20px] font-bold text-(--color-success)">{formatCLP(kpis.pagada)}</p>
          </CardContent>
        </Card>
        <Card className="border-(--color-border) shadow-sm">
          <CardContent className="pt-4">
            <p className="text-caption text-(--color-muted-foreground)">Por vencer</p>
            <p className="text-[20px] font-bold text-(--color-warning)">{formatCLP(kpis.porVencer)}</p>
          </CardContent>
        </Card>
        <Card className="border-(--color-border) shadow-sm">
          <CardContent className="pt-4">
            <p className="text-caption text-(--color-muted-foreground)">Vencida</p>
            <p className="text-[20px] font-bold text-(--color-destructive)">{formatCLP(kpis.vencida)}</p>
          </CardContent>
        </Card>
        <Card className="border-(--color-border) shadow-sm">
          <CardContent className="pt-4">
            <p className="text-caption text-(--color-muted-foreground)">Nota de Crédito</p>
            <p className="text-[20px] font-bold text-(--color-muted-foreground)">{formatCLP(kpis.anulada)}</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex-1 min-h-0 overflow-hidden border border-(--color-border) rounded-xl bg-white shadow-sm flex flex-col">
        {invoices.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title="Sin facturas registradas"
            description="El historial de facturación aparecerá aquí cuando esté disponible."
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
                    <TableHead className="w-10" />
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
                        <InvoiceRowActions
                          invoiceId={inv.id}
                          isPaid={
                            inv.statusName?.toLowerCase().includes("pag") ||
                            inv.statusName?.toLowerCase().includes("paid") ||
                            false
                          }
                          url={inv.url ?? null}
                          pdfUrl={inv.pdfUrl ?? null}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <BillingPagination total={total} page={page} pageSize={pageSize} />
          </>
        )}
      </div>
    </div>
  );
}
