"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import TextField from "@mui/material/TextField";
import Alert from "@mui/material/Alert";
import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";
import CheckCircleOutlinedIcon from "@mui/icons-material/CheckCircleOutlined";
import { formatCLP } from "@/lib/utils/formatters";

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
  return new Intl.DateTimeFormat("es-CL", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(dateStr));
}

function PreviewRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary" sx={{ display: "block", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", fontSize: "0.625rem" }}>
        {label}
      </Typography>
      <Typography fontSize="0.8125rem" fontWeight={500}>{value}</Typography>
    </Box>
  );
}

export function ImportInvoiceDialog() {
  const router = useRouter();
  const pathname = usePathname();
  const portfolioId = pathname.match(/^\/(\d+)\//)?.[1] ?? "";

  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("form");
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
      const res = await fetch(`/api/billing/import?duemintId=${encodeURIComponent(duemintId.trim())}&portfolioId=${portfolioId}`);
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Error al buscar la factura"); return; }
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
        body: JSON.stringify({ duemintId: result.preview.duemintId, portfolioId: result.portfolioId, customerId: result.customer!.id }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Error al importar la factura"); return; }
      setStep("success");
      router.refresh();
    } catch {
      setError("Error de conexión con el servidor");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Button variant="outlined" size="small" startIcon={<DownloadOutlinedIcon />} onClick={() => setOpen(true)} color="inherit" sx={{ borderColor: "#c3c6d7" }}>
        Importar factura
      </Button>

      <Dialog open={open} onClose={() => handleOpenChange(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", pr: 3 }}>
          <Typography fontWeight={700} fontSize="0.9375rem">Importar factura desde Duemint</Typography>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
            Paso {step === "form" ? 1 : step === "preview" ? 2 : 3} de 3
          </Typography>
        </DialogTitle>

        <DialogContent sx={{ pt: "8px !important" }}>
          {step === "form" && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
              <TextField
                size="small"
                label="ID de factura en Duemint"
                placeholder="ej. 43533878"
                autoFocus
                value={duemintId}
                onChange={(e) => setDuemintId(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleFetch()}
                inputProps={{ style: { fontFamily: "monospace", fontSize: "0.8125rem" } }}
              />
              {error && <Alert severity="error" sx={{ fontSize: "0.8125rem" }}>{error}</Alert>}
            </Box>
          )}

          {step === "preview" && result && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
              <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2, backgroundColor: "#eff4ff", borderRadius: 1.5, p: 2 }}>
                <PreviewRow label="N° Factura" value={<Box component="span" sx={{ fontFamily: "monospace" }}>{result.preview.number ?? `#${result.preview.duemintId}`}</Box>} />
                <PreviewRow label="Estado" value={result.preview.statusName ?? "—"} />
                <PreviewRow label="Cliente" value={<><span>{result.preview.clientName ?? "—"}</span><Box component="span" sx={{ display: "block", fontSize: "0.75rem", color: "text.secondary" }}>{result.preview.clientTaxId ?? ""}</Box></>} />
                <PreviewRow label="Portafolio" value={result.portfolioName} />
                <PreviewRow label="Emisión" value={formatDate(result.preview.issueDate)} />
                <PreviewRow label="Vencimiento" value={formatDate(result.preview.dueDate)} />
                <PreviewRow label="Total" value={result.preview.total != null ? formatCLP(result.preview.total) : "—"} />
                <PreviewRow label="Por cobrar" value={result.preview.amountDue != null ? formatCLP(result.preview.amountDue) : "—"} />
              </Box>

              {result.customer
                ? <Alert severity="success" icon={<CheckCircleOutlinedIcon fontSize="small" />} sx={{ fontSize: "0.8125rem" }}>
                    Cliente encontrado: <strong>{result.customer.name}</strong>
                  </Alert>
                : <Alert severity="error" sx={{ fontSize: "0.8125rem" }}>
                    No hay cliente asociado al RUT <strong>{result.preview.clientTaxId ?? "desconocido"}</strong>. Créalo en Clientes y vuelve a intentarlo.
                  </Alert>
              }

              {error && <Alert severity="error" sx={{ fontSize: "0.8125rem" }}>{error}</Alert>}
            </Box>
          )}

          {step === "success" && (
            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, py: 3 }}>
              <Box sx={{ width: 48, height: 48, borderRadius: "50%", backgroundColor: "#dbe1ff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <CheckCircleOutlinedIcon sx={{ fontSize: 24, color: "#004ac6" }} />
              </Box>
              <Box sx={{ textAlign: "center" }}>
                <Typography fontWeight={700} fontSize="0.9375rem">Factura importada</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  La factura fue agregada correctamente al sistema.
                </Typography>
              </Box>
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          {step === "form" && (
            <>
              <Button variant="outlined" size="small" color="inherit" onClick={() => handleOpenChange(false)} sx={{ borderColor: "#c3c6d7" }}>Cancelar</Button>
              <Button variant="contained" size="small" onClick={handleFetch} disabled={loading || !duemintId.trim() || !portfolioId}
                startIcon={loading ? <CircularProgress size={12} color="inherit" /> : undefined}>
                {loading ? "Buscando..." : "Buscar factura"}
              </Button>
            </>
          )}
          {step === "preview" && (
            <>
              <Button variant="outlined" size="small" color="inherit" onClick={() => setStep("form")} disabled={loading} sx={{ borderColor: "#c3c6d7" }}>Volver</Button>
              <Button variant="contained" size="small" onClick={handleConfirm} disabled={loading || !result?.customer}
                startIcon={loading ? <CircularProgress size={12} color="inherit" /> : undefined}>
                {loading ? "Importando..." : "Confirmar importación"}
              </Button>
            </>
          )}
          {step === "success" && (
            <Button variant="contained" size="small" onClick={() => handleOpenChange(false)} fullWidth>Cerrar</Button>
          )}
        </DialogActions>
      </Dialog>
    </>
  );
}
