"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import MuiTable from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TableSortLabel from "@mui/material/TableSortLabel";
import TablePagination from "@mui/material/TablePagination";
import Chip from "@mui/material/Chip";
import Box from "@mui/material/Box";
import Tooltip from "@mui/material/Tooltip";
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

type SortKey = "solcorId" | "name" | "city" | "distributorCompany" | "tariffId" | "startDate" | "durationYears" | "capacityKw" | "specificYield" | "status";
type SortDir = "asc" | "desc";

const PAGE_SIZES = [15, 25, 50];

const truncSx = {
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap" as const,
  display: "block",
};

function TruncCell({ value, width }: { value: string | null; width: number }) {
  const text = value ?? "—";
  return (
    <TableCell sx={{ width, maxWidth: width, p: "6px 12px" }}>
      <Tooltip title={value ?? ""} placement="top" disableHoverListener={!value} enterDelay={400}>
        <Box component="span" sx={{ ...truncSx, width: "100%" }}>{text}</Box>
      </Tooltip>
    </TableCell>
  );
}

function getValue(plant: Plant, key: SortKey): string | number | null {
  switch (key) {
    case "solcorId":          return plant.solcorId ?? "";
    case "name":              return plant.name;
    case "city":              return plant.city ?? plant.location ?? "";
    case "distributorCompany": return plant.distributorCompany ?? "";
    case "tariffId":          return plant.tariffId ?? "";
    case "startDate":         return plant.startDate ? new Date(plant.startDate).getTime() : -Infinity;
    case "durationYears":     return plant.durationYears ?? -Infinity;
    case "capacityKw":        return plant.capacityKw;
    case "specificYield":     return plant.specificYield ?? -Infinity;
    case "status":            return plant.status;
  }
}

function sortPlants(plants: Plant[], key: SortKey, dir: SortDir): Plant[] {
  return [...plants].sort((a, b) => {
    const va = getValue(a, key);
    const vb = getValue(b, key);
    if (va === vb) return 0;
    if (typeof va === "string" && typeof vb === "string") {
      return dir === "asc" ? va.localeCompare(vb, "es") : vb.localeCompare(va, "es");
    }
    const na = va as number;
    const nb = vb as number;
    return dir === "asc" ? na - nb : nb - na;
  });
}

