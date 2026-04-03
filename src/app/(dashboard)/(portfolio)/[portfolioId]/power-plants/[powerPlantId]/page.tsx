import { requireAuth, getAccessiblePowerPlantIds } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import Chip from "@mui/material/Chip";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
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
        <Chip
          label={plant.status === "active" ? "Activa" : "En mantenimiento"}
          size="small"
          sx={plant.status === "active"
            ? { backgroundColor: "#dbe1ff", color: "#0d1c2e", fontWeight: 600 }
            : { backgroundColor: "#e6eeff", color: "#434655", fontWeight: 500 }}
        />
      </Box>

      <Tabs value="overview" sx={{ borderBottom: 1, borderColor: "divider" }}>
        <Tab label="General" value="overview" component={Link} href={base} />
        <Tab label="Reportes" value="generation" component={Link} href={`${base}/generation`} />
        <Tab label="Contingencias" value="contingencies" component={Link} href={`${base}/contingencies`} />
      </Tabs>

      <PlantDetailPanel plant={plant} canEdit={canEdit} />
    </Box>
  );
}
