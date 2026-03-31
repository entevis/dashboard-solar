import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Leaf, TreePine, Car } from "lucide-react";

interface EnvironmentalImpactProps {
  co2Tonnes: number;
  equivalentTrees: number;
  equivalentCars: number;
}

export function EnvironmentalImpact({
  co2Tonnes,
  equivalentTrees,
  equivalentCars,
}: EnvironmentalImpactProps) {
  return (
    <Card className="border-[var(--color-border)] shadow-sm">
      <CardHeader className="pb-3">
        <h3 className="text-[14px] font-medium text-[var(--color-foreground)]">
          Impacto medioambiental
        </h3>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="w-10 h-10 rounded-lg bg-[var(--color-success)]/10 flex items-center justify-center mx-auto mb-2">
              <Leaf className="w-5 h-5 text-[var(--color-success)]" />
            </div>
            <p className="text-lg font-bold text-[var(--color-foreground)]">
              {co2Tonnes.toFixed(1)}
            </p>
            <p className="text-[12px] text-[var(--color-muted-foreground)]">
              ton CO2 evitadas
            </p>
          </div>
          <div className="text-center">
            <div className="w-10 h-10 rounded-lg bg-[var(--color-success)]/10 flex items-center justify-center mx-auto mb-2">
              <TreePine className="w-5 h-5 text-[var(--color-success)]" />
            </div>
            <p className="text-lg font-bold text-[var(--color-foreground)]">
              {equivalentTrees.toLocaleString("es-CL")}
            </p>
            <p className="text-[12px] text-[var(--color-muted-foreground)]">
              árboles equivalentes
            </p>
          </div>
          <div className="text-center">
            <div className="w-10 h-10 rounded-lg bg-[var(--color-success)]/10 flex items-center justify-center mx-auto mb-2">
              <Car className="w-5 h-5 text-[var(--color-success)]" />
            </div>
            <p className="text-lg font-bold text-[var(--color-foreground)]">
              {equivalentCars}
            </p>
            <p className="text-[12px] text-[var(--color-muted-foreground)]">
              autos retirados
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
