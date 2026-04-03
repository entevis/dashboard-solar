"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Grid from "@mui/material/Grid";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import CircularProgress from "@mui/material/CircularProgress";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import BusinessOutlinedIcon from "@mui/icons-material/BusinessOutlined";
import AccountBalanceOutlinedIcon from "@mui/icons-material/AccountBalanceOutlined";
import { toast } from "@/lib/utils/toast";

const inputSx = { "& .MuiOutlinedInput-root": { backgroundColor: "#eff4ff", "& fieldset": { borderColor: "transparent" }, "&:hover fieldset": { borderColor: "transparent" }, "&.Mui-focused fieldset": { borderColor: "#004ac6", borderWidth: 2 } } };

export interface SerializedPortfolio {
  id: number;
  name: string;
  description: string | null;
  taxIdentification: string | null;
  country: string | null;
  contact: string | null;
  duemintCompanyId: string | null;
  bankAccount: {
    id: number;
    name: string;
    bankName: string;
    accountType: string;
    accountNumber: string;
    rut: string;
    receiptEmail: string | null;
  } | null;
}

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <Box>
      <Typography variant="overline" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>{label}</Typography>
      <Typography variant="body1" fontWeight={500} color="text.primary">{value || "—"}</Typography>
    </Box>
  );
}

function ReadonlyField({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <Box>
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 0.5 }}>
        <Typography variant="overline" color="text.secondary">{label}</Typography>
        <LockOutlinedIcon sx={{ fontSize: 11, color: "text.secondary" }} />
      </Box>
      <Typography variant="body1" fontWeight={500} color="text.primary">{value || "—"}</Typography>
    </Box>
  );
}

function SectionCard({ icon: Icon, title, children }: { icon: React.ComponentType<{ sx?: object }>; title: string; children: React.ReactNode }) {
  return (
    <Card>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, px: 2, py: 1.25, backgroundColor: "#eff4ff", borderRadius: "12px 12px 0 0" }}>
        <Icon sx={{ fontSize: 16, color: "primary.dark" }} />
        <Typography variant="body1" fontWeight={600} color="text.primary">{title}</Typography>
      </Box>
      <CardContent sx={{ pt: 2 }}>{children}</CardContent>
    </Card>
  );
}

function buildForm(p: SerializedPortfolio) {
  return {
    name: p.name,
    description: p.description ?? "",
    taxIdentification: p.taxIdentification ?? "",
    country: p.country ?? "Chile",
    contact: p.contact ?? "",
    duemintCompanyId: p.duemintCompanyId ?? "",
    baName: p.bankAccount?.name ?? "",
    baBankName: p.bankAccount?.bankName ?? "",
    baAccountType: p.bankAccount?.accountType ?? "",
    baAccountNumber: p.bankAccount?.accountNumber ?? "",
    baRut: p.bankAccount?.rut ?? "",
    baReceiptEmail: p.bankAccount?.receiptEmail ?? "",
  };
}

interface Props {
  portfolio: SerializedPortfolio;
  canEdit: boolean;
}

