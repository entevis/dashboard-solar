import { requireAuth, buildPlantAccessFilter } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { formatKwh, formatPeriod } from "@/lib/utils/formatters";
import Link from "next/link";
import { ReportFilterBar } from "@/components/reports/report-filter-bar";
import { ReportTable } from "@/components/reports/report-table";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import UploadFileOutlinedIcon from "@mui/icons-material/UploadFileOutlined";
import SearchOffOutlinedIcon from "@mui/icons-material/SearchOffOutlined";

interface Props {
  searchParams: Promise<{ year?: string; powerPlantId?: string }>;
}

export default async function ReportsPage({ searchParams }: Props) {
  const user = await requireAuth();
  const params = await searchParams;

  const plantFilter = await buildPlantAccessFilter(user);

  const customerIdsAccessible = await prisma.powerPlant.findMany({
    where: plantFilter,
    select: { customerId: true },
    distinct: ["customerId"],
  }).then((rows) => rows.map((r) => r.customerId));

  const where: Record<string, unknown> = {
    active: 1,
    OR: [
      { powerPlant: plantFilter },
      { powerPlantId: null, customerId: { in: customerIdsAccessible } },
    ],
  };
  if (params.year)         where.periodYear    = parseInt(params.year);
  if (params.powerPlantId) where.powerPlantId  = parseInt(params.powerPlantId);

  const baseWhere = {
    active: 1,
    OR: [
      { powerPlant: plantFilter },
      { powerPlantId: null, customerId: { in: customerIdsAccessible } },
    ],
  };

  const [reports, totalKwh, totalCo2] = await Promise.all([
    prisma.generationReport.findMany({
      where,
      include: {
        powerPlant: { select: { id: true, name: true, portfolio: { select: { name: true } } } },
        customer: { select: { name: true } },
      },
      orderBy: [{ periodYear: "desc" }, { periodMonth: "desc" }],
    }),
    prisma.generationReport
      .aggregate({ where: baseWhere, _sum: { kwhGenerated: true } })
      .then((r) => r._sum.kwhGenerated ?? 0),
    prisma.generationReport
      .aggregate({ where: baseWhere, _sum: { co2Avoided: true } })
      .then((r) => r._sum.co2Avoided ?? 0),
  ]);

  const accessiblePlants = await prisma.powerPlant.findMany({
    where: plantFilter,
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  const hasFilters = !!(params.year || params.powerPlantId);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3, flex: 1, minHeight: 0 }}>

      {/* Header */}
      <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, alignItems: { sm: "flex-end" }, justifyContent: "space-between", gap: 2, flexShrink: 0 }}>
        <Box>
          <Typography variant="h5" fontWeight={700} color="text.primary">Reportes</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
            {reports.length} {reports.length === 1 ? "reporte encontrado" : "reportes encontrados"}
          </Typography>
        </Box>
        <ReportFilterBar plants={accessiblePlants} />
      </Box>

      {/* KPI Cards */}
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" }, gap: 2, flexShrink: 0 }}>
        <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider" }}>
          <CardContent>
            <Typography variant="overline" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>Total generado</Typography>
            <Typography variant="h6" fontWeight={700} color="text.primary">{formatKwh(totalKwh)}</Typography>
          </CardContent>
        </Card>
        <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider" }}>
          <CardContent>
            <Typography variant="overline" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>CO2 evitado</Typography>
            <Typography variant="h6" fontWeight={700} sx={{ color: "#16a34a" }}>{totalCo2.toFixed(2)} ton</Typography>
          </CardContent>
        </Card>
        <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider" }}>
          <CardContent>
            <Typography variant="overline" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>Reportes</Typography>
            <Typography variant="h6" fontWeight={700} color="text.primary">{reports.length}</Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Table */}
      <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", flex: 1, minHeight: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {reports.length === 0 ? (
          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 200, gap: 1.5, color: "text.secondary" }}>
            {hasFilters
              ? <SearchOffOutlinedIcon sx={{ fontSize: 36 }} />
              : <UploadFileOutlinedIcon sx={{ fontSize: 36 }} />
            }
            <Typography variant="body2" fontWeight={500}>
              {hasFilters ? "Sin resultados" : "Sin reportes disponibles"}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ textAlign: "center", maxWidth: 360 }}>
              {hasFilters
                ? "Ningún reporte coincide con los filtros aplicados."
                : "Los reportes de generación mensual aparecerán aquí una vez que el equipo de S-Invest los cargue."}
            </Typography>
          </Box>
        ) : (
          <ReportTable reports={reports} />
        )}
      </Card>
    </Box>
  );
}
