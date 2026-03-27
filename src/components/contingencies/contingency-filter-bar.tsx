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

export function ContingencyFilterBar({ plants }: { plants: Option[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "_all") {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`/contingencies?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Select
        defaultValue={searchParams.get("powerPlantId") ?? "_all"}
        onValueChange={(v) => updateParam("powerPlantId", v)}
      >
        <SelectTrigger className="h-8 text-[13px] w-52">
          <SelectValue placeholder="Planta" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="_all">Todas las plantas</SelectItem>
          {plants.map((p) => (
            <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        defaultValue={searchParams.get("type") ?? "_all"}
        onValueChange={(v) => updateParam("type", v)}
      >
        <SelectTrigger className="h-8 text-[13px] w-40">
          <SelectValue placeholder="Tipo" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="_all">Todos los tipos</SelectItem>
          <SelectItem value="PREVENTIVE">Preventiva</SelectItem>
          <SelectItem value="CORRECTIVE">Correctiva</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
