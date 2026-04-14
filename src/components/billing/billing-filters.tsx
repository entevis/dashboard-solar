"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Box from "@mui/material/Box";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";

const MONTHS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

const STATUS_OPTIONS = [
  { value: "all",      label: "Todos los estados" },
  { value: "pagada",    label: "Pagadas" },
  { value: "porVencer", label: "Por vencer" },
  { value: "vencida",   label: "Vencidas" },
  { value: "notaCredito", label: "Notas de crédito" },
];

function getYears() {
  const current = new Date().getFullYear();
  return [current - 2, current - 1, current];
}

interface Props {
  month: number;
  year: number;
  status: string;
}

export function BillingFilters({ month, year, status }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [localMonth, setLocalMonth]   = useState(String(month));
  const [localYear, setLocalYear]     = useState(String(year));
  const [localStatus, setLocalStatus] = useState(status);

  function handleSearch() {
    const params = new URLSearchParams(searchParams.toString());
    params.set("month",  localMonth);
    params.set("year",   localYear);
    params.set("status", localStatus);
    params.set("page",   "1");
    startTransition(() => router.push(`?${params.toString()}`));
  }

  const selectSx = { height: 32, fontSize: "0.8125rem", backgroundColor: "#eff4ff", "& .MuiOutlinedInput-notchedOutline": { borderColor: "transparent" }, "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#c3c6d7" } };

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
      <FormControl size="small" sx={{ minWidth: 120 }}>
        <InputLabel sx={{ fontSize: "0.8125rem" }}>Mes</InputLabel>
        <Select label="Mes" value={localMonth} onChange={(e) => setLocalMonth(String(e.target.value))} sx={selectSx}>
          {MONTHS.map((name, i) => (
            <MenuItem key={i + 1} value={String(i + 1)} sx={{ fontSize: "0.8125rem" }}>{name}</MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControl size="small" sx={{ minWidth: 80 }}>
        <InputLabel sx={{ fontSize: "0.8125rem" }}>Año</InputLabel>
        <Select label="Año" value={localYear} onChange={(e) => setLocalYear(String(e.target.value))} sx={selectSx}>
          {getYears().map((y) => (
            <MenuItem key={y} value={String(y)} sx={{ fontSize: "0.8125rem" }}>{y}</MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControl size="small" sx={{ minWidth: 160 }}>
        <InputLabel sx={{ fontSize: "0.8125rem" }}>Estado</InputLabel>
        <Select label="Estado" value={localStatus} onChange={(e) => setLocalStatus(String(e.target.value))} sx={selectSx}>
          {STATUS_OPTIONS.map((opt) => (
            <MenuItem key={opt.value} value={opt.value} sx={{ fontSize: "0.8125rem" }}>{opt.label}</MenuItem>
          ))}
        </Select>
      </FormControl>

      <Button
        variant="contained"
        size="small"
        onClick={handleSearch}
        disabled={isPending}
        startIcon={isPending ? <CircularProgress size={12} color="inherit" /> : <SearchOutlinedIcon />}
      >
        {isPending ? "Buscando..." : "Buscar"}
      </Button>
    </Box>
  );
}
