import { requireAuth, buildPlantAccessFilter } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Zap, MapPin } from "lucide-react";

export default async function PowerPlantsPage() {
  const user = await requireAuth();
  const filter = await buildPlantAccessFilter(user);

  const plants = await prisma.powerPlant.findMany({
    where: filter,
    include: {
      portfolio: { select: { name: true } },
      customer: { select: { name: true, rut: true } },
    },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-bold text-[var(--color-foreground)]">
          Plantas Solares
        </h1>
        <p className="text-[13px] text-[var(--color-muted-foreground)]">
          {plants.length} plantas encontradas
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {plants.map((plant) => (
          <Link key={plant.id} href={`/power-plants/${plant.id}`}>
            <Card className="border-[var(--color-border)] shadow-sm hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-[14px] font-medium text-[var(--color-foreground)]">
                      {plant.name}
                    </h3>
                    <p className="text-[12px] text-[var(--color-muted-foreground)]">
                      {plant.customer.name}
                    </p>
                  </div>
                  <Badge
                    variant="secondary"
                    className={`text-[11px] ${
                      plant.status === "active"
                        ? "bg-[var(--color-success)]/10 text-[var(--color-success)]"
                        : "bg-[var(--color-warning)]/10 text-[var(--color-warning)]"
                    }`}
                  >
                    {plant.status === "active" ? "Activa" : "Mantenimiento"}
                  </Badge>
                </div>

                <div className="flex items-center gap-4 text-[12px] text-[var(--color-muted-foreground)]">
                  <div className="flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5" />
                    {plant.capacityKw} kW
                  </div>
                  {plant.location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" />
                      {plant.location}
                    </div>
                  )}
                </div>

                <div className="mt-3 pt-3 border-t border-[var(--color-border)]">
                  <p className="text-[11px] text-[var(--color-muted-foreground)]">
                    {plant.portfolio.name}
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {plants.length === 0 && (
        <div className="text-center py-12">
          <p className="text-[13px] text-[var(--color-muted-foreground)]">
            No tienes plantas asignadas
          </p>
        </div>
      )}
    </div>
  );
}
