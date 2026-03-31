"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tag,
  Zap,
  FileText,
  Users,
  MapPin,
  Pencil,
  Lock,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

interface PlantAddress {
  address: string | null;
  reference: string | null;
  city: string | null;
  county: string | null;
  country: string | null;
}

interface Plant {
  id: number;
  name: string;
  status: string;
  solcorId: string | null;
  capacityKw: number;
  specificYield: number | null;
  distributorCompany: string | null;
  tariffId: string | null;
  startDate: Date | null;
  durationYears: number | null;
  city: string | null;
  location: string | null;
  portfolio: { id: number; name: string };
  customer: { name: string; rut: string };
  address: PlantAddress | null;
}

interface Props {
  plant: Plant;
  canEdit: boolean;
}

function formatDate(date: Date | null): string {
  if (!date) return "—";
  return new Intl.DateTimeFormat("es-CL").format(new Date(date));
}

function calcEndDate(startDate: Date | null, durationYears: number | null): string {
  if (!startDate || !durationYears) return "—";
  const end = new Date(startDate);
  end.setFullYear(end.getFullYear() + durationYears);
  return new Intl.DateTimeFormat("es-CL").format(end);
}

function Field({ label, value }: { label: string; value: string | number | null | undefined }) {
  return (
    <div>
      <p className="text-[12px] uppercase tracking-wide text-[var(--color-muted-foreground)] mb-0.5">
        {label}
      </p>
      <p className="text-[14px] font-medium text-[var(--color-foreground)]">
        {value ?? "—"}
      </p>
    </div>
  );
}

function ReadonlyField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="flex items-center gap-1 mb-0.5">
        <p className="text-[12px] uppercase tracking-wide text-[var(--color-muted-foreground)]">{label}</p>
        <Lock className="w-2.5 h-2.5 text-[var(--color-muted-foreground)]" />
      </div>
      <p className="text-[14px] font-medium text-[var(--color-foreground)]">{value || "—"}</p>
    </div>
  );
}

function SectionCard({
  icon: Icon,
  title,
  children,
  className,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Card className={`border-[var(--color-border)] shadow-sm bg-white ${className ?? ""}`}>
      <CardContent className="p-5">
        <div className="flex items-center gap-2 pb-3 mb-4 border-b border-[var(--color-border)]">
          <Icon className="w-4 h-4 text-[var(--color-primary)]" />
          <h3 className="text-[14px] font-semibold text-[var(--color-foreground)]">{title}</h3>
        </div>
        {children}
      </CardContent>
    </Card>
  );
}

function EditInput({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <p className="text-[12px] uppercase tracking-wide text-[var(--color-muted-foreground)] mb-1">
        {label}
      </p>
      <Input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-9 text-[13px]"
      />
    </div>
  );
}

