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
    router.push(`/dashboard`);
  }

  function handleKeyDown(e: React.KeyboardEvent, id: string) {
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      setSelected(id);
    }
  }

  return (
    <div className="w-full space-y-4">
      <fieldset>
        <legend className="sr-only">Portafolios disponibles</legend>
        <div role="radiogroup" aria-label="Seleccionar portafolio" className="space-y-2">
          {portfolios.map((p) => {
            const isSelected = selected === String(p.id);
            return (
              <div
                key={p.id}
                role="radio"
                aria-checked={isSelected}
                tabIndex={0}
                onClick={() => setSelected(String(p.id))}
                onKeyDown={(e) => handleKeyDown(e, String(p.id))}
                className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl cursor-pointer text-left transition-all duration-150 outline-none
                  focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2
                  ${isSelected
                    ? "bg-[var(--color-primary-fixed)] ring-2 ring-[var(--color-primary)]"
                    : "bg-[var(--color-surface-container-low)] hover:bg-[var(--color-surface-container)]"
                  }`}
              >
                <div
                  aria-hidden="true"
                  className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                    isSelected
                      ? "bg-[var(--color-primary)] text-white"
                      : "bg-[var(--color-primary-fixed)] text-[var(--color-primary)]"
                  }`}
                >
                  <Building2 className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-[14px] font-semibold truncate ${
                    isSelected ? "text-[var(--color-primary)]" : "text-[var(--color-on-surface)]"
                  }`}>
                    {p.name}
                  </p>
                  <p className="text-[12px] text-[var(--color-on-surface-variant)]">
                    {p.plantCount} {p.plantCount === 1 ? "planta" : "plantas"}
                  </p>
                </div>
                {/* Visual radio indicator */}
                <div
                  aria-hidden="true"
                  className={`w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center transition-colors ${
                    isSelected
                      ? "border-[var(--color-primary)] bg-[var(--color-primary)]"
                      : "border-[var(--color-outline-variant)]"
                  }`}
                >
                  {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                </div>
              </div>
            );
          })}
        </div>
      </fieldset>

      <button
        onClick={handleContinue}
        disabled={!selected}
        aria-disabled={!selected}
        className="group w-full flex items-center justify-center gap-2 h-11 px-6 rounded-xl bg-[var(--color-primary-container)] text-white text-[14px] font-semibold transition-all
          hover:bg-[var(--color-primary)] active:scale-[0.98]
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2
          disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100
          shadow-sm hover:shadow-md"
      >
        Continuar
        <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
      </button>
    </div>
  );
}
