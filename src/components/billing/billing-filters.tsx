"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, Loader2 } from "lucide-react";

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
  const [isPending, startTransition] = useTransition();

  const [localMonth, setLocalMonth] = useState(String(month));
  const [localYear, setLocalYear] = useState(String(year));
  const [localStatus, setLocalStatus] = useState(status);

  function handleSearch() {
    const params = new URLSearchParams(searchParams.toString());
    params.set("month", localMonth);
    params.set("year", localYear);
    params.set("status", localStatus);
    params.set("page", "1");
    startTransition(() => {
      router.push(`?${params.toString()}`);
    });
  }

  return (
    <div className="flex items-center gap-2">
      <Select value={localMonth} onValueChange={setLocalMonth}>
        <SelectTrigger className="h-8 text-label w-32.5">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {MONTHS.map((name, i) => (
            <SelectItem key={i + 1} value={String(i + 1)} className="text-label">
              {name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={localYear} onValueChange={setLocalYear}>
        <SelectTrigger className="h-8 text-label w-22.5">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {getYears().map((y) => (
            <SelectItem key={y} value={String(y)} className="text-label">
              {y}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={localStatus} onValueChange={setLocalStatus}>
        <SelectTrigger className="h-8 text-label w-40">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {STATUS_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value} className="text-label">
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button
        size="sm"
        className="h-8 gap-1.5 text-label"
        onClick={handleSearch}
        disabled={isPending}
      >
        {isPending ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <Search className="w-3.5 h-3.5" />
        )}
        {isPending ? "Buscando..." : "Buscar"}
      </Button>
    </div>
  );
}
