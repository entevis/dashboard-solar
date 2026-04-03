"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import TextField from "@mui/material/TextField";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import { toast } from "@/lib/utils/toast";

const inputSx = { "& .MuiOutlinedInput-root": { backgroundColor: "#eff4ff", "& fieldset": { borderColor: "transparent" }, "&:hover fieldset": { borderColor: "transparent" }, "&.Mui-focused fieldset": { borderColor: "#004ac6", borderWidth: 2 } } };

const emptyForm = {
  name: "",
  description: "",
  taxIdentification: "",
  country: "Chile",
  contact: "",
  baName: "",
  baBankName: "",
  baAccountType: "",
  baAccountNumber: "",
  baRut: "",
  baReceiptEmail: "",
};

export function CreatePortfolioDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState(emptyForm);

  function f(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [field]: e.target.value });
  }

  function handleClose() {
    setOpen(false);
    setForm(emptyForm);
  }

  const hasBankData = !!(form.baName || form.baBankName || form.baAccountNumber || form.baRut);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name) { toast.error("El nombre es obligatorio"); return; }

    const bankAccountFilled = form.baName && form.baBankName && form.baAccountType && form.baAccountNumber && form.baRut;
    if (hasBankData && !bankAccountFilled) {
      toast.error("Completa todos los campos obligatorios de la cuenta bancaria");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/portfolios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          description: form.description || null,
          taxIdentification: form.taxIdentification || null,
          country: form.country || null,
          contact: form.contact || null,
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
      if (!res.ok) {
        const err = await res.json();
        throw new Error(typeof err.error === "string" ? err.error : "Error al crear portafolio");
      }
      toast.success("Portafolio creado exitosamente");
      handleClose();
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al crear portafolio");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Button variant="contained" size="small" startIcon={<AddOutlinedIcon />} onClick={() => setOpen(true)}>
        Nuevo portafolio
      </Button>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontSize: "0.9375rem", fontWeight: 700, pb: 1 }}>Crear portafolio</DialogTitle>
        <Box component="form" onSubmit={handleSubmit}>
          <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
            {/* Portafolio */}
            <TextField label="Nombre" size="small" required value={form.name} onChange={f("name")} placeholder="Nombre del portafolio" sx={inputSx} />
            <TextField label="Descripción" size="small" multiline rows={2} value={form.description} onChange={f("description")} placeholder="Descripción opcional" sx={inputSx} />
            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
              <TextField label="ID Tributario (RUT)" size="small" value={form.taxIdentification} onChange={f("taxIdentification")} placeholder="Ej: 76813402-2" sx={inputSx} />
              <TextField label="País" size="small" value={form.country} onChange={f("country")} sx={inputSx} />
            </Box>
            <TextField label="Contacto" size="small" value={form.contact} onChange={f("contact")} placeholder="Nombre o email del contacto" sx={inputSx} />

            {/* Cuenta bancaria */}
            <Box sx={{ pt: 0.5 }}>
              <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ display: "block", mb: 1.5, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Cuenta bancaria
              </Typography>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
                  <TextField label="Nombre titular" size="small" required={hasBankData} value={form.baName} onChange={f("baName")} placeholder="Ej: S-INVEST CHILE SPA" sx={inputSx} />
                  <TextField label="RUT" size="small" required={hasBankData} value={form.baRut} onChange={f("baRut")} placeholder="Ej: 76813402-2" sx={inputSx} />
                </Box>
                <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
                  <TextField label="Banco" size="small" required={hasBankData} value={form.baBankName} onChange={f("baBankName")} placeholder="Ej: Banco de Chile" sx={inputSx} />
                  <TextField label="Tipo de cuenta" size="small" required={hasBankData} value={form.baAccountType} onChange={f("baAccountType")} placeholder="Ej: Cuenta Corriente" sx={inputSx} />
                </Box>
                <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
                  <TextField label="Número de cuenta" size="small" required={hasBankData} value={form.baAccountNumber} onChange={f("baAccountNumber")} placeholder="Ej: 1594154504" sx={inputSx} />
                  <TextField label="Email comprobantes" size="small" type="email" value={form.baReceiptEmail} onChange={f("baReceiptEmail")} placeholder="Ej: cobranzas@empresa.cl" sx={inputSx} />
                </Box>
              </Box>
            </Box>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
            <Button variant="outlined" color="inherit" size="small" onClick={handleClose} sx={{ borderColor: "#c3c6d7" }}>Cancelar</Button>
            <Button type="submit" variant="contained" size="small" disabled={loading}>{loading ? "Creando..." : "Crear portafolio"}</Button>
          </DialogActions>
        </Box>
      </Dialog>
    </>
  );
}
