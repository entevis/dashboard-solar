import { requireAuth, buildPlantAccessFilter } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";
import { formatCLP } from "@/lib/utils/formatters";
import { BillingFilters } from "@/components/billing/billing-filters";
import { BillingTable, type BillingSortKey } from "@/components/billing/billing-table";
import { ImportInvoiceDialog } from "@/components/billing/import-invoice-dialog";
import { SyncSinceDialog } from "@/components/billing/sync-since-dialog";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";

const PAGE_SIZE = 15;
const MONTHS = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

const VALID_SORT_KEYS: BillingSortKey[] = ["number","customer","portfolio","issueDate","dueDate","total","amountDue","status"];

function buildOrderBy(sortBy: BillingSortKey, dir: "asc" | "desc") {
  switch (sortBy) {
    case "number":    return { number: dir };
    case "customer":  return { customer: { name: dir } };
    case "portfolio": return { portfolio: { name: dir } };
    case "issueDate": return { issueDate: dir };
    case "dueDate":   return { dueDate: dir };
    case "total":     return { total: dir };
    case "amountDue": return { amountDue: dir };
    case "status":    return { statusName: dir };
    default:          return { issueDate: "desc" as const };
  }
}

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; size?: string; month?: string; year?: string; status?: string; sortBy?: string; sortDir?: string }>;
}) {
  const user = await requireAuth();
  const params = await searchParams;

  const page = Math.max(1, parseInt(params.page ?? "1") || 1);
  const VALID_SIZES = [15, 50, 100] as const;
  type PageSize = typeof VALID_SIZES[number];
  const parsedSize = parseInt(params.size ?? "");
  const pageSize: PageSize = (VALID_SIZES as readonly number[]).includes(parsedSize) ? parsedSize as PageSize : PAGE_SIZE;

  const now = new Date();
  const month = Math.min(12, Math.max(1, parseInt(params.month ?? "") || now.getMonth() + 1));
  const year = parseInt(params.year ?? "") || now.getFullYear();
  const periodStart = new Date(year, month - 1, 1);
  const periodEnd = new Date(year, month, 1);

  const VALID_STATUSES = ["pagada", "porVencer", "vencida", "anulada"];
  const status = VALID_STATUSES.includes(params.status ?? "") ? params.status! : "all";

  const sortBy = VALID_SORT_KEYS.includes(params.sortBy as BillingSortKey) ? params.sortBy as BillingSortKey : "issueDate";
  const sortDir = params.sortDir === "asc" ? "asc" : "desc";

  const plantFilter = await buildPlantAccessFilter(user);
  const periodFilter = { gte: periodStart, lt: periodEnd };
  let invoiceWhere: Record<string, unknown> = { active: 1, issueDate: periodFilter };

  if (user.role === UserRole.CLIENTE || user.role === UserRole.CLIENTE_PERFILADO) {
    invoiceWhere = { active: 1, customerId: user.customerId, issueDate: periodFilter };
  } else if (user.role === UserRole.OPERATIVO) {
    const plants = await prisma.powerPlant.findMany({ where: { ...plantFilter, active: 1 }, select: { customerId: true } });
    const customerIds = [...new Set(plants.map((p) => p.customerId))];
    invoiceWhere = { active: 1, customerId: { in: customerIds }, issueDate: periodFilter };
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
      orderBy: buildOrderBy(sortBy, sortDir),
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.invoice.findMany({ where: invoiceWhere, select: { total: true, statusName: true } }),
    isMaestro
      ? prisma.portfolio.findMany({ where: { active: 1, duemintCompanyId: { not: null } }, select: { id: true, name: true } })
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
  for (const inv of allInvoices) kpis[categorize(inv.statusName)] += inv.total ?? 0;

  const kpiCards = [
    { label: "Pagada",          value: kpis.pagada,    color: "#15803d", bg: "#dcfce7" },
    { label: "Por vencer",      value: kpis.porVencer, color: "#a16207", bg: "#fef9c3" },
    { label: "Vencida",         value: kpis.vencida,   color: "#dc2626", bg: "#fee2e2" },
    { label: "Nota de Crédito", value: kpis.anulada,   color: "#434655", bg: "#e6eeff" },
  ];

  const serializedInvoices = invoices.map((inv) => ({
    ...inv,
    issueDate: inv.issueDate?.toISOString() ?? null,
    dueDate: inv.dueDate?.toISOString() ?? null,
  }));

  return (
    <Box sx={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0, gap: 3 }}>

      {/* Header */}
      <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, alignItems: { sm: "center" }, justifyContent: "space-between", gap: 2, flexShrink: 0 }}>
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

      {/* KPI Cards */}
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(2, 1fr)", sm: "repeat(4, 1fr)" }, gap: 2, flexShrink: 0 }}>
        {kpiCards.map((k) => (
          <Card key={k.label} elevation={0} sx={{ border: "1px solid", borderColor: "divider" }}>
            <CardContent>
              <Typography variant="overline" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>{k.label}</Typography>
              <Typography variant="h6" fontWeight={700} sx={{ color: k.color }}>{formatCLP(k.value)}</Typography>
            </CardContent>
          </Card>
        ))}
      </Box>

      {/* Table */}
      <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", flex: 1, minHeight: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {invoices.length === 0 ? (
          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: 1, gap: 1.5, color: "text.secondary" }}>
            <ReceiptLongOutlinedIcon sx={{ fontSize: 36 }} />
            <Typography variant="body2" fontWeight={500}>Sin facturas registradas</Typography>
            <Typography variant="caption" color="text.secondary">El historial de facturación aparecerá aquí cuando esté disponible.</Typography>
          </Box>
        ) : (
          <BillingTable invoices={serializedInvoices} total={total} page={page} pageSize={pageSize} />
        )}
      </Card>
    </Box>
  );
}
