"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Option { id: number; name: string }

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 5 }, (_, i) => CURRENT_YEAR - i);

export function ReportFilterBar({ plants }: { plants: Option[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "_all") {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`/reports?${params.toString()}`);
  }

  return (
    <div className="flex flex-col sm:flex-row flex-wrap gap-2">
      <Select
        defaultValue={searchParams.get("year") ?? "_all"}
        onValueChange={(v) => updateParam("year", v)}
      >
        <SelectTrigger className="h-9 text-[13px] w-full sm:w-32">
          <SelectValue placeholder="Año" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="_all">Todos los años</SelectItem>
          {YEARS.map((y) => (
            <SelectItem key={y} value={String(y)}>{y}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        defaultValue={searchParams.get("powerPlantId") ?? "_all"}
        onValueChange={(v) => updateParam("powerPlantId", v)}
      >
        <SelectTrigger className="h-9 text-[13px] w-full sm:w-52">
          <SelectValue placeholder="Planta" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="_all">Todas las plantas</SelectItem>
          {plants.map((p) => (
            <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
