import Image from "next/image";
import { Briefcase } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  logoUrl: string | null;
  name: string;
  size?: number;
  className?: string;
}

export function PortfolioLogo({ logoUrl, name, size = 48, className }: Props) {
  const isSmall = size <= 24;
  const isTiny = size <= 20;

  const containerClass = cn(
    "shrink-0 flex items-center justify-center overflow-hidden",
    !isSmall && "bg-white border border-[var(--color-border)] shadow-sm",
    className
  );

  const radiusStyle = {
    borderRadius:
      size >= 48 ? "10px"
      : size >= 28 ? "8px"
      : size >= 24 ? "6px"
      : "4px",
    width: size,
    height: size,
  };

  if (logoUrl) {
    return (
      <div className={containerClass} style={radiusStyle}>
        <Image
          src={logoUrl}
          alt={`Logo ${name}`}
          width={size}
          height={size}
          className="object-contain"
          style={{ padding: isSmall ? 0 : "6px" }}
        />
      </div>
    );
  }

  // Fallback: initials or icon
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  return (
    <div
      className={cn(containerClass, "bg-[var(--color-primary)]/10 text-[var(--color-primary)]")}
      style={radiusStyle}
    >
      {isTiny ? (
        <Briefcase style={{ width: size * 0.55, height: size * 0.55 }} />
      ) : (
        <span style={{ fontSize: size * 0.32, fontWeight: 600 }}>{initials}</span>
      )}
    </div>
  );
}
