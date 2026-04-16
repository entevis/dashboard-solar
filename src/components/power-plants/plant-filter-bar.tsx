"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Popover from "@mui/material/Popover";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import FilterListOutlinedIcon from "@mui/icons-material/FilterListOutlined";

interface Option { id: number; name: string }

interface Props {
  portfolios: Option[];
  customers: Option[];
  hidePortfolioFilter?: boolean;
  actions?: React.ReactNode;
}

const selectSx = {
  height: 36,
  fontSize: "0.8125rem",
  backgroundColor: "#eff4ff",
  "& .MuiOutlinedInput-notchedOutline": { borderColor: "transparent" },
  "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#c3c6d7" },
  "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#2563eb", borderWidth: 2 },
};

export function PlantFilterBar({ portfolios, customers, hidePortfolioFilter = false, actions }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const [localQ, setLocalQ] = useState(searchParams.get("q") ?? "");
  const [localPortfolio, setLocalPortfolio] = useState(searchParams.get("portfolioId") ?? "all");
  const [localCustomer, setLocalCustomer] = useState(searchParams.get("customerId") ?? "all");

  function applyFilters() {
    const params = new URLSearchParams();
    if (localQ.trim()) params.set("q", localQ.trim());
    if (localPortfolio !== "all") params.set("portfolioId", localPortfolio);
    if (localCustomer !== "all") params.set("customerId", localCustomer);
    startTransition(() => router.push(`?${params.toString()}`));
    setAnchorEl(null);
  }

  function clearFilters() {
    setLocalQ("");
    setLocalPortfolio("all");
    setLocalCustomer("all");
  }

  // Count active filters
  let activeCount = 0;
  if (localQ.trim()) activeCount++;
  if (localPortfolio !== "all") activeCount++;
  if (localCustomer !== "all") activeCount++;

  // Chips
  const chips: { label: string; onDelete: () => void }[] = [];
  if (localQ.trim()) {
    chips.push({ label: `"${localQ.trim()}"`, onDelete: () => setLocalQ("") });
  }
  if (localPortfolio !== "all") {
    const name = portfolios.find((p) => String(p.id) === localPortfolio)?.name ?? localPortfolio;
    chips.push({ label: name, onDelete: () => setLocalPortfolio("all") });
  }
  if (localCustomer !== "all") {
    const name = customers.find((c) => String(c.id) === localCustomer)?.name ?? localCustomer;
    chips.push({ label: name, onDelete: () => setLocalCustomer("all") });
  }

  return (
    <Box sx={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 1.5,
      flexWrap: "wrap",
      px: 2,
      py: 1.25,
      backgroundColor: "#fff",
      border: "1px solid",
      borderColor: "divider",
      borderRadius: 2,
      opacity: isPending ? 0.6 : 1,
      transition: "opacity 150ms",
    }}>
      {/* Left: filter button + chips */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
        <Button
          size="small"
          variant="outlined"
          color="inherit"
          startIcon={<FilterListOutlinedIcon />}
          onClick={(e) => setAnchorEl(e.currentTarget)}
          sx={{
            borderColor: "#c3c6d7",
            fontWeight: 600,
            fontSize: "0.8125rem",
            "&:hover": { borderColor: "#004ac6", color: "#004ac6" },
          }}
        >
          Filtros
          {activeCount > 0 && (
            <Box component="span" sx={{
              ml: 0.75,
              width: 20,
              height: 20,
              borderRadius: "50%",
              backgroundColor: "#2563eb",
              color: "#fff",
              fontSize: "0.6875rem",
              fontWeight: 700,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
            }}>
              {activeCount}
            </Box>
          )}
        </Button>

        {chips.map((chip) => (
          <Chip
            key={chip.label}
            label={chip.label}
            size="small"
            sx={{
              backgroundColor: "#dbe1ff",
              color: "#004ac6",
              fontWeight: 600,
              fontSize: "0.6875rem",
              height: 24,
            }}
          />
        ))}
      </Box>

      {/* Right: actions */}
      {actions && (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          {actions}
        </Box>
      )}

      {/* Popover */}
      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
        slotProps={{ paper: { sx: { borderRadius: 3, boxShadow: "0 8px 24px rgba(13,28,46,0.14)", mt: 1, p: 2.5, minWidth: 300 } } }}
      >
        <Typography fontSize="0.875rem" fontWeight={700} sx={{ mb: 2 }}>Filtros</Typography>

        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
          <TextField
            size="small"
            fullWidth
            label="Buscar planta"
            placeholder="Nombre o ID Solcor"
            value={localQ}
            onChange={(e) => setLocalQ(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") applyFilters(); }}
            sx={{ "& .MuiOutlinedInput-root": { backgroundColor: "#eff4ff", "& fieldset": { borderColor: "transparent" }, "&:hover fieldset": { borderColor: "#c3c6d7" }, "&.Mui-focused fieldset": { borderColor: "#2563eb", borderWidth: 2 } } }}
          />

          {!hidePortfolioFilter && portfolios.length > 0 && (
            <FormControl size="small" fullWidth>
              <InputLabel sx={{ fontSize: "0.8125rem" }}>Portafolio</InputLabel>
              <Select label="Portafolio" value={localPortfolio} onChange={(e) => setLocalPortfolio(String(e.target.value))} sx={selectSx}>
                <MenuItem value="all" sx={{ fontSize: "0.8125rem" }}>Todos</MenuItem>
                {portfolios.map((p) => (
                  <MenuItem key={p.id} value={String(p.id)} sx={{ fontSize: "0.8125rem" }}>{p.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          {customers.length > 0 && (
            <FormControl size="small" fullWidth>
              <InputLabel sx={{ fontSize: "0.8125rem" }}>Cliente</InputLabel>
              <Select label="Cliente" value={localCustomer} onChange={(e) => setLocalCustomer(String(e.target.value))} sx={selectSx}>
                <MenuItem value="all" sx={{ fontSize: "0.8125rem" }}>Todos</MenuItem>
                {customers.map((c) => (
                  <MenuItem key={c.id} value={String(c.id)} sx={{ fontSize: "0.8125rem" }}>{c.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
        </Box>

        <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1, mt: 2, pt: 1.5, borderTop: "1px solid", borderColor: "divider" }}>
          <Button size="small" color="inherit" onClick={clearFilters} sx={{ fontSize: "0.8125rem" }}>Limpiar</Button>
          <Button size="small" variant="contained" onClick={applyFilters} sx={{ fontSize: "0.8125rem" }}>Aplicar</Button>
        </Box>
      </Popover>
    </Box>
  );
}
