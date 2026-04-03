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
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import UploadOutlinedIcon from "@mui/icons-material/UploadOutlined";
import CloudUploadOutlinedIcon from "@mui/icons-material/CloudUploadOutlined";
import InsertDriveFileOutlinedIcon from "@mui/icons-material/InsertDriveFileOutlined";
import ErrorOutlineOutlinedIcon from "@mui/icons-material/ErrorOutlineOutlined";
import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import { toast } from "@/lib/utils/toast";

const MONTHS = [
  { value: "1", label: "Enero" },
  { value: "2", label: "Febrero" },
  { value: "3", label: "Marzo" },
  { value: "4", label: "Abril" },
  { value: "5", label: "Mayo" },
  { value: "6", label: "Junio" },
  { value: "7", label: "Julio" },
  { value: "8", label: "Agosto" },
  { value: "9", label: "Septiembre" },
  { value: "10", label: "Octubre" },
  { value: "11", label: "Noviembre" },
  { value: "12", label: "Diciembre" },
];

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 5 }, (_, i) => String(currentYear - i));

interface Props {
  powerPlantId: number;
  powerPlantName: string;
}

type DropZoneState = "idle" | "dragging" | "selected" | "error";

function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function UploadGenerationDialog({ powerPlantId, powerPlantName }: Props) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [periodError, setPeriodError] = useState<string | null>(null);
  const [dropState, setDropState] = useState<DropZoneState>("idle");
  const [fileError, setFileError] = useState<string | null>(null);
  const [form, setForm] = useState({
    periodMonth: "",
    periodYear: String(currentYear),
    kwhGenerated: "",
  });
  const [file, setFile] = useState<File | null>(null);

  function handleClose() {
    setOpen(false);
    setForm({ periodMonth: "", periodYear: String(currentYear), kwhGenerated: "" });
    setFile(null);
    setDropState("idle");
    setFileError(null);
    setPeriodError(null);
  }

  function validateFile(f: File): string | null {
    if (!f.type.includes("pdf")) return "Solo se aceptan archivos PDF";
    if (f.size > 10 * 1024 * 1024) return "El archivo supera el máximo de 10 MB";
    return null;
  }

  function selectFile(f: File) {
    const err = validateFile(f);
    if (err) {
      setFileError(err);
      setDropState("error");
      setFile(null);
    } else {
      setFileError(null);
      setFile(f);
      setDropState("selected");
    }
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    if (dropState !== "selected") setDropState("dragging");
  }

  function handleDragLeave() {
    if (dropState !== "selected") setDropState("idle");
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) selectFile(f);
  }

  function clearFile() {
    setFile(null);
    setDropState("idle");
    setFileError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.periodMonth || !form.kwhGenerated || !file) {
      toast.error("Completa todos los campos y selecciona un archivo PDF");
      return;
    }
    const kwh = parseFloat(form.kwhGenerated);
    if (isNaN(kwh) || kwh <= 0) {
      toast.error("Ingresa un valor de kWh válido");
      return;
    }

    setLoading(true);
    setPeriodError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("powerPlantId", String(powerPlantId));
      formData.append("periodMonth", form.periodMonth);
      formData.append("periodYear", form.periodYear);
      formData.append("kwhGenerated", form.kwhGenerated);

      const res = await fetch("/api/generation/upload", {
        method: "POST",
        body: formData,
      });

      if (res.status === 409) {
        setPeriodError("Ya existe un reporte para este periodo.");
        return;
      }

      if (!res.ok) {
        const err = await res.json();
        throw new Error(typeof err.error === "string" ? err.error : "Error al subir reporte");
      }

      toast.success("Reporte subido exitosamente");
      handleClose();
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al subir reporte");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Button
        variant="contained"
        size="small"
        startIcon={<AddOutlinedIcon />}
        onClick={() => setOpen(true)}
      >
        Subir Reporte
      </Button>

      <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ pb: 0.5 }}>
          <Typography fontWeight={700} fontSize="0.9375rem">Subir Reporte de Generación</Typography>
          <Typography variant="caption" color="text.secondary">{powerPlantName}</Typography>
        </DialogTitle>

        <DialogContent sx={{ pt: "16px !important" }}>
          <Box component="form" id="upload-form" onSubmit={handleSubmit} sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>

            {/* Periodo */}
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1, fontWeight: 600 }}>
                Periodo *
              </Typography>
              <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.5 }}>
                <FormControl size="small" fullWidth>
                  <InputLabel>Mes</InputLabel>
                  <Select
                    label="Mes"
                    value={form.periodMonth}
                    onChange={(e) => { setForm({ ...form, periodMonth: e.target.value }); setPeriodError(null); }}
                  >
                    {MONTHS.map((m) => (
                      <MenuItem key={m.value} value={m.value} sx={{ fontSize: "0.8125rem" }}>{m.label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControl size="small" fullWidth>
                  <InputLabel>Año</InputLabel>
                  <Select
                    label="Año"
                    value={form.periodYear}
                    onChange={(e) => { setForm({ ...form, periodYear: e.target.value }); setPeriodError(null); }}
                  >
                    {YEARS.map((y) => (
                      <MenuItem key={y} value={y} sx={{ fontSize: "0.8125rem" }}>{y}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
              {periodError && (
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mt: 0.75 }}>
                  <ErrorOutlineOutlinedIcon sx={{ fontSize: 14, color: "error.main" }} />
                  <Typography variant="caption" color="error">{periodError}</Typography>
                </Box>
              )}
            </Box>

            {/* kWh */}
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1, fontWeight: 600 }}>
                Generación *
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center", border: "1px solid", borderColor: "divider", borderRadius: 1, overflow: "hidden", backgroundColor: "#eff4ff", "&:focus-within": { borderColor: "primary.main", borderWidth: 2 } }}>
                <Box
                  component="input"
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.kwhGenerated}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, kwhGenerated: e.target.value })}
                  placeholder="0"
                  sx={{ flex: 1, px: 1.5, py: 1, fontSize: "0.8125rem", border: "none", outline: "none", backgroundColor: "transparent", fontFamily: "Inter, sans-serif" }}
                />
                <Box sx={{ px: 1.5, py: 1, fontSize: "0.75rem", color: "text.secondary", borderLeft: "1px solid", borderColor: "divider", backgroundColor: "#e6eeff", whiteSpace: "nowrap" }}>
                  kWh
                </Box>
              </Box>
            </Box>

            {/* Drop zone */}
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1, fontWeight: 600 }}>
                Archivo PDF *
              </Typography>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                style={{ display: "none" }}
                onChange={(e) => { const f = e.target.files?.[0]; if (f) selectFile(f); }}
              />

              {dropState === "selected" && file ? (
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, px: 2, py: 1.5, borderRadius: 1.5, border: "1px solid #16a34a", backgroundColor: "#f0fdf4" }}>
                  <InsertDriveFileOutlinedIcon sx={{ fontSize: 20, color: "#16a34a", flexShrink: 0 }} />
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography fontSize="0.8125rem" fontWeight={500} noWrap>{file.name}</Typography>
                    <Typography variant="caption" color="text.secondary">{formatFileSize(file.size)} · PDF</Typography>
                  </Box>
                  <Box
                    component="button"
                    type="button"
                    onClick={clearFile}
                    sx={{ p: 0.5, border: "none", background: "none", cursor: "pointer", color: "text.secondary", borderRadius: 1, "&:hover": { color: "text.primary", backgroundColor: "action.hover" }, display: "flex" }}
                  >
                    <CloseOutlinedIcon sx={{ fontSize: 16 }} />
                  </Box>
                </Box>
              ) : dropState === "error" ? (
                <Box
                  sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: 110, borderRadius: 1.5, border: "2px dashed", borderColor: "error.light", backgroundColor: "#fff5f5", cursor: "pointer" }}
                  onClick={() => { setDropState("idle"); setFileError(null); fileInputRef.current?.click(); }}
                >
                  <ErrorOutlineOutlinedIcon sx={{ fontSize: 22, color: "error.main", mb: 0.5 }} />
                  <Typography fontSize="0.8125rem" color="error">{fileError}</Typography>
                  <Typography variant="caption" color="error" sx={{ opacity: 0.7, mt: 0.25 }}>Clic para intentar de nuevo</Typography>
                </Box>
              ) : (
                <Box
                  sx={{
                    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                    height: 110, borderRadius: 1.5, border: "2px dashed", cursor: "pointer", transition: "all 150ms",
                    borderColor: dropState === "dragging" ? "primary.main" : "divider",
                    backgroundColor: dropState === "dragging" ? "#eff4ff" : "#fafafa",
                  }}
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <CloudUploadOutlinedIcon sx={{ fontSize: 24, mb: 0.75, color: dropState === "dragging" ? "primary.main" : "text.secondary" }} />
                  <Typography fontSize="0.8125rem" fontWeight={500}>
                    {dropState === "dragging" ? "Soltá el archivo aquí" : "Arrastrá el PDF aquí"}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.25 }}>
                    o hacé clic para seleccionar · máx. 10 MB
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button variant="outlined" size="small" onClick={handleClose} disabled={loading} color="inherit">
            Cancelar
          </Button>
          <Button
            type="submit"
            form="upload-form"
            variant="contained"
            size="small"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={14} color="inherit" /> : <UploadOutlinedIcon />}
            sx={{ minWidth: 130 }}
          >
            {loading ? "Subiendo..." : "Subir Reporte"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
