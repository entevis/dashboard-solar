"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import DialogContentText from "@mui/material/DialogContentText";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Select from "@mui/material/Select";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { toast } from "sonner";

interface PlantAddress {
  address: string | null;
  reference: string | null;
  city: string | null;
  county: string | null;
  country: string | null;
}

interface Plant {
  id: number;
  name: string;
  location: string | null;
  city: string | null;
  capacityKw: number;
  status: string;
  portfolioId: number;
  customerId: number;
  solcorId: string | null;
  distributorCompany: string | null;
  tariffId: string | null;
  startDate: Date | null;
  durationYears: number | null;
  specificYield: number | null;
  address: PlantAddress | null;
}

interface Option { id: number; name: string }

interface Props {
  plant: Plant;
  portfolios: Option[];
  customers: Option[];
}

function toDateInputValue(date: Date | null): string {
  if (!date) return "";
  return new Date(date).toISOString().split("T")[0];
}

export function PlantRowActions({ plant, portfolios, customers }: Props) {
  const router = useRouter();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: plant.name,
    city: plant.city ?? "",
    location: plant.location ?? "",
    capacityKw: String(plant.capacityKw),
    status: plant.status,
    portfolioId: String(plant.portfolioId),
    customerId: String(plant.customerId),
    solcorId: plant.solcorId ?? "",
    distributorCompany: plant.distributorCompany ?? "",
    tariffId: plant.tariffId ?? "",
    startDate: toDateInputValue(plant.startDate),
    durationYears: plant.durationYears != null ? String(plant.durationYears) : "",
    specificYield: plant.specificYield != null ? String(plant.specificYield) : "",
    addrAddress: plant.address?.address ?? "",
    addrReference: plant.address?.reference ?? "",
    addrCity: plant.address?.city ?? "",
    addrCounty: plant.address?.county ?? "",
    addrCountry: plant.address?.country ?? "Chile",
  });

  const sf = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [field]: e.target.value });

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`/api/power-plants/${plant.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          city: form.city || null,
          location: form.location || null,
          capacityKw: parseFloat(form.capacityKw),
          status: form.status,
          portfolioId: form.portfolioId,
          customerId: form.customerId,
          solcorId: form.solcorId || null,
          distributorCompany: form.distributorCompany || null,
          tariffId: form.tariffId || null,
          startDate: form.startDate || null,
          durationYears: form.durationYears ? parseInt(form.durationYears) : null,
          specificYield: form.specificYield ? parseFloat(form.specificYield) : null,
          address: {
            address: form.addrAddress || null,
            reference: form.addrReference || null,
            city: form.addrCity || null,
            county: form.addrCounty || null,
            country: form.addrCountry || "Chile",
          },
        }),
      });
      if (!res.ok) throw new Error();
      toast.success("Planta actualizada");
      setEditOpen(false);
      router.refresh();
    } catch {
      toast.error("Error al actualizar planta");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    const res = await fetch(`/api/power-plants/${plant.id}`, { method: "DELETE" });
    if (!res.ok) throw new Error();
    toast.success("Planta eliminada");
    router.refresh();
  }

  return (
    <>
      <IconButton
        size="small"
        aria-label={`Acciones para ${plant.name}`}
        onClick={(e) => setAnchorEl(e.currentTarget)}
        sx={{ color: "text.secondary" }}
      >
        <MoreVertIcon fontSize="small" />
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        slotProps={{ paper: { sx: { minWidth: 160 } } }}
      >
        <MenuItem onClick={() => { setAnchorEl(null); setEditOpen(true); }}>
          <EditOutlinedIcon fontSize="small" sx={{ mr: 1.5, color: "text.secondary" }} />
          Editar
        </MenuItem>
        <MenuItem
          onClick={() => { setAnchorEl(null); setDeleteOpen(true); }}
          sx={{ color: "error.main" }}
        >
          <DeleteOutlineIcon fontSize="small" sx={{ mr: 1.5 }} />
          Eliminar
        </MenuItem>
      </Menu>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="sm" fullWidth>
        <form onSubmit={handleEdit}>
          <DialogTitle>Editar Planta</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ pt: 1 }}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField fullWidth size="small" label="Nombre *" value={form.name} onChange={sf("name")} required />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField fullWidth size="small" label="ID Solcor" value={form.solcorId} onChange={sf("solcorId")} placeholder="Ej: SOL-001" />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField fullWidth size="small" label="Comuna" value={form.city} onChange={sf("city")} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField fullWidth size="small" label="Región / Ubicación" value={form.location} onChange={sf("location")} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField fullWidth size="small" label="Distribuidora" value={form.distributorCompany} onChange={sf("distributorCompany")} placeholder="Ej: Enel" />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField fullWidth size="small" label="ID Tarifa" value={form.tariffId} onChange={sf("tariffId")} placeholder="Ej: BT1" />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField fullWidth size="small" label="Potencia (kWp) *" type="number" inputProps={{ step: "0.1", min: 0 }} value={form.capacityKw} onChange={sf("capacityKw")} required />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField fullWidth size="small" label="Rendimiento (kWh/kWp)" type="number" inputProps={{ step: "0.01", min: 0 }} value={form.specificYield} onChange={sf("specificYield")} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField fullWidth size="small" label="Fecha Inicio (F6)" type="date" value={form.startDate} onChange={sf("startDate")} slotProps={{ inputLabel: { shrink: true } }} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField fullWidth size="small" label="Duración (Años)" type="number" inputProps={{ min: 1, max: 50 }} value={form.durationYears} onChange={sf("durationYears")} />
              </Grid>
              <Grid size={12}>
                <FormControl fullWidth size="small">
                  <InputLabel>Estado *</InputLabel>
                  <Select label="Estado *" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                    <MenuItem value="active">Activa</MenuItem>
                    <MenuItem value="maintenance">Mantenimiento</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Portafolio *</InputLabel>
                  <Select label="Portafolio *" value={form.portfolioId} onChange={(e) => setForm({ ...form, portfolioId: e.target.value })}>
                    {portfolios.map((p) => <MenuItem key={p.id} value={String(p.id)}>{p.name}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Cliente *</InputLabel>
                  <Select label="Cliente *" value={form.customerId} onChange={(e) => setForm({ ...form, customerId: e.target.value })}>
                    {customers.map((c) => <MenuItem key={c.id} value={String(c.id)}>{c.name}</MenuItem>)}
                  </Select>
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
          <DialogActions sx={{ px: 3, pb: 2.5 }}>
            <Button variant="text" onClick={() => setEditOpen(false)}>Cancelar</Button>
            <Button variant="contained" type="submit" disabled={loading}>
              {loading ? "Guardando..." : "Guardar"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Eliminar planta</DialogTitle>
        <DialogContent>
          <DialogContentText>
            ¿Eliminar <strong>{plant.name}</strong>? Esta acción no se puede deshacer.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button variant="text" onClick={() => setDeleteOpen(false)}>Cancelar</Button>
          <Button
            variant="contained"
            color="error"
            onClick={async () => {
              try {
                await handleDelete();
                setDeleteOpen(false);
              } catch {
                toast.error("Error al eliminar la planta");
              }
            }}
          >
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