export function PlantDetailPanel({ plant, canEdit }: Props) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: plant.name,
    solcorId: plant.solcorId ?? "",
    status: plant.status,
    capacityKw: String(plant.capacityKw),
    specificYield: plant.specificYield != null ? String(plant.specificYield) : "",
    distributorCompany: plant.distributorCompany ?? "",
    tariffId: plant.tariffId ?? "",
    startDate: plant.startDate ? new Date(plant.startDate).toISOString().split("T")[0] : "",
    durationYears: plant.durationYears != null ? String(plant.durationYears) : "",
    addrAddress: plant.address?.address ?? "",
    addrReference: plant.address?.reference ?? "",
    addrCity: plant.address?.city ?? plant.city ?? "",
    addrCounty: plant.address?.county ?? plant.location ?? "",
    addrCountry: plant.address?.country ?? "Chile",
  });

  function handleCancel() {
    setForm({
      name: plant.name,
      solcorId: plant.solcorId ?? "",
      status: plant.status,
      capacityKw: String(plant.capacityKw),
      specificYield: plant.specificYield != null ? String(plant.specificYield) : "",
      distributorCompany: plant.distributorCompany ?? "",
      tariffId: plant.tariffId ?? "",
      startDate: plant.startDate ? new Date(plant.startDate).toISOString().split("T")[0] : "",
      durationYears: plant.durationYears != null ? String(plant.durationYears) : "",
      addrAddress: plant.address?.address ?? "",
      addrReference: plant.address?.reference ?? "",
      addrCity: plant.address?.city ?? plant.city ?? "",
      addrCounty: plant.address?.county ?? plant.location ?? "",
      addrCountry: plant.address?.country ?? "Chile",
    });
    setIsEditing(false);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch(`/api/power-plants/${plant.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          solcorId: form.solcorId || null,
          status: form.status,
          capacityKw: parseFloat(form.capacityKw),
          specificYield: form.specificYield ? parseFloat(form.specificYield) : null,
          distributorCompany: form.distributorCompany || null,
          tariffId: form.tariffId || null,
          startDate: form.startDate || null,
          durationYears: form.durationYears ? parseFloat(form.durationYears) : null,
          address: {
            address: form.addrAddress || null,
            reference: form.addrReference || null,
            city: form.addrCity || null,
            county: form.addrCounty || null,
            country: form.addrCountry || "Chile",
          },
        }),
      });
      if (!res.ok) throw new Error();
      toast.success("Planta actualizada");
      setIsEditing(false);
      router.refresh();
    } catch {
      toast.error("Error al guardar los cambios. Intenta nuevamente.");
    } finally {
      setSaving(false);
    }
  }

  const ef = (field: keyof typeof form) => (v: string) => setForm({ ...form, [field]: v });

  const addrCity = plant.address?.city ?? plant.city;
  const addrCounty = plant.address?.county ?? plant.location;
  const hasAddress = !!(plant.address?.address || plant.address?.city || addrCity);

  return (
    <div className="space-y-4">
      {/* Actions bar */}
      <div className="flex justify-end">
        {isEditing ? (
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={handleCancel} disabled={saving}
              className="text-[var(--color-muted-foreground)]">
              Cancelar
            </Button>
            <Button size="sm" onClick={handleSave} disabled={saving}
              className="bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary)]/90">
              {saving ? (
                <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />Guardando...</>
              ) : "Guardar cambios"}
            </Button>
          </div>
        ) : canEdit ? (
          <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
            <Pencil className="w-3.5 h-3.5 mr-1.5" />
            Editar
          </Button>
        ) : null}
      </div>

      {/* Grid layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Col left (2/3) */}
        <div className="lg:col-span-2 space-y-4">

          {/* Card: Identificación */}
          <SectionCard icon={Tag} title="Identificación">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
              {isEditing ? (
                <>
                  <EditInput label="Nombre de planta" value={form.name} onChange={ef("name")} />
                  <EditInput label="ID Solcor" value={form.solcorId} onChange={ef("solcorId")} placeholder="Ej: SOL-001" />
                  <div>
                    <p className="text-[12px] uppercase tracking-wide text-[var(--color-muted-foreground)] mb-1">Estado</p>
                    <Select value={form.status} onValueChange={ef("status")}>
                      <SelectTrigger className="h-9 text-[13px]"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Activa</SelectItem>
                        <SelectItem value="maintenance">En mantenimiento</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              ) : (
                <>
                  <Field label="Nombre de planta" value={plant.name} />
                  <Field label="ID Solcor" value={plant.solcorId} />
                  <div>
                    <p className="text-[12px] uppercase tracking-wide text-[var(--color-muted-foreground)] mb-1">Estado</p>
                    <Badge
                      variant="secondary"
                      className={`text-[12px] font-semibold px-2.5 rounded-full ${
                        plant.status === "active"
                          ? "bg-[var(--color-success)]/10 text-[var(--color-success)]"
                          : "bg-[var(--color-warning)]/10 text-[var(--color-warning)]"
                      }`}
                    >
                      {plant.status === "active" ? "Activa" : "En mantenimiento"}
                    </Badge>
                  </div>
                </>
              )}
            </div>
          </SectionCard>

          {/* Card: Contrato */}
          <SectionCard icon={FileText} title="Contrato">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
              {isEditing ? (
                <>
                  <EditInput label="Fecha inicio (F6)" value={form.startDate} onChange={ef("startDate")} type="date" />
                  <EditInput label="Duración (años)" value={form.durationYears} onChange={ef("durationYears")} type="number" placeholder="Ej: 20" />
                </>
              ) : (
                <>
                  <Field label="Fecha inicio (F6)" value={formatDate(plant.startDate)} />
                  <Field label="Duración" value={plant.durationYears != null ? `${plant.durationYears} años` : null} />
                  <Field label="Fecha término estimada" value={calcEndDate(plant.startDate, plant.durationYears)} />
                </>
              )}
            </div>
          </SectionCard>
        </div>

        {/* Col right (1/3) */}
        <div className="space-y-4">

          {/* Card: Técnico */}
          <SectionCard icon={Zap} title="Técnico">
            <div className="space-y-5">
              {isEditing ? (
                <>
                  <EditInput label="Capacidad (kWp)" value={form.capacityKw} onChange={ef("capacityKw")} type="number" />
                  <EditInput label="Rendimiento (kWh/kWp)" value={form.specificYield} onChange={ef("specificYield")} type="number" placeholder="Ej: 1450" />
                  <EditInput label="Distribuidora" value={form.distributorCompany} onChange={ef("distributorCompany")} placeholder="Ej: Enel" />
                  <EditInput label="ID Tarifa" value={form.tariffId} onChange={ef("tariffId")} placeholder="Ej: BT1" />
                </>
              ) : (
                <>
                  <Field label="Capacidad" value={plant.capacityKw != null ? `${plant.capacityKw} kWp` : null} />
                  <Field label="Rendimiento anual" value={plant.specificYield != null ? `${plant.specificYield.toLocaleString("es-CL")} kWh/kWp` : null} />
                  <Field label="Distribuidora" value={plant.distributorCompany} />
                  <Field label="ID Tarifa" value={plant.tariffId} />
                </>
              )}
            </div>
          </SectionCard>

          {/* Card: Cliente & Portafolio */}
          <SectionCard icon={Users} title="Cliente & Portafolio">
            <div className="space-y-5">
              <ReadonlyField label="Cliente" value={plant.customer.name} />
              <ReadonlyField label="RUT" value={plant.customer.rut} />
              <ReadonlyField label="Portafolio" value={plant.portfolio.name} />
            </div>
          </SectionCard>
        </div>

        {/* Card: Dirección (full width) */}
        <div className="lg:col-span-3">
          <SectionCard icon={MapPin} title="Dirección">
            {isEditing ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-5">
                <div className="sm:col-span-2 lg:col-span-2">
                  <EditInput label="Dirección" value={form.addrAddress} onChange={ef("addrAddress")} placeholder="Ej: Av. El Sol 1234" />
                </div>
                <EditInput label="Referencia" value={form.addrReference} onChange={ef("addrReference")} placeholder="Ej: Frente al galpón" />
                <EditInput label="Comuna" value={form.addrCity} onChange={ef("addrCity")} placeholder="Ej: Rancagua" />
                <EditInput label="Región" value={form.addrCounty} onChange={ef("addrCounty")} placeholder="Ej: O'Higgins" />
                <EditInput label="País" value={form.addrCountry} onChange={ef("addrCountry")} />
              </div>
            ) : !hasAddress ? (
              <p className="text-[13px] italic text-[var(--color-muted-foreground)] text-center py-4">
                Sin dirección registrada
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-5">
                <div className="sm:col-span-2 lg:col-span-2">
                  <Field label="Dirección" value={plant.address?.address} />
                </div>
                <Field label="Referencia" value={plant.address?.reference} />
                <Field label="Comuna" value={addrCity} />
                <Field label="Región" value={addrCounty} />
                <Field label="País" value={plant.address?.country ?? "Chile"} />
              </div>
            )}
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
