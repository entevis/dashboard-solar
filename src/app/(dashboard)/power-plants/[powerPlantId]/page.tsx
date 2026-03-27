import { requireAuth, getAccessiblePowerPlantIds } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Zap, MapPin, Building2, User } from "lucide-react";

interface Props {
  params: Promise<{ powerPlantId: string }>;
}

export default async function PowerPlantDetailPage({ params }: Props) {
  const { powerPlantId } = await params;
  const id = parseInt(powerPlantId);
  const user = await requireAuth();

  // Verify access
  const accessibleIds = await getAccessiblePowerPlantIds(user);
  if (accessibleIds !== "all" && !accessibleIds.includes(id)) {
    notFound();
  }

  const plant = await prisma.powerPlant.findUnique({
    where: { id, active: 1 },
    include: {
      portfolio: { select: { name: true } },
      customer: { select: { name: true, rut: true } },
    },
  });

  if (!plant) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-lg font-bold text-[var(--color-foreground)]">
            {plant.name}
          </h1>
          <p className="text-[13px] text-[var(--color-muted-foreground)]">
            {plant.customer.name} - {plant.portfolio.name}
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
          {plant.status === "active" ? "Activa" : "En mantenimiento"}
        </Badge>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview" asChild>
            <Link href={`/power-plants/${plant.id}`}>General</Link>
          </TabsTrigger>
          <TabsTrigger value="generation" asChild>
            <Link href={`/power-plants/${plant.id}/generation`}>
              Generación
            </Link>
          </TabsTrigger>
          <TabsTrigger value="billing" asChild>
            <Link href={`/power-plants/${plant.id}/billing`}>
              Facturación
            </Link>
          </TabsTrigger>
          <TabsTrigger value="contingencies" asChild>
            <Link href={`/power-plants/${plant.id}/contingencies`}>
              Contingencias
            </Link>
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="border-[var(--color-border)] shadow-sm">
          <CardHeader className="pb-3">
            <h3 className="text-[14px] font-medium">Información de la planta</h3>
          </CardHeader>
          <CardContent className="pt-0 space-y-3">
            <div className="flex items-center gap-3">
              <Zap className="w-4 h-4 text-[var(--color-muted-foreground)]" />
              <div>
                <p className="text-[12px] text-[var(--color-muted-foreground)]">
                  Capacidad
                </p>
                <p className="text-[13px] font-medium">{plant.capacityKw} kW</p>
              </div>
            </div>
            {plant.location && (
              <div className="flex items-center gap-3">
                <MapPin className="w-4 h-4 text-[var(--color-muted-foreground)]" />
                <div>
                  <p className="text-[12px] text-[var(--color-muted-foreground)]">
                    Ubicación
                  </p>
                  <p className="text-[13px] font-medium">{plant.location}</p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-3">
              <Building2 className="w-4 h-4 text-[var(--color-muted-foreground)]" />
              <div>
                <p className="text-[12px] text-[var(--color-muted-foreground)]">
                  Portafolio
                </p>
                <p className="text-[13px] font-medium">{plant.portfolio.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <User className="w-4 h-4 text-[var(--color-muted-foreground)]" />
              <div>
                <p className="text-[12px] text-[var(--color-muted-foreground)]">
                  Propietario
                </p>
                <p className="text-[13px] font-medium">
                  {plant.customer.name} ({plant.customer.rut})
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
