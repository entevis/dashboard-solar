import { requireAuth, buildPlantAccessFilter } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";
import { formatCLP } from "@/lib/utils/formatters";
import { BillingPagination } from "@/components/billing/billing-pagination";
import { BillingFilters } from "@/components/billing/billing-filters";
import { ImportInvoiceDialog } from "@/components/billing/import-invoice-dialog";
import { SyncSinceDialog } from "@/components/billing/sync-since-dialog";
import { InvoiceRowActions } from "@/components/billing/invoice-row-actions";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";

const PAGE_SIZE = 15;
const MONTHS = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

function formatDate(date: Date | null) {
  if (!date) return "—";
  return new Intl.DateTimeFormat("es-CL", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(date));
}

function StatusChip({ statusName }: { statusName: string | null }) {
  if (!statusName) return <Typography variant="caption" color="text.secondary">—</Typography>;
  const n = statusName.toLowerCase();
  let sx = { backgroundColor: "#e6eeff", color: "#434655" };
  if (n.includes("pag") || n.includes("paid")) sx = { backgroundColor: "#dcfce7", color: "#15803d" };
  else if (n.includes("venc") || n.includes("overdue")) sx = { backgroundColor: "#fee2e2", color: "#dc2626" };
  else if (n.includes("pend") || n.includes("emiti") || n.includes("vencer")) sx = { backgroundColor: "#fef9c3", color: "#a16207" };
  else if (n.includes("nul") || n.includes("cancel")) sx = { backgroundColor: "#f1f5f9", color: "#64748b" };
  return <Chip label={statusName} size="small" sx={{ ...sx, fontSize: "0.6875rem", height: 20, fontWeight: 600 }} />;
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
  const pageSize: PageSize = (VALID_SIZES as readonly number[]).includes(parsedSize) ? parsedSize as PageSize : PAGE_SIZE;

  const now = new Date();
  const month = Math.min(12, Math.max(1, parseInt(sp.month ?? "") || now.getMonth() + 1));
  const year = parseInt(sp.year ?? "") || now.getFullYear();
  const periodStart = new Date(year, month - 1, 1);
  const periodEnd = new Date(year, month, 1);

  const VALID_STATUSES = ["pagada", "porVencer", "vencida", "anulada"];
  const status = VALID_STATUSES.includes(sp.status ?? "") ? sp.status! : "all";

  let invoiceWhere: Record<string, unknown> = { active: 1, portfolioId: pid, issueDate: { gte: periodStart, lt: periodEnd } };

  if (user.role === UserRole.CLIENTE || user.role === UserRole.CLIENTE_PERFILADO) {
    invoiceWhere = { ...invoiceWhere, customerId: user.customerId };
  } else if (user.role === UserRole.OPERATIVO) {
    const plantFilter = await buildPlantAccessFilter(user);
    const plants = await prisma.powerPlant.findMany({ where: { ...plantFilter, portfolioId: pid }, select: { customerId: true } });
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
  const tableWhere = status === "all" ? invoiceWhere : { ...invoiceWhere, ...statusConditions[status] };
  const isMaestro = user.role === UserRole.MAESTRO;

  const [total, invoices, allInvoices, maestroPortfolios] = await Promise.all([
    prisma.invoice.count({ where: tableWhere }),
    prisma.invoice.findMany({
      where: tableWhere,
      include: { customer: { select: { name: true } }, portfolio: { select: { name: true } } },
      orderBy: { issueDate: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.invoice.findMany({ where: invoiceWhere, select: { total: true, statusName: true } }),
    isMaestro ? prisma.portfolio.findMany({ where: { active: 1, duemintCompanyId: { not: null } }, select: { id: true, name: true } }) : Promise.resolve([]),
  ]);

  function categorize(statusName: string | null) {
    const s = (statusName ?? "").toLowerCase();
    if (s.includes("pag") || s.includes("paid")) return "pagada";
    if (s.includes("venc") || s.includes("overdue")) return "vencida";
    if (s.includes("nul") || s.includes("cancel")) return "anulada";
    return "porVencer";
  }

  const kpis = { pagada: 0, porVencer: 0, vencida: 0, anulada: 0 };
  for (const inv of allInvoices) kpis[categorize(inv.statusName)] += inv.total ?? 0;

  const kpiCards = [
    { label: "Pagada",          value: formatCLP(kpis.pagada),    color: "#15803d", bg: "#dcfce7" },
    { label: "Por vencer",      value: formatCLP(kpis.porVencer), color: "#a16207", bg: "#fef9c3" },
    { label: "Vencida",         value: formatCLP(kpis.vencida),   color: "#dc2626", bg: "#fee2e2" },
    { label: "Nota de Crédito", value: formatCLP(kpis.anulada),   color: "#434655", bg: "#e6eeff" },
  ];

  return (
    <Box sx={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0, gap: 3 }}>
      <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, alignItems: { sm: "center" }, justifyContent: "space-between", gap: 2, flexWrap: "wrap", flexShrink: 0 }}>
        <Box>
          <Typography variant="h5" fontWeight={700} color="text.primary">Facturación</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
            {total} {total === 1 ? "factura" : "facturas"} · {MONTHS[month - 1]} {year}
          </Typography>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}>
          <BillingFilters month={month} year={year} status={status} />
          {isMaestro && maestroPortfolios.length > 0 && (
            <>
              <SyncSinceDialog />
              <ImportInvoiceDialog portfolios={maestroPortfolios} />
            </>
          )}
        </Box>
      </Box>

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(2, 1fr)", sm: "repeat(4, 1fr)" }, gap: 2, flexShrink: 0 }}>
        {kpiCards.map((kpi) => (
          <Card key={kpi.label} elevation={0} sx={{ border: "1px solid", borderColor: "divider" }}>
            <CardContent>
              <Typography variant="overline" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>{kpi.label}</Typography>
              <Typography variant="h6" fontWeight={700} sx={{ color: kpi.color }}>{kpi.value}</Typography>
            </CardContent>
          </Card>
        ))}
      </Box>

      <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", flex: 1, minHeight: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {invoices.length === 0 ? (
          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: 1, gap: 1.5, color: "text.secondary" }}>
            <ReceiptLongOutlinedIcon sx={{ fontSize: 36 }} />
            <Typography variant="body2" fontWeight={500}>Sin facturas registradas</Typography>
            <Typography variant="caption" color="text.secondary">El historial de facturación aparecerá aquí cuando esté disponible.</Typography>
          </Box>
        ) : (
          <>
            <TableContainer sx={{ flex: 1, minHeight: 0, overflow: "auto" }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow sx={{ "& .MuiTableCell-head": { backgroundColor: "#eff4ff", fontSize: "0.75rem", fontWeight: 600 } }}>
                    <TableCell>N° Factura</TableCell>
                    <TableCell>Cliente</TableCell>
                    <TableCell>Portafolio</TableCell>
                    <TableCell>Emisión</TableCell>
                    <TableCell>Vencimiento</TableCell>
                    <TableCell align="right">Total</TableCell>
                    <TableCell align="right">Por cobrar</TableCell>
                    <TableCell>Estado</TableCell>
                    <TableCell sx={{ width: 40 }} />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {invoices.map((inv) => (
                    <TableRow key={inv.id} hover sx={{ "& .MuiTableCell-root": { fontSize: "0.8125rem", py: 1.25 } }}>
                      <TableCell sx={{ fontFamily: "monospace", fontWeight: 500 }}>{inv.number ?? `#${inv.duemintId}`}</TableCell>
                      <TableCell>
                        <Typography fontSize="inherit" fontWeight={500}>{inv.customer.name}</Typography>
                        {inv.clientTaxId && <Typography fontSize="0.75rem" color="text.secondary">{inv.clientTaxId}</Typography>}
                      </TableCell>
                      <TableCell sx={{ color: "text.secondary" }}>{inv.portfolio?.name ?? "—"}</TableCell>
                      <TableCell sx={{ color: "text.secondary", whiteSpace: "nowrap" }}>{formatDate(inv.issueDate)}</TableCell>
                      <TableCell sx={{ color: "text.secondary", whiteSpace: "nowrap" }}>{formatDate(inv.dueDate)}</TableCell>
                      <TableCell align="right" sx={{ fontVariantNumeric: "tabular-nums", fontWeight: 500 }}>{inv.total != null ? formatCLP(inv.total) : "—"}</TableCell>
                      <TableCell align="right" sx={{ fontVariantNumeric: "tabular-nums" }}>{inv.amountDue != null ? formatCLP(inv.amountDue) : "—"}</TableCell>
                      <TableCell><StatusChip statusName={inv.statusName} /></TableCell>
                      <TableCell>
                        <InvoiceRowActions invoiceId={inv.id} isPaid={inv.statusName?.toLowerCase().includes("pag") || inv.statusName?.toLowerCase().includes("paid") || false} url={inv.url ?? null} pdfUrl={inv.pdfUrl ?? null} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <BillingPagination total={total} page={page} pageSize={pageSize} />
          </>
        )}
      </Card>
    </Box>
  );
}
