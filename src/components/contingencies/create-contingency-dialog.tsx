"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface PowerPlant {
  id: number;
  name: string;
}

export function CreateContingencyDialog({
  powerPlants,
}: {
  powerPlants: PowerPlant[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [plantComboOpen, setPlantComboOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    powerPlantId: "",
    type: "",
    description: "",
    cost: "",
    provider: "",
    workDescription: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.powerPlantId || !form.type || !form.description) {
      toast.error("Completa los campos obligatorios");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/contingencies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          powerPlantId: form.powerPlantId,
          type: form.type,
          description: form.description,
          cost: form.cost ? parseFloat(form.cost) : null,
          provider: form.provider || null,
          workDescription: form.workDescription || null,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error?.message || "Error al crear contingencia");
      }

      toast.success("Contingencia creada exitosamente");
      setOpen(false);
      setForm({ powerPlantId: "", type: "", description: "", cost: "", provider: "", workDescription: "" });
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al crear contingencia");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary)]/90">
          <Plus className="w-4 h-4 mr-1" aria-hidden="true" />
          Nueva contingencia
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-[15px] font-bold">
            Crear contingencia
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label id="plant-label" className="text-[13px]">
              Planta <span className="text-[var(--color-warning)]">*</span>
            </Label>
            <Popover open={plantComboOpen} onOpenChange={setPlantComboOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={plantComboOpen}
                  aria-labelledby="plant-label"
                  className="w-full justify-between text-[13px] font-normal h-9"
                >
                  {form.powerPlantId ? (
                    <span className="truncate">
                      {powerPlants.find((p) => String(p.id) === form.powerPlantId)?.name}
                    </span>
                  ) : (
                    <span className="text-[var(--color-muted-foreground)]">Seleccionar planta...</span>
                  )}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Buscar planta..." className="text-[13px]" />
                  <CommandList>
                    <CommandEmpty className="text-[13px] py-3 text-center text-[var(--color-muted-foreground)]">
                      Sin resultados
                    </CommandEmpty>
                    <CommandGroup>
                      {powerPlants.map((p) => (
                        <CommandItem
                          key={p.id}
                          value={p.name}
                          onSelect={() => {
                            setForm({ ...form, powerPlantId: String(p.id) });
                            setPlantComboOpen(false);
                          }}
                          className="text-[13px]"
                          title={p.name}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4 shrink-0 text-[var(--color-primary)]",
                              form.powerPlantId === String(p.id) ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {p.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label className="text-[13px]">Tipo <span className="text-[var(--color-warning)]">*</span></Label>
            <Select
              value={form.type}
              onValueChange={(v) => setForm({ ...form, type: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PREVENTIVE">Preventiva</SelectItem>
                <SelectItem value="CORRECTIVE">Correctiva</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-[13px]">Descripción <span className="text-[var(--color-warning)]">*</span></Label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Describe la contingencia..."
              className="min-h-[80px]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[13px]">Costo (CLP)</Label>
              <Input
                type="number"
                value={form.cost}
                onChange={(e) => setForm({ ...form, cost: e.target.value })}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[13px]">Proveedor</Label>
              <Input
                value={form.provider}
                onChange={(e) => setForm({ ...form, provider: e.target.value })}
                placeholder="Nombre del proveedor"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-[13px]">Descripción del trabajo</Label>
            <Textarea
              value={form.workDescription}
              onChange={(e) => setForm({ ...form, workDescription: e.target.value })}
              placeholder="Detalle del trabajo realizado o a realizar..."
              className="min-h-[60px]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={loading}
              className="bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary)]/90"
            >
              {loading ? "Creando..." : "Crear contingencia"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
