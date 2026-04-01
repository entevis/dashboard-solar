import { requireAuth, buildPlantAccessFilter } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { PlantFilterBar } from "@/components/power-plants/plant-filter-bar";
import { PlantTable } from "@/components/power-plants/plant-table";
import { EmptyState } from "@/components/ui/empty-state";
import { UserRole } from "@prisma/client";
import { Zap, SearchX } from "lucide-react";

interface Props {
  params: Promise<{ portfolioId: string }>;
  searchParams: Promise<{ q?: string; customerId?: string }>;
}

export default async function PowerPlantsPage({ params, searchParams }: Props) {
  const { portfolioId } = await params;
  const pid = parseInt(portfolioId);
  const user = await requireAuth();
  const sParams = await searchParams;

  const filter = await buildPlantAccessFilter(user);

  const where = {
    ...filter,
    portfolioId: pid,
    ...(sParams.q ? { name: { contains: sParams.q, mode: "insensitive" as const } } : {}),
    ...(sParams.customerId ? { customerId: parseInt(sParams.customerId) } : {}),
  };

  const [plants, customers] = await Promise.all([
    prisma.powerPlant.findMany({
      where,
      include: {
        portfolio: { select: { name: true } },
        customer: { select: { name: true } },
        address: true,
      },
      orderBy: { name: "asc" },
    }),
    prisma.customer.findMany({ where: { active: 1 }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  const canEdit = user.role === UserRole.MAESTRO;
  const hasFilters = !!(sParams.q || sParams.customerId);

  return (
    <div className="flex flex-col flex-1 min-h-0 gap-4">
      <div className="flex-shrink-0 space-y-4">
        <div>
          <h1 className="text-lg font-bold text-[var(--color-foreground)]">Plantas Solares</h1>
          <p className="text-[13px] text-[var(--color-muted-foreground)]">
            {plants.length} {plants.length === 1 ? "planta encontrada" : "plantas encontradas"}
          </p>
        </div>
        {/* portfolios vacío: ya estamos en el contexto de uno */}
        <PlantFilterBar portfolios={[]} customers={customers} hidePortfolioFilter />
      </div>

      <div className="flex-1 min-h-0 overflow-hidden border border-[var(--color-border)] rounded-xl bg-white shadow-sm flex flex-col">
        {plants.length === 0 ? (
          <EmptyState
            icon={hasFilters ? SearchX : Zap}
            title={hasFilters ? "Sin resultados" : "Sin plantas asignadas"}
            description={
              hasFilters
                ? "Ninguna planta coincide con los filtros aplicados."
                : "Las plantas solares que gestiones aparecerán aquí."
            }
          />
        ) : (
          <PlantTable plants={plants} portfolios={[]} customers={customers} canEdit={canEdit} />
        )}
      </div>
    </div>
  );
}
