"use client";

import { useRouter, useSearchParams } from "next/navigation";
import Box from "@mui/material/Box";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";

interface Option { id: number; name: string }

export function ContingencyFilterBar({ plants }: { plants: Option[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "_all") params.set(key, value); else params.delete(key);
    router.push(`/contingencies?${params.toString()}`);
  }

  const selectSx = { height: 36, fontSize: "0.8125rem", backgroundColor: "#eff4ff", "& .MuiOutlinedInput-notchedOutline": { borderColor: "transparent" }, "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#c3c6d7" } };

  return (
    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5 }}>
      <FormControl size="small" sx={{ minWidth: 200 }}>
        <InputLabel sx={{ fontSize: "0.8125rem" }}>Planta</InputLabel>
        <Select
          label="Planta"
          defaultValue={searchParams.get("powerPlantId") ?? "_all"}
          onChange={(e) => updateParam("powerPlantId", String(e.target.value))}
          sx={selectSx}
        >
          <MenuItem value="_all" sx={{ fontSize: "0.8125rem" }}>Todas las plantas</MenuItem>
          {plants.map((p) => (
            <MenuItem key={p.id} value={String(p.id)} sx={{ fontSize: "0.8125rem" }}>{p.name}</MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControl size="small" sx={{ minWidth: 160 }}>
        <InputLabel sx={{ fontSize: "0.8125rem" }}>Tipo</InputLabel>
        <Select
          label="Tipo"
          defaultValue={searchParams.get("type") ?? "_all"}
          onChange={(e) => updateParam("type", String(e.target.value))}
          sx={selectSx}
        >
          <MenuItem value="_all"       sx={{ fontSize: "0.8125rem" }}>Todos los tipos</MenuItem>
          <MenuItem value="PREVENTIVE" sx={{ fontSize: "0.8125rem" }}>Preventiva</MenuItem>
          <MenuItem value="CORRECTIVE" sx={{ fontSize: "0.8125rem" }}>Correctiva</MenuItem>
        </Select>
      </FormControl>
    </Box>
  );
}
