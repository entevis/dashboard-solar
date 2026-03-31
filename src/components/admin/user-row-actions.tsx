"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { ROLE_LABELS } from "@/lib/auth/roles";
import { toast } from "sonner";
import type { UserRole } from "@prisma/client";

interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  customerId: number | null;
  assignedPortfolioId: number | null;
}

interface Option { id: number; name: string }

interface Props {
  user: User;
  customers: Option[];
  portfolios: Option[];
  currentUserId: number;
}

const ROLES: UserRole[] = ["MAESTRO", "OPERATIVO", "CLIENTE", "CLIENTE_PERFILADO"];

export function UserRowActions({ user, customers, portfolios, currentUserId }: Props) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: user.name,
    role: user.role,
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
        body: JSON.stringify({
          name: form.name,
          role: form.role,
          customerId: form.customerId || null,
          assignedPortfolioId: form.assignedPortfolioId || null,
        }),
      });
      if (!res.ok) throw new Error();
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
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error);
    }
    toast.success("Usuario eliminado");
    router.refresh();
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-[var(--color-muted-foreground)]" aria-label={`Acciones para ${user.name}`}>
            <MoreHorizontal className="w-4 h-4" aria-hidden="true" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-36">
          <DropdownMenuItem onClick={() => setEditOpen(true)}>
            <Pencil className="w-3.5 h-3.5 mr-2" />
            Editar
          </DropdownMenuItem>
          {!isSelf && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setDeleteOpen(true)}
                className="text-[var(--color-destructive)] focus:text-[var(--color-destructive)]"
              >
                <Trash2 className="w-3.5 h-3.5 mr-2" />
                Eliminar
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle className="text-[15px] font-bold">Editar Usuario</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-[13px]">Nombre <span className="text-[var(--color-warning)]">*</span></Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label className="text-[13px]">Email</Label>
              <Input value={user.email} disabled className="opacity-50" />
            </div>
            <div className="space-y-2">
              <Label className="text-[13px]">Rol <span className="text-[var(--color-warning)]">*</span></Label>
              <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v as UserRole, customerId: "", assignedPortfolioId: "" })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => (
                    <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {(form.role === "CLIENTE" || form.role === "CLIENTE_PERFILADO") && (
              <div className="space-y-2">
                <Label className="text-[13px]">Cliente</Label>
                <Select value={form.customerId} onValueChange={(v) => setForm({ ...form, customerId: v })}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar cliente" /></SelectTrigger>
                  <SelectContent>
                    {customers.map((c) => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
            {form.role === "OPERATIVO" && (
              <div className="space-y-2">
                <Label className="text-[13px]">Portafolio asignado</Label>
                <Select value={form.assignedPortfolioId} onValueChange={(v) => setForm({ ...form, assignedPortfolioId: v })}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar portafolio" /></SelectTrigger>
                  <SelectContent>
                    {portfolios.map((p) => <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setEditOpen(false)}>Cancelar</Button>
              <Button type="submit" size="sm" disabled={loading} className="bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary)]/90">
                {loading ? "Guardando..." : "Guardar"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Eliminar usuario"
        description={`¿Eliminar a "${user.name}"? Perderá acceso al sistema.`}
        onConfirm={handleDelete}
      />
    </>
  );
}
