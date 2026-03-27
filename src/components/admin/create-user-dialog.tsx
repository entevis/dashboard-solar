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
  id: string;
  name: string;
  rut: string;
}

interface Portfolio {
  id: string;
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
        <Button className="h-9 text-[13px] bg-[var(--color-primary)] hover:bg-[var(--color-primary)]/90 rounded-lg">
          <Plus className="w-4 h-4 mr-1.5" />
          Crear usuario
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle className="text-base">Crear nuevo usuario</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label className="text-[13px]">Nombre</Label>
            <Input
              name="name"
              placeholder="Nombre completo"
              required
              className="h-10"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-[13px]">Correo electrónico</Label>
            <Input
              name="email"
              type="email"
              placeholder="correo@empresa.cl"
              required
              className="h-10"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-[13px]">Contraseña</Label>
            <Input
              name="password"
              type="password"
              placeholder="Mínimo 6 caracteres"
              minLength={6}
              required
              className="h-10"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-[13px]">Rol</Label>
            <Select value={role} onValueChange={setRole} required>
              <SelectTrigger className="h-10">
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
              <Label className="text-[13px]">Cliente</Label>
              <Select name="customerId" required>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Seleccionar cliente" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name} ({c.rut})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {showPortfolio && (
            <div className="space-y-2">
              <Label className="text-[13px]">Portafolio asignado</Label>
              <Select name="assignedPortfolioId" required>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Seleccionar portafolio" />
                </SelectTrigger>
                <SelectContent>
                  {portfolios.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
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
              onClick={() => setOpen(false)}
              className="h-9 text-[13px]"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading || !role}
              className="h-9 text-[13px] bg-[var(--color-primary)] hover:bg-[var(--color-primary)]/90 rounded-lg"
            >
              {loading ? "Creando..." : "Crear usuario"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
