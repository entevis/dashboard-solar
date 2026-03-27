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
import { toast } from "sonner";

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
  });

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
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-[var(--color-muted-foreground)]">
            <MoreHorizontal className="w-4 h-4" />
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
            className="text-red-600 focus:text-red-600"
          >
            <Trash2 className="w-3.5 h-3.5 mr-2" />
            Eliminar
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-[15px] font-bold">Editar Planta</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4">

            {/* Identificación */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[13px]">Nombre *</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label className="text-[13px]">ID Solcor</Label>
                <Input value={form.solcorId} onChange={(e) => setForm({ ...form, solcorId: e.target.value })} placeholder="Ej: SOL-001" />
              </div>
            </div>

            {/* Ubicación */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[13px]">Comuna</Label>
                <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="Ej: Santiago" />
              </div>
              <div className="space-y-2">
                <Label className="text-[13px]">Región / Ubicación</Label>
                <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Ej: Región Metropolitana" />
              </div>
            </div>

            {/* Distribuidora y Tarifa */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[13px]">Empresa Distribuidora</Label>
                <Input value={form.distributorCompany} onChange={(e) => setForm({ ...form, distributorCompany: e.target.value })} placeholder="Ej: Enel, CGE" />
              </div>
              <div className="space-y-2">
                <Label className="text-[13px]">ID Tarifa</Label>
                <Input value={form.tariffId} onChange={(e) => setForm({ ...form, tariffId: e.target.value })} placeholder="Ej: BT1" />
              </div>
            </div>

            {/* Técnico */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[13px]">Potencia (kWp) *</Label>
                <Input type="number" step="0.1" min="0" value={form.capacityKw} onChange={(e) => setForm({ ...form, capacityKw: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label className="text-[13px]">Rendimiento Anual (kWh/kWp)</Label>
                <Input type="number" step="0.01" min="0" value={form.specificYield} onChange={(e) => setForm({ ...form, specificYield: e.target.value })} placeholder="Ej: 1450.5" />
              </div>
            </div>

            {/* Contrato */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[13px]">Fecha Inicio (F6)</Label>
                <Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label className="text-[13px]">Duración (Años)</Label>
                <Input type="number" min="1" max="50" value={form.durationYears} onChange={(e) => setForm({ ...form, durationYears: e.target.value })} placeholder="Ej: 20" />
              </div>
            </div>

            {/* Estado y asignaciones */}
            <div className="space-y-2">
              <Label className="text-[13px]">Estado *</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Activa</SelectItem>
                  <SelectItem value="maintenance">Mantenimiento</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[13px]">Portafolio *</Label>
                <Select value={form.portfolioId} onValueChange={(v) => setForm({ ...form, portfolioId: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {portfolios.map((p) => <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-[13px]">Cliente *</Label>
                <Select value={form.customerId} onValueChange={(v) => setForm({ ...form, customerId: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {customers.map((c) => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
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
        title="Eliminar planta"
        description={`¿Eliminar "${plant.name}"? Esta acción no se puede deshacer.`}
        onConfirm={handleDelete}
      />
    </>
  );
}
