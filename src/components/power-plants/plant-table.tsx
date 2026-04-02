"use client";

import { useState } from "react";
import Link from "next/link";
import MuiTable from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TablePagination from "@mui/material/TablePagination";
import Chip from "@mui/material/Chip";
import Box from "@mui/material/Box";
import { PlantRowActions } from "@/components/power-plants/plant-row-actions";

interface PlantAddress {
  address: string | null;
  reference: string | null;
  city: string | null;
  county: string | null;
  country: string | null;
}

interface Plant {
  id: number;
  name: string;
  location: string | null;
  city: string | null;
  capacityKw: number;
  status: string;
  portfolioId: number;
  customerId: number;
  solcorId: string | null;
  distributorCompany: string | null;
  tariffId: string | null;
  startDate: Date | null;
  durationYears: number | null;
  specificYield: number | null;
  address: PlantAddress | null;
  portfolio: { name: string };
  customer: { name: string };
}

interface Option { id: number; name: string }

interface PlantTableProps {
  plants: Plant[];
  portfolios: Option[];
  customers: Option[];
  canEdit: boolean;
}

const PAGE_SIZES = [15, 25, 50];

export function PlantTable({ plants, portfolios, customers, canEdit }: PlantTableProps) {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(15);

  const paginated = plants.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
      <TableContainer sx={{ flex: 1, minHeight: 0, overflow: "auto" }}>
        <MuiTable stickyHeader size="small">
          <TableHead>
            <TableRow>
              <TableCell>ID Solcor</TableCell>
              <TableCell>Nombre Planta</TableCell>
              <TableCell>Comuna</TableCell>
              <TableCell>Distribuidora</TableCell>
              <TableCell>ID Tarifa</TableCell>
              <TableCell>Fecha Inicio (F6)</TableCell>
              <TableCell align="center">Duración (Años)</TableCell>
              <TableCell align="right">Potencia (kWp)</TableCell>
              <TableCell align="right">
                Rendimiento Anual<br />
                <Box component="span" sx={{ fontWeight: 400, textTransform: "none", fontSize: "0.7rem" }}>
                  (kWh/kWp)
                </Box>
              </TableCell>
              <TableCell>Estado</TableCell>
              {canEdit && <TableCell sx={{ width: 40 }} />}
            </TableRow>
          </TableHead>
          <TableBody>
            {paginated.map((plant) => (
              <TableRow key={plant.id} hover>
                <TableCell sx={{ color: "text.secondary", fontFamily: "monospace" }}>
                  {plant.solcorId ?? "—"}
                </TableCell>
                <TableCell sx={{ whiteSpace: "nowrap" }}>
                  <Link
                    href={`/power-plants/${plant.id}`}
                    style={{ color: "#004ac6", fontWeight: 500, textDecoration: "none" }}
                    onMouseOver={e => (e.currentTarget.style.textDecoration = "underline")}
                    onMouseOut={e => (e.currentTarget.style.textDecoration = "none")}
                  >
                    {plant.name}
                  </Link>
                </TableCell>
                <TableCell sx={{ whiteSpace: "nowrap" }}>
                  {plant.city ?? plant.location ?? "—"}
                </TableCell>
                <TableCell sx={{ whiteSpace: "nowrap" }}>
                  {plant.distributorCompany ?? "—"}
                </TableCell>
                <TableCell sx={{ fontFamily: "monospace" }}>
                  {plant.tariffId ?? "—"}
                </TableCell>
                <TableCell sx={{ whiteSpace: "nowrap" }}>
                  {plant.startDate
                    ? new Intl.DateTimeFormat("es-CL").format(new Date(plant.startDate))
                    : "—"}
                </TableCell>
                <TableCell align="center">
                  {plant.durationYears ?? "—"}
                </TableCell>
                <TableCell align="right" sx={{ fontVariantNumeric: "tabular-nums" }}>
                  {plant.capacityKw}
                </TableCell>
                <TableCell align="right" sx={{ fontVariantNumeric: "tabular-nums" }}>
                  {plant.specificYield != null
                    ? plant.specificYield.toLocaleString("es-CL")
                    : "—"}
                </TableCell>
                <TableCell>
                  <Chip
                    label={plant.status === "active" ? "Activa" : "Mantención"}
                    size="small"
                    sx={
                      plant.status === "active"
                        ? { backgroundColor: "#dbe1ff", color: "#0d1c2e", fontWeight: 600 }
                        : { backgroundColor: "#e6eeff", color: "#434655", fontWeight: 500 }
                    }
                  />
                </TableCell>
                {canEdit && (
                  <TableCell>
                    <PlantRowActions plant={plant} portfolios={portfolios} customers={customers} />
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </MuiTable>
      </TableContainer>

      <TablePagination
        component="div"
        count={plants.length}
        page={page}
        onPageChange={(_, p) => setPage(p)}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value)); setPage(0); }}
        rowsPerPageOptions={PAGE_SIZES}
        labelRowsPerPage="Filas:"
        labelDisplayedRows={({ from, to, count }) => `${from}–${to} de ${count}`}
        sx={{
          borderTop: "none",
          flexShrink: 0,
          fontSize: "0.75rem",
          "& .MuiTablePagination-toolbar": { minHeight: 40, px: 1.5 },
          "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows": {
            fontSize: "0.75rem",
          },
        }}
      />
    </Box>
  );
}
