"use client";

import { useState } from "react";
import Link from "next/link";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TablePagination from "@mui/material/TablePagination";
import CheckCircleOutlinedIcon from "@mui/icons-material/CheckCircleOutlined";
import { formatDate, formatCLP } from "@/lib/utils/formatters";
import { ContingencyRowActions } from "@/components/contingencies/contingency-row-actions";

interface Contingency {
  id: number;
  code: string | null;
  type: string;
  description: string;
  status: string;
  cost: number | null;
  provider: string | null;
  createdAt: string;
  closedAt: string | null;
  powerPlant: { name: string; portfolio: { name: string } };
  createdBy: { name: string };
}

const statusConfig: Record<string, { label: string; sx: object }> = {
  OPEN:        { label: "Abierta",     sx: { backgroundColor: "#fee2e2", color: "#dc2626", fontWeight: 600 } },
  IN_PROGRESS: { label: "En progreso", sx: { backgroundColor: "#fef9c3", color: "#a16207", fontWeight: 600 } },
  CLOSED:      { label: "Cerrada",     sx: { backgroundColor: "#dcfce7", color: "#15803d", fontWeight: 600 } },
};

const typeLabels: Record<string, string> = {
  PREVENTIVE: "Preventiva",
  CORRECTIVE: "Correctiva",
};

const PAGE_SIZES = [15, 25, 50];

export function ContingencyTable({ contingencies, canWrite = false }: { contingencies: Contingency[]; canWrite?: boolean }) {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(15);

  if (contingencies.length === 0) {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: 1, gap: 1.5, color: "text.secondary" }}>
        <CheckCircleOutlinedIcon sx={{ fontSize: 36 }} />
        <Typography variant="body2" fontWeight={500}>Sin contingencias registradas</Typography>
        <Typography variant="caption" color="text.secondary" sx={{ textAlign: "center", maxWidth: 320 }}>
          Todas las plantas operan con normalidad. Las mantenciones y alertas activas aparecerán aquí.
        </Typography>
      </Box>
    );
  }

  const paginated = contingencies.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
      <TableContainer sx={{ flex: 1, minHeight: 0, overflow: "auto" }}>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              <TableCell>Código</TableCell>
              <TableCell>Planta</TableCell>
              <TableCell>Tipo</TableCell>
              <TableCell>Descripción</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell>Costo</TableCell>
              <TableCell>Proveedor</TableCell>
              <TableCell>Creada</TableCell>
              <TableCell sx={{ width: 40 }} />
            </TableRow>
          </TableHead>
          <TableBody>
            {paginated.map((c) => {
              const status = statusConfig[c.status] ?? statusConfig.OPEN;
              return (
                <TableRow key={c.id} hover>
                  <TableCell sx={{ fontSize: "0.8125rem", color: c.code ? "text.primary" : "text.disabled", whiteSpace: "nowrap" }}>
                    {c.code ?? "—"}
                  </TableCell>
                  <TableCell>
                    <Link href={`/contingencies/${c.id}`} style={{ color: "#004ac6", fontWeight: 500, textDecoration: "none", fontSize: "0.8125rem" }}
                      onMouseOver={e => (e.currentTarget.style.textDecoration = "underline")}
                      onMouseOut={e => (e.currentTarget.style.textDecoration = "none")}
                    >
                      {c.powerPlant.name}
                    </Link>
                    <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                      {c.powerPlant.portfolio.name}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip label={typeLabels[c.type] ?? c.type} size="small" variant="outlined" sx={{ fontSize: "0.6875rem", height: 20 }} />
                  </TableCell>
                  <TableCell sx={{ maxWidth: 280 }}>
                    <Typography fontSize="0.8125rem" noWrap title={c.description}>{c.description}</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip label={status.label} size="small" sx={{ ...status.sx, fontSize: "0.6875rem", height: 20 }} />
                  </TableCell>
                  <TableCell sx={{ fontSize: "0.8125rem" }}>{c.cost != null ? formatCLP(c.cost) : "—"}</TableCell>
                  <TableCell sx={{ fontSize: "0.8125rem", color: "text.secondary" }}>{c.provider ?? "—"}</TableCell>
                  <TableCell sx={{ fontSize: "0.8125rem", color: "text.secondary", whiteSpace: "nowrap" }}>{formatDate(c.createdAt)}</TableCell>
                  <TableCell>
                    <ContingencyRowActions contingencyId={c.id} description={c.description} canWrite={canWrite} />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        component="div"
        count={contingencies.length}
        page={page}
        onPageChange={(_, p) => setPage(p)}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value)); setPage(0); }}
        rowsPerPageOptions={PAGE_SIZES}
        labelRowsPerPage="Filas:"
        labelDisplayedRows={({ from, to, count }) => `${from}–${to} de ${count}`}
        sx={{
          flexShrink: 0,
          fontSize: "0.75rem",
          "& .MuiTablePagination-toolbar": { minHeight: 40, px: 1.5 },
          "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows": { fontSize: "0.75rem" },
        }}
      />
    </Box>
  );
}
