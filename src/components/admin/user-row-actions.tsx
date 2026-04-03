"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Divider from "@mui/material/Divider";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import MuiMenuItem from "@mui/material/MenuItem";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import MoreHorizOutlinedIcon from "@mui/icons-material/MoreHorizOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import { ROLE_LABELS } from "@/lib/auth/roles";
import { toast } from "@/lib/utils/toast";
import type { UserRole } from "@prisma/client";

const inputSx = { "& .MuiOutlinedInput-root": { backgroundColor: "#eff4ff", "& fieldset": { borderColor: "transparent" }, "&:hover fieldset": { borderColor: "transparent" }, "&.Mui-focused fieldset": { borderColor: "#004ac6", borderWidth: 2 } } };

interface User { id: number; name: string; email: string; role: UserRole; customerId: number | null; assignedPortfolioId: number | null }
interface Option { id: number; name: string }
interface Props { user: User; customers: Option[]; portfolios: Option[]; currentUserId: number }

const ROLES: UserRole[] = ["MAESTRO", "OPERATIVO", "CLIENTE", "CLIENTE_PERFILADO"];

export function UserRowActions({ user, customers, portfolios, currentUserId }: Props) {
  const router = useRouter();
  const [anchor, setAnchor] = useState<null | HTMLElement>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: user.name,
    role: user.role as string,
    customerId: user.customerId ? String(user.customerId) : "",
    assignedPortfolioId: user.assignedPortfolioId ? String(user.assignedPortfolioId) : "",
  });

  const isSelf = user.id === currentUserId;

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.name, role: form.role, customerId: form.customerId || null, assignedPortfolioId: form.assignedPortfolioId || null }),
      });
      if (!res.ok) { const data = await res.json(); throw new Error(data.error || "Error al actualizar usuario"); }
      toast.success("Usuario actualizado");
      setEditOpen(false);
      router.refresh();
    } catch {
      toast.error("Error al actualizar usuario");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    const res = await fetch(`/api/users/${user.id}`, { method: "DELETE" });
    if (!res.ok) { const err = await res.json(); throw new Error(err.error); }
    toast.success("Usuario eliminado");
    setDeleteOpen(false);
    router.refresh();
  }

  return (
    <>
      <IconButton size="small" onClick={(e) => setAnchor(e.currentTarget)} aria-label={`Acciones para ${user.name}`}>
        <MoreHorizOutlinedIcon sx={{ fontSize: 18 }} />
      </IconButton>
      <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)} anchorOrigin={{ vertical: "bottom", horizontal: "right" }} transformOrigin={{ vertical: "top", horizontal: "right" }}>
        <MenuItem dense onClick={() => { setAnchor(null); setEditOpen(true); }}>
          <ListItemIcon><EditOutlinedIcon sx={{ fontSize: 16 }} /></ListItemIcon>
          <ListItemText primaryTypographyProps={{ fontSize: "0.8125rem" }}>Editar</ListItemText>
        </MenuItem>
        {!isSelf && [
          <Divider key="div" />,
          <MenuItem key="del" dense onClick={() => { setAnchor(null); setDeleteOpen(true); }} sx={{ color: "error.main" }}>
            <ListItemIcon><DeleteOutlinedIcon sx={{ fontSize: 16, color: "error.main" }} /></ListItemIcon>
            <ListItemText primaryTypographyProps={{ fontSize: "0.8125rem" }}>Eliminar</ListItemText>
          </MenuItem>,
        ]}
      </Menu>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontSize: "0.9375rem", fontWeight: 700, pb: 1 }}>Editar Usuario</DialogTitle>
        <Box component="form" onSubmit={handleEdit}>
          <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
            <TextField label="Nombre" size="small" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} sx={inputSx} />
            <TextField label="Email" size="small" value={user.email} disabled sx={inputSx} />
            <FormControl size="small" required sx={inputSx}>
              <InputLabel>Rol</InputLabel>
              <Select label="Rol" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value, customerId: "", assignedPortfolioId: "" })}>
                {ROLES.map((r) => <MuiMenuItem key={r} value={r}>{ROLE_LABELS[r]}</MuiMenuItem>)}
              </Select>
            </FormControl>
            {(form.role === "CLIENTE" || form.role === "CLIENTE_PERFILADO") && (
              <FormControl size="small" sx={inputSx}>
                <InputLabel>Cliente</InputLabel>
                <Select label="Cliente" value={form.customerId} onChange={(e) => setForm({ ...form, customerId: e.target.value })}>
                  {customers.map((c) => <MuiMenuItem key={c.id} value={String(c.id)}>{c.name}</MuiMenuItem>)}
                </Select>
              </FormControl>
            )}
            {form.role === "OPERATIVO" && (
              <FormControl size="small" sx={inputSx}>
                <InputLabel>Portafolio asignado</InputLabel>
                <Select label="Portafolio asignado" value={form.assignedPortfolioId} onChange={(e) => setForm({ ...form, assignedPortfolioId: e.target.value })}>
                  {portfolios.map((p) => <MuiMenuItem key={p.id} value={String(p.id)}>{p.name}</MuiMenuItem>)}
                </Select>
              </FormControl>
            )}
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
            <Button variant="outlined" color="inherit" size="small" onClick={() => setEditOpen(false)} sx={{ borderColor: "#c3c6d7" }}>Cancelar</Button>
            <Button type="submit" variant="contained" size="small" disabled={loading}>{loading ? "Guardando..." : "Guardar"}</Button>
          </DialogActions>
        </Box>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontSize: "0.9375rem", fontWeight: 700 }}>Eliminar usuario</DialogTitle>
        <DialogContent>
          <Typography fontSize="0.875rem" color="text.secondary">
            ¿Eliminar a <Box component="span" fontWeight={600} color="text.primary">&quot;{user.name}&quot;</Box>? Perderá acceso al sistema.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button variant="contained" color="error" size="small" onClick={handleDelete}>Eliminar</Button>
          <Button variant="outlined" color="inherit" size="small" onClick={() => setDeleteOpen(false)} sx={{ borderColor: "#c3c6d7" }}>Cancelar</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
