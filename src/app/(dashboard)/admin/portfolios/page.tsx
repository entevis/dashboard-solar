import { requireRole } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { CreatePortfolioDialog } from "@/components/admin/create-portfolio-dialog";
import { PortfolioRowActions } from "@/components/admin/portfolio-row-actions";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Card from "@mui/material/Card";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Chip from "@mui/material/Chip";
import BusinessOutlinedIcon from "@mui/icons-material/BusinessOutlined";
import Link from "next/link";

export default async function PortfoliosPage() {
  await requireRole(["MAESTRO"]);

  const portfolios = await prisma.portfolio.findMany({
    where: { active: 1 },
    include: {
      _count: {
        select: {
          powerPlants: { where: { active: 1 } },
          users: { where: { active: 1 } },
        },
      },
    },
    orderBy: { name: "asc" },
  });

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3, flex: 1, minHeight: 0 }}>
      <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 2, flexWrap: "wrap", flexShrink: 0 }}>
        <Box>
          <Typography variant="h5" fontWeight={700} color="text.primary">Portafolios</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
            {portfolios.length} {portfolios.length === 1 ? "portafolio registrado" : "portafolios registrados"}
          </Typography>
        </Box>
        <CreatePortfolioDialog />
      </Box>

      <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", overflow: "hidden", flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
        {portfolios.length === 0 ? (
          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", py: 10, gap: 1.5 }}>
            <BusinessOutlinedIcon sx={{ fontSize: 36, color: "text.disabled" }} />
            <Typography fontSize="0.875rem" color="text.secondary">
              Crea un portafolio para agrupar plantas solares por cliente o proyecto de inversión.
            </Typography>
            <CreatePortfolioDialog />
          </Box>
        ) : (
          <TableContainer sx={{ flex: 1, minHeight: 0, overflow: "auto" }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow sx={{ "& .MuiTableCell-head": { backgroundColor: "#eff4ff", fontSize: "0.75rem", fontWeight: 600 } }}>
                  <TableCell>Nombre</TableCell>
                  <TableCell>Descripción</TableCell>
                  <TableCell>Plantas</TableCell>
                  <TableCell>Usuarios asignados</TableCell>
                  <TableCell sx={{ width: 48 }} />
                </TableRow>
              </TableHead>
              <TableBody>
                {portfolios.map((p) => (
                  <TableRow key={p.id} hover sx={{ "& .MuiTableCell-root": { fontSize: "0.8125rem", py: 1.25 } }}>
                    <TableCell sx={{ fontWeight: 500 }}>
                      <Box
                        component={Link}
                        href={`/power-plants?portfolioId=${p.id}`}
                        sx={{ color: "primary.main", textDecoration: "none", "&:hover": { textDecoration: "underline" } }}
                      >
                        {p.name}
                      </Box>
                    </TableCell>
                    <TableCell sx={{ color: "text.secondary" }}>{p.description ?? "—"}</TableCell>
                    <TableCell>
                      <Chip label={p._count.powerPlants} size="small" sx={{ backgroundColor: "#eff4ff", color: "text.secondary", fontSize: "0.75rem", height: 20 }} />
                    </TableCell>
                    <TableCell>
                      <Chip label={p._count.users} size="small" sx={{ backgroundColor: "#eff4ff", color: "text.secondary", fontSize: "0.75rem", height: 20 }} />
                    </TableCell>
                    <TableCell>
                      <PortfolioRowActions portfolio={p} />
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
