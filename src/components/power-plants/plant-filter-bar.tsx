"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useRef, useTransition } from "react";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import SearchIcon from "@mui/icons-material/Search";

interface Option { id: number; name: string }

interface Props {
  portfolios: Option[];
  customers: Option[];
  hidePortfolioFilter?: boolean;
}

export function PlantFilterBar({ portfolios, customers, hidePortfolioFilter = false }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  return (
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
        sx={{ width: 200 }}
      />

      {!hidePortfolioFilter && (
        <FormControl size="small" sx={{ width: 176 }}>
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

      <FormControl size="small" sx={{ width: 200 }}>
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

      {isPending && (
        <Typography variant="caption" color="text.secondary">
          Filtrando...
        </Typography>
      )}
    </Box>
  );
}
