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
  params: Promise<{ portfolioId: string; powerPlantId: string }>;
}

export default async function PortfolioPlantDetailPage({ params }: Props) {
  const { portfolioId, powerPlantId } = await params;
  const pid = parseInt(portfolioId);
  const id = parseInt(powerPlantId);
  const user = await requireAuth();

  const accessibleIds = await getAccessiblePowerPlantIds(user);
  if (accessibleIds !== "all" && !accessibleIds.includes(id)) {
    notFound();
  }

  const plant = await prisma.powerPlant.findUnique({
    where: { id, active: 1, portfolioId: pid },
    include: {
      portfolio: { select: { id: true, name: true } },
      customer: { select: { name: true, rut: true } },
      address: true,
    },
  });

  if (!plant) notFound();

  const canEdit = user.role === UserRole.MAESTRO;
  const base = `/${pid}/power-plants/${plant.id}`;

  return (
    <div className="space-y-6">
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
          className={`text-[12px] ${
            plant.status === "active"
              ? "bg-[var(--color-success)]/10 text-[var(--color-success)]"
              : "bg-[var(--color-warning)]/10 text-[var(--color-warning)]"
          }`}
        >
          {plant.status === "active" ? "Activa" : "En mantenimiento"}
        </Badge>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview" asChild>
            <Link href={base}>General</Link>
          </TabsTrigger>
          <TabsTrigger value="generation" asChild>
            <Link href={`${base}/generation`}>Reportes</Link>
          </TabsTrigger>
          <TabsTrigger value="billing" asChild>
            <Link href={`${base}/billing`}>Facturación</Link>
          </TabsTrigger>
          <TabsTrigger value="contingencies" asChild>
            <Link href={`${base}/contingencies`}>Contingencias</Link>
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <PlantDetailPanel plant={plant} canEdit={canEdit} />
    </div>
  );
}
