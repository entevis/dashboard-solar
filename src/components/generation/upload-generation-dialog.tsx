"use client";

import { useState } from "react";
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
import { Upload } from "lucide-react";
import { toast } from "sonner";

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

export function UploadGenerationDialog({ powerPlantId, powerPlantName }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    periodMonth: "",
    periodYear: String(currentYear),
    kwhGenerated: "",
  });
  const [file, setFile] = useState<File | null>(null);

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

      if (!res.ok) {
        const err = await res.json();
        throw new Error(typeof err.error === "string" ? err.error : "Error al subir reporte");
      }

      toast.success("Reporte de generación subido exitosamente");
      setOpen(false);
      setForm({ periodMonth: "", periodYear: String(currentYear), kwhGenerated: "" });
      setFile(null);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al subir reporte");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          className="bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary)]/90"
        >
          <Upload className="w-4 h-4 mr-1" />
          Subir Reporte
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle className="text-[15px] font-bold">
            Subir Reporte de Generación
          </DialogTitle>
          <p className="text-[12px] text-[var(--color-muted-foreground)]">
            {powerPlantName}
          </p>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[13px]">Mes *</Label>
              <Select
                value={form.periodMonth}
                onValueChange={(v) => setForm({ ...form, periodMonth: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar" />
                </SelectTrigger>
                <SelectContent>
                  {MONTHS.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-[13px]">Año *</Label>
              <Select
                value={form.periodYear}
                onValueChange={(v) => setForm({ ...form, periodYear: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {YEARS.map((y) => (
                    <SelectItem key={y} value={y}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-[13px]">Generación (kWh) *</Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={form.kwhGenerated}
              onChange={(e) => setForm({ ...form, kwhGenerated: e.target.value })}
              placeholder="Ej: 12500.50"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-[13px]">Archivo PDF *</Label>
            <div className="border border-[var(--color-border)] rounded-md p-3">
              <input
                type="file"
                accept="application/pdf"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className="text-[13px] w-full file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:text-[12px] file:font-medium file:bg-[var(--color-secondary)] file:text-[var(--color-foreground)] hover:file:bg-[var(--color-secondary)]/80 cursor-pointer"
              />
              {file && (
                <p className="text-[11px] text-[var(--color-muted-foreground)] mt-1">
                  {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                </p>
              )}
            </div>
            <p className="text-[11px] text-[var(--color-muted-foreground)]">
              Máximo 10 MB. Solo archivos PDF.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={loading}
              className="bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary)]/90"
            >
              {loading ? "Subiendo..." : "Subir Reporte"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
