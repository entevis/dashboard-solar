"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Building2 } from "lucide-react";

interface Portfolio {
  id: number;
  name: string;
  plantCount: number;
}

const COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

export function SelectPortfolioForm({ portfolios }: { portfolios: Portfolio[] }) {
  const [selected, setSelected] = useState("");
  const router = useRouter();

  function handleContinue() {
    if (!selected) return;
    document.cookie = `portfolio_id=${selected}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;
    router.push(`/${selected}/power-plants`);
  }

  return (
    <div className="w-full space-y-4">
      {/* Portfolio list as selectable cards */}
      <div className="space-y-2">
        {portfolios.map((p) => (
          <button
            key={p.id}
            onClick={() => setSelected(String(p.id))}
            className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl border-2 text-left transition-all duration-150 ${
              selected === String(p.id)
                ? "border-[var(--color-primary)] bg-[var(--color-primary)]/5"
                : "border-[var(--color-border)] bg-white hover:border-[var(--color-primary)]/40 hover:bg-[var(--color-primary)]/3"
            }`}
          >
            <div
              className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                selected === String(p.id)
                  ? "bg-[var(--color-primary)] text-white"
                  : "bg-[var(--color-primary)]/10 text-[var(--color-primary)]"
              }`}
            >
              <Building2 className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-[14px] font-semibold truncate ${selected === String(p.id) ? "text-[var(--color-primary)]" : "text-[var(--color-foreground)]"}`}>
                {p.name}
              </p>
              <p className="text-[12px] text-[var(--color-muted-foreground)]">
                {p.plantCount} {p.plantCount === 1 ? "planta" : "plantas"}
              </p>
            </div>
            <div className={`w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center transition-colors ${
              selected === String(p.id)
                ? "border-[var(--color-primary)] bg-[var(--color-primary)]"
                : "border-[var(--color-border)]"
            }`}>
              {selected === String(p.id) && (
                <div className="w-1.5 h-1.5 rounded-full bg-white" />
              )}
            </div>
          </button>
        ))}
      </div>

      <button
        onClick={handleContinue}
        disabled={!selected}
        className="group w-full flex items-center justify-center gap-2 h-11 px-6 rounded-xl bg-[var(--color-primary)] text-white text-[14px] font-semibold transition-all hover:bg-[var(--color-primary)]/90 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100 shadow-sm hover:shadow-md"
      >
        Continuar
        <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-disabled:translate-x-0" />
      </button>
    </div>
  );
}
