"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Pencil, Trash2, Plus, UserX } from "lucide-react";
import { toast } from "sonner";

interface Contact {
  id: number;
  name: string;
  rut: string | null;
  phone: string | null;
  role: string | null;
  email: string | null;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerId: number;
  customerName: string;
}

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
      const data = await res.json();
      setContacts(data);
    } catch {
      toast.error("Error al cargar contactos");
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setFormOpen(true);
  }

  function openEdit(c: Contact) {
    setEditing(c);
    setForm({
      name: c.name,
      rut: c.rut ?? "",
      phone: c.phone ?? "",
      role: c.role ?? "",
      email: c.email ?? "",
    });
    setFormOpen(true);
  }

  async function handleSave() {
    if (!form.name.trim()) {
      toast.error("El nombre es obligatorio");
      return;
    }
    setSaving(true);
    try {
      const url = editing
        ? `/api/customers/${customerId}/contacts/${editing.id}`
        : `/api/customers/${customerId}/contacts`;
      const method = editing ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          rut: form.rut || null,
          phone: form.phone || null,
          role: form.role || null,
          email: form.email || null,
        }),
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
      const res = await fetch(`/api/customers/${customerId}/contacts/${deleteContact.id}`, {
        method: "DELETE",
      });
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
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-[500px] sm:w-[540px] p-0 flex flex-col">
          <SheetHeader className="px-6 pt-6 pb-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] text-[var(--color-muted-foreground)] uppercase tracking-wide mb-0.5">
                  Contactos
                </p>
                <SheetTitle className="text-[15px] font-semibold text-[var(--color-foreground)] leading-tight">
                  {customerName}
                </SheetTitle>
              </div>
              <Button
                size="sm"
                onClick={openCreate}
                className="bg-[var(--color-primary)] hover:bg-[var(--color-primary)]/90 text-white text-[12px] h-8 shrink-0"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                Agregar contacto
              </Button>
            </div>
          </SheetHeader>

          <Separator />

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-16 text-[13px] text-[var(--color-muted-foreground)]">
                Cargando...
              </div>
            ) : contacts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <UserX className="w-8 h-8 text-[var(--color-border)]" />
                <p className="text-[13px] text-[var(--color-muted-foreground)]">
                  Sin contactos registrados
                </p>
                <Button
                  size="sm"
                  onClick={openCreate}
                  className="bg-[var(--color-primary)] hover:bg-[var(--color-primary)]/90 text-white text-[12px] h-8"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  Agregar primer contacto
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-[11px] px-4">Nombre</TableHead>
                    <TableHead className="text-[11px] px-4">Cargo</TableHead>
                    <TableHead className="text-[11px] px-4">Email</TableHead>
                    <TableHead className="text-[11px] px-4">Teléfono</TableHead>
                    <TableHead className="w-16" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contacts.map((c) => (
                    <TableRow key={c.id} className="hover:bg-[var(--color-secondary)]">
                      <TableCell className="text-[13px] font-medium px-4 py-2.5">
                        {c.name}
                      </TableCell>
                      <TableCell className="text-[12px] text-[var(--color-muted-foreground)] px-4 py-2.5">
                        {c.role ?? "—"}
                      </TableCell>
                      <TableCell className="text-[12px] px-4 py-2.5 max-w-[160px] truncate">
                        {c.email ? (
                          <span className="truncate block" title={c.email}>{c.email}</span>
                        ) : "—"}
                      </TableCell>
                      <TableCell className="text-[12px] text-[var(--color-muted-foreground)] px-4 py-2.5 whitespace-nowrap">
                        {c.phone ?? "—"}
                      </TableCell>
                      <TableCell className="px-4 py-2.5">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => openEdit(c)}
                            className="p-1 rounded text-[var(--color-muted-foreground)] hover:text-[var(--color-primary)] hover:bg-[var(--color-secondary)] transition-colors"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteContact(c)}
                            className="p-1 rounded text-[var(--color-muted-foreground)] hover:text-red-500 hover:bg-red-50 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Create / Edit Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="text-[15px] font-bold">
              {editing ? "Editar contacto" : "Nuevo contacto"}
            </DialogTitle>
            <p className="text-[12px] text-[var(--color-muted-foreground)]">{customerName}</p>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-[12px] font-medium">
                Nombre completo <span className="text-[var(--color-warning)]">*</span>
              </Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ej: Juan Pérez"
                className="text-[13px]"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[12px] font-medium">RUT</Label>
              <Input
                value={form.rut}
                onChange={(e) => setForm({ ...form, rut: e.target.value })}
                placeholder="Ej: 12345678-9"
                className="text-[13px]"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[12px] font-medium">Cargo</Label>
              <Input
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                placeholder="Ej: Gerente Agrícola"
                className="text-[13px]"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[12px] font-medium">Teléfono</Label>
              <Input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="Ej: +56912345678"
                className="text-[13px]"
              />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label className="text-[12px] font-medium">Email</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="Ej: juan@empresa.cl"
                className="text-[13px]"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setFormOpen(false)}>
              Cancelar
            </Button>
            <Button
              size="sm"
              disabled={saving}
              onClick={handleSave}
              className="bg-[var(--color-primary)] hover:bg-[var(--color-primary)]/90 text-white"
            >
              {saving ? "Guardando..." : editing ? "Guardar cambios" : "Crear contacto"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete AlertDialog */}
      <AlertDialog open={!!deleteContact} onOpenChange={(o) => !o && setDeleteContact(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[15px]">¿Eliminar contacto?</AlertDialogTitle>
            <AlertDialogDescription className="text-[13px]">
              Se eliminará a <span className="font-medium text-[var(--color-foreground)]">{deleteContact?.name}</span>. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="text-[13px]">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-500 hover:bg-red-600 text-white text-[13px]"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