export function PlantTable({ plants, portfolios, customers, canEdit }: PlantTableProps) {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(15);
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  function handleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
    setPage(0);
  }

  const sorted = useMemo(() => sortPlants(plants, sortKey, sortDir), [plants, sortKey, sortDir]);
  const paginated = sorted.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  function col(key: SortKey) {
    return {
      active: sortKey === key,
      direction: sortKey === key ? sortDir : "asc" as SortDir,
      onClick: () => handleSort(key),
    };
  }

  // Fixed column widths (px) — keeps layout stable across sort changes
  const W = { solcorId: 100, name: 200, city: 130, dist: 140, tariff: 110, date: 120, dur: 100, kw: 110, yield: 130, status: 100, actions: 40 };

  const headSx = (w: number, align?: "right" | "center") => ({
    width: w, maxWidth: w, minWidth: w,
    ...(align === "right" && { textAlign: "right" }),
    ...(align === "center" && { textAlign: "center" }),
  });

  return (
    <Box sx={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
      <TableContainer sx={{ flex: 1, minHeight: 0, overflow: "auto" }}>
        <MuiTable stickyHeader size="small" sx={{ tableLayout: "fixed", minWidth: 900 }}>
          <TableHead>
            <TableRow
              sx={{
                "& .MuiTableCell-head": { backgroundColor: "#eff4ff" },
                "& .MuiTableSortLabel-root": { fontSize: "0.75rem", fontWeight: 600 },
                "& .MuiTableSortLabel-root.Mui-active": { color: "#004ac6" },
                "& .MuiTableSortLabel-icon": { fontSize: "0.9rem !important" },
              }}
            >
              <TableCell sx={headSx(W.solcorId)}>
                <TableSortLabel {...col("solcorId")}>ID Solcor</TableSortLabel>
              </TableCell>
              <TableCell sx={headSx(W.name)}>
                <TableSortLabel {...col("name")}>Nombre Planta</TableSortLabel>
              </TableCell>
              <TableCell sx={headSx(W.city)}>
                <TableSortLabel {...col("city")}>Comuna</TableSortLabel>
              </TableCell>
              <TableCell sx={headSx(W.dist)}>
                <TableSortLabel {...col("distributorCompany")}>Distribuidora</TableSortLabel>
              </TableCell>
              <TableCell sx={headSx(W.tariff)}>
                <TableSortLabel {...col("tariffId")}>ID Tarifa</TableSortLabel>
              </TableCell>
              <TableCell sx={headSx(W.date)}>
                <TableSortLabel {...col("startDate")}>Fecha Inicio</TableSortLabel>
              </TableCell>
              <TableCell sx={headSx(W.dur, "center")}>
                <TableSortLabel {...col("durationYears")} sx={{ justifyContent: "center", width: "100%" }}>
                  Duración (Años)
                </TableSortLabel>
              </TableCell>
              <TableCell sx={headSx(W.kw, "right")}>
                <TableSortLabel {...col("capacityKw")} sx={{ justifyContent: "flex-end", width: "100%", flexDirection: "row-reverse" }}>
                  Potencia (kWp)
                </TableSortLabel>
              </TableCell>
              <TableCell sx={headSx(W.yield, "right")}>
                <TableSortLabel {...col("specificYield")} sx={{ justifyContent: "flex-end", width: "100%", flexDirection: "row-reverse" }}>
                  Rendimiento<br />
                  <Box component="span" sx={{ fontWeight: 400, textTransform: "none", fontSize: "0.7rem" }}>(kWh/kWp)</Box>
                </TableSortLabel>
              </TableCell>
              <TableCell sx={headSx(W.status)}>
                <TableSortLabel {...col("status")}>Estado</TableSortLabel>
              </TableCell>
              {canEdit && <TableCell sx={{ width: W.actions, minWidth: W.actions }} />}
            </TableRow>
          </TableHead>
          <TableBody>
            {paginated.map((plant) => (
              <TableRow key={plant.id} hover>
                <TruncCell value={plant.solcorId} width={W.solcorId} />
                <TableCell sx={{ width: W.name, maxWidth: W.name, p: "6px 12px" }}>
                  <Tooltip title={plant.name} placement="top" enterDelay={400}>
                    <Link
                      href={`/power-plants/${plant.id}`}
                      style={{ color: "#004ac6", fontWeight: 500, textDecoration: "none", ...truncSx, display: "block" }}
                      onMouseOver={e => (e.currentTarget.style.textDecoration = "underline")}
                      onMouseOut={e => (e.currentTarget.style.textDecoration = "none")}
                    >
                      {plant.name}
                    </Link>
                  </Tooltip>
                </TableCell>
                <TruncCell value={plant.city ?? plant.location} width={W.city} />
                <TruncCell value={plant.distributorCompany} width={W.dist} />
                <TruncCell value={plant.tariffId} width={W.tariff} />
                <TableCell sx={{ width: W.date, maxWidth: W.date, p: "6px 12px" }}>
                  {plant.startDate ? new Intl.DateTimeFormat("es-CL").format(new Date(plant.startDate)) : "—"}
                </TableCell>
                <TableCell align="center" sx={{ width: W.dur, maxWidth: W.dur, p: "6px 12px" }}>
                  {plant.durationYears ?? "—"}
                </TableCell>
                <TableCell align="right" sx={{ width: W.kw, maxWidth: W.kw, fontVariantNumeric: "tabular-nums", p: "6px 12px" }}>
                  {plant.capacityKw}
                </TableCell>
                <TableCell align="right" sx={{ width: W.yield, maxWidth: W.yield, fontVariantNumeric: "tabular-nums", p: "6px 12px" }}>
                  {plant.specificYield != null ? plant.specificYield.toLocaleString("es-CL") : "—"}
                </TableCell>
                <TableCell sx={{ width: W.status, maxWidth: W.status, p: "6px 12px" }}>
                  <Chip
                    label={plant.status === "active" ? "Activa" : "Mantención"}
                    size="small"
                    sx={plant.status === "active"
                      ? { backgroundColor: "#dbe1ff", color: "#0d1c2e", fontWeight: 600 }
                      : { backgroundColor: "#e6eeff", color: "#434655", fontWeight: 500 }}
                  />
                </TableCell>
                {canEdit && (
                  <TableCell sx={{ width: W.actions, p: "6px 4px" }}>
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
