import Link from "next/link";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Zap, Users } from "lucide-react";

interface PortfolioSummaryCardProps {
  name: string;
  plantCount: number;
  totalCapacityKw: number;
  activePlants: number;
  customerCount: number;
  logoUrl: string | null;
  href: string;
}

export function PortfolioSummaryCard({
  name,
  plantCount,
  totalCapacityKw,
  activePlants,
  customerCount,
  logoUrl,
  href,
}: PortfolioSummaryCardProps) {
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  return (
    <Link href={href} className="block group">
      <Card className="border-[var(--color-border)] shadow-sm transition-all duration-200 group-hover:shadow-md group-hover:border-[var(--color-primary)]/30">
        <CardContent className="p-4 space-y-3">
          {/* Header: logo + name */}
          <div className="flex items-center gap-3">
            <div
              className="shrink-0 overflow-hidden rounded-[8px] bg-[var(--color-secondary)] flex items-center justify-center"
              style={{ width: 88, height: 40 }}
            >
              {logoUrl ? (
                <Image
                  src={logoUrl}
                  alt={`Logo ${name}`}
                  width={88}
                  height={40}
                  className="w-full h-full object-contain"
                />
              ) : (
                <span
                  className="text-[13px] font-semibold text-[var(--color-primary)]"
                >
                  {initials}
                </span>
              )}
            </div>
            <h3 className="text-[14px] font-semibold text-[var(--color-foreground)] truncate">
              {name}
            </h3>
          </div>

          {/* Separator */}
          <div className="border-t border-[var(--color-border)]/60" />

          {/* Stats grid */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <p className="text-[11px] text-[var(--color-muted-foreground)] mb-0.5">
                clientes
              </p>
              <p className="text-[18px] font-bold text-[var(--color-foreground)] leading-none">
                {customerCount}
              </p>
            </div>
            <div>
              <p className="text-[11px] text-[var(--color-muted-foreground)] mb-0.5">
                plantas activas
              </p>
              <p className="text-[18px] font-bold text-[var(--color-foreground)] leading-none">
                {activePlants}
              </p>
            </div>
            <div>
              <p className="text-[11px] text-[var(--color-muted-foreground)] mb-0.5">
                capacidad
              </p>
              <div className="flex items-baseline gap-1 leading-none">
                <Zap className="w-3 h-3 text-[var(--color-warning)] shrink-0 mb-0.5" />
                <p className="text-[18px] font-bold text-[var(--color-foreground)]">
                  {Math.round(totalCapacityKw).toLocaleString("es-CL")}
                  <span className="text-[11px] font-normal text-[var(--color-muted-foreground)] ml-0.5">
                    kW
                  </span>
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
