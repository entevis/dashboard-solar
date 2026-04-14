"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import SyncOutlinedIcon from "@mui/icons-material/SyncOutlined";
import CheckCircleOutlinedIcon from "@mui/icons-material/CheckCircleOutlined";

type Step = "form" | "loading" | "result";

interface Props {
  portfolioId?: number;
}

interface SyncResult {
  since: string;
  portfolios: number;
  invoices: { created: number; updated: number; skipped: number };
  reports: { created: number; updated: number; skipped: number };
  errors?: string[];
}

function defaultSince() {
  const d = new Date();
  d.setDate(1);
  return d.toISOString().slice(0, 10);
}

export function SyncSinceDialog({ portfolioId }: Props) {
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
        body: JSON.stringify({ since, portfolioId }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Error al sincronizar"); setStep("form"); return; }
      setResult(data);
      setStep("result");
      router.refresh();
    } catch {
      setError("Error de conexión con el servidor");
      setStep("form");
    }
  }

  return (
    <>
      <Button variant="outlined" size="small" startIcon={<SyncOutlinedIcon />} onClick={() => setOpen(true)} color="inherit" sx={{ borderColor: "#c3c6d7" }}>
        Sincronizar
      </Button>

      <Dialog open={open} onClose={() => handleOpenChange(false)} maxWidth="xs" fullWidth>
        <DialogTitle>
          <Typography fontWeight={700} fontSize="0.9375rem">Sincronizar facturas</Typography>
        </DialogTitle>

        <DialogContent sx={{ pt: "8px !important" }}>

          {/* FORM */}
          {step === "form" && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <Box>
                <TextField
                  size="small"
                  fullWidth
                  label="Traer facturas creadas desde"
                  type="date"
                  value={since}
                  onChange={(e) => setSince(e.target.value)}
                  inputProps={{ max: new Date().toISOString().slice(0, 10) }}
                  InputLabelProps={{ shrink: true }}
                />
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.75 }}>
                  Se sincronizarán las facturas y reportes de este portafolio.
                </Typography>
              </Box>
              {error && <Alert severity="error" sx={{ fontSize: "0.8125rem" }}>{error}</Alert>}
            </Box>
          )}

          {/* LOADING */}
          {step === "loading" && (
            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, py: 4 }}>
              <CircularProgress size={32} />
              <Box sx={{ textAlign: "center" }}>
                <Typography fontSize="0.8125rem" fontWeight={600}>Sincronizando...</Typography>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: "block" }}>
                  Esto puede tomar unos segundos.
                </Typography>
              </Box>
            </Box>
          )}

          {/* RESULT */}
          {step === "result" && result && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                <Box sx={{ width: 36, height: 36, borderRadius: "50%", backgroundColor: "#dbe1ff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <CheckCircleOutlinedIcon sx={{ fontSize: 20, color: "#004ac6" }} />
                </Box>
                <Box>
                  <Typography fontSize="0.8125rem" fontWeight={600}>Sincronización completada</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Desde {result.since}
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ borderRadius: 1.5, border: "1px solid", borderColor: "divider", overflow: "hidden" }}>
                <Box sx={{ px: 2, py: 1, backgroundColor: "#eff4ff" }}>
                  <Typography fontSize="0.75rem" fontWeight={600} color="text.secondary">Facturas</Typography>
                </Box>
                {[
                  { label: "Creadas",      value: result.invoices?.created ?? 0,  color: "#16a34a" },
                  { label: "Actualizadas", value: result.invoices?.updated ?? 0,  color: "text.primary" },
                  { label: "Omitidas",     value: result.invoices?.skipped ?? 0,  color: "text.secondary" },
                ].map((row) => (
                  <Box key={row.label} sx={{ display: "flex", justifyContent: "space-between", px: 2, py: 1 }}>
                    <Typography fontSize="0.8125rem" color="text.secondary">{row.label}</Typography>
                    <Typography fontSize="0.8125rem" fontWeight={600} color={row.color}>{row.value}</Typography>
                  </Box>
                ))}
                <Box sx={{ px: 2, py: 1, backgroundColor: "#eff4ff" }}>
                  <Typography fontSize="0.75rem" fontWeight={600} color="text.secondary">Reportes</Typography>
                </Box>
                {[
                  { label: "Creados",      value: result.reports?.created ?? 0,  color: "#16a34a" },
                  { label: "Actualizados", value: result.reports?.updated ?? 0,  color: "text.primary" },
                  { label: "Omitidos",     value: result.reports?.skipped ?? 0,  color: "text.secondary" },
                ].map((row) => (
                  <Box key={row.label} sx={{ display: "flex", justifyContent: "space-between", px: 2, py: 1 }}>
                    <Typography fontSize="0.8125rem" color="text.secondary">{row.label}</Typography>
                    <Typography fontSize="0.8125rem" fontWeight={600} color={row.color}>{row.value}</Typography>
                  </Box>
                ))}
              </Box>

              {result.errors && result.errors.length > 0 && (
                <Alert severity="warning" sx={{ fontSize: "0.75rem" }}>
                  {result.errors.map((e, i) => <div key={i}>{e}</div>)}
                </Alert>
              )}
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          {step === "form" && (
            <>
              <Button variant="outlined" size="small" color="inherit" onClick={() => handleOpenChange(false)} sx={{ borderColor: "#c3c6d7" }}>Cancelar</Button>
              <Button variant="contained" size="small" onClick={handleSync} disabled={!since} startIcon={<SyncOutlinedIcon />}>
                Sincronizar
              </Button>
            </>
          )}
          {step === "result" && (
            <Button variant="contained" size="small" onClick={() => handleOpenChange(false)} fullWidth>Cerrar</Button>
          )}
        </DialogActions>
      </Dialog>
    </>
  );
}
