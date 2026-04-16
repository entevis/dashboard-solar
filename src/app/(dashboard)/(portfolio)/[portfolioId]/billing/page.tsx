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

const VALID_SORT_KEYS: BillingSortKey[] = ["number","customer","issueDate","dueDate","total","status"];

function buildOrderBy(sortBy: BillingSortKey, dir: "asc" | "desc") {
  switch (sortBy) {
    case "number":    return { number: dir };
    case "customer":  return { customer: { name: dir } };
    case "issueDate": return { issueDate: dir };
    case "dueDate":   return { dueDate: dir };
    case "total":     return { total: dir };
    case "status":    return { statusName: dir };
    default:          return { issueDate: "desc" as const };
  }
}

interface Props {
  params: Promise<{ portfolioId: string }>;
  searchParams: Promise<{ page?: string; size?: string; month?: string; year?: string; status?: string; sortBy?: string; sortDir?: string; invoiceNumber?: string }>;
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
  const invoiceNumber = sp.invoiceNumber?.trim() ?? "";
  const month = Math.min(12, Math.max(1, parseInt(sp.month ?? "") || now.getMonth() + 1));
  const year = parseInt(sp.year ?? "") || now.getFullYear();

  const VALID_STATUSES = ["pagada", "porVencer", "vencida", "notaCredito"];
  const status = VALID_STATUSES.includes(sp.status ?? "") ? sp.status! : "all";

  const sortBy = VALID_SORT_KEYS.includes(sp.sortBy as BillingSortKey) ? sp.sortBy as BillingSortKey : "issueDate";
  const sortDir = sp.sortDir === "asc" ? "asc" : "desc";

  let invoiceWhere: Record<string, unknown> = { active: 1, portfolioId: pid };
  // When searching by invoice number, skip date filter to search across all dates
  if (!invoiceNumber) {
    const periodStart = new Date(year, month - 1, 1);
    const periodEnd = new Date(year, month, 1);
    invoiceWhere.issueDate = { gte: periodStart, lt: periodEnd };
  }

  if (user.role === UserRole.CLIENTE || user.role === UserRole.CLIENTE_PERFILADO) {
    invoiceWhere = { ...invoiceWhere, customerId: user.customerId };
  } else if (user.role === UserRole.OPERATIVO) {
    const plantFilter = await buildPlantAccessFilter(user);
    const plants = await prisma.powerPlant.findMany({ where: { ...plantFilter, portfolioId: pid }, select: { customerId: true } });
    const customerIds = [...new Set(plants.map((p) => p.customerId))];
    invoiceWhere = { ...invoiceWhere, customerId: { in: customerIds } };
  }

  // statusCode: 1=Pagada, 2=Por vencer, 3=Vencida, 4=Documento
  const statusConditions: Record<string, object> = {
    pagada:    { statusCode: 1 },
    porVencer: { statusCode: 2 },
    vencida:   { statusCode: 3 },
    notaCredito: { statusCode: 4 },
  };
  let tableWhere = status === "all" ? invoiceWhere : { ...invoiceWhere, ...statusConditions[status] };
  if (invoiceNumber) {
    tableWhere = { ...tableWhere, number: { contains: invoiceNumber, mode: "insensitive" as const } };
  }
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
    prisma.invoice.findMany({ where: invoiceWhere, select: { total: true, statusCode: true } }),
    isMaestro ? prisma.portfolio.findMany({ where: { active: 1, duemintCompanyId: { not: null } }, select: { id: true, name: true } }) : Promise.resolve([]),
  ]);

  function categorize(statusCode: number | null): "pagada" | "porVencer" | "vencida" | "notaCredito" {
    switch (statusCode) {
      case 1: return "pagada";
      case 2: return "porVencer";
      case 3: return "vencida";
      case 4: return "notaCredito";
      default: return "porVencer";
    }
  }

  const kpis = { pagada: 0, porVencer: 0, vencida: 0, notaCredito: 0 };
  const kpiCounts = { pagada: 0, porVencer: 0, vencida: 0, notaCredito: 0 };
  for (const inv of allInvoices) {
    const cat = categorize(inv.statusCode);
    kpis[cat] += inv.total ?? 0;
    kpiCounts[cat]++;
  }

  const kpiCards = [
    { label: "Pagadas",     value: kpis.pagada,    count: kpiCounts.pagada,    color: "#15803d" },
    { label: "Por vencer",  value: kpis.porVencer, count: kpiCounts.porVencer, color: "#a16207" },
    { label: "Vencidas",    value: kpis.vencida,   count: kpiCounts.vencida,   color: "#dc2626" },
    { label: "Notas de crédito",  value: kpis.notaCredito, count: kpiCounts.notaCredito, color: "#434655" },
  ];

  const invoiceDuemintIds = invoices.map((inv) => inv.duemintId).filter(Boolean) as string[];
  const reports = invoiceDuemintIds.length > 0
    ? await prisma.generationReport.findMany({
        where: { duemintId: { in: invoiceDuemintIds }, active: 1 },
        select: { duemintId: true, kwhGenerated: true, co2Avoided: true, fileUrl: true, periodMonth: true, periodYear: true, plantName: true },
      })
    : [];
  const reportByDuemintId = new Map(reports.map((r) => [r.duemintId, r]));

  const serializedInvoices = invoices.map((inv) => {
    const report = inv.duemintId ? reportByDuemintId.get(inv.duemintId) ?? null : null;
    return {
      ...inv,
      issueDate: inv.issueDate?.toISOString() ?? null,
      dueDate: inv.dueDate?.toISOString() ?? null,
      kwhGenerated: report?.kwhGenerated ?? null,
      co2Avoided: report?.co2Avoided ?? null,
      reportUrl: report?.fileUrl ?? null,
      reportPeriodMonth: report?.periodMonth ?? null,
      reportPeriodYear: report?.periodYear ?? null,
      reportPlantName: report?.plantName ?? null,
    };
  });

  return (
    <Box sx={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0, gap: 3 }}>
      <Box>
        <Typography variant="h5" fontWeight={700} color="text.primary">Facturas y reportes</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
          {total} {total === 1 ? "factura" : "facturas"}{invoiceNumber ? ` · Buscando "${invoiceNumber}"` : ` · ${MONTHS[month - 1]} ${year}`}
        </Typography>
      </Box>

      <BillingFilters
        month={month}
        year={year}
        status={status}
        plants={[]}
        isMaestro={isMaestro}
        actions={isMaestro && maestroPortfolios.length > 0 ? (
          <>
            <SyncSinceDialog portfolioId={pid} />
            <ImportInvoiceDialog portfolios={maestroPortfolios} />
          </>
        ) : undefined}
      />

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(2, 1fr)", sm: "repeat(4, 1fr)" }, gap: 2, flexShrink: 0 }}>
        {kpiCards.map((kpi) => (
          <Card key={kpi.label} elevation={0} sx={{ border: "1px solid", borderColor: "divider" }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5, fontWeight: 600 }}>{kpi.label}</Typography>
              <Typography variant="h6" fontWeight={700} sx={{ color: kpi.color }}>{formatCLP(kpi.value)}</Typography>
              <Typography variant="caption" color="text.secondary">{kpi.count} {kpi.count === 1 ? "factura" : "facturas"}</Typography>
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
          <BillingTable invoices={serializedInvoices} total={total} page={page} pageSize={pageSize} />
        )}
      </Card>
    </Box>
  );
}
