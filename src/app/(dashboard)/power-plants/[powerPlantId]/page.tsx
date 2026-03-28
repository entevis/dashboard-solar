import { requireAuth, getAccessiblePowerPlantIds } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PortfolioLogo } from "@/components/ui/portfolio-logo";
import { getPortfolioLogo } from "@/lib/portfolio-logos";
import { PlantDetailPanel } from "@/components/power-plants/plant-detail-panel";
import { UserRole } from "@prisma/client";

interface Props {
  params: Promise<{ powerPlantId: string }>;
}

export default async function PowerPlantDetailPage({ params }: Props) {
  const { powerPlantId } = await params;
  const id = parseInt(powerPlantId);
  const user = await requireAuth();

  const accessibleIds = await getAccessiblePowerPlantIds(user);
  if (accessibleIds !== "all" && !accessibleIds.includes(id)) {
    notFound();
  }

  const plant = await prisma.powerPlant.findUnique({
    where: { id, active: 1 },
    include: {
      portfolio: { select: { id: true, name: true } },
      customer: { select: { name: true, rut: true } },
      address: true,
    },
  });

  if (!plant) notFound();

  const canEdit = user.role === UserRole.MAESTRO;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-lg font-bold text-[var(--color-foreground)]">
            {plant.name}
          </h1>
          <div className="flex items-center gap-1.5 text-[13px] text-[var(--color-muted-foreground)]">
            <PortfolioLogo
              logoUrl={getPortfolioLogo(plant.portfolio.id)}
              name={plant.portfolio.name}
              size={20}
            />
            <span>{plant.customer.name} · {plant.portfolio.name}</span>
          </div>
        </div>
        <Badge
          variant="secondary"
          className={`text-[11px] ${
            plant.status === "active"
              ? "bg-[var(--color-success)]/10 text-[var(--color-success)]"
              : "bg-[var(--color-warning)]/10 text-[var(--color-warning)]"
          }`}
        >
          {plant.status === "active" ? "Activa" : "En mantenimiento"}
        </Badge>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview" asChild>
            <Link href={`/power-plants/${plant.id}`}>General</Link>
          </TabsTrigger>
          <TabsTrigger value="generation" asChild>
            <Link href={`/power-plants/${plant.id}/generation`}>Reportes</Link>
          </TabsTrigger>
          <TabsTrigger value="billing" asChild>
            <Link href={`/power-plants/${plant.id}/billing`}>Facturación</Link>
          </TabsTrigger>
          <TabsTrigger value="contingencies" asChild>
            <Link href={`/power-plants/${plant.id}/contingencies`}>Contingencias</Link>
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Detail panel (view/edit) */}
      <PlantDetailPanel plant={plant} canEdit={canEdit} />
    </div>
  );
}
