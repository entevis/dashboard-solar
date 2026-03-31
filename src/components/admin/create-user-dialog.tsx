"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus } from "lucide-react";
import { toast } from "sonner";

interface Customer {
  id: number;
  name: string;
  rut: string;
}

interface Portfolio {
  id: number;
  name: string;
}

interface CreateUserDialogProps {
  customers: Customer[];
  portfolios: Portfolio[];
}

export function CreateUserDialog({
  customers,
  portfolios,
}: CreateUserDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState("");
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const body = {
      email: formData.get("email") as string,
      name: formData.get("name") as string,
      password: formData.get("password") as string,
      role,
      customerId: formData.get("customerId") as string || undefined,
      assignedPortfolioId: formData.get("assignedPortfolioId") as string || undefined,
    };

    const res = await fetch("/api/users/invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const data = await res.json();
      toast.error(data.error || "Error al crear usuario");
      setLoading(false);
      return;
    }

    toast.success("Usuario creado correctamente");
    setOpen(false);
    setLoading(false);
    router.refresh();
  }

  const showCustomer = role === "CLIENTE" || role === "CLIENTE_PERFILADO";
  const showPortfolio = role === "OPERATIVO";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary)]/90">
          <Plus className="w-4 h-4 mr-1" aria-hidden="true" />
          Nuevo usuario
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle className="text-[15px] font-bold">Crear usuario</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label className="text-[13px]">Nombre <span className="text-[var(--color-warning)]">*</span></Label>
            <Input
              name="name"
              placeholder="Nombre completo"
              required
            />
          </div>

          <div className="space-y-2">
            <Label className="text-[13px]">Correo electrónico <span className="text-[var(--color-warning)]">*</span></Label>
            <Input
              name="email"
              type="email"
              placeholder="correo@empresa.cl"
              required
            />
          </div>

          <div className="space-y-2">
            <Label className="text-[13px]">Contraseña <span className="text-[var(--color-warning)]">*</span></Label>
            <Input
              name="password"
              type="password"
              placeholder="Mínimo 6 caracteres"
              minLength={6}
              required
            />
          </div>

          <div className="space-y-2">
            <Label className="text-[13px]">Rol <span className="text-[var(--color-warning)]">*</span></Label>
            <Select value={role} onValueChange={setRole} required>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar rol" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MAESTRO">Maestro</SelectItem>
                <SelectItem value="OPERATIVO">Operativo</SelectItem>
                <SelectItem value="CLIENTE">Cliente</SelectItem>
                <SelectItem value="CLIENTE_PERFILADO">
                  Cliente Perfilado
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {showCustomer && (
            <div className="space-y-2">
              <Label className="text-[13px]">Cliente <span className="text-[var(--color-warning)]">*</span></Label>
              <Select name="customerId" required>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar cliente" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.name} ({c.rut})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {showPortfolio && (
            <div className="space-y-2">
              <Label className="text-[13px]">Portafolio asignado <span className="text-[var(--color-warning)]">*</span></Label>
              <Select name="assignedPortfolioId" required>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar portafolio" />
                </SelectTrigger>
                <SelectContent>
                  {portfolios.map((p) => (
                    <SelectItem key={p.id} value={String(p.id)}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

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
              disabled={loading || !role}
              className="bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary)]/90"
            >
              {loading ? "Creando..." : "Crear usuario"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
