"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import TextField from "@mui/material/TextField";
import Select from "@mui/material/Select";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Collapse from "@mui/material/Collapse";
import Divider from "@mui/material/Divider";
import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import ExpandMoreOutlinedIcon from "@mui/icons-material/ExpandMoreOutlined";
import ExpandLessOutlinedIcon from "@mui/icons-material/ExpandLessOutlined";
import BoltOutlinedIcon from "@mui/icons-material/BoltOutlined";
import { normalizeRut } from "@/lib/utils/formatters";
import { toast } from "@/lib/utils/toast";

const inputSx = {
  "& .MuiOutlinedInput-root": {
    backgroundColor: "#eff4ff",
    "& fieldset": { borderColor: "transparent" },
    "&:hover fieldset": { borderColor: "transparent" },
    "&.Mui-focused fieldset": { borderColor: "#004ac6", borderWidth: 2 },
  },
};

interface Portfolio { id: number; name: string }

interface Props {
  portfolios: Portfolio[];
}

const emptyCustomer = { name: "", rut: "", altName: "" };
const emptyPlant = { portfolioId: "", name: "", capacityKw: "" };

export function CreateCustomerDialog({ portfolios }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [plantOpen, setPlantOpen] = useState(false);
  const [customer, setCustomer] = useState(emptyCustomer);
  const [plant, setPlant] = useState(emptyPlant);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function handleClose() {
    setOpen(false);
    setPlantOpen(false);
    setCustomer(emptyCustomer);
    setPlant(emptyPlant);
    setErrors({});
  }

  function handleRutChange(raw: string) {
    const digits = raw.replace(/[^0-9kK]/g, "");
    const formatted = digits.length > 1 ? normalizeRut(digits) : digits;
    setCustomer((prev) => ({ ...prev, rut: formatted }));
    if (errors.rut) setErrors((prev) => ({ ...prev, rut: "" }));
  }

  function validate() {
    const e: Record<string, string> = {};
    if (!customer.name.trim()) e.name = "La razón social es obligatoria";
    if (!customer.rut.trim()) e.rut = "El RUT es obligatorio";

    const plantPartial = plant.name || plant.capacityKw || plant.portfolioId;
    if (plantPartial) {
      if (!plant.portfolioId) e.plantPortfolioId = "Selecciona un portafolio";
      if (!plant.name.trim()) e.plantName = "El nombre de la planta es obligatorio";
      if (!plant.capacityKw || parseFloat(plant.capacityKw) <= 0) e.plantCapacity = "Ingresa una potencia mayor a 0";
    }
    return e;
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const v = validate();
    if (Object.keys(v).length > 0) { setErrors(v); return; }
    setLoading(true);
    try {
      const customerRes = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: customer.name, rut: customer.rut, altName: customer.altName || null }),
      });
      if (!customerRes.ok) {
        const err = await customerRes.json().catch(() => ({}));
        throw new Error(typeof err.error === "string" ? err.error : "Error al crear cliente");
      }
      const newCustomer = await customerRes.json();

      const plantPartial = plant.name || plant.capacityKw || plant.portfolioId;
      if (plantPartial) {
        const plantRes = await fetch("/api/power-plants", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: plant.name,
            portfolioId: parseInt(plant.portfolioId),
            customerId: newCustomer.id,
            capacityKw: parseFloat(plant.capacityKw),
          }),
        });
        if (!plantRes.ok) {
          const err = await plantRes.json().catch(() => ({}));
          throw new Error(typeof err.error === "string" ? err.error : "Error al crear planta");
        }
        toast.success("Cliente y planta creados exitosamente");
      } else {
        toast.success("Cliente creado exitosamente");
      }

      handleClose();
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al crear cliente");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Button variant="contained" size="small" startIcon={<AddOutlinedIcon />} onClick={() => setOpen(true)}>
        Nuevo cliente
      </Button>

      <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontSize: "0.9375rem", fontWeight: 700, pb: 1 }}>Crear cliente</DialogTitle>
        <Box component="form" onSubmit={handleSubmit}>
          <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>

            {/* Cliente */}
            <TextField
              label="Razón social"
              size="small"
              required
              value={customer.name}
              onChange={(e) => { setCustomer({ ...customer, name: e.target.value }); if (errors.name) setErrors((p) => ({ ...p, name: "" })); }}
              placeholder="Razón social del cliente"
              error={!!errors.name}
              helperText={errors.name}
              sx={inputSx}
            />
            <TextField
              label="RUT"
              size="small"
              required
              value={customer.rut}
              onChange={(e) => handleRutChange(e.target.value)}
              placeholder="76.123.456-7"
              error={!!errors.rut}
              helperText={errors.rut || "Formato: XX.XXX.XXX-X"}
              sx={inputSx}
            />
            <TextField
              label="Nombre alternativo"
              size="small"
              value={customer.altName}
              onChange={(e) => setCustomer({ ...customer, altName: e.target.value })}
              placeholder="Nombre corto o alias"
              sx={inputSx}
            />

            {/* Sección planta opcional */}
            <Divider />
            <Box
              onClick={() => setPlantOpen((v) => !v)}
              sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", userSelect: "none", py: 0.25 }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <BoltOutlinedIcon sx={{ fontSize: 16, color: "primary.main" }} />
                <Typography fontSize="0.8125rem" fontWeight={600} color="primary.main">
                  Agregar planta solar
                </Typography>
                <Typography fontSize="0.75rem" color="text.disabled">(opcional)</Typography>
              </Box>
              {plantOpen ? <ExpandLessOutlinedIcon sx={{ fontSize: 18, color: "text.secondary" }} /> : <ExpandMoreOutlinedIcon sx={{ fontSize: 18, color: "text.secondary" }} />}
            </Box>

            <Collapse in={plantOpen} unmountOnExit>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <FormControl fullWidth size="small" error={!!errors.plantPortfolioId} sx={inputSx}>
                  <InputLabel>Portafolio</InputLabel>
                  <Select
                    label="Portafolio"
                    value={plant.portfolioId}
                    onChange={(e) => { setPlant({ ...plant, portfolioId: e.target.value }); if (errors.plantPortfolioId) setErrors((p) => ({ ...p, plantPortfolioId: "" })); }}
                  >
                    {portfolios.map((p) => <MenuItem key={p.id} value={String(p.id)}>{p.name}</MenuItem>)}
                  </Select>
                  {errors.plantPortfolioId && <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.75 }}>{errors.plantPortfolioId}</Typography>}
                </FormControl>
                <TextField
                  label="Nombre de la planta"
                  size="small"
                  value={plant.name}
                  onChange={(e) => { setPlant({ ...plant, name: e.target.value }); if (errors.plantName) setErrors((p) => ({ ...p, plantName: "" })); }}
                  error={!!errors.plantName}
                  helperText={errors.plantName}
                  sx={inputSx}
                />
                <TextField
                  label="Potencia (kWp)"
                  size="small"
                  type="number"
                  inputProps={{ step: "0.1", min: 0 }}
                  value={plant.capacityKw}
                  onChange={(e) => { setPlant({ ...plant, capacityKw: e.target.value }); if (errors.plantCapacity) setErrors((p) => ({ ...p, plantCapacity: "" })); }}
                  error={!!errors.plantCapacity}
                  helperText={errors.plantCapacity}
                  sx={inputSx}
                />
              </Box>
            </Collapse>

          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
            <Button variant="outlined" color="inherit" size="small" onClick={handleClose} sx={{ borderColor: "#c3c6d7" }}>Cancelar</Button>
            <Button type="submit" variant="contained" size="small" disabled={loading}>
              {loading ? "Creando..." : "Crear cliente"}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </>
  );
}
