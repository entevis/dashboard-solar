import { requireAuth, getAccessiblePowerPlantIds } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { PortfolioLogo } from "@/components/ui/portfolio-logo";
import { getPortfolioLogo } from "@/lib/portfolio-logos";
import { PlantTabsClient } from "@/components/power-plants/plant-tabs-client";
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
      plantNames: { where: { active: 1 }, select: { name: true }, orderBy: { name: "asc" } },
    },
  });

  if (!plant) notFound();

  const canEdit = user.role === UserRole.MAESTRO;
  const base = `/${pid}/power-plants/${plant.id}`;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <Box>
          <Typography variant="h5" fontWeight={700} color="text.primary">{plant.name}</Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mt: 0.5 }}>
            <PortfolioLogo logoUrl={getPortfolioLogo(plant.portfolio.id)} name={plant.portfolio.name} size={20} />
            <Typography variant="body2" color="text.secondary">
              {plant.customer.name} · {plant.portfolio.name}
            </Typography>
          </Box>
        </Box>
      </Box>

      <PlantTabsClient plant={plant} canEdit={canEdit} base={base} />
    </Box>
  );
}
