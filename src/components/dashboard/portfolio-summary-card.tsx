import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Zap } from "lucide-react";

interface PortfolioSummaryCardProps {
  name: string;
  plantCount: number;
  totalCapacityKw: number;
  activePlants: number;
}

export function PortfolioSummaryCard({
  name,
  plantCount,
  totalCapacityKw,
  activePlants,
}: PortfolioSummaryCardProps) {
  return (
    <Card className="border-[var(--color-border)] shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <h3 className="text-[14px] font-medium text-[var(--color-foreground)]">
            {name}
          </h3>
          <Badge
            variant="secondary"
            className="text-[11px] bg-[var(--color-success)]/10 text-[var(--color-success)]"
          >
            {activePlants} activas
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-[11px] text-[var(--color-muted-foreground)]">
              Plantas
            </p>
            <p className="text-lg font-bold text-[var(--color-foreground)]">
              {plantCount}
            </p>
          </div>
          <div>
            <p className="text-[11px] text-[var(--color-muted-foreground)]">
              Capacidad
            </p>
            <div className="flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-[var(--color-warning)]" />
              <p className="text-lg font-bold text-[var(--color-foreground)]">
                {Math.round(totalCapacityKw)} kW
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
