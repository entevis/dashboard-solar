"use client";

import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import MuiTable from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TableSortLabel from "@mui/material/TableSortLabel";
import TablePagination from "@mui/material/TablePagination";
import Box from "@mui/material/Box";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
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
  plantNames: { name: string }[];
}

interface Option { id: number; name: string }

interface PlantTableProps {
  plants: Plant[];
  portfolios: Option[];
  customers: Option[];
  canEdit: boolean;
}

type SortKey = "solcorId" | "name" | "plantNameLabel" | "city" | "distributorCompany" | "tariffId" | "startDate" | "durationYears" | "capacityKw" | "specificYield";
type SortDir = "asc" | "desc";

const PAGE_SIZES = [15, 25, 50, 100];

const truncSx = {
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap" as const,
  display: "block",
};

function TruncCell({ value, width }: { value: string | null; width: number }) {
  const text = value ?? "—";
  const ref = useRef<HTMLSpanElement>(null);
  const [isTruncated, setIsTruncated] = useState(false);

  const checkTruncation = useCallback(() => {
    const el = ref.current;
    if (el) setIsTruncated(el.scrollWidth > el.clientWidth);
  }, []);

  useEffect(() => { checkTruncation(); }, [checkTruncation, value]);

  return (
    <TableCell sx={{ width, maxWidth: width, p: "6px 12px" }}>
      <Tooltip title={isTruncated ? text : ""} placement="top" disableHoverListener={!isTruncated} enterDelay={400}>
        <Box component="span" ref={ref} onMouseEnter={checkTruncation} sx={{ ...truncSx, width: "100%" }}>{text}</Box>
      </Tooltip>
    </TableCell>
  );
}

function getValue(plant: Plant, key: SortKey): string | number | null {
  switch (key) {
    case "solcorId":          return plant.solcorId ?? "";
    case "name":              return plant.name;
    case "plantNameLabel":    return plant.plantNames.map((p) => p.name).join(", ") || "";
    case "city":              return plant.city ?? plant.location ?? "";
    case "distributorCompany": return plant.distributorCompany ?? "";
    case "tariffId":          return plant.tariffId ?? "";
    case "startDate":         return plant.startDate ? new Date(plant.startDate).getTime() : -Infinity;
    case "durationYears":     return plant.durationYears ?? -Infinity;
    case "capacityKw":        return plant.capacityKw;
    case "specificYield":     return plant.specificYield ?? -Infinity;
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

  const W = { solcorId: 100, name: 200, plantName: 180, city: 130, dist: 140, tariff: 110, date: 120, dur: 100, kw: 110, yield: 160, actions: 40 };

  const headSx = (w: number, align?: "right" | "center") => ({
    width: w, maxWidth: w, minWidth: w,
    ...(align === "right" && { textAlign: "right" }),
    ...(align === "center" && { textAlign: "center" }),
  });

  // Mobile card list (xs/sm)
  const MobileList = (
    <Box sx={{ display: { xs: "flex", md: "none" }, flexDirection: "column", flex: 1, minHeight: 0 }}>
      <Box sx={{ flex: 1, overflowY: "auto" }}>
        {paginated.map((plant) => (
          <Box
            key={plant.id}
            component={Link}
            href={`/${plant.portfolioId}/power-plants/${plant.id}`}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 2,
              px: 2,
              py: 1.5,
              minHeight: 64,
              borderBottom: "1px solid",
              borderColor: "divider",
              textDecoration: "none",
              color: "inherit",
              "&:hover": { backgroundColor: "#eff4ff" },
              "&:active": { backgroundColor: "#dbe1ff" },
            }}
          >
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                fontSize="0.875rem"
                fontWeight={600}
                color="primary.main"
                sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
              >
                {plant.name}
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.5, flexWrap: "wrap" }}>
                {(plant.city ?? plant.location) && (
                  <Typography variant="caption" color="text.secondary">
                    {plant.city ?? plant.location}
                  </Typography>
                )}
                <Typography variant="caption" color="text.secondary">·</Typography>
                <Typography variant="caption" color="text.secondary">{plant.capacityKw} kWp</Typography>
              </Box>
            </Box>
            <ChevronRightIcon sx={{ fontSize: 18, color: "text.disabled", flexShrink: 0 }} />
          </Box>
        ))}
      </Box>
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
          borderTop: "1px solid",
          borderColor: "divider",
          flexShrink: 0,
          "& .MuiTablePagination-toolbar": { minHeight: 52, px: 1.5 },
          "& .MuiTablePagination-actions button": { minWidth: 44, minHeight: 44 },
          "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows": { fontSize: "0.8125rem" },
        }}
      />
    </Box>
  );

  return (
    <Box sx={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
      {MobileList}
      <TableContainer sx={{ flex: 1, minHeight: 0, overflow: "auto", display: { xs: "none", md: "block" } }}>
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
              <TableCell sx={headSx(W.plantName)}>
                <TableSortLabel {...col("plantNameLabel")}>Nombre Reporte</TableSortLabel>
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
                  Rendimiento (kWh/kWp)
                </TableSortLabel>
              </TableCell>
              {canEdit && <TableCell sx={{ width: W.actions, minWidth: W.actions }} />}
            </TableRow>
          </TableHead>
          <TableBody>
            {paginated.map((plant) => (
              <TableRow key={plant.id} hover>
                <TruncCell value={plant.solcorId} width={W.solcorId} />
                <TableCell sx={{ width: W.name, maxWidth: W.name, p: "6px 12px" }}>
                  <TruncLink href={`/${plant.portfolioId}/power-plants/${plant.id}`} text={plant.name} width={W.name} />
                </TableCell>
                <TruncCell value={plant.plantNames.map((p) => p.name).join(", ") || null} width={W.plantName} />
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
          display: { xs: "none", md: "flex" },
          justifyContent: "flex-end",
          borderTop: "none",
          flexShrink: 0,
          "& .MuiTablePagination-toolbar": { minHeight: 44, px: 1.5 },
          "& .MuiTablePagination-spacer": { display: "none" },
          "& .MuiTablePagination-actions button": { minWidth: 44, minHeight: 44 },
          "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows": {
            fontSize: "0.75rem",
          },
        }}
      />
    </Box>
  );
}

function TruncLink({ href, text, width }: { href: string; text: string; width: number }) {
  const ref = useRef<HTMLAnchorElement>(null);
  const [isTruncated, setIsTruncated] = useState(false);

  const check = useCallback(() => {
    const el = ref.current;
    if (el) setIsTruncated(el.scrollWidth > el.clientWidth);
  }, []);

  useEffect(() => { check(); }, [check, text]);

  return (
    <Tooltip title={isTruncated ? text : ""} placement="top" disableHoverListener={!isTruncated} enterDelay={400}>
      <Link
        ref={ref}
        href={href}
        onMouseEnter={check}
        style={{ color: "#004ac6", fontWeight: 500, textDecoration: "none", ...truncSx, display: "block", maxWidth: width - 24 }}
        onMouseOver={e => (e.currentTarget.style.textDecoration = "underline")}
        onMouseOut={e => (e.currentTarget.style.textDecoration = "none")}
      >
        {text}
      </Link>
    </Tooltip>
  );
}
