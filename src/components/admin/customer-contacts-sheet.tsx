"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Drawer from "@mui/material/Drawer";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import TextField from "@mui/material/TextField";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Divider from "@mui/material/Divider";
import CircularProgress from "@mui/material/CircularProgress";
import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import PersonOffOutlinedIcon from "@mui/icons-material/PersonOffOutlined";
import { toast } from "@/lib/utils/toast";

const inputSx = { "& .MuiOutlinedInput-root": { backgroundColor: "#eff4ff", "& fieldset": { borderColor: "transparent" }, "&:hover fieldset": { borderColor: "transparent" }, "&.Mui-focused fieldset": { borderColor: "#004ac6", borderWidth: 2 } } };

interface Contact { id: number; name: string; rut: string | null; phone: string | null; role: string | null; email: string | null }
interface Props { open: boolean; onOpenChange: (open: boolean) => void; customerId: number; customerName: string }

const emptyForm = { name: "", rut: "", phone: "", role: "", email: "" };

export function CustomerContactsSheet({ open, onOpenChange, customerId, customerName }: Props) {
  const router = useRouter();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteContact, setDeleteContact] = useState<Contact | null>(null);
  const [editing, setEditing] = useState<Contact | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) fetchContacts();
  }, [open, customerId]);

  async function fetchContacts() {
    setLoading(true);
    try {
      const res = await fetch(`/api/customers/${customerId}/contacts`);
      setContacts(await res.json());
    } catch {
      toast.error("Error al cargar contactos");
    } finally {
      setLoading(false);
    }
  }

  function openCreate() { setEditing(null); setForm(emptyForm); setFormOpen(true); }
  function openEdit(c: Contact) {
    setEditing(c);
    setForm({ name: c.name, rut: c.rut ?? "", phone: c.phone ?? "", role: c.role ?? "", email: c.email ?? "" });
    setFormOpen(true);
  }

  async function handleSave() {
    if (!form.name.trim()) { toast.error("El nombre es obligatorio"); return; }
    setSaving(true);
    try {
      const url = editing ? `/api/customers/${customerId}/contacts/${editing.id}` : `/api/customers/${customerId}/contacts`;
      const res = await fetch(url, {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.name, rut: form.rut || null, phone: form.phone || null, role: form.role || null, email: form.email || null }),
      });
      if (!res.ok) throw new Error();
      toast.success(editing ? "Contacto actualizado" : "Contacto creado");
      setFormOpen(false);
      fetchContacts();
      router.refresh();
    } catch {
      toast.error("Error al guardar contacto");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteContact) return;
    try {
      const res = await fetch(`/api/customers/${customerId}/contacts/${deleteContact.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Contacto eliminado");
      setDeleteContact(null);
      fetchContacts();
      router.refresh();
    } catch {
      toast.error("Error al eliminar contacto");
    }
  }

  return (
    <>
      <Drawer anchor="right" open={open} onClose={() => onOpenChange(false)} PaperProps={{ sx: { width: 520, display: "flex", flexDirection: "column" } }}>
        {/* Header */}
        <Box sx={{ px: 3, pt: 3, pb: 2.5, display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 2 }}>
          <Box>
            <Typography variant="caption" sx={{ textTransform: "uppercase", letterSpacing: "0.06em", color: "text.secondary", display: "block", mb: 0.5 }}>
              Contactos
            </Typography>
            <Typography fontSize="0.9375rem" fontWeight={600}>{customerName}</Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Button variant="contained" size="small" startIcon={<AddOutlinedIcon />} onClick={openCreate}>
              Agregar contacto
            </Button>
            <IconButton size="small" onClick={() => onOpenChange(false)}>
              <CloseOutlinedIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Box>
        </Box>

        <Divider />

        {/* Body */}
        <Box sx={{ flex: 1, overflowY: "auto" }}>
          {loading ? (
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", py: 10 }}>
              <CircularProgress size={24} />
            </Box>
          ) : contacts.length === 0 ? (
            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", py: 10, gap: 2 }}>
              <PersonOffOutlinedIcon sx={{ fontSize: 36, color: "text.disabled" }} />
              <Typography fontSize="0.875rem" color="text.secondary">Sin contactos registrados</Typography>
              <Button variant="contained" size="small" startIcon={<AddOutlinedIcon />} onClick={openCreate}>
                Agregar primer contacto
              </Button>
            </Box>
          ) : (
            <Table size="small">
              <TableHead>
                <TableRow sx={{ "& .MuiTableCell-head": { backgroundColor: "#eff4ff", fontSize: "0.75rem", fontWeight: 600, py: 1 } }}>
                  <TableCell>Nombre</TableCell>
                  <TableCell>Cargo</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Teléfono</TableCell>
                  <TableCell sx={{ width: 72 }} />
                </TableRow>
              </TableHead>
              <TableBody>
                {contacts.map((c) => (
                  <TableRow key={c.id} hover sx={{ "& .MuiTableCell-root": { fontSize: "0.8125rem", py: 1.25 } }}>
                    <TableCell sx={{ fontWeight: 500 }}>{c.name}</TableCell>
                    <TableCell sx={{ color: "text.secondary" }}>{c.role ?? "—"}</TableCell>
                    <TableCell sx={{ maxWidth: 160 }}>
                      <Typography fontSize="inherit" noWrap title={c.email ?? ""}>{c.email ?? "—"}</Typography>
                    </TableCell>
                    <TableCell sx={{ color: "text.secondary", whiteSpace: "nowrap" }}>{c.phone ?? "—"}</TableCell>
                    <TableCell>
                      <Box sx={{ display: "flex", gap: 0.5 }}>
                        <IconButton size="small" onClick={() => openEdit(c)} sx={{ color: "text.secondary", "&:hover": { color: "primary.main" } }}>
                          <EditOutlinedIcon sx={{ fontSize: 15 }} />
                        </IconButton>
                        <IconButton size="small" onClick={() => setDeleteContact(c)} sx={{ color: "text.secondary", "&:hover": { color: "error.main" } }}>
                          <DeleteOutlinedIcon sx={{ fontSize: 15 }} />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Box>
      </Drawer>

      {/* Create / Edit Dialog */}
      <Dialog open={formOpen} onClose={() => setFormOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontSize: "0.9375rem", fontWeight: 700, pb: 0.5 }}>
          {editing ? "Editar contacto" : "Nuevo contacto"}
          <Typography variant="caption" display="block" color="text.secondary">{customerName}</Typography>
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
            <TextField label="Nombre completo" size="small" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ej: Juan Pérez" sx={inputSx} />
            <TextField label="RUT" size="small" value={form.rut} onChange={(e) => setForm({ ...form, rut: e.target.value })} placeholder="Ej: 12345678-9" sx={inputSx} />
            <TextField label="Cargo" size="small" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} placeholder="Ej: Gerente Agrícola" sx={inputSx} />
            <TextField label="Teléfono" size="small" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Ej: +56912345678" sx={inputSx} />
            <TextField label="Email" type="email" size="small" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Ej: juan@empresa.cl" sx={{ ...inputSx, gridColumn: "1 / -1" }} />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button variant="outlined" color="inherit" size="small" onClick={() => setFormOpen(false)} sx={{ borderColor: "#c3c6d7" }}>Cancelar</Button>
          <Button variant="contained" size="small" disabled={saving} onClick={handleSave}>
            {saving ? "Guardando..." : editing ? "Guardar cambios" : "Crear contacto"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog open={!!deleteContact} onClose={() => setDeleteContact(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontSize: "0.9375rem", fontWeight: 700 }}>¿Eliminar contacto?</DialogTitle>
        <DialogContent>
          <Typography fontSize="0.875rem" color="text.secondary">
            Se eliminará a <Box component="span" fontWeight={600} color="text.primary">{deleteContact?.name}</Box>. Esta acción no se puede deshacer.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button variant="contained" color="error" size="small" onClick={handleDelete}>Eliminar</Button>
          <Button variant="outlined" color="inherit" size="small" onClick={() => setDeleteContact(null)} sx={{ borderColor: "#c3c6d7" }}>Cancelar</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
