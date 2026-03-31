"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Upload, UploadCloud, FileText, X, AlertCircle, Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

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
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); else setOpen(true); }}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          className="bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary)]/90"
        >
          <Plus className="w-4 h-4 mr-1" />
          Subir Reporte
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-[15px] font-bold">
            Subir Reporte de Generación
          </DialogTitle>
          <p className="text-[12px] text-[var(--color-muted-foreground)]">{powerPlantName}</p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 w-full min-w-0">
          {/* Periodo */}
          <div className="space-y-1.5">
            <Label className="text-[13px]">Periodo <span className="text-[var(--color-warning)]">*</span></Label>
            <div className="grid grid-cols-2 gap-3">
              <Select
                value={form.periodMonth}
                onValueChange={(v) => { setForm({ ...form, periodMonth: v }); setPeriodError(null); }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Mes" />
                </SelectTrigger>
                <SelectContent>
                  {MONTHS.map((m) => (
                    <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={form.periodYear}
                onValueChange={(v) => { setForm({ ...form, periodYear: v }); setPeriodError(null); }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {YEARS.map((y) => (
                    <SelectItem key={y} value={y}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {periodError && (
              <p className="flex items-center gap-1.5 text-[12px] text-[var(--color-destructive)] mt-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                {periodError}
              </p>
            )}
          </div>

          {/* kWh */}
          <div className="space-y-1.5">
            <Label className="text-[13px]">Generación <span className="text-[var(--color-warning)]">*</span></Label>
            <div className="flex items-center w-full border border-input rounded-md overflow-hidden focus-within:ring-1 focus-within:ring-ring">
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.kwhGenerated}
                onChange={(e) => setForm({ ...form, kwhGenerated: e.target.value })}
                placeholder="0"
                className="flex-1 px-3 py-2 text-[13px] bg-transparent outline-none"
              />
              <span className="px-3 text-[12px] text-[var(--color-muted-foreground)] border-l border-input bg-[var(--color-secondary)] h-full flex items-center py-2">
                kWh
              </span>
            </div>
          </div>

          {/* Drop zone */}
          <div className="space-y-1.5">
            <Label className="text-[13px]">Archivo PDF <span className="text-[var(--color-warning)]">*</span></Label>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) selectFile(f); }}
            />

            {dropState === "selected" && file ? (
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-[var(--color-success)] bg-[var(--color-success)]/5 w-full min-w-0">
                <FileText className="w-5 h-5 text-[var(--color-success)] shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium text-[var(--color-foreground)] truncate">{file.name}</p>
                  <p className="text-[12px] text-[var(--color-muted-foreground)]">{formatFileSize(file.size)} · PDF</p>
                </div>
                <button
                  type="button"
                  onClick={clearFile}
                  className="p-1 rounded text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : dropState === "error" ? (
              <div
                className="flex flex-col items-center justify-center h-[120px] rounded-xl border-2 border-dashed border-[var(--color-destructive)]/50 bg-[var(--color-destructive)]/5 cursor-pointer transition-all"
                onClick={() => { setDropState("idle"); setFileError(null); fileInputRef.current?.click(); }}
              >
                <AlertCircle className="w-5 h-5 text-[var(--color-destructive)] mb-1" />
                <p className="text-[13px] text-[var(--color-destructive)]">{fileError}</p>
                <p className="text-[12px] text-[var(--color-destructive)]/70 mt-0.5">Clic para intentar de nuevo</p>
              </div>
            ) : (
              <div
                className={cn(
                  "flex flex-col items-center justify-center h-[120px] rounded-xl border-2 border-dashed cursor-pointer transition-all duration-150",
                  dropState === "dragging"
                    ? "border-[var(--color-primary)] bg-[var(--color-primary)]/5"
                    : "border-[var(--color-border)] bg-[var(--color-secondary)]"
                )}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <UploadCloud
                  className={cn(
                    "w-6 h-6 mb-2 transition-colors",
                    dropState === "dragging" ? "text-[var(--color-primary)]" : "text-[var(--color-muted-foreground)]"
                  )}
                />
                <p className="text-[13px] font-medium text-[var(--color-foreground)]">
                  {dropState === "dragging" ? "Soltá el archivo aquí" : "Arrastrá el PDF aquí"}
                </p>
                <p className="text-[12px] text-[var(--color-muted-foreground)] mt-0.5">
                  o hacé clic para seleccionar · máx. 10 MB
                </p>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleClose}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={loading}
              className="bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary)]/90 min-w-[130px]"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                  Subiendo...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-1.5" />
                  Subir Reporte
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
