"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useTransition } from "react";
import Box from "@mui/material/Box";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import Typography from "@mui/material/Typography";

interface Option { id: number; name: string }

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 5 }, (_, i) => CURRENT_YEAR - i);

export function ReportFilterBar({ plants }: { plants: Option[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "_all") params.set(key, value); else params.delete(key);
    startTransition(() => router.push(`${pathname}?${params.toString()}`));
  }

  const selectSx = {
    height: 36,
    fontSize: "0.8125rem",
    backgroundColor: "#eff4ff",
    "& .MuiOutlinedInput-notchedOutline": { borderColor: "transparent" },
    "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#c3c6d7" },
  };

  return (
    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5, alignItems: "center" }}>
      <FormControl size="small" sx={{ minWidth: 120 }}>
        <InputLabel sx={{ fontSize: "0.8125rem" }}>Año</InputLabel>
        <Select label="Año" defaultValue={searchParams.get("year") ?? "_all"} onChange={(e) => updateParam("year", String(e.target.value))} sx={selectSx}>
          <MenuItem value="_all" sx={{ fontSize: "0.8125rem" }}>Todos los años</MenuItem>
          {YEARS.map((y) => (
            <MenuItem key={y} value={String(y)} sx={{ fontSize: "0.8125rem" }}>{y}</MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControl size="small" sx={{ minWidth: 200 }}>
        <InputLabel sx={{ fontSize: "0.8125rem" }}>Planta</InputLabel>
        <Select label="Planta" defaultValue={searchParams.get("powerPlantId") ?? "_all"} onChange={(e) => updateParam("powerPlantId", String(e.target.value))} sx={selectSx}>
          <MenuItem value="_all" sx={{ fontSize: "0.8125rem" }}>Todas las plantas</MenuItem>
          {plants.map((p) => (
            <MenuItem key={p.id} value={String(p.id)} sx={{ fontSize: "0.8125rem" }}>{p.name}</MenuItem>
          ))}
        </Select>
      </FormControl>

      {isPending && (
        <Typography variant="caption" color="text.secondary">Filtrando...</Typography>
      )}
    </Box>
  );
}
