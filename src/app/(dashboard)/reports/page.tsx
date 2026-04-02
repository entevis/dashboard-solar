import { requireAuth, buildPlantAccessFilter } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { formatKwh, formatPeriod } from "@/lib/utils/formatters";
import Link from "next/link";
import { ReportFilterBar } from "@/components/reports/report-filter-bar";
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
import Button from "@mui/material/Button";
import UploadFileOutlinedIcon from "@mui/icons-material/UploadFileOutlined";
import SearchOffOutlinedIcon from "@mui/icons-material/SearchOffOutlined";
import OpenInNewOutlinedIcon from "@mui/icons-material/OpenInNewOutlined";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";

interface Props {
  searchParams: Promise<{ year?: string; powerPlantId?: string }>;
}

export default async function ReportsPage({ searchParams }: Props) {
  const user = await requireAuth();
  const params = await searchParams;

  const plantFilter = await buildPlantAccessFilter(user);

  const where: Record<string, unknown> = { active: 1, powerPlant: plantFilter };
  if (params.year)         where.periodYear    = parseInt(params.year);
  if (params.powerPlantId) where.powerPlantId  = parseInt(params.powerPlantId);

  const [reports, totalKwh, totalCo2] = await Promise.all([
    prisma.generationReport.findMany({
      where,
      include: { powerPlant: { select: { id: true, name: true, portfolio: { select: { name: true } } } } },
      orderBy: [{ periodYear: "desc" }, { periodMonth: "desc" }],
    }),
    prisma.generationReport
      .aggregate({ where: { active: 1, powerPlant: plantFilter }, _sum: { kwhGenerated: true } })
      .then((r) => r._sum.kwhGenerated ?? 0),
    prisma.generationReport
      .aggregate({ where: { active: 1, powerPlant: plantFilter }, _sum: { co2Avoided: true } })
      .then((r) => r._sum.co2Avoided ?? 0),
    prisma.powerPlant.findMany({ where: plantFilter, select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  const accessiblePlants = await prisma.powerPlant.findMany({
    where: plantFilter,
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  const hasFilters = !!(params.year || params.powerPlantId);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>

      {/* Header */}
      <Box>
        <Typography variant="h5" fontWeight={700} color="text.primary">Reportes</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
          Historial de producción energética del portafolio
        </Typography>
      </Box>

      <ReportFilterBar plants={accessiblePlants} />

      {/* KPI Cards */}
      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 2 }}>
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
      <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider" }}>
        <Box sx={{ px: 2, py: 1.5, borderBottom: "1px solid", borderColor: "divider" }}>
          <Typography variant="body2" fontWeight={600}>Historial</Typography>
        </Box>

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
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Planta</TableCell>
                  <TableCell>Portafolio</TableCell>
                  <TableCell>Periodo</TableCell>
                  <TableCell align="right">Generación</TableCell>
                  <TableCell align="right">CO2 evitado</TableCell>
                  <TableCell>Archivo</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {reports.map((r) => (
                  <TableRow key={r.id} hover>
                    <TableCell>
                      <Link href={`/power-plants/${r.powerPlant.id}/generation`} style={{ color: "#004ac6", fontWeight: 500, textDecoration: "none", fontSize: "0.8125rem" }}
                        onMouseOver={e => (e.currentTarget.style.textDecoration = "underline")}
                        onMouseOut={e => (e.currentTarget.style.textDecoration = "none")}
                      >
                        {r.powerPlant.name}
                      </Link>
                    </TableCell>
                    <TableCell sx={{ color: "text.secondary" }}>{r.powerPlant.portfolio.name}</TableCell>
                    <TableCell>
                      <Chip
                        label={formatPeriod(r.periodMonth, r.periodYear)}
                        size="small"
                        sx={{ backgroundColor: "#e6eeff", color: "#0d1c2e", fontWeight: 600, fontSize: "0.75rem", textTransform: "capitalize" }}
                      />
                    </TableCell>
                    <TableCell align="right" sx={{ fontVariantNumeric: "tabular-nums", fontWeight: 500 }}>
                      {formatKwh(r.kwhGenerated)}
                    </TableCell>
                    <TableCell align="right" sx={{ fontVariantNumeric: "tabular-nums" }}>
                      <Box component="span" fontWeight={500}>{r.co2Avoided.toFixed(2)}</Box>
                      <Box component="span" sx={{ fontSize: "0.75rem", color: "text.secondary", ml: 0.5 }}>ton</Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                        <Button
                          component="a"
                          href={r.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          size="small"
                          startIcon={<OpenInNewOutlinedIcon sx={{ fontSize: "14px !important" }} />}
                          sx={{ fontSize: "0.75rem", py: 0.25, px: 1, minWidth: 0 }}
                        >
                          Ver
                        </Button>
                        <Button
                          component="a"
                          href={r.fileUrl}
                          download={r.fileName}
                          size="small"
                          color="inherit"
                          sx={{ fontSize: "0.75rem", py: 0.25, px: 0.75, minWidth: 0, color: "text.secondary" }}
                        >
                          <FileDownloadOutlinedIcon sx={{ fontSize: 16 }} />
                        </Button>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Card>
    </Box>
  );
}
