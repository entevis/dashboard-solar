"use client";

import { useState, useRef } from "react";
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
import IconButton from "@mui/material/IconButton";
import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import AttachFileOutlinedIcon from "@mui/icons-material/AttachFileOutlined";
import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import useMediaQuery from "@mui/material/useMediaQuery";
import { toast } from "@/lib/utils/toast";

interface PowerPlant { id: number; name: string }

export function CreateContingencyDialog({ powerPlants }: { powerPlants: PowerPlant[] }) {
  const router = useRouter();
  const isMobile = useMediaQuery("(max-width:599px)");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    powerPlantId: "",
    code: "",
    type: "",
    description: "",
    cost: "",
    provider: "",
    workDescription: "",
  });

  function handleClose() {
    setOpen(false);
    setFile(null);
    setForm({ powerPlantId: "", code: "", type: "", description: "", cost: "", provider: "", workDescription: "" });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.powerPlantId || !form.type || !form.description) {
      toast.error("Completa los campos obligatorios");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("powerPlantId", form.powerPlantId);
      if (form.code) formData.append("code", form.code);
      formData.append("type", form.type);
      formData.append("description", form.description);
      if (form.cost) formData.append("cost", form.cost);
      if (form.provider) formData.append("provider", form.provider);
      if (form.workDescription) formData.append("workDescription", form.workDescription);
      if (file) formData.append("file", file);

      const res = await fetch("/api/contingencies", {
        method: "POST",
        body: formData,
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

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth fullScreen={isMobile}>
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

            <TextField
              size="small"
              fullWidth
              label="Código"
              placeholder="Ej: OT-2024-001"
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
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

            {/* File attachment */}
            <Box>
              <input
                ref={fileInputRef}
                type="file"
                style={{ display: "none" }}
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
              {file ? (
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, px: 1.5, py: 1, backgroundColor: "#eff4ff", borderRadius: 1.5 }}>
                  <AttachFileOutlinedIcon sx={{ fontSize: 15, color: "text.secondary", flexShrink: 0 }} />
                  <Typography variant="caption" sx={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {file.name}
                  </Typography>
                  <IconButton size="small" onClick={() => { setFile(null); if (fileInputRef.current) fileInputRef.current.value = ""; }} sx={{ p: 0.25 }}>
                    <CloseOutlinedIcon sx={{ fontSize: 14 }} />
                  </IconButton>
                </Box>
              ) : (
                <Button
                  variant="outlined"
                  size="small"
                  color="inherit"
                  startIcon={<AttachFileOutlinedIcon sx={{ fontSize: 15 }} />}
                  onClick={() => fileInputRef.current?.click()}
                  sx={{ borderColor: "#c3c6d7", fontSize: "0.8125rem" }}
                >
                  Adjuntar documento
                </Button>
              )}
            </Box>
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
