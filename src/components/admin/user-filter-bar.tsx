"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useRef, useTransition } from "react";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import SearchIcon from "@mui/icons-material/Search";
import { ROLE_LABELS } from "@/lib/auth/roles";
import type { UserRole } from "@prisma/client";

const ROLES: UserRole[] = ["MAESTRO", "OPERATIVO", "CLIENTE", "CLIENTE_PERFILADO"];

export function UserFilterBar() {
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
    startTransition(() => router.push(`?${params.toString()}`));
  }

  function handleSearch(e: React.ChangeEvent<HTMLInputElement>) {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => updateParam("q", e.target.value), 350);
  }

  return (
    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5, alignItems: "center" }}>
      <TextField
        size="small"
        placeholder="Buscar usuario..."
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

      <FormControl size="small" sx={{ width: 176 }}>
        <InputLabel>Rol</InputLabel>
        <Select
          label="Rol"
          defaultValue={searchParams.get("role") ?? "_all"}
          onChange={(e) => updateParam("role", String(e.target.value))}
        >
          <MenuItem value="_all">Todos los roles</MenuItem>
          {ROLES.map((r) => (
            <MenuItem key={r} value={r}>{ROLE_LABELS[r]}</MenuItem>
          ))}
        </Select>
      </FormControl>

      {isPending && (
        <Typography variant="caption" color="text.secondary">Filtrando...</Typography>
      )}
    </Box>
  );
}
