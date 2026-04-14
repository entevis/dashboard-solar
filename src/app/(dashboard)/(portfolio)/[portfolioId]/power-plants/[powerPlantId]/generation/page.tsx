import { requireAuth, getAccessiblePowerPlantIds } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { UserRole } from "@prisma/client";
import { formatKwh, formatPeriod } from "@/lib/utils/formatters";
import Link from "next/link";
import { UploadGenerationDialog } from "@/components/generation/upload-generation-dialog";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
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
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import OpenInNewOutlinedIcon from "@mui/icons-material/OpenInNewOutlined";

interface Props {
  params: Promise<{ portfolioId: string; powerPlantId: string }>;
}

export default async function PortfolioPlantGenerationPage({ params }: Props) {
  const { portfolioId, powerPlantId } = await params;
  const pid = parseInt(portfolioId);
  const id = parseInt(powerPlantId);
  const user = await requireAuth();

  const accessibleIds = await getAccessiblePowerPlantIds(user);
  if (accessibleIds !== "all" && !accessibleIds.includes(id)) notFound();

  const [plant, reports] = await Promise.all([
    prisma.powerPlant.findUnique({
      where: { id, active: 1, portfolioId: pid },
      select: { id: true, name: true },
    }),
    prisma.generationReport.findMany({
      where: { powerPlantId: id, active: 1 },
      orderBy: [{ periodYear: "desc" }, { periodMonth: "desc" }],
    }),
  ]);

  if (!plant) notFound();

  const totalKwh = reports.reduce((sum, r) => sum + (r.kwhGenerated ?? 0), 0);
  const totalCo2 = reports.reduce((sum, r) => sum + (r.co2Avoided ?? 0), 0);
  const base = `/${pid}/power-plants/${plant.id}`;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <Box>
          <Typography variant="h5" fontWeight={700} color="text.primary">{plant.name}</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>Reportes de generación energética</Typography>
        </Box>
        {user.role === UserRole.MAESTRO && (
          <UploadGenerationDialog powerPlantId={plant.id} powerPlantName={plant.name} />
        )}
      </Box>

      <Tabs value="generation" sx={{ borderBottom: 1, borderColor: "divider" }}>
        <Tab label="General" value="overview" component={Link} href={base} />
        <Tab label="Reportes" value="generation" component={Link} href={`${base}/generation`} />
        <Tab label="Contingencias" value="contingencies" component={Link} href={`${base}/contingencies`} />
      </Tabs>

      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 2 }}>
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
          <Typography variant="body2" fontWeight={600}>Historial de generación</Typography>
        </Box>
        {reports.length === 0 ? (
          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 200, gap: 1, color: "text.secondary" }}>
            <UploadFileOutlinedIcon sx={{ fontSize: 32 }} />
            <Typography variant="body2">Sin reportes de generación</Typography>
            {user.role === UserRole.MAESTRO && <Typography variant="caption">Subí el primer reporte usando el botón superior</Typography>}
          </Box>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ "& .MuiTableCell-head": { backgroundColor: "#eff4ff", fontSize: "0.75rem", fontWeight: 600 } }}>
                  <TableCell>Periodo</TableCell>
                  <TableCell align="right">Generación</TableCell>
                  <TableCell align="right">CO2 evitado</TableCell>
                  <TableCell>Archivo</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {reports.map((r) => (
                  <TableRow key={r.id} hover sx={{ "& .MuiTableCell-root": { fontSize: "0.8125rem", py: 1.25 } }}>
                    <TableCell>
                      <Chip label={formatPeriod(r.periodMonth, r.periodYear)} size="small" sx={{ backgroundColor: "#e6eeff", color: "#0d1c2e", fontWeight: 600, fontSize: "0.75rem", textTransform: "capitalize" }} />
                    </TableCell>
                    <TableCell align="right" sx={{ fontVariantNumeric: "tabular-nums", fontWeight: 500 }}>{r.kwhGenerated != null ? formatKwh(r.kwhGenerated) : "—"}</TableCell>
                    <TableCell align="right" sx={{ fontVariantNumeric: "tabular-nums" }}>
                      <Box component="span" fontWeight={500}>{r.co2Avoided != null ? r.co2Avoided.toFixed(2) : "—"}</Box>
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
