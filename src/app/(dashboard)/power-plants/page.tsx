import { requireAuth, buildPlantAccessFilter } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { PlantFilterBar } from "@/components/power-plants/plant-filter-bar";
import { PlantTable } from "@/components/power-plants/plant-table";
import { CreatePlantDialog } from "@/components/power-plants/create-plant-dialog";
import { UserRole } from "@prisma/client";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import BoltOutlinedIcon from "@mui/icons-material/BoltOutlined";
import SearchOffOutlinedIcon from "@mui/icons-material/SearchOffOutlined";

interface Props {
  searchParams: Promise<{ q?: string; portfolioId?: string; customerId?: string }>;
}

export default async function PowerPlantsPage({ searchParams }: Props) {
  const user = await requireAuth();
  const params = await searchParams;
  const filter = await buildPlantAccessFilter(user);

  const where = {
    ...filter,
    ...(params.q ? { name: { contains: params.q, mode: "insensitive" as const } } : {}),
    ...(params.portfolioId ? { portfolioId: parseInt(params.portfolioId) } : {}),
    ...(params.customerId ? { customerId: parseInt(params.customerId) } : {}),
  };

  const [plants, portfolios, customers] = await Promise.all([
    prisma.powerPlant.findMany({
      where,
      include: {
        portfolio: { select: { name: true } },
        customer: { select: { name: true } },
        address: true,
      },
      orderBy: { name: "asc" },
    }),
    prisma.portfolio.findMany({ where: { active: 1 }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.customer.findMany({ where: { active: 1 }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  const canEdit = user.role === UserRole.MAESTRO;
  const isCliente = user.role === UserRole.CLIENTE || user.role === UserRole.CLIENTE_PERFILADO;
  const hasFilters = !!(params.q || params.portfolioId || params.customerId);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3, flex: 1, minHeight: 0 }}>
      <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, alignItems: { sm: "flex-end" }, justifyContent: "space-between", gap: 2, flexShrink: 0 }}>
        <Box>
          <Typography variant="h5" fontWeight={700} color="text.primary">Plantas Solares</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
            {plants.length} {plants.length === 1 ? "planta encontrada" : "plantas encontradas"}
          </Typography>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <PlantFilterBar portfolios={portfolios} customers={customers} hidePortfolioFilter={isCliente} hideCustomerFilter={isCliente} />
          {canEdit && <CreatePlantDialog portfolios={portfolios} customers={customers} />}
        </Box>
      </Box>

      <Box sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, backgroundColor: "white", overflow: "hidden", display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
        {plants.length === 0 ? (
          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", py: 10, gap: 1.5 }}>
            {hasFilters
              ? <SearchOffOutlinedIcon sx={{ fontSize: 36, color: "text.disabled" }} />
              : <BoltOutlinedIcon sx={{ fontSize: 36, color: "text.disabled" }} />
            }
            <Typography fontSize="0.875rem" color="text.secondary">
              {hasFilters ? "Ninguna planta coincide con los filtros aplicados." : "Las plantas solares que gestiones aparecerán aquí."}
            </Typography>
          </Box>
        ) : (
          <PlantTable plants={plants} portfolios={portfolios} customers={customers} canEdit={canEdit} />
        )}
      </Box>
    </Box>
  );
}
