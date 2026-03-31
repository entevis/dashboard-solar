"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const MONTHS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

const STATUS_OPTIONS = [
  { value: "all", label: "Todos los estados" },
  { value: "pagada", label: "Pagada" },
  { value: "porVencer", label: "Por vencer" },
  { value: "vencida", label: "Vencida" },
  { value: "anulada", label: "Nota de Crédito" },
];

function getYears() {
  const current = new Date().getFullYear();
  return [current - 2, current - 1, current];
}

interface Props {
  month: number;
  year: number;
  status: string;
}

export function BillingFilters({ month, year, status }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function update(key: "month" | "year" | "status", value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set(key, value);
    params.set("page", "1");
    router.push(`?${params.toString()}`);
  }

  return (
    <div className="flex items-center gap-2">
      <Select value={status} onValueChange={(v) => update("status", v)}>
        <SelectTrigger className="h-8 text-[13px] w-40">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {STATUS_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value} className="text-[13px]">
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={String(month)} onValueChange={(v) => update("month", v)}>
        <SelectTrigger className="h-8 text-[13px] w-[130px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {MONTHS.map((name, i) => (
            <SelectItem key={i + 1} value={String(i + 1)} className="text-[13px]">
              {name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={String(year)} onValueChange={(v) => update("year", v)}>
        <SelectTrigger className="h-8 text-[13px] w-[90px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {getYears().map((y) => (
            <SelectItem key={y} value={String(y)} className="text-[13px]">
              {y}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
