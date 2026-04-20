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
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import FilterListOutlinedIcon from "@mui/icons-material/FilterListOutlined";
import { SearchableSelect } from "@/components/ui/searchable-select";

const MONTHS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

const MONTHS_SHORT = [
  "Ene", "Feb", "Mar", "Abr", "May", "Jun",
  "Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
];

const STATUS_OPTIONS = [
  { value: "all",         label: "Todos" },
  { value: "pagada",      label: "Pagadas" },
  { value: "porVencer",   label: "Por vencer" },
  { value: "vencida",     label: "Vencidas" },
  { value: "notaCredito", label: "Notas de crédito" },
];

function getYears() {
  const current = new Date().getFullYear();
  return Array.from({ length: 4 }, (_, i) => current - i);
}

const selectSx = {
  height: 36,
  fontSize: "0.8125rem",
  backgroundColor: "#eff4ff",
  "& .MuiOutlinedInput-notchedOutline": { borderColor: "transparent" },
  "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#c3c6d7" },
  "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#2563eb", borderWidth: 2 },
};

interface FilterOption { id: number; name: string }

interface Props {
  month: number;
  year: number;
  monthTo?: number;
  yearTo?: number;
  status: string;
  plants?: FilterOption[];
  isMaestro?: boolean;
  actions?: React.ReactNode;
}

