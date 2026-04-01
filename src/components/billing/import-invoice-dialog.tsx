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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Download, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { formatCLP } from "@/lib/utils/formatters";

interface Portfolio {
  id: number;
  name: string;
}

interface InvoicePreview {
  duemintId: string;
  number: string | null;
  clientTaxId: string | null;
  clientName: string | null;
  issueDate: string | null;
  dueDate: string | null;
  statusName: string | null;
  currency: string | null;
  total: number | null;
  amountDue: number | null;
  net: number | null;
  taxes: number | null;
  url: string | null;
}

interface PreviewResult {
  preview: InvoicePreview;
  customer: { id: number; name: string } | null;
  portfolioId: number;
  portfolioName: string;
}

type Step = "form" | "preview" | "success";

function formatDate(dateStr: string | null) {
  if (!dateStr) return "—";
  return new Intl.DateTimeFormat("es-CL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(dateStr));
}

export function ImportInvoiceDialog({ portfolios }: { portfolios: Portfolio[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("form");

  // Form state
  const [portfolioId, setPortfolioId] = useState<string>(portfolios[0] ? String(portfolios[0].id) : "");
  const [duemintId, setDuemintId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PreviewResult | null>(null);

  function reset() {
    setStep("form");
    setDuemintId("");
    setError(null);
    setResult(null);
    setLoading(false);
  }

  function handleOpenChange(val: boolean) {
    setOpen(val);
    if (!val) reset();
  }

  async function handleFetch() {
    if (!duemintId.trim() || !portfolioId) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/billing/import?duemintId=${encodeURIComponent(duemintId.trim())}&portfolioId=${portfolioId}`
      );
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Error al buscar la factura");
        return;
      }

      setResult(data);
      setStep("preview");
    } catch {
      setError("Error de conexión con el servidor");
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirm() {
    if (!result) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/billing/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          duemintId: result.preview.duemintId,
          portfolioId: result.portfolioId,
          customerId: result.customer!.id,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Error al importar la factura");
        return;
      }

      setStep("success");
      router.refresh();
    } catch {
      setError("Error de conexión con el servidor");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="h-8 gap-1.5 text-label">
          <Download className="w-3.5 h-3.5" />
          Importar factura
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-body">Importar factura desde Duemint</DialogTitle>
        </DialogHeader>

        {step === "form" && (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label className="text-label">Portafolio</Label>
              <Select value={portfolioId} onValueChange={setPortfolioId}>
                <SelectTrigger className="h-9 text-label">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {portfolios.map((p) => (
                    <SelectItem key={p.id} value={String(p.id)} className="text-label">
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-label">ID de factura en Duemint</Label>
              <Input
                className="h-9 text-label font-mono"
                placeholder="ej. 43533878"
                value={duemintId}
                onChange={(e) => setDuemintId(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleFetch()}
              />
            </div>

            {error && (
              <div className="flex items-start gap-2 text-destructive bg-destructive/10 rounded-lg px-3 py-2.5">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <p className="text-label">{error}</p>
              </div>
            )}

            <Button
              className="w-full"
              onClick={handleFetch}
              disabled={loading || !duemintId.trim() || !portfolioId}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {loading ? "Buscando..." : "Buscar factura"}
            </Button>
          </div>
        )}

        {step === "preview" && result && (
          <div className="flex flex-col gap-4">
            {/* Invoice summary */}
            <div className="rounded-lg border border-(--color-border) divide-y divide-(--color-border)">
              <div className="grid grid-cols-2 gap-x-4 px-4 py-3">
                <div>
                  <p className="text-caption text-(--color-muted-foreground)">N° Factura</p>
                  <p className="text-label font-medium font-mono">
                    {result.preview.number ?? `#${result.preview.duemintId}`}
                  </p>
                </div>
                <div>
                  <p className="text-caption text-(--color-muted-foreground)">Estado</p>
                  <p className="text-label">{result.preview.statusName ?? "—"}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-x-4 px-4 py-3">
                <div>
                  <p className="text-caption text-(--color-muted-foreground)">Cliente (Duemint)</p>
                  <p className="text-label font-medium">{result.preview.clientName ?? "—"}</p>
                  <p className="text-caption text-(--color-muted-foreground)">{result.preview.clientTaxId ?? "—"}</p>
                </div>
                <div>
                  <p className="text-caption text-(--color-muted-foreground)">Portafolio</p>
                  <p className="text-label">{result.portfolioName}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-x-4 px-4 py-3">
                <div>
                  <p className="text-caption text-(--color-muted-foreground)">Emisión</p>
                  <p className="text-label">{formatDate(result.preview.issueDate)}</p>
                </div>
                <div>
                  <p className="text-caption text-(--color-muted-foreground)">Vencimiento</p>
                  <p className="text-label">{formatDate(result.preview.dueDate)}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-x-4 px-4 py-3">
                <div>
                  <p className="text-caption text-(--color-muted-foreground)">Total</p>
                  <p className="text-label font-semibold">
                    {result.preview.total != null ? formatCLP(result.preview.total) : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-caption text-(--color-muted-foreground)">Por cobrar</p>
                  <p className="text-label">
                    {result.preview.amountDue != null ? formatCLP(result.preview.amountDue) : "—"}
                  </p>
                </div>
              </div>
            </div>

            {/* Customer match status */}
            {result.customer ? (
              <div className="flex items-start gap-2 text-success bg-success/10 rounded-lg px-3 py-2.5">
                <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
                <p className="text-label">
                  Cliente encontrado: <span className="font-medium">{result.customer.name}</span>
                </p>
              </div>
            ) : (
              <div className="flex items-start gap-2 text-destructive bg-destructive/10 rounded-lg px-3 py-2.5">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <p className="text-label">
                  No existe un cliente asociado al RUT{" "}
                  <span className="font-mono font-medium">{result.preview.clientTaxId ?? "desconocido"}</span>.
                  Créalo en la sección de clientes y vuelve a intentarlo.
                </p>
              </div>
            )}

            {error && (
              <div className="flex items-start gap-2 text-destructive bg-destructive/10 rounded-lg px-3 py-2.5">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <p className="text-label">{error}</p>
              </div>
            )}

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setStep("form")} disabled={loading}>
                Volver
              </Button>
              <Button
                className="flex-1"
                onClick={handleConfirm}
                disabled={loading || !result.customer}
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                {loading ? "Importando..." : "Confirmar importación"}
              </Button>
            </div>
          </div>
        )}

        {step === "success" && (
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-(--color-success)" />
            </div>
            <div className="text-center">
              <p className="text-body font-medium">Factura importada</p>
              <p className="text-label text-(--color-muted-foreground) mt-1">
                La factura fue agregada correctamente al sistema.
              </p>
            </div>
            <Button className="w-full" onClick={() => handleOpenChange(false)}>
              Cerrar
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
