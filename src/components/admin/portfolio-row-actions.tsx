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
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import MoreHorizOutlinedIcon from "@mui/icons-material/MoreHorizOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import { toast } from "@/lib/utils/toast";

const inputSx = { "& .MuiOutlinedInput-root": { backgroundColor: "#eff4ff", "& fieldset": { borderColor: "transparent" }, "&:hover fieldset": { borderColor: "transparent" }, "&.Mui-focused fieldset": { borderColor: "#004ac6", borderWidth: 2 } } };

interface Portfolio { id: number; name: string; description: string | null; duemintCompanyId: string | null }

export function PortfolioRowActions({ portfolio }: { portfolio: Portfolio }) {
  const router = useRouter();
  const [anchor, setAnchor] = useState<null | HTMLElement>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: portfolio.name,
    description: portfolio.description ?? "",
    duemintCompanyId: portfolio.duemintCompanyId ?? "",
  });

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`/api/portfolios/${portfolio.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.name, description: form.description || null, duemintCompanyId: form.duemintCompanyId || null }),
      });
      if (!res.ok) { const data = await res.json(); throw new Error(data.error || "Error al actualizar portafolio"); }
      toast.success("Portafolio actualizado");
      setEditOpen(false);
      router.refresh();
    } catch {
      toast.error("Error al actualizar portafolio");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    const res = await fetch(`/api/portfolios/${portfolio.id}`, { method: "DELETE" });
    if (!res.ok) throw new Error();
    toast.success("Portafolio eliminado");
    setDeleteOpen(false);
    router.refresh();
  }

  return (
    <>
      <IconButton size="small" onClick={(e) => setAnchor(e.currentTarget)} aria-label={`Acciones para ${portfolio.name}`}>
        <MoreHorizOutlinedIcon sx={{ fontSize: 18 }} />
      </IconButton>
      <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)} anchorOrigin={{ vertical: "bottom", horizontal: "right" }} transformOrigin={{ vertical: "top", horizontal: "right" }}>
        <MenuItem dense onClick={() => { setAnchor(null); setEditOpen(true); }}>
          <ListItemIcon><EditOutlinedIcon sx={{ fontSize: 16 }} /></ListItemIcon>
          <ListItemText primaryTypographyProps={{ fontSize: "0.8125rem" }}>Editar</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem dense onClick={() => { setAnchor(null); setDeleteOpen(true); }} sx={{ color: "error.main" }}>
          <ListItemIcon><DeleteOutlinedIcon sx={{ fontSize: 16, color: "error.main" }} /></ListItemIcon>
          <ListItemText primaryTypographyProps={{ fontSize: "0.8125rem" }}>Eliminar</ListItemText>
        </MenuItem>
      </Menu>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontSize: "0.9375rem", fontWeight: 700, pb: 1 }}>Editar Portafolio</DialogTitle>
        <Box component="form" onSubmit={handleEdit}>
          <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
            <TextField label="Nombre" size="small" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} sx={inputSx} />
            <TextField label="Descripción" size="small" multiline rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} sx={inputSx} />
            <TextField label="Duemint Company ID" size="small" value={form.duemintCompanyId} onChange={(e) => setForm({ ...form, duemintCompanyId: e.target.value })} placeholder="ej: 2908" sx={inputSx} />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
            <Button variant="outlined" color="inherit" size="small" onClick={() => setEditOpen(false)} sx={{ borderColor: "#c3c6d7" }}>Cancelar</Button>
            <Button type="submit" variant="contained" size="small" disabled={loading}>{loading ? "Guardando..." : "Guardar"}</Button>
          </DialogActions>
        </Box>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontSize: "0.9375rem", fontWeight: 700 }}>Eliminar portafolio</DialogTitle>
        <DialogContent>
          <Typography fontSize="0.875rem" color="text.secondary">
            ¿Eliminar <Box component="span" fontWeight={600} color="text.primary">&quot;{portfolio.name}&quot;</Box>? Esta acción no se puede deshacer.
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
