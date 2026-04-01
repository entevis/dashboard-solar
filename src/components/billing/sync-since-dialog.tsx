"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RefreshCw, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";

type Step = "form" | "loading" | "result";

interface SyncResult {
  since: string;
  portfolios: number;
  created: number;
  updated: number;
  skipped: number;
  errors?: string[];
}

function defaultSince() {
  const d = new Date();
  d.setDate(1);
  return d.toISOString().slice(0, 10);
}

export function SyncSinceDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("form");
  const [since, setSince] = useState(defaultSince);
  const [result, setResult] = useState<SyncResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setStep("form");
    setResult(null);
    setError(null);
  }

  function handleOpenChange(val: boolean) {
    setOpen(val);
    if (!val) reset();
  }

  async function handleSync() {
    setStep("loading");
    setError(null);

    try {
      const res = await fetch("/api/billing/sync-since", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ since }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Error al sincronizar");
        setStep("form");
        return;
      }

      setResult(data);
      setStep("result");
      router.refresh();
    } catch {
      setError("Error de conexión con el servidor");
      setStep("form");
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="h-8 gap-1.5 text-label">
          <RefreshCw className="w-3.5 h-3.5" />
          Sincronizar
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-body">Sincronizar facturas</DialogTitle>
        </DialogHeader>

        {step === "form" && (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label className="text-label">Traer facturas creadas desde</Label>
              <Input
                type="date"
                className="h-9 text-label"
                value={since}
                onChange={(e) => setSince(e.target.value)}
                max={new Date().toISOString().slice(0, 10)}
              />
              <p className="text-caption text-(--color-muted-foreground)">
                Se consultará esta fecha en todos los portafolios con Duemint configurado.
              </p>
            </div>

            {error && (
              <div className="flex items-start gap-2 text-(--color-destructive) bg-destructive/10 rounded-lg px-3 py-2.5">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <p className="text-label">{error}</p>
              </div>
            )}

            <Button className="w-full gap-2" onClick={handleSync} disabled={!since}>
              <RefreshCw className="w-3.5 h-3.5" />
              Sincronizar
            </Button>
          </div>
        )}

        {step === "loading" && (
          <div className="flex flex-col items-center gap-4 py-6">
            <Loader2 className="w-8 h-8 animate-spin text-(--color-primary)" />
            <div className="text-center">
              <p className="text-label font-medium">Sincronizando...</p>
              <p className="text-caption text-(--color-muted-foreground) mt-1">
                Consultando todos los portafolios. Esto puede tomar unos segundos.
              </p>
            </div>
          </div>
        )}

        {step === "result" && result && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-success/10 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5 text-(--color-success)" />
              </div>
              <div>
                <p className="text-label font-medium">Sincronización completada</p>
                <p className="text-caption text-(--color-muted-foreground)">
                  Desde {result.since} · {result.portfolios} {result.portfolios === 1 ? "portafolio" : "portafolios"}
                </p>
              </div>
            </div>

            <div className="rounded-lg border border-(--color-border) divide-y divide-(--color-border)">
              <div className="flex items-center justify-between px-4 py-2.5">
                <span className="text-label text-(--color-muted-foreground)">Creadas</span>
                <span className="text-label font-semibold text-(--color-success)">{result.created}</span>
              </div>
              <div className="flex items-center justify-between px-4 py-2.5">
                <span className="text-label text-(--color-muted-foreground)">Actualizadas</span>
                <span className="text-label font-semibold text-(--color-foreground)">{result.updated}</span>
              </div>
              <div className="flex items-center justify-between px-4 py-2.5">
                <span className="text-label text-(--color-muted-foreground)">Omitidas</span>
                <span className="text-label font-medium text-(--color-muted-foreground)">{result.skipped}</span>
              </div>
            </div>

            {result.errors && result.errors.length > 0 && (
              <div className="flex flex-col gap-1.5">
                <p className="text-caption font-medium text-(--color-destructive)">Errores</p>
                {result.errors.map((e, i) => (
                  <p key={i} className="text-caption text-(--color-muted-foreground)">{e}</p>
                ))}
              </div>
            )}

            <Button className="w-full" onClick={() => handleOpenChange(false)}>
              Cerrar
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
