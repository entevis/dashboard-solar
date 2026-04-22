"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import TextField from "@mui/material/TextField";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import Checkbox from "@mui/material/Checkbox";
import ListItemText from "@mui/material/ListItemText";
import OutlinedInput from "@mui/material/OutlinedInput";
import Box from "@mui/material/Box";
import Alert from "@mui/material/Alert";
import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import { toast } from "@/lib/utils/toast";
import { SearchableSelect } from "@/components/ui/searchable-select";

const inputSx = { "& .MuiOutlinedInput-root": { backgroundColor: "#eff4ff", "& fieldset": { borderColor: "transparent" }, "&:hover fieldset": { borderColor: "transparent" }, "&.Mui-focused fieldset": { borderColor: "#004ac6", borderWidth: 2 } } };

interface Customer { id: number; name: string; rut: string }
interface Portfolio { id: number; name: string }
interface Plant { id: number; name: string; customerId: number }

interface Props {
  customers: Customer[];
  portfolios: Portfolio[];
  plants: Plant[];
}

export function CreateUserDialog({ customers, portfolios, plants }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState("");
  const [form, setForm] = useState({ name: "", email: "", customerId: "", assignedPortfolioId: "" });
  const [portfolioIds, setPortfolioIds] = useState<string[]>([]);
  const [plantIds, setPlantIds] = useState<string[]>([]);

  const showCustomer = role === "CLIENTE" || role === "CLIENTE_PERFILADO";
  const showPortfolio = role === "OPERATIVO";
  const showPortfolioMulti = role === "TECNICO";
  const showPlantMulti = role === "CLIENTE_PERFILADO" && !!form.customerId;
  const customerPlants = form.customerId
    ? plants.filter((p) => p.customerId === Number(form.customerId))
    : [];

  function handleClose() {
    setOpen(false);
    setRole("");
    setPortfolioIds([]);
    setPlantIds([]);
    setForm({ name: "", email: "", customerId: "", assignedPortfolioId: "" });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/users/invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        email: form.email,
        role,
        customerId: form.customerId || undefined,
        assignedPortfolioId: form.assignedPortfolioId || undefined,
        portfolioIds: role === "TECNICO" ? portfolioIds.map(Number) : undefined,
        plantIds: role === "CLIENTE_PERFILADO" ? plantIds.map(Number) : undefined,
      }),
    });
    if (!res.ok) {
      const data = await res.json();
      toast.error(data.error || "Error al crear usuario");
      setLoading(false);
      return;
    }
    const data = await res.json();
    if (data.emailSent) {
      toast.success(`Invitación enviada a ${form.email}`);
    } else {
      toast.success("Usuario creado. No se pudo enviar el correo de invitación.");
    }
    setLoading(false);
    router.refresh();
    handleClose();
  }

  return (
    <>
      <Button variant="contained" size="small" startIcon={<AddOutlinedIcon />} onClick={() => setOpen(true)}>
        Nuevo usuario
      </Button>

      <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontSize: "0.9375rem", fontWeight: 700, pb: 1 }}>Crear usuario</DialogTitle>
        <Box component="form" onSubmit={handleSubmit}>
          <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
            <Alert severity="info" sx={{ fontSize: "0.75rem", py: 0.5 }}>
              Se enviará un correo de invitación para que el usuario active su cuenta y defina su contraseña.
            </Alert>
            <TextField label="Nombre" size="small" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nombre completo" sx={inputSx} />
            <TextField label="Correo electrónico" type="email" size="small" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="correo@empresa.cl" sx={inputSx} />
            <FormControl size="small" required sx={inputSx}>
              <InputLabel>Rol</InputLabel>
              <Select label="Rol" value={role} onChange={(e) => { setRole(e.target.value); setPortfolioIds([]); setPlantIds([]); setForm((f) => ({ ...f, customerId: "", assignedPortfolioId: "" })); }}>
                <MenuItem value="MAESTRO">Maestro</MenuItem>
                <MenuItem value="CLIENTE">Cliente</MenuItem>
                <MenuItem value="CLIENTE_PERFILADO">Cliente Perfilado</MenuItem>
              </Select>
            </FormControl>
            {showCustomer && (
              <SearchableSelect
                label="Cliente"
                required
                options={customers.map((c) => ({ id: c.id, name: c.name, secondary: c.rut }))}
                value={form.customerId}
                onChange={(v) => { setForm({ ...form, customerId: v }); setPlantIds([]); }}
              />
            )}
            {showPlantMulti && (
              <FormControl size="small" required sx={inputSx}>
                <InputLabel>Plantas visibles</InputLabel>
                <Select
                  multiple
                  label="Plantas visibles"
                  value={plantIds}
                  onChange={(e) => setPlantIds(typeof e.target.value === "string" ? e.target.value.split(",") : e.target.value as string[])}
                  input={<OutlinedInput label="Plantas visibles" />}
                  renderValue={(selected) => customerPlants.filter((p) => (selected as string[]).includes(String(p.id))).map((p) => p.name).join(", ")}
                >
                  {customerPlants.length === 0 ? (
                    <MenuItem disabled dense>
                      <ListItemText primary="Este cliente no tiene plantas" primaryTypographyProps={{ fontSize: "0.8125rem", color: "text.secondary" }} />
                    </MenuItem>
                  ) : (
                    customerPlants.map((p) => (
                      <MenuItem key={p.id} value={String(p.id)} dense>
                        <Checkbox checked={plantIds.includes(String(p.id))} size="small" sx={{ py: 0 }} />
                        <ListItemText primary={p.name} primaryTypographyProps={{ fontSize: "0.8125rem" }} />
                      </MenuItem>
                    ))
                  )}
                </Select>
              </FormControl>
            )}
            {showPortfolio && (
              <SearchableSelect
                label="Portafolio asignado"
                required
                options={portfolios.map((p) => ({ id: p.id, name: p.name }))}
                value={form.assignedPortfolioId}
                onChange={(v) => setForm({ ...form, assignedPortfolioId: v })}
              />
            )}
            {showPortfolioMulti && (
              <FormControl size="small" required sx={inputSx}>
                <InputLabel>Portafolios</InputLabel>
                <Select
                  multiple
                  label="Portafolios"
                  value={portfolioIds}
                  onChange={(e) => setPortfolioIds(typeof e.target.value === "string" ? e.target.value.split(",") : e.target.value as string[])}
                  input={<OutlinedInput label="Portafolios" />}
                  renderValue={(selected) => portfolios.filter((p) => (selected as string[]).includes(String(p.id))).map((p) => p.name).join(", ")}
                >
                  {portfolios.map((p) => (
                    <MenuItem key={p.id} value={String(p.id)} dense>
                      <Checkbox checked={portfolioIds.includes(String(p.id))} size="small" sx={{ py: 0 }} />
                      <ListItemText primary={p.name} primaryTypographyProps={{ fontSize: "0.8125rem" }} />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
            <Button variant="outlined" color="inherit" size="small" onClick={handleClose} sx={{ borderColor: "#c3c6d7" }}>Cancelar</Button>
            <Button type="submit" variant="contained" size="small" disabled={loading || !role}>{loading ? "Creando..." : "Crear usuario"}</Button>
          </DialogActions>
        </Box>
      </Dialog>
    </>
  );
}
