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
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <Box>
        <Typography variant="h5" fontWeight={700} color="text.primary">Reportes</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>Historial de producción energética del portafolio</Typography>
      </Box>

      <ReportFilterBar plants={accessiblePlants} />

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" }, gap: 2 }}>
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

      <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider" }}>
        <Box sx={{ px: 2, py: 1.5, borderBottom: "1px solid", borderColor: "divider" }}>
          <Typography variant="body2" fontWeight={600}>Historial</Typography>
        </Box>
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
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ "& .MuiTableCell-head": { backgroundColor: "#eff4ff", fontSize: "0.75rem", fontWeight: 600 } }}>
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
                  <TableRow key={r.id} hover sx={{ "& .MuiTableCell-root": { fontSize: "0.8125rem", py: 1.25 } }}>
                    <TableCell sx={{ fontWeight: 500 }}>
                      <Box component={Link} href={`/${pid}/power-plants/${r.powerPlant.id}/generation`} sx={{ color: "primary.main", textDecoration: "none", "&:hover": { textDecoration: "underline" } }}>
                        {r.powerPlant.name}
                      </Box>
                    </TableCell>
                    <TableCell sx={{ color: "text.secondary" }}>{r.powerPlant.portfolio.name}</TableCell>
                    <TableCell>
                      <Chip label={formatPeriod(r.periodMonth, r.periodYear)} size="small" sx={{ backgroundColor: "#e6eeff", color: "#0d1c2e", fontWeight: 600, fontSize: "0.75rem", textTransform: "capitalize" }} />
                    </TableCell>
                    <TableCell align="right" sx={{ fontVariantNumeric: "tabular-nums", fontWeight: 500 }}>{formatKwh(r.kwhGenerated)}</TableCell>
                    <TableCell align="right" sx={{ fontVariantNumeric: "tabular-nums" }}>
                      <Box component="span" fontWeight={500}>{r.co2Avoided.toFixed(2)}</Box>
                      <Box component="span" sx={{ fontSize: "0.75rem", color: "text.secondary", ml: 0.5 }}>ton</Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                        <Button component="a" href={r.fileUrl} target="_blank" rel="noopener noreferrer" size="small" startIcon={<OpenInNewOutlinedIcon sx={{ fontSize: "14px !important" }} />} sx={{ fontSize: "0.75rem", py: 0.25, px: 1, minWidth: 0 }}>Ver</Button>
                        <Button component="a" href={r.fileUrl} download={r.fileName} size="small" color="inherit" sx={{ fontSize: "0.75rem", py: 0.25, px: 0.75, minWidth: 0, color: "text.secondary" }}>
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
