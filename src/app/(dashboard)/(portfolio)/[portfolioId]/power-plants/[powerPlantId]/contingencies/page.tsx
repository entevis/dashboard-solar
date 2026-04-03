import { requireAuth, getAccessiblePowerPlantIds } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { UserRole } from "@prisma/client";
import { formatDate, formatCLP } from "@/lib/utils/formatters";
import Link from "next/link";
import { CreateContingencyDialog } from "@/components/contingencies/create-contingency-dialog";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Card from "@mui/material/Card";
import Chip from "@mui/material/Chip";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import CheckCircleOutlinedIcon from "@mui/icons-material/CheckCircleOutlined";

interface Props {
  params: Promise<{ portfolioId: string; powerPlantId: string }>;
}

const statusSx: Record<string, { backgroundColor: string; color: string; fontWeight: number }> = {
  OPEN: { backgroundColor: "#fee2e2", color: "#b91c1c", fontWeight: 600 },
  IN_PROGRESS: { backgroundColor: "#fef9c3", color: "#a16207", fontWeight: 600 },
  CLOSED: { backgroundColor: "#dcfce7", color: "#15803d", fontWeight: 600 },
};
const statusLabel: Record<string, string> = { OPEN: "Abierta", IN_PROGRESS: "En progreso", CLOSED: "Cerrada" };
const typeLabel: Record<string, string> = { PREVENTIVE: "Preventiva", CORRECTIVE: "Correctiva" };

export default async function PortfolioPlantContingenciesPage({ params }: Props) {
  const { portfolioId, powerPlantId } = await params;
  const pid = parseInt(portfolioId);
  const id = parseInt(powerPlantId);
  const user = await requireAuth();

  const accessibleIds = await getAccessiblePowerPlantIds(user);
  if (accessibleIds !== "all" && !accessibleIds.includes(id)) notFound();

  const [plant, contingencies] = await Promise.all([
    prisma.powerPlant.findUnique({ where: { id, active: 1, portfolioId: pid }, select: { id: true, name: true } }),
    prisma.contingency.findMany({
      where: { powerPlantId: id, active: 1 },
      include: { createdBy: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  if (!plant) notFound();

  const canWrite = user.role === UserRole.MAESTRO || user.role === UserRole.OPERATIVO;
  const openCount = contingencies.filter((c) => c.status !== "CLOSED").length;
  const base = `/${pid}/power-plants/${plant.id}`;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <Box>
          <Typography variant="h5" fontWeight={700} color="text.primary">{plant.name}</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Contingencias de la planta · {openCount} abierta{openCount !== 1 ? "s" : ""}
          </Typography>
        </Box>
        {canWrite && <CreateContingencyDialog powerPlants={[{ id: plant.id, name: plant.name }]} />}
      </Box>

      <Tabs value="contingencies" sx={{ borderBottom: 1, borderColor: "divider" }}>
        <Tab label="General" value="overview" component={Link} href={base} />
        <Tab label="Reportes" value="generation" component={Link} href={`${base}/generation`} />
        <Tab label="Contingencias" value="contingencies" component={Link} href={`${base}/contingencies`} />
      </Tabs>

      <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", overflow: "hidden" }}>
        {contingencies.length === 0 ? (
          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", py: 8, gap: 1.5 }}>
            <CheckCircleOutlinedIcon sx={{ fontSize: 36, color: "text.disabled" }} />
            <Typography fontSize="0.875rem" color="text.secondary">Esta planta no tiene mantenciones ni alertas activas.</Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ "& .MuiTableCell-head": { backgroundColor: "#eff4ff", fontSize: "0.75rem", fontWeight: 600 } }}>
                  <TableCell>Tipo</TableCell>
                  <TableCell>Descripción</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell>Costo</TableCell>
                  <TableCell>Creada por</TableCell>
                  <TableCell>Fecha</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {contingencies.map((c) => (
                  <TableRow key={c.id} hover sx={{ "& .MuiTableCell-root": { fontSize: "0.8125rem", py: 1.25 } }}>
                    <TableCell>
                      <Chip label={typeLabel[c.type] ?? c.type} size="small" variant="outlined" sx={{ fontSize: "0.75rem", height: 22 }} />
                    </TableCell>
                    <TableCell sx={{ maxWidth: 300 }}>
                      <Box
                        component={Link}
                        href={`/${pid}/contingencies/${c.id}`}
                        sx={{ color: "primary.main", textDecoration: "none", "&:hover": { textDecoration: "underline" }, display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                      >
                        {c.description}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip label={statusLabel[c.status] ?? c.status} size="small" sx={{ ...statusSx[c.status] ?? statusSx.OPEN, fontSize: "0.75rem", height: 22 }} />
                    </TableCell>
                    <TableCell>{c.cost != null ? formatCLP(c.cost) : "—"}</TableCell>
                    <TableCell sx={{ color: "text.secondary" }}>{c.createdBy.name}</TableCell>
                    <TableCell sx={{ color: "text.secondary" }}>{formatDate(c.createdAt)}</TableCell>
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
