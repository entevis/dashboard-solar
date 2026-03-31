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
import { Textarea } from "@/components/ui/textarea";
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface Portfolio {
  id: number;
  name: string;
  description: string | null;
  duemintCompanyId: string | null;
}

export function PortfolioRowActions({ portfolio }: { portfolio: Portfolio }) {
  const router = useRouter();
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
        body: JSON.stringify({
          name: form.name,
          description: form.description || null,
          duemintCompanyId: form.duemintCompanyId || null,
        }),
      });
      if (!res.ok) throw new Error();
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
    router.refresh();
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-[var(--color-muted-foreground)]" aria-label={`Acciones para ${portfolio.name}`}>
            <MoreHorizontal className="w-4 h-4" aria-hidden="true" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-36">
          <DropdownMenuItem onClick={() => setEditOpen(true)}>
            <Pencil className="w-3.5 h-3.5 mr-2" />
            Editar
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => setDeleteOpen(true)}
            className="text-[var(--color-destructive)] focus:text-[var(--color-destructive)]"
          >
            <Trash2 className="w-3.5 h-3.5 mr-2" />
            Eliminar
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle className="text-[15px] font-bold">Editar Portafolio</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-[13px]">Nombre <span className="text-[var(--color-warning)]">*</span></Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label className="text-[13px]">Descripción</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="min-h-[80px]" />
            </div>
            <div className="space-y-2">
              <Label className="text-[13px]">Duemint Company ID</Label>
              <Input
                value={form.duemintCompanyId}
                onChange={(e) => setForm({ ...form, duemintCompanyId: e.target.value })}
                placeholder="ej: 2908"
              />
            </div>
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
        title="Eliminar portafolio"
        description={`¿Eliminar "${portfolio.name}"? Esta acción no se puede deshacer.`}
        onConfirm={handleDelete}
      />
    </>
  );
}
