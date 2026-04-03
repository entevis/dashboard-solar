import { requireAuth, buildPlantAccessFilter } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { formatKwh } from "@/lib/utils/formatters";
import { ReportFilterBar } from "@/components/reports/report-filter-bar";
import { ReportTable } from "@/components/reports/report-table";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import UploadFileOutlinedIcon from "@mui/icons-material/UploadFileOutlined";
import SearchOffOutlinedIcon from "@mui/icons-material/SearchOffOutlined";

interface Props {
  params: Promise<{ portfolioId: string }>;
  searchParams: Promise<{ year?: string; powerPlantId?: string }>;
}

export default async function PortfolioReportsPage({ params, searchParams }: Props) {
  const { portfolioId } = await params;
  const pid = parseInt(portfolioId);
  const user = await requireAuth();
  const sp = await searchParams;

  const plantFilter = await buildPlantAccessFilter(user);
  const plantWhere = { ...plantFilter, portfolioId: pid };

  const where: Record<string, unknown> = { active: 1, powerPlant: plantWhere };
  if (sp.year) where.periodYear = parseInt(sp.year);
  if (sp.powerPlantId) where.powerPlantId = parseInt(sp.powerPlantId);

  const [reports, totalKwh, totalCo2, accessiblePlants] = await Promise.all([
    prisma.generationReport.findMany({
      where,
      include: { powerPlant: { select: { id: true, name: true, portfolio: { select: { name: true } } } } },
      orderBy: [{ periodYear: "desc" }, { periodMonth: "desc" }],
    }),
    prisma.generationReport.aggregate({ where: { active: 1, powerPlant: plantWhere }, _sum: { kwhGenerated: true } }).then((r) => r._sum.kwhGenerated ?? 0),
    prisma.generationReport.aggregate({ where: { active: 1, powerPlant: plantWhere }, _sum: { co2Avoided: true } }).then((r) => r._sum.co2Avoided ?? 0),
    prisma.powerPlant.findMany({ where: plantWhere, select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  const hasFilters = !!(sp.year || sp.powerPlantId);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3, flex: 1, minHeight: 0 }}>
      <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, alignItems: { sm: "flex-end" }, justifyContent: "space-between", gap: 2, flexShrink: 0 }}>
        <Box>
          <Typography variant="h5" fontWeight={700} color="text.primary">Reportes</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
            {reports.length} {reports.length === 1 ? "reporte encontrado" : "reportes encontrados"}
          </Typography>
        </Box>
        <ReportFilterBar plants={accessiblePlants} />
      </Box>

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" }, gap: 2, flexShrink: 0 }}>
        {[
          { label: "Total generado", value: formatKwh(totalKwh), color: "text.primary" },
          { label: "CO2 evitado", value: `${totalCo2.toFixed(2)} ton`, color: "#16a34a" },
          { label: "Reportes", value: String(reports.length), color: "text.primary" },
        ].map((kpi) => (
          <Card key={kpi.label} elevation={0} sx={{ border: "1px solid", borderColor: "divider" }}>
            <CardContent>
              <Typography variant="overline" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>{kpi.label}</Typography>
              <Typography variant="h6" fontWeight={700} sx={{ color: kpi.color }}>{kpi.value}</Typography>
            </CardContent>
          </Card>
        ))}
      </Box>

      <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", flex: 1, minHeight: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {reports.length === 0 ? (
          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", py: 8, gap: 1.5 }}>
            {hasFilters
              ? <SearchOffOutlinedIcon sx={{ fontSize: 36, color: "text.disabled" }} />
              : <UploadFileOutlinedIcon sx={{ fontSize: 36, color: "text.disabled" }} />
            }
            <Typography fontSize="0.875rem" color="text.secondary">
              {hasFilters ? "Ningún reporte coincide con los filtros aplicados." : "Los reportes de generación mensual aparecerán aquí."}
            </Typography>
          </Box>
        ) : (
          <ReportTable reports={reports} portfolioId={pid} />
        )}
      </Card>
    </Box>
  );
}