export function BillingFilters({ month, year, monthTo, yearTo, status, plants = [], isMaestro, actions }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const hasRange = Boolean(searchParams.get("monthTo"));
  const [dateMode, setDateMode] = useState<"mes" | "rango">(hasRange ? "rango" : "mes");
  const [localMonth, setLocalMonth] = useState(String(month));
  const [localYear, setLocalYear] = useState(String(year));
  const [localMonthTo, setLocalMonthTo] = useState(String(monthTo ?? month));
  const [localYearTo, setLocalYearTo] = useState(String(yearTo ?? year));
  const [localStatus, setLocalStatus] = useState(status);
  const [localPlant, setLocalPlant] = useState(searchParams.get("plantNameId") ?? "all");
  const [localInvoiceNumber, setLocalInvoiceNumber] = useState(searchParams.get("invoiceNumber") ?? "");

  function applyFilters() {
    const params = new URLSearchParams();
    if (localInvoiceNumber.trim()) {
      params.set("invoiceNumber", localInvoiceNumber.trim());
    } else {
      params.set("month", localMonth);
      params.set("year", localYear);
      if (dateMode === "rango") {
        params.set("monthTo", localMonthTo);
        params.set("yearTo", localYearTo);
      }
    }
    if (localStatus !== "all") params.set("status", localStatus);
    if (localPlant !== "all") params.set("plantNameId", localPlant);
    params.set("page", "1");
    startTransition(() => router.push(`?${params.toString()}`));
    setAnchorEl(null);
  }

  function clearFilters() {
    const now = new Date();
    setDateMode("mes");
    setLocalMonth(String(now.getMonth() + 1));
    setLocalYear(String(now.getFullYear()));
    setLocalMonthTo(String(now.getMonth() + 1));
    setLocalYearTo(String(now.getFullYear()));
    setLocalStatus("all");
    setLocalPlant("all");
    setLocalInvoiceNumber("");
  }

  // Count active non-default filters
  let activeCount = 0;
  if (localStatus !== "all") activeCount++;
  if (localPlant !== "all") activeCount++;
  if (localInvoiceNumber.trim()) activeCount++;

  // Chips for active filters
  const chips: { label: string }[] = [];
  if (localInvoiceNumber.trim()) {
    chips.push({ label: `N° ${localInvoiceNumber.trim()}` });
  } else if (dateMode === "rango") {
    chips.push({ label: `${MONTHS_SHORT[parseInt(localMonth) - 1]} ${localYear} → ${MONTHS_SHORT[parseInt(localMonthTo) - 1]} ${localYearTo}` });
  } else {
    chips.push({ label: `${MONTHS[parseInt(localMonth) - 1]} ${localYear}` });
  }
  if (localStatus !== "all") {
    const statusLabel = STATUS_OPTIONS.find((s) => s.value === localStatus)?.label ?? localStatus;
    chips.push({ label: statusLabel });
  }
  if (localPlant !== "all") {
    const plantLabel = plants.find((p) => String(p.id) === localPlant)?.name ?? `Planta #${localPlant}`;
    chips.push({ label: plantLabel });
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

        {/* Active filter chips */}
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
      {isMaestro && actions && (
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
        slotProps={{ paper: { sx: { borderRadius: 3, boxShadow: "0 8px 24px rgba(13,28,46,0.14)", mt: 1, p: 2.5, minWidth: 340 } } }}
      >
        <Typography fontSize="0.875rem" fontWeight={700} sx={{ mb: 2 }}>Filtros</Typography>

        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
          <TextField
            size="small"
            fullWidth
            label="N° Factura"
            placeholder="Ej: 5299"
            value={localInvoiceNumber}
            onChange={(e) => setLocalInvoiceNumber(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") applyFilters(); }}
            sx={{ "& .MuiOutlinedInput-root": { backgroundColor: "#eff4ff", "& fieldset": { borderColor: "transparent" }, "&:hover fieldset": { borderColor: "#c3c6d7" }, "&.Mui-focused fieldset": { borderColor: "#2563eb", borderWidth: 2 } } }}
          />

          {/* Period mode toggle */}
          <Box>
            <Typography fontSize="0.75rem" fontWeight={500} color="text.secondary" sx={{ mb: 0.75 }}>Período</Typography>
            <ToggleButtonGroup
              size="small"
              exclusive
              value={dateMode}
              onChange={(_, v) => { if (v) setDateMode(v); }}
              sx={{
                backgroundColor: "#eff4ff",
                borderRadius: 1.5,
                "& .MuiToggleButton-root": {
                  border: "none",
                  borderRadius: "6px !important",
                  px: 2,
                  py: 0.5,
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  color: "#6b7280",
                  textTransform: "none",
                  "&.Mui-selected": {
                    backgroundColor: "#fff",
                    color: "#004ac6",
                    boxShadow: "0 1px 3px rgba(13,28,46,0.1)",
                    "&:hover": { backgroundColor: "#fff" },
                  },
                },
              }}
            >
              <ToggleButton value="mes">Mes</ToggleButton>
              <ToggleButton value="rango">Rango</ToggleButton>
            </ToggleButtonGroup>
          </Box>

          {/* Single month mode */}
          {dateMode === "mes" && (
            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.5 }}>
              <FormControl size="small" fullWidth>
                <InputLabel sx={{ fontSize: "0.8125rem" }}>Mes</InputLabel>
                <Select label="Mes" value={localMonth} onChange={(e) => setLocalMonth(String(e.target.value))} sx={selectSx}>
                  {MONTHS.map((name, i) => (
                    <MenuItem key={i + 1} value={String(i + 1)} sx={{ fontSize: "0.8125rem" }}>{name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl size="small" fullWidth>
                <InputLabel sx={{ fontSize: "0.8125rem" }}>Año</InputLabel>
                <Select label="Año" value={localYear} onChange={(e) => setLocalYear(String(e.target.value))} sx={selectSx}>
                  {getYears().map((y) => (
                    <MenuItem key={y} value={String(y)} sx={{ fontSize: "0.8125rem" }}>{y}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          )}

          {/* Range mode */}
          {dateMode === "rango" && (
            <Box sx={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 1, alignItems: "end" }}>
              <Box>
                <Typography fontSize="0.6875rem" fontWeight={500} color="text.secondary" sx={{ mb: 0.5 }}>Desde</Typography>
                <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0.75 }}>
                  <FormControl size="small">
                    <Select value={localMonth} onChange={(e) => setLocalMonth(String(e.target.value))} sx={selectSx}>
                      {MONTHS.map((name, i) => (
                        <MenuItem key={i + 1} value={String(i + 1)} sx={{ fontSize: "0.8125rem" }}>{name}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <FormControl size="small">
                    <Select value={localYear} onChange={(e) => setLocalYear(String(e.target.value))} sx={selectSx}>
                      {getYears().map((y) => (
                        <MenuItem key={y} value={String(y)} sx={{ fontSize: "0.8125rem" }}>{y}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>
              </Box>
              <Typography color="text.secondary" fontSize="0.875rem" sx={{ pb: 0.75 }}>→</Typography>
              <Box>
                <Typography fontSize="0.6875rem" fontWeight={500} color="text.secondary" sx={{ mb: 0.5 }}>Hasta</Typography>
                <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0.75 }}>
                  <FormControl size="small">
                    <Select value={localMonthTo} onChange={(e) => setLocalMonthTo(String(e.target.value))} sx={selectSx}>
                      {MONTHS.map((name, i) => (
                        <MenuItem key={i + 1} value={String(i + 1)} sx={{ fontSize: "0.8125rem" }}>{name}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <FormControl size="small">
                    <Select value={localYearTo} onChange={(e) => setLocalYearTo(String(e.target.value))} sx={selectSx}>
                      {getYears().map((y) => (
                        <MenuItem key={y} value={String(y)} sx={{ fontSize: "0.8125rem" }}>{y}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>
              </Box>
            </Box>
          )}

          <FormControl size="small" fullWidth>
            <InputLabel sx={{ fontSize: "0.8125rem" }}>Estado</InputLabel>
            <Select label="Estado" value={localStatus} onChange={(e) => setLocalStatus(String(e.target.value))} sx={selectSx}>
              {STATUS_OPTIONS.map((opt) => (
                <MenuItem key={opt.value} value={opt.value} sx={{ fontSize: "0.8125rem" }}>{opt.label}</MenuItem>
              ))}
            </Select>
          </FormControl>

          {plants.length > 0 && (
            <SearchableSelect
              label="Planta"
              allOption="Todas las plantas"
              options={plants.map((p) => ({ id: p.id, name: p.name }))}
              value={localPlant}
              onChange={(v) => setLocalPlant(v)}
            />
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
