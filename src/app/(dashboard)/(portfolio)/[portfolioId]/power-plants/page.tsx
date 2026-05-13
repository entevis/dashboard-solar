import { requireAuth, buildPlantAccessFilter } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { PlantFilterBar } from "@/components/power-plants/plant-filter-bar";
import { PlantTable } from "@/components/power-plants/plant-table";
import { PlantCards } from "@/components/power-plants/plant-cards";
import { ExportPlantsButton } from "@/components/power-plants/export-plants-button";
import { CreatePlantDialog } from "@/components/power-plants/create-plant-dialog";
import { UserRole } from "@prisma/client";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import BoltOutlinedIcon from "@mui/icons-material/BoltOutlined";
import SearchOffOutlinedIcon from "@mui/icons-material/SearchOffOutlined";

interface Props {
  params: Promise<{ portfolioId: string }>;
  searchParams: Promise<{ q?: string; customerId?: string }>;
}

export default async function PowerPlantsPage({ params, searchParams }: Props) {
  const { portfolioId } = await params;
  const pid = parseInt(portfolioId);
  const user = await requireAuth();
  const sParams = await searchParams;
  const isMaestro = user.role === UserRole.MAESTRO;

  const filter = await buildPlantAccessFilter(user);

  const where = {
    ...filter,
    portfolioId: pid,
    ...(sParams.q ? { name: { contains: sParams.q, mode: "insensitive" as const } } : {}),
    ...(sParams.customerId ? { customerId: parseInt(sParams.customerId) } : {}),
  };

  const [plants, filterCustomers, allCustomers, portfolio] = await Promise.all([
    prisma.powerPlant.findMany({
      where,
      include: {
        portfolio: { select: { name: true } },
        customer: { select: { name: true } },
        address: true,
        plantNames: { where: { active: 1 }, select: { name: true }, orderBy: { name: "asc" } },
      },
      orderBy: { name: "asc" },
    }),
    prisma.customer.findMany({
      where: { active: 1, powerPlants: { some: { portfolioId: pid, active: 1 } } },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    isMaestro
      ? prisma.customer.findMany({ where: { active: 1 }, select: { id: true, name: true }, orderBy: { name: "asc" } })
      : Promise.resolve([] as { id: number; name: string }[]),
    isMaestro
      ? prisma.portfolio.findUnique({ where: { id: pid }, select: { name: true } })
      : Promise.resolve(null),
  ]);

  const canEdit = isMaestro;
  const hasFilters = !!(sParams.q || sParams.customerId);

  const emptyState = (
    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", py: 10, gap: 1.5 }}>
      {hasFilters
        ? <SearchOffOutlinedIcon sx={{ fontSize: 36, color: "text.disabled" }} />
        : <BoltOutlinedIcon sx={{ fontSize: 36, color: "text.disabled" }} />
      }
      <Typography fontSize="0.875rem" color="text.secondary">
        {hasFilters ? "Ninguna planta coincide con los filtros aplicados." : "Las plantas solares que gestiones aparecerán aquí."}
      </Typography>
    </Box>
  );

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3, flex: 1, minHeight: 0 }}>
      <Box>
        <Typography variant="h5" fontWeight={700} color="text.primary">Plantas Fotovoltaicas</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
          {plants.length} {plants.length === 1 ? "planta encontrada" : "plantas encontradas"}
        </Typography>
      </Box>

      <PlantFilterBar
        portfolios={[]}
        customers={filterCustomers}
        hidePortfolioFilter
        actions={canEdit ? (
          <Box sx={{ display: "flex", gap: 1 }}>
            <ExportPlantsButton />
            <CreatePlantDialog portfolios={[]} customers={allCustomers} fixedPortfolioId={pid} fixedPortfolioName={portfolio?.name} />
          </Box>
        ) : undefined}
      />

      {isMaestro ? (
        <Box sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, backgroundColor: "white", overflow: "hidden", display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
          {plants.length === 0 ? emptyState : (
            <PlantTable plants={plants} portfolios={[]} customers={filterCustomers} canEdit={false} />
          )}
        </Box>
      ) : plants.length === 0 ? emptyState : (
        <PlantCards plants={plants} />
      )}
    </Box>
  );
}
