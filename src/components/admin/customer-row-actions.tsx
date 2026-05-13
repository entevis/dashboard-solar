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
import MoreVertOutlinedIcon from "@mui/icons-material/MoreVertOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import GroupOutlinedIcon from "@mui/icons-material/GroupOutlined";
import { CustomerContactsSheet } from "@/components/admin/customer-contacts-sheet";
import { normalizeRut } from "@/lib/utils/formatters";
import { toast } from "@/lib/utils/toast";

const inputSx = { "& .MuiOutlinedInput-root": { backgroundColor: "#eff4ff", "& fieldset": { borderColor: "transparent" }, "&:hover fieldset": { borderColor: "transparent" }, "&.Mui-focused fieldset": { borderColor: "#004ac6", borderWidth: 2 } } };

interface Customer { id: number; name: string; rut: string; altName: string | null }

export function CustomerRowActions({ customer }: { customer: Customer }) {
  const router = useRouter();
  const [anchor, setAnchor] = useState<null | HTMLElement>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [contactsOpen, setContactsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: customer.name, rut: customer.rut, altName: customer.altName ?? "" });

  function handleRutChange(raw: string) {
    const digits = raw.replace(/[^0-9kK]/g, "");
    const formatted = digits.length > 1 ? normalizeRut(digits) : digits;
    setForm((prev) => ({ ...prev, rut: formatted }));
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`/api/customers/${customer.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.name, rut: form.rut, altName: form.altName || null }),
      });
      if (!res.ok) { const data = await res.json(); throw new Error(data.error || "Error al actualizar cliente"); }
      toast.success("Cliente actualizado");
      setEditOpen(false);
      router.refresh();
    } catch {
      toast.error("Error al actualizar cliente");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    const res = await fetch(`/api/customers/${customer.id}`, { method: "DELETE" });
    if (!res.ok) throw new Error();
    toast.success("Cliente eliminado");
    setDeleteOpen(false);
    router.refresh();
  }

  return (
    <>
      <IconButton size="small" onClick={(e) => setAnchor(e.currentTarget)} aria-label={`Acciones para ${customer.name}`}>
        <MoreVertOutlinedIcon sx={{ fontSize: 18 }} />
      </IconButton>
      <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)} anchorOrigin={{ vertical: "bottom", horizontal: "right" }} transformOrigin={{ vertical: "top", horizontal: "right" }}>
        <MenuItem dense onClick={() => { setAnchor(null); setContactsOpen(true); }}>
          <ListItemIcon><GroupOutlinedIcon sx={{ fontSize: 16 }} /></ListItemIcon>
          <ListItemText primaryTypographyProps={{ fontSize: "0.8125rem" }}>Contactos</ListItemText>
        </MenuItem>
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
        <DialogTitle sx={{ fontSize: "0.9375rem", fontWeight: 700, pb: 1 }}>Editar Cliente</DialogTitle>
        <Box component="form" onSubmit={handleEdit}>
          <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
            <TextField label="Razón social" size="small" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} sx={inputSx} />
            <TextField label="RUT" size="small" required value={form.rut} onChange={(e) => handleRutChange(e.target.value)} placeholder="76.123.456-7" helperText="Formato: XX.XXX.XXX-X" sx={inputSx} />
            <TextField label="Nombre alternativo" size="small" value={form.altName} onChange={(e) => setForm({ ...form, altName: e.target.value })} placeholder="Alias opcional" sx={inputSx} />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
            <Button variant="outlined" color="inherit" size="small" onClick={() => setEditOpen(false)} sx={{ borderColor: "#c3c6d7" }}>Cancelar</Button>
            <Button type="submit" variant="contained" size="small" disabled={loading}>{loading ? "Guardando..." : "Guardar"}</Button>
          </DialogActions>
        </Box>
      </Dialog>

      {/* Contacts Sheet */}
      <CustomerContactsSheet open={contactsOpen} onOpenChange={setContactsOpen} customerId={customer.id} customerName={customer.name} />

      {/* Delete Confirm Dialog */}
      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontSize: "0.9375rem", fontWeight: 700 }}>Eliminar cliente</DialogTitle>
        <DialogContent>
          <Typography fontSize="0.875rem" color="text.secondary">
            ¿Eliminar a <Box component="span" fontWeight={600} color="text.primary">&quot;{customer.name}&quot;</Box>? Esta acción no se puede deshacer.
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