export function PortfolioDetailClient({ portfolio, canEdit }: Props) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(() => buildForm(portfolio));

  function f(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) => setForm((prev) => ({ ...prev, [field]: e.target.value }));
  }

  function handleCancel() {
    setForm(buildForm(portfolio));
    setIsEditing(false);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const hasBankData = !!(form.baName || form.baBankName || form.baAccountNumber || form.baRut);
      const bankAccountFilled = form.baName && form.baBankName && form.baAccountType && form.baAccountNumber && form.baRut;
      if (hasBankData && !bankAccountFilled) {
        toast.error("Completa todos los campos obligatorios de la cuenta bancaria");
        return;
      }

      const res = await fetch(`/api/portfolios/${portfolio.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          description: form.description || null,
          taxIdentification: form.taxIdentification || null,
          country: form.country || null,
          contact: form.contact || null,
          duemintCompanyId: form.duemintCompanyId || null,
          bankAccount: bankAccountFilled ? {
            name: form.baName,
            bankName: form.baBankName,
            accountType: form.baAccountType,
            accountNumber: form.baAccountNumber,
            rut: form.baRut,
            receiptEmail: form.baReceiptEmail || null,
          } : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al guardar");
      toast.success("Portafolio actualizado");
      setIsEditing(false);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al guardar los cambios");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      {/* Edit / Save buttons */}
      {canEdit && (
        <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1 }}>
          {isEditing ? (
            <>
              <Button variant="text" size="small" onClick={handleCancel} disabled={saving}>Cancelar</Button>
              <Button
                variant="contained"
                size="small"
                onClick={handleSave}
                disabled={saving}
                startIcon={saving ? <CircularProgress size={14} color="inherit" /> : undefined}
              >
                {saving ? "Guardando..." : "Guardar cambios"}
              </Button>
            </>
          ) : (
            <Button variant="outlined" size="small" startIcon={<EditOutlinedIcon />} onClick={() => setIsEditing(true)}>
              Editar
            </Button>
          )}
        </Box>
      )}

      <Grid container spacing={2}>
        {/* Identificación */}
        <Grid size={{ xs: 12, md: 6 }}>
          <SectionCard icon={BusinessOutlinedIcon} title="Identificación">
            <Grid container spacing={3}>
              {isEditing ? (
                <>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField fullWidth size="small" label="Nombre" required value={form.name} onChange={f("name")} sx={inputSx} />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField fullWidth size="small" label="ID Tributario (RUT)" value={form.taxIdentification} onChange={f("taxIdentification")} placeholder="Ej: 76813402-2" sx={inputSx} />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField fullWidth size="small" label="País" value={form.country} onChange={f("country")} sx={inputSx} />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField fullWidth size="small" label="Contacto" value={form.contact} onChange={f("contact")} placeholder="Nombre o email" sx={inputSx} />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField fullWidth size="small" label="Descripción" value={form.description} onChange={f("description")} sx={inputSx} />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField fullWidth size="small" label="Duemint Company ID" value={form.duemintCompanyId} onChange={f("duemintCompanyId")} placeholder="Ej: 2908" sx={inputSx} />
                  </Grid>
                </>
              ) : (
                <>
                  <Grid size={{ xs: 12, sm: 6 }}><ReadonlyField label="Nombre" value={portfolio.name} /></Grid>
                  <Grid size={{ xs: 12, sm: 6 }}><Field label="ID Tributario (RUT)" value={portfolio.taxIdentification} /></Grid>
                  <Grid size={{ xs: 12, sm: 6 }}><Field label="País" value={portfolio.country} /></Grid>
                  <Grid size={{ xs: 12, sm: 6 }}><Field label="Contacto" value={portfolio.contact} /></Grid>
                  <Grid size={{ xs: 12, sm: 6 }}><Field label="Descripción" value={portfolio.description} /></Grid>
                  <Grid size={{ xs: 12, sm: 6 }}><Field label="Duemint Company ID" value={portfolio.duemintCompanyId} /></Grid>
                </>
              )}
            </Grid>
          </SectionCard>
        </Grid>

        {/* Cuenta bancaria */}
        <Grid size={{ xs: 12, md: 6 }}>
          <SectionCard icon={AccountBalanceOutlinedIcon} title="Cuenta bancaria">
            {isEditing ? (
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField fullWidth size="small" label="Nombre titular" value={form.baName} onChange={f("baName")} placeholder="Ej: S-INVEST CHILE SPA" sx={inputSx} />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField fullWidth size="small" label="RUT" value={form.baRut} onChange={f("baRut")} placeholder="Ej: 76813402-2" sx={inputSx} />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField fullWidth size="small" label="Banco" value={form.baBankName} onChange={f("baBankName")} placeholder="Ej: Banco de Chile" sx={inputSx} />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField fullWidth size="small" label="Tipo de cuenta" value={form.baAccountType} onChange={f("baAccountType")} placeholder="Ej: Cuenta Corriente" sx={inputSx} />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField fullWidth size="small" label="Número de cuenta" value={form.baAccountNumber} onChange={f("baAccountNumber")} sx={inputSx} />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField fullWidth size="small" label="Email comprobantes" type="email" value={form.baReceiptEmail} onChange={f("baReceiptEmail")} placeholder="Ej: cobranzas@empresa.cl" sx={inputSx} />
                </Grid>
              </Grid>
            ) : portfolio.bankAccount ? (
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, sm: 6 }}><Field label="Nombre titular" value={portfolio.bankAccount.name} /></Grid>
                <Grid size={{ xs: 12, sm: 6 }}><Field label="RUT" value={portfolio.bankAccount.rut} /></Grid>
                <Grid size={{ xs: 12, sm: 6 }}><Field label="Banco" value={portfolio.bankAccount.bankName} /></Grid>
                <Grid size={{ xs: 12, sm: 6 }}><Field label="Tipo de cuenta" value={portfolio.bankAccount.accountType} /></Grid>
                <Grid size={{ xs: 12, sm: 6 }}><Field label="Número de cuenta" value={portfolio.bankAccount.accountNumber} /></Grid>
                <Grid size={{ xs: 12, sm: 6 }}><Field label="Email comprobantes" value={portfolio.bankAccount.receiptEmail} /></Grid>
              </Grid>
            ) : (
              <Typography variant="body2" color="text.secondary" fontStyle="italic" textAlign="center" py={2}>
                Sin cuenta bancaria registrada
              </Typography>
            )}
          </SectionCard>
        </Grid>
      </Grid>
    </Box>
  );
}
