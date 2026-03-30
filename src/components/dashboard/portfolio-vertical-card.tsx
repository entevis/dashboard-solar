"use client";

import Link from "next/link";
import Image from "next/image";
import { Leaf, TreePine, Car, CheckCircle2, AlertTriangle, ArrowRight } from "lucide-react";
import { calculateEquivalentTrees, calculateEquivalentCars } from "@/lib/utils/co2";

const HEADER_COLOR = "#1E2A3A";

interface Props {
  name: string;
  description: string | null;
  logoUrl: string | null;
  customerCount: number;
  activePlants: number;
  totalCapacityKw: number;
  openContingencies: number;
  co2Avoided: number;
  href: string;
}

export function PortfolioVerticalCard({
  name,
  description,
  logoUrl,
  customerCount,
  activePlants,
  totalCapacityKw,
  openContingencies,
  co2Avoided,
  href,
}: Props) {
  const headerColor = HEADER_COLOR;
  const initials = name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
  const equivalentTrees = calculateEquivalentTrees(co2Avoided);
  const equivalentCars = calculateEquivalentCars(co2Avoided);

  return (
    <div className="flex flex-col rounded-[12px] border border-[var(--color-border)] bg-white shadow-sm overflow-hidden h-full">

      {/* Header */}
      <div className="p-6 pb-5" style={{ backgroundColor: headerColor }}>
        <div
          className="flex items-center justify-center rounded-[6px] mb-3 mx-auto"
          style={{ background: "rgba(255,255,255,0.15)", padding: "6px 10px", width: "100%", maxWidth: 160, height: 40 }}
        >
          {logoUrl ? (
            <Image
              src={logoUrl}
              alt={`Logo ${name}`}
              width={120}
              height={28}
              className="object-contain max-h-7"
            />
          ) : (
            <span className="text-[16px] font-bold text-white">{initials}</span>
          )}
        </div>
        <h3 className="text-[18px] font-semibold text-white leading-tight">{name}</h3>
        {description && (
          <p className="text-[12px] text-white/70 mt-1 line-clamp-2">{description}</p>
        )}
      </div>

      {/* Stats */}
      <div className="px-6 py-5 border-b border-[var(--color-border)]">
        <div className="grid grid-cols-3 divide-x divide-[var(--color-border)]">
          <div className="flex flex-col items-center gap-1 pr-4">
            <p className="text-[11px] uppercase tracking-wide text-[var(--color-muted-foreground)]">Clientes</p>
            <p className="text-[22px] font-semibold text-[var(--color-foreground)] leading-none">{customerCount}</p>
          </div>
          <div className="flex flex-col items-center gap-1 px-4">
            <p className="text-[11px] uppercase tracking-wide text-[var(--color-muted-foreground)]">Plantas</p>
            <p className="text-[22px] font-semibold text-[var(--color-foreground)] leading-none">{activePlants}</p>
          </div>
          <div className="flex flex-col items-center gap-1 pl-4">
            <p className="text-[11px] uppercase tracking-wide text-[var(--color-muted-foreground)]">Capacidad</p>
            <p className="text-[18px] font-semibold text-[var(--color-foreground)] leading-none">
              {Math.round(totalCapacityKw).toLocaleString("es-CL")}
              <span className="text-[13px] font-normal text-[var(--color-muted-foreground)] ml-0.5">kW</span>
            </p>
          </div>
        </div>
      </div>

      {/* Contingencias */}
      <div className="px-6 py-4 border-b border-[var(--color-border)]">
        {openContingencies === 0 ? (
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[var(--color-success)] shrink-0" />
            <span className="text-[13px] text-[var(--color-muted-foreground)]">
              <span className="font-semibold">0</span> Contingencias Abiertas
            </span>
          </div>
        ) : (
          <div
            className="flex items-center gap-2 rounded-[8px] px-3 py-2"
            style={{ background: "rgba(249,115,22,0.06)" }}
          >
            <AlertTriangle className="w-4 h-4 text-[var(--color-warning)] shrink-0" />
            <span className="text-[13px] font-bold text-[var(--color-warning)]">{openContingencies}</span>
            <span className="text-[13px] text-[var(--color-foreground)]">Contingencias Abiertas</span>
          </div>
        )}
      </div>

      {/* Impacto ambiental */}
      <div className="px-6 py-5 flex-1">
        <p className="text-[11px] uppercase tracking-wide text-[var(--color-muted-foreground)] mb-3">
          Impacto Medioambiental
        </p>
        <div className="space-y-2">
          <div className="flex items-center gap-2.5">
            <Leaf className="w-4 h-4 text-[var(--color-success)] shrink-0" />
            <span className="text-[14px] font-semibold text-[var(--color-foreground)]">{co2Avoided.toFixed(1)}</span>
            <span className="text-[13px] text-[var(--color-muted-foreground)]">t CO₂ evitadas</span>
          </div>
          <div className="flex items-center gap-2.5">
            <TreePine className="w-4 h-4 text-[var(--color-success)] shrink-0" />
            <span className="text-[14px] font-semibold text-[var(--color-foreground)]">{equivalentTrees.toLocaleString("es-CL")}</span>
            <span className="text-[13px] text-[var(--color-muted-foreground)]">árboles equivalentes</span>
          </div>
          <div className="flex items-center gap-2.5">
            <Car className="w-4 h-4 text-[var(--color-muted-foreground)] shrink-0" />
            <span className="text-[14px] font-semibold text-[var(--color-foreground)]">{equivalentCars.toFixed(1)}</span>
            <span className="text-[13px] text-[var(--color-muted-foreground)]">autos equivalentes</span>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="px-6 pb-6">
        <Link
          href={href}
          className="flex items-center justify-center gap-2 w-full h-10 rounded-[8px] border-[1.5px] border-[var(--color-border)] text-[13px] font-medium text-[var(--color-foreground)] transition-all duration-150 hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] hover:bg-[#2A6EF5]/4"
        >
          Ver detalle del portafolio
          <ArrowRight className="w-3.5 h-3.5 text-[var(--color-primary)]" />
        </Link>
      </div>
    </div>
  );
}
