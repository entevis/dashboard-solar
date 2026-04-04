"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useRef, useTransition, useState } from "react";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Badge from "@mui/material/Badge";
import Button from "@mui/material/Button";
import Collapse from "@mui/material/Collapse";
import SearchIcon from "@mui/icons-material/Search";
import TuneIcon from "@mui/icons-material/Tune";

interface Option { id: number; name: string }

interface Props {
  portfolios: Option[];
  customers: Option[];
  hidePortfolioFilter?: boolean;
  hideCustomerFilter?: boolean;
}

export function PlantFilterBar({ portfolios, customers, hidePortfolioFilter = false, hideCustomerFilter = false }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const hasDropdownFilters = !hidePortfolioFilter || !hideCustomerFilter;
  const activeFilterCount = [
    !hidePortfolioFilter && searchParams.get("portfolioId"),
    !hideCustomerFilter && searchParams.get("customerId"),
  ].filter(Boolean).length;

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "_all") {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    startTransition(() => {
      router.push(`?${params.toString()}`);
    });
  }

  function handleSearch(e: React.ChangeEvent<HTMLInputElement>) {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      updateParam("q", e.target.value);
    }, 350);
  }

  const dropdownFilters = (
    <>
      {!hidePortfolioFilter && (
        <FormControl size="small" sx={{ width: { xs: "100%", sm: 176 } }}>
          <InputLabel>Portafolio</InputLabel>
          <Select
            label="Portafolio"
            defaultValue={searchParams.get("portfolioId") ?? "_all"}
            onChange={(e) => updateParam("portfolioId", String(e.target.value))}
          >
            <MenuItem value="_all">Todos</MenuItem>
            {portfolios.map((p) => (
              <MenuItem key={p.id} value={String(p.id)}>{p.name}</MenuItem>
            ))}
          </Select>
        </FormControl>
      )}

      {!hideCustomerFilter && (
        <FormControl size="small" sx={{ width: { xs: "100%", sm: 200 } }}>
          <InputLabel>Cliente</InputLabel>
          <Select
            label="Cliente"
            defaultValue={searchParams.get("customerId") ?? "_all"}
            onChange={(e) => updateParam("customerId", String(e.target.value))}
          >
            <MenuItem value="_all">Todos</MenuItem>
            {customers.map((c) => (
              <MenuItem key={c.id} value={String(c.id)}>{c.name}</MenuItem>
            ))}
          </Select>
        </FormControl>
      )}
    </>
  );

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
      {/* Row: search + filter toggle (mobile) / search + dropdowns (desktop) */}
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5, alignItems: "center" }}>
        <TextField
          size="small"
          placeholder="Buscar planta..."
          defaultValue={searchParams.get("q") ?? ""}
          onChange={handleSearch}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ fontSize: 16, color: "text.secondary" }} />
                </InputAdornment>
              ),
            },
          }}
          sx={{ width: { xs: "100%", sm: 200 } }}
        />

        {/* Desktop: inline dropdowns */}
        {hasDropdownFilters && (
          <Box sx={{ display: { xs: "none", sm: "flex" }, gap: 1.5, alignItems: "center" }}>
            {dropdownFilters}
          </Box>
        )}

        {/* Mobile: toggle button */}
        {hasDropdownFilters && (
          <Badge
            badgeContent={activeFilterCount}
            color="primary"
            sx={{ display: { xs: "flex", sm: "none" } }}
          >
            <Button
              variant={showFilters ? "contained" : "outlined"}
              size="small"
              startIcon={<TuneIcon />}
              onClick={() => setShowFilters((v) => !v)}
              sx={{ minHeight: 40, borderColor: "#c3c6d7", color: showFilters ? undefined : "text.secondary" }}
            >
              Filtros
            </Button>
          </Badge>
        )}

        {isPending && (
          <Typography variant="caption" color="text.secondary">
            Filtrando...
          </Typography>
        )}
      </Box>

      {/* Mobile: collapsible dropdowns */}
      {hasDropdownFilters && (
        <Collapse in={showFilters} sx={{ display: { xs: "block", sm: "none" } }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, pt: 0.5 }}>
            {dropdownFilters}
          </Box>
        </Collapse>
      )}
    </Box>
  );
}
