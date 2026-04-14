"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TableSortLabel from "@mui/material/TableSortLabel";
import Chip from "@mui/material/Chip";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import OpenInNewOutlinedIcon from "@mui/icons-material/OpenInNewOutlined";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import { formatKwh, formatPeriod } from "@/lib/utils/formatters";

interface Report {
  id: number;
  periodYear: number;
  periodMonth: number;
  kwhGenerated: number;
  co2Avoided: number;
  fileUrl: string;
  fileName: string | null;
  powerPlant: { id: number; name: string; portfolio: { name: string } };
}

type SortKey = "plant" | "portfolio" | "period" | "kwh" | "co2";
type SortDir = "asc" | "desc";

function sortReports(reports: Report[], key: SortKey, dir: SortDir): Report[] {
  return [...reports].sort((a, b) => {
    let cmp: number;
    switch (key) {
      case "plant":     cmp = a.powerPlant.name.localeCompare(b.powerPlant.name, "es"); break;
      case "portfolio": cmp = a.powerPlant.portfolio.name.localeCompare(b.powerPlant.portfolio.name, "es"); break;
      case "period":    cmp = (a.periodYear * 12 + a.periodMonth) - (b.periodYear * 12 + b.periodMonth); break;
      case "kwh":       cmp = a.kwhGenerated - b.kwhGenerated; break;
      case "co2":       cmp = a.co2Avoided - b.co2Avoided; break;
    }
    return dir === "asc" ? cmp : -cmp;
  });
}

interface Props {
  reports: Report[];
  portfolioId?: number;
}

export function ReportTable({ reports, portfolioId }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>("period");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  function handleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  function col(key: SortKey) {
    return {
      active: sortKey === key,
      direction: sortKey === key ? sortDir : ("asc" as SortDir),
      onClick: () => handleSort(key),
    };
  }

  const sorted = useMemo(() => sortReports(reports, sortKey, sortDir), [reports, sortKey, sortDir]);

  return (
    <TableContainer sx={{ flex: 1, minHeight: 0, overflow: "auto" }}>
      <Table size="small" stickyHeader>
        <TableHead>
          <TableRow
            sx={{
              "& .MuiTableCell-head": { backgroundColor: "#eff4ff" },
              "& .MuiTableSortLabel-root": { fontSize: "0.75rem", fontWeight: 600 },
              "& .MuiTableSortLabel-root.Mui-active": { color: "#004ac6" },
              "& .MuiTableSortLabel-icon": { fontSize: "0.9rem !important" },
            }}
          >
            <TableCell><TableSortLabel {...col("plant")}>Planta</TableSortLabel></TableCell>
            <TableCell><TableSortLabel {...col("portfolio")}>Portafolio</TableSortLabel></TableCell>
            <TableCell><TableSortLabel {...col("period")}>Periodo</TableSortLabel></TableCell>
            <TableCell align="right">
              <TableSortLabel {...col("kwh")} sx={{ justifyContent: "flex-end", width: "100%", flexDirection: "row-reverse" }}>
                Generación
              </TableSortLabel>
            </TableCell>
            <TableCell align="right">
              <TableSortLabel {...col("co2")} sx={{ justifyContent: "flex-end", width: "100%", flexDirection: "row-reverse" }}>
                CO₂ evitado
              </TableSortLabel>
            </TableCell>
            <TableCell>Archivo</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {sorted.map((r) => (
            <TableRow key={r.id} hover>
              <TableCell sx={{ fontSize: "0.8125rem" }}>
                <Link
                  href={`/${portfolioId}/power-plants/${r.powerPlant.id}/generation`}
                  style={{ color: "#004ac6", fontWeight: 500, textDecoration: "none" }}
                  onMouseOver={(e) => (e.currentTarget.style.textDecoration = "underline")}
                  onMouseOut={(e) => (e.currentTarget.style.textDecoration = "none")}
                >
                  {r.powerPlant.name}
                </Link>
              </TableCell>
              <TableCell sx={{ color: "text.secondary", fontSize: "0.8125rem" }}>{r.powerPlant.portfolio.name}</TableCell>
              <TableCell>
                <Chip
                  label={formatPeriod(r.periodMonth, r.periodYear)}
                  size="small"
                  sx={{ backgroundColor: "#e6eeff", color: "#0d1c2e", fontWeight: 600, fontSize: "0.6875rem", height: 20, textTransform: "capitalize" }}
                />
              </TableCell>
              <TableCell align="right" sx={{ fontVariantNumeric: "tabular-nums", fontWeight: 500, fontSize: "0.8125rem" }}>
                {formatKwh(r.kwhGenerated)}
              </TableCell>
              <TableCell align="right" sx={{ fontVariantNumeric: "tabular-nums", fontSize: "0.8125rem" }}>
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
  );
}
