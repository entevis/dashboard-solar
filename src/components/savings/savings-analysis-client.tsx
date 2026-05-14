"use client";

import { useState, useCallback, useRef } from "react";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import Chip from "@mui/material/Chip";
import UploadFileOutlinedIcon from "@mui/icons-material/UploadFileOutlined";
import InsertDriveFileOutlinedIcon from "@mui/icons-material/InsertDriveFileOutlined";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import CloseIcon from "@mui/icons-material/Close";
import { SavingsResults } from "./savings-results";
import type { SavingsResult } from "@/lib/savings/types";

interface Plant {
  id: number;
  name: string;
  selfConsumptionDiscount: number | null;
}

interface Props {
  plants: Plant[];
}

type Status = "idle" | "analyzing" | "done" | "error";

export function SavingsAnalysisClient({ plants }: Props) {
  const [plantId, setPlantId] = useState<number | "">("");
  const [files, setFiles] = useState<File[]>([]);
  const [dragging, setDragging] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [result, setResult] = useState<SavingsResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback((incoming: File[]) => {
    const pdfs = incoming.filter((f) => f.type === "application/pdf" || f.name.endsWith(".pdf"));
    setFiles((prev) => {
      const existing = new Set(prev.map((f) => f.name));
      return [...prev, ...pdfs.filter((f) => !existing.has(f.name))];
    });
  }, []);

  const removeFile = (name: string) => setFiles((prev) => prev.filter((f) => f.name !== name));

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      addFiles(Array.from(e.dataTransfer.files));
    },
    [addFiles]
  );

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) addFiles(Array.from(e.target.files));
  };

  const analyze = async () => {
    if (!plantId || files.length === 0) return;

    const totalBytes = files.reduce((sum, f) => sum + f.size, 0);
    if (totalBytes > 4 * 1024 * 1024) {
      setErrorMsg("Los archivos superan 4 MB en total. Sube menos boletas a la vez.");
      setStatus("error");
      return;
    }

    setStatus("analyzing");
    setErrorMsg("");
    setResult(null);

    const fd = new FormData();
    fd.append("plantId", String(plantId));
    for (const f of files) fd.append("files", f);

    try {
      const res = await fetch("/api/savings-analysis/analyze", { method: "POST", body: fd });
      if (!res.ok) {
        let msg = "Error desconocido";
        try {
          const data = await res.json();
          msg = data.error ?? msg;
        } catch {
          msg = `Error del servidor (${res.status})`;
        }
        setErrorMsg(msg);
        setStatus("error");
        return;
      }
      const data = await res.json();
      setResult(data as SavingsResult);
      setStatus("done");
    } catch (err) {
      console.error("[savings-analysis] fetch error:", err);
      setErrorMsg("Error de conexión. Intenta nuevamente.");
      setStatus("error");
    }
  };

  const reset = () => {
    setStatus("idle");
    setResult(null);
    setFiles([]);
    setErrorMsg("");
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
      {/* Plant selector */}
      <FormControl size="small" sx={{ width: "100%", maxWidth: 560 }}>
        <InputLabel>Selecciona una planta</InputLabel>
        <Select
          value={plantId}
          label="Selecciona una planta"
          onChange={(e) => {
            setPlantId(e.target.value as number);
            reset();
          }}
          sx={{ bgcolor: "#fff", borderRadius: 1 }}
        >
          {plants.map((p) => (
            <MenuItem key={p.id} value={p.id}>
              {p.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {plantId !== "" && (
        <>
          {/* Upload area */}
          <Card
            elevation={0}
            onDrop={onDrop}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onClick={() => fileInputRef.current?.click()}
            sx={{
              border: "2px dashed",
              borderColor: dragging ? "#004ac6" : "#c3cfe8",
              bgcolor: dragging ? "#eff4ff" : "#fafbff",
              borderRadius: 2,
              cursor: "pointer",
              transition: "all 0.15s",
              "&:hover": { borderColor: "#004ac6", bgcolor: "#eff4ff" },
            }}
          >
            <CardContent sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1, py: 4 }}>
              <UploadFileOutlinedIcon sx={{ fontSize: 36, color: "#004ac6", opacity: 0.7 }} />
              <Typography fontWeight={600} color="text.primary" fontSize="0.9375rem">
                Arrastra las boletas aquí o haz clic para seleccionar
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Solo PDFs digitales (no escaneados) · Puedes subir varios archivos a la vez
              </Typography>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,application/pdf"
                multiple
                style={{ display: "none" }}
                onChange={onInputChange}
                onClick={(e) => e.stopPropagation()}
              />
            </CardContent>
          </Card>

          {/* File list */}
          {files.length > 0 && (
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
              {files.map((f) => (
                <Chip
                  key={f.name}
                  icon={<InsertDriveFileOutlinedIcon />}
                  label={f.name}
                  onDelete={() => removeFile(f.name)}
                  deleteIcon={<CloseIcon />}
                  size="small"
                  sx={{ bgcolor: "#eff4ff", color: "#0d1c2e", maxWidth: 280, "& .MuiChip-label": { fontSize: "0.75rem" } }}
                />
              ))}
            </Box>
          )}

          {/* Action */}
          {status === "error" && (
            <Alert severity="error" icon={<ErrorOutlineIcon />} onClose={() => setStatus("idle")}>
              {errorMsg}
            </Alert>
          )}

          <Box sx={{ display: "flex", gap: 1.5, alignItems: "center" }}>
            <Button
              variant="contained"
              onClick={analyze}
              disabled={files.length === 0 || status === "analyzing"}
              sx={{ borderRadius: 1, textTransform: "none", fontWeight: 600, px: 3, bgcolor: "#004ac6", "&:hover": { bgcolor: "#003da3" } }}
            >
              {status === "analyzing" ? (
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <CircularProgress size={16} sx={{ color: "#fff" }} />
                  Analizando…
                </Box>
              ) : (
                "Analizar"
              )}
            </Button>
            {(files.length > 0 || status === "done") && (
              <Button
                variant="text"
                onClick={reset}
                size="small"
                sx={{ textTransform: "none", color: "#434655" }}
              >
                Limpiar
              </Button>
            )}
          </Box>
        </>
      )}

      {/* Results */}
      {status === "done" && result && <SavingsResults result={result} />}
    </Box>
  );
}
