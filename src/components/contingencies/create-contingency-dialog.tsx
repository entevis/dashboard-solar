"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import Autocomplete from "@mui/material/Autocomplete";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";
import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import { toast } from "@/lib/utils/toast";

interface PowerPlant { id: number; name: string }

export function CreateContingencyDialog({ powerPlants }: { powerPlants: PowerPlant[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    powerPlantId: "",
    type: "",
    description: "",
    cost: "",
    provider: "",
    workDescription: "",
  });

  function handleClose() {
    setOpen(false);
    setForm({ powerPlantId: "", type: "", description: "", cost: "", provider: "", workDescription: "" });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.powerPlantId || !form.type || !form.description) {
      toast.error("Completa los campos obligatorios");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/contingencies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          powerPlantId: form.powerPlantId,
          type: form.type,
          description: form.description,
          cost: form.cost ? parseFloat(form.cost) : null,
          provider: form.provider || null,
          workDescription: form.workDescription || null,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error?.message || "Error al crear contingencia");
      }

      toast.success("Contingencia creada exitosamente");
      handleClose();
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al crear contingencia");
    } finally {
      setLoading(false);
    }
  }

  const selectedPlant = powerPlants.find((p) => String(p.id) === form.powerPlantId) ?? null;

  return (
    <>
      <Button variant="contained" size="small" startIcon={<AddOutlinedIcon />} onClick={() => setOpen(true)}>
        Nueva contingencia
      </Button>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Typography fontWeight={700} fontSize="0.9375rem">Crear contingencia</Typography>
        </DialogTitle>

        <DialogContent sx={{ pt: "8px !important" }}>
          <Box component="form" id="contingency-form" onSubmit={handleSubmit} sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>

            <Autocomplete
              size="small"
              options={powerPlants}
              getOptionLabel={(p) => p.name}
              value={selectedPlant}
              onChange={(_, v) => setForm({ ...form, powerPlantId: v ? String(v.id) : "" })}
              renderInput={(params) => (
                <TextField {...params} label="Planta *" placeholder="Buscar planta..." />
              )}
              noOptionsText="Sin resultados"
            />

            <FormControl size="small" fullWidth>
              <InputLabel>Tipo *</InputLabel>
              <Select label="Tipo *" value={form.type} onChange={(e) => setForm({ ...form, type: String(e.target.value) })}>
                <MenuItem value="PREVENTIVE" sx={{ fontSize: "0.8125rem" }}>Preventiva</MenuItem>
                <MenuItem value="CORRECTIVE" sx={{ fontSize: "0.8125rem" }}>Correctiva</MenuItem>
              </Select>
            </FormControl>

            <TextField
              size="small"
              fullWidth
              multiline
              minRows={3}
              label="Descripción *"
              placeholder="Describe la contingencia..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />

            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
              <TextField
                size="small"
                type="number"
                label="Costo (CLP)"
                placeholder="0"
                value={form.cost}
                onChange={(e) => setForm({ ...form, cost: e.target.value })}
              />
              <TextField
                size="small"
                label="Proveedor"
                placeholder="Nombre del proveedor"
                value={form.provider}
                onChange={(e) => setForm({ ...form, provider: e.target.value })}
              />
            </Box>

            <TextField
              size="small"
              fullWidth
              multiline
              minRows={2}
              label="Descripción del trabajo"
              placeholder="Detalle del trabajo realizado o a realizar..."
              value={form.workDescription}
              onChange={(e) => setForm({ ...form, workDescription: e.target.value })}
            />
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button variant="outlined" size="small" color="inherit" onClick={handleClose} disabled={loading} sx={{ borderColor: "#c3c6d7" }}>
            Cancelar
          </Button>
          <Button
            type="submit"
            form="contingency-form"
            variant="contained"
            size="small"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={12} color="inherit" /> : undefined}
          >
            {loading ? "Creando..." : "Crear contingencia"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
