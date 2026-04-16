import { requireAuth, getAccessiblePowerPlantIds } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { formatKwh } from "@/lib/utils/formatters";
import Link from "next/link";
import { BillingTable, type BillingSortKey } from "@/components/billing/billing-table";
import { GenerationCharts } from "@/components/generation/generation-charts";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";
import { formatCLP } from "@/lib/utils/formatters";

const DEFAULT_PAGE_SIZE = 15;
const VALID_SORT_KEYS: BillingSortKey[] = ["number", "customer", "issueDate", "dueDate", "total", "status"];

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
  params: Promise<{ portfolioId: string; powerPlantId: string }>;
  searchParams: Promise<{ page?: string; size?: string; sortBy?: string; sortDir?: string }>;
}

export default async function PortfolioPlantGenerationPage({ params, searchParams }: Props) {
  const { portfolioId, powerPlantId } = await params;
  const pid = parseInt(portfolioId);
  const id = parseInt(powerPlantId);
  const user = await requireAuth();
  const sp = await searchParams;

  const accessibleIds = await getAccessiblePowerPlantIds(user);
  if (accessibleIds !== "all" && !accessibleIds.includes(id)) notFound();

  const page = Math.max(1, parseInt(sp.page ?? "1") || 1);
  const VALID_SIZES = [15, 50, 100] as const;
  type PageSize = typeof VALID_SIZES[number];
  const parsedSize = parseInt(sp.size ?? "");
  const pageSize: PageSize = (VALID_SIZES as readonly number[]).includes(parsedSize) ? parsedSize as PageSize : DEFAULT_PAGE_SIZE;
  const sortBy = VALID_SORT_KEYS.includes(sp.sortBy as BillingSortKey) ? sp.sortBy as BillingSortKey : "issueDate";
  const sortDir = sp.sortDir === "asc" ? "asc" : "desc";

  // Find all PlantName IDs linked to this plant
  const plantNameIds = await prisma.plantName.findMany({
    where: { powerPlantId: id },
    select: { id: true },
  }).then((rows) => rows.map((r) => r.id));

  // Find all duemintIds from reports linked to those plant names
  const reportDuemintIds = plantNameIds.length > 0
    ? await prisma.generationReport.findMany({
        where: { plantNameId: { in: plantNameIds }, active: 1, duemintId: { not: null } },
        select: { duemintId: true },
      }).then((rows) => rows.map((r) => r.duemintId!))
    : [];

  const plant = await prisma.powerPlant.findUnique({
    where: { id, active: 1, portfolioId: pid },
    select: { id: true, name: true },
  });

  if (!plant) notFound();

  const base = `/${pid}/power-plants/${plant.id}`;

  // Query invoices linked to this plant
  const invoiceWhere = reportDuemintIds.length > 0
    ? { active: 1, duemintId: { in: reportDuemintIds } }
    : { active: 1, id: -1 }; // no results if no reports

  const [total, invoices] = await Promise.all([
    prisma.invoice.count({ where: invoiceWhere }),
    prisma.invoice.findMany({
      where: invoiceWhere,
      include: { customer: { select: { name: true } } },
      orderBy: buildOrderBy(sortBy, sortDir),
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  // Look up generation reports for the fetched invoices
  const invoiceDuemintIds = invoices.map((inv) => inv.duemintId).filter(Boolean) as string[];
  const reports = invoiceDuemintIds.length > 0
    ? await prisma.generationReport.findMany({
        where: { duemintId: { in: invoiceDuemintIds }, active: 1 },
        select: { duemintId: true, kwhGenerated: true, co2Avoided: true, fileUrl: true, periodMonth: true, periodYear: true, plantName: true },
      })
    : [];
  const reportByDuemintId = new Map(reports.map((r) => [r.duemintId, r]));

  // KPIs + chart data from all reports for this plant
  const allReports = plantNameIds.length > 0
    ? await prisma.generationReport.findMany({
        where: { plantNameId: { in: plantNameIds }, active: 1 },
        select: { kwhGenerated: true, co2Avoided: true, periodMonth: true, periodYear: true },
      })
    : [];
  const totalKwh = allReports.reduce((sum, r) => sum + (r.kwhGenerated ?? 0), 0);
  const totalCo2 = allReports.reduce((sum, r) => sum + (r.co2Avoided ?? 0), 0);

  // Aggregate by month for charts
  const monthlyMap = new Map<string, { month: number; year: number; kwh: number; co2: number }>();
  for (const r of allReports) {
    const key = `${r.periodYear}-${r.periodMonth}`;
    const existing = monthlyMap.get(key);
    if (existing) {
      existing.kwh += r.kwhGenerated ?? 0;
      existing.co2 += r.co2Avoided ?? 0;
    } else {
      monthlyMap.set(key, {
        month: r.periodMonth,
        year: r.periodYear,
        kwh: r.kwhGenerated ?? 0,
        co2: r.co2Avoided ?? 0,
      });
    }
  }
  const chartData = Array.from(monthlyMap.values());

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
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <Box>
        <Typography variant="h5" fontWeight={700} color="text.primary">{plant.name}</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
          Facturas y reportes de generación
        </Typography>
      </Box>

      <Tabs value="generation" sx={{ borderBottom: 1, borderColor: "divider" }}>
        <Tab label="General" value="overview" component={Link} href={base} />
        <Tab label="Facturas y reportes" value="generation" component={Link} href={`${base}/generation`} />
      </Tabs>

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" }, gap: 2, flexShrink: 0 }}>
        {[
          { label: "Total generado", value: formatKwh(totalKwh), color: "text.primary" },
          { label: "CO₂ evitado", value: `${totalCo2.toFixed(2)} ton`, color: "#16a34a" },
          { label: "Facturas", value: String(total), color: "text.primary" },
        ].map((kpi) => (
          <Card key={kpi.label} elevation={0} sx={{ border: "1px solid", borderColor: "divider" }}>
            <CardContent>
              <Typography variant="overline" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>{kpi.label}</Typography>
              <Typography variant="h6" fontWeight={700} sx={{ color: kpi.color }}>{kpi.value}</Typography>
            </CardContent>
          </Card>
        ))}
      </Box>

      <GenerationCharts data={chartData} />

      <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {total === 0 ? (
          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: 1, gap: 1.5, color: "text.secondary" }}>
            <ReceiptLongOutlinedIcon sx={{ fontSize: 36 }} />
            <Typography variant="body2" fontWeight={500}>Sin facturas vinculadas</Typography>
            <Typography variant="caption" color="text.secondary" sx={{ textAlign: "center", maxWidth: 320 }}>
              Las facturas aparecerán aquí cuando estén vinculadas a esta planta.
            </Typography>
          </Box>
        ) : (
          <BillingTable invoices={serializedInvoices} total={total} page={page} pageSize={pageSize} />
        )}
      </Card>
    </Box>
  );
}
