"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useRef, useTransition } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search } from "lucide-react";

interface Option { id: number; name: string }

interface Props {
  portfolios: Option[];
  customers: Option[];
}

export function PlantFilterBar({ portfolios, customers }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "_all") {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    startTransition(() => {
      router.push(`/power-plants?${params.toString()}`);
    });
  }

  function handleSearch(e: React.ChangeEvent<HTMLInputElement>) {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      updateParam("q", e.target.value);
    }, 350);
  }

  return (
    <div className="flex flex-col sm:flex-row flex-wrap gap-2 items-stretch sm:items-center">
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--color-muted-foreground)]" />
        <Input
          ref={inputRef}
          defaultValue={searchParams.get("q") ?? ""}
          onChange={handleSearch}
          placeholder="Buscar planta..."
          className="pl-8 h-9 text-[13px] w-full sm:w-52"
        />
      </div>

      <Select
        defaultValue={searchParams.get("portfolioId") ?? "_all"}
        onValueChange={(v) => updateParam("portfolioId", v)}
      >
        <SelectTrigger className="h-9 text-[13px] w-full sm:w-44">
          <SelectValue placeholder="Portafolio" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="_all">Todos los portafolios</SelectItem>
          {portfolios.map((p) => (
            <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        defaultValue={searchParams.get("customerId") ?? "_all"}
        onValueChange={(v) => updateParam("customerId", v)}
      >
        <SelectTrigger className="h-9 text-[13px] w-full sm:w-52">
          <SelectValue placeholder="Cliente" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="_all">Todos los clientes</SelectItem>
          {customers.map((c) => (
            <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {isPending && (
        <span className="text-[12px] text-[var(--color-muted-foreground)]">Filtrando...</span>
      )}
    </div>
  );
}
