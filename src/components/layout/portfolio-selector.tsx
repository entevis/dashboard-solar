"use client";

import { usePathname, useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Building2 } from "lucide-react";

interface Portfolio {
  id: number;
  name: string;
}

interface Props {
  portfolios: Portfolio[];
  selectedPortfolioId?: number | null;
}

const COOKIE_NAME = "portfolio_id";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 días

export function PortfolioSelector({ portfolios, selectedPortfolioId }: Props) {
  const router = useRouter();
  const pathname = usePathname();

  // Prefer portfolioId from URL over cookie
  const urlMatch = pathname.match(/^\/(\d+)(\/|$)/);
  const currentId = urlMatch ? parseInt(urlMatch[1]) : selectedPortfolioId;

  function handleChange(value: string) {
    const id = parseInt(value);
    document.cookie = `${COOKIE_NAME}=${id}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;
    router.push(`/${id}/power-plants`);
    router.refresh();
  }

  return (
    <Select
      value={currentId ? String(currentId) : ""}
      onValueChange={handleChange}
    >
      <SelectTrigger className="h-8 text-[13px] w-48 border-(--color-border) bg-[var(--color-secondary)]">
        <div className="flex items-center gap-2 min-w-0">
          <Building2 className="w-3.5 h-3.5 text-(--color-muted-foreground) shrink-0" />
          <SelectValue placeholder="Seleccionar portafolio" />
        </div>
      </SelectTrigger>
      <SelectContent>
        {portfolios.map((p) => (
          <SelectItem key={p.id} value={String(p.id)} className="text-[13px]">
            {p.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
