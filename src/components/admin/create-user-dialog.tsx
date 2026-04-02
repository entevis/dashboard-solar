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
import Box from "@mui/material/Box";
import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import { toast } from "sonner";

const inputSx = { "& .MuiOutlinedInput-root": { backgroundColor: "#eff4ff", "& fieldset": { borderColor: "transparent" }, "&:hover fieldset": { borderColor: "transparent" }, "&.Mui-focused fieldset": { borderColor: "#004ac6", borderWidth: 2 } } };

interface Customer { id: number; name: string; rut: string }
interface Portfolio { id: number; name: string }

interface Props {
  customers: Customer[];
  portfolios: Portfolio[];
}

export function CreateUserDialog({ customers, portfolios }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState("");
  const [form, setForm] = useState({ name: "", email: "", password: "", customerId: "", assignedPortfolioId: "" });

  const showCustomer = role === "CLIENTE" || role === "CLIENTE_PERFILADO";
  const showPortfolio = role === "OPERATIVO";

  function handleClose() {
    setOpen(false);
    setRole("");
    setForm({ name: "", email: "", password: "", customerId: "", assignedPortfolioId: "" });
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
        password: form.password,
        role,
        customerId: form.customerId || undefined,
        assignedPortfolioId: form.assignedPortfolioId || undefined,
      }),
    });
    if (!res.ok) {
      const data = await res.json();
      toast.error(data.error || "Error al crear usuario");
      setLoading(false);
      return;
    }
    toast.success("Usuario creado correctamente");
    handleClose();
    setLoading(false);
    router.refresh();
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
            <TextField label="Nombre" size="small" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nombre completo" sx={inputSx} />
            <TextField label="Correo electrónico" type="email" size="small" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="correo@empresa.cl" sx={inputSx} />
            <TextField label="Contraseña" type="password" size="small" required inputProps={{ minLength: 6 }} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Mínimo 6 caracteres" sx={inputSx} />
            <FormControl size="small" required sx={inputSx}>
              <InputLabel>Rol</InputLabel>
              <Select label="Rol" value={role} onChange={(e) => { setRole(e.target.value); setForm((f) => ({ ...f, customerId: "", assignedPortfolioId: "" })); }}>
                <MenuItem value="MAESTRO">Maestro</MenuItem>
                <MenuItem value="OPERATIVO">Operativo</MenuItem>
                <MenuItem value="CLIENTE">Cliente</MenuItem>
                <MenuItem value="CLIENTE_PERFILADO">Cliente Perfilado</MenuItem>
              </Select>
            </FormControl>
            {showCustomer && (
              <FormControl size="small" required sx={inputSx}>
                <InputLabel>Cliente</InputLabel>
                <Select label="Cliente" value={form.customerId} onChange={(e) => setForm({ ...form, customerId: e.target.value })}>
                  {customers.map((c) => <MenuItem key={c.id} value={String(c.id)}>{c.name} ({c.rut})</MenuItem>)}
                </Select>
              </FormControl>
            )}
            {showPortfolio && (
              <FormControl size="small" required sx={inputSx}>
                <InputLabel>Portafolio asignado</InputLabel>
                <Select label="Portafolio asignado" value={form.assignedPortfolioId} onChange={(e) => setForm({ ...form, assignedPortfolioId: e.target.value })}>
                  {portfolios.map((p) => <MenuItem key={p.id} value={String(p.id)}>{p.name}</MenuItem>)}
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
