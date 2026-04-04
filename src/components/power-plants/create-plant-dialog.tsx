"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import TextField from "@mui/material/TextField";
import Select from "@mui/material/Select";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import useMediaQuery from "@mui/material/useMediaQuery";
import { toast } from "@/lib/utils/toast";

interface Option { id: number; name: string }

interface Props {
  portfolios: Option[];
  customers: Option[];
  /** Pre-fixes and locks the portfolio selector */
  fixedPortfolioId?: number;
}

const emptyForm = {
  name: "",
  solcorId: "",
  capacityKw: "",
  specificYield: "",
  distributorCompany: "",
  tariffId: "",
  startDate: "",
  durationYears: "",
  status: "active",
  portfolioId: "",
  customerId: "",
  addrAddress: "",
  addrReference: "",
  addrCity: "",
  addrCounty: "",
  addrCountry: "Chile",
};

type FormErrors = Partial<Record<keyof typeof emptyForm, string>>;

export function CreatePlantDialog({ portfolios, customers, fixedPortfolioId }: Props) {
  const router = useRouter();
  const isMobile = useMediaQuery("(max-width:599px)");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ ...emptyForm, portfolioId: fixedPortfolioId ? String(fixedPortfolioId) : "" });
  const [errors, setErrors] = useState<FormErrors>({});

  const sf = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [field]: e.target.value });
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  function validate(): FormErrors {
    const e: FormErrors = {};
    if (!form.name.trim()) e.name = "El nombre es obligatorio";
    if (!form.capacityKw || parseFloat(form.capacityKw) <= 0) e.capacityKw = "Ingresa una potencia mayor a 0";
    if (!form.portfolioId) e.portfolioId = "Selecciona un portafolio";
    if (!form.customerId) e.customerId = "Selecciona un cliente";
    return e;
  }

  function handleClose() {
    setOpen(false);
    setErrors({});
    setForm({ ...emptyForm, portfolioId: fixedPortfolioId ? String(fixedPortfolioId) : "" });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const validation = validate();
    if (Object.keys(validation).length > 0) { setErrors(validation); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/power-plants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          portfolioId: parseInt(form.portfolioId),
          customerId: parseInt(form.customerId),
          capacityKw: parseFloat(form.capacityKw),
          status: form.status,
          solcorId: form.solcorId || null,
          distributorCompany: form.distributorCompany || null,
          tariffId: form.tariffId || null,
          startDate: form.startDate || null,
          durationYears: form.durationYears ? parseFloat(form.durationYears) : null,
          specificYield: form.specificYield ? parseFloat(form.specificYield) : null,
          address: (form.addrAddress || form.addrCity || form.addrCounty) ? {
            address: form.addrAddress || null,
            reference: form.addrReference || null,
            city: form.addrCity || null,
            county: form.addrCounty || null,
            country: form.addrCountry || "Chile",
          } : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al crear planta");
      toast.success("Planta creada exitosamente");
      handleClose();
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al crear planta");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Button variant="contained" size="small" startIcon={<AddOutlinedIcon />} onClick={() => setOpen(true)}>
        Nueva planta
      </Button>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth fullScreen={isMobile}>
        <form onSubmit={handleSubmit}>
          <DialogTitle sx={{ fontSize: "0.9375rem", fontWeight: 700 }}>Nueva planta solar</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ pt: 1 }}>
              {/* Identificación */}
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField fullWidth size="small" label="Nombre" value={form.name} onChange={sf("name")} error={!!errors.name} helperText={errors.name} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField fullWidth size="small" label="ID Solcor" value={form.solcorId} onChange={sf("solcorId")} placeholder="Ej: SOL-001" />
              </Grid>

              {/* Técnico */}
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField fullWidth size="small" label="Potencia (kWp)" type="number" inputProps={{ step: "0.1", min: 0 }} value={form.capacityKw} onChange={sf("capacityKw")} error={!!errors.capacityKw} helperText={errors.capacityKw} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField fullWidth size="small" label="Rendimiento (kWh/kWp)" type="number" inputProps={{ step: "0.01", min: 0 }} value={form.specificYield} onChange={sf("specificYield")} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField fullWidth size="small" label="Distribuidora" value={form.distributorCompany} onChange={sf("distributorCompany")} placeholder="Ej: Enel" />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField fullWidth size="small" label="ID Tarifa" value={form.tariffId} onChange={sf("tariffId")} placeholder="Ej: BT1" />
              </Grid>

              {/* Contrato */}
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField fullWidth size="small" label="Fecha inicio (F6)" type="date" value={form.startDate} onChange={sf("startDate")} slotProps={{ inputLabel: { shrink: true } }} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField fullWidth size="small" label="Duración (años)" type="number" inputProps={{ min: 1, max: 50 }} value={form.durationYears} onChange={sf("durationYears")} />
              </Grid>

              {/* Estado / Portfolio / Cliente */}
              <Grid size={12}>
                <FormControl fullWidth size="small" required>
                  <InputLabel>Estado</InputLabel>
                  <Select label="Estado" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                    <MenuItem value="active">Activa</MenuItem>
                    <MenuItem value="maintenance">En mantenimiento</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth size="small" error={!!errors.portfolioId}>
                  <InputLabel>Portafolio</InputLabel>
                  <Select
                    label="Portafolio"
                    value={form.portfolioId}
                    onChange={(e) => { if (!fixedPortfolioId) { setForm({ ...form, portfolioId: e.target.value }); setErrors((prev) => ({ ...prev, portfolioId: undefined })); } }}
                    inputProps={fixedPortfolioId ? { readOnly: true } : {}}
                  >
                    {portfolios.map((p) => <MenuItem key={p.id} value={String(p.id)}>{p.name}</MenuItem>)}
                  </Select>
                  {errors.portfolioId && <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.75 }}>{errors.portfolioId}</Typography>}
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth size="small" error={!!errors.customerId}>
                  <InputLabel>Cliente</InputLabel>
                  <Select label="Cliente" value={form.customerId} onChange={(e) => { setForm({ ...form, customerId: e.target.value }); setErrors((prev) => ({ ...prev, customerId: undefined })); }}>
                    {customers.map((c) => <MenuItem key={c.id} value={String(c.id)}>{c.name}</MenuItem>)}
                  </Select>
                  {errors.customerId && <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.75 }}>{errors.customerId}</Typography>}
                </FormControl>
              </Grid>

              {/* Dirección */}
              <Grid size={12}>
                <Divider sx={{ my: 0.5 }} />
                <Typography variant="overline" color="text.secondary">Dirección</Typography>
              </Grid>
              <Grid size={12}>
                <TextField fullWidth size="small" label="Dirección" value={form.addrAddress} onChange={sf("addrAddress")} placeholder="Ej: Av. El Sol 1234" />
              </Grid>
              <Grid size={12}>
                <TextField fullWidth size="small" label="Referencia" value={form.addrReference} onChange={sf("addrReference")} placeholder="Ej: Frente al galpón principal" />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField fullWidth size="small" label="Comuna" value={form.addrCity} onChange={sf("addrCity")} placeholder="Ej: Rancagua" />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField fullWidth size="small" label="Región" value={form.addrCounty} onChange={sf("addrCounty")} />
              </Grid>
              <Grid size={12}>
                <TextField fullWidth size="small" label="País" value={form.addrCountry} onChange={sf("addrCountry")} />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
            <Button variant="outlined" color="inherit" size="small" onClick={handleClose} sx={{ borderColor: "#c3c6d7" }}>Cancelar</Button>
            <Button variant="contained" size="small" type="submit" disabled={loading}>{loading ? "Creando..." : "Crear planta"}</Button>
          </DialogActions>
        </form>
      </Dialog>
    </>
  );
}
