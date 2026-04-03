import { requireAuth } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { UserRole } from "@prisma/client";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import { PortfolioLogo } from "@/components/ui/portfolio-logo";
import { getPortfolioLogo } from "@/lib/portfolio-logos";
import { PortfolioDetailClient } from "@/components/portfolios/portfolio-detail-client";

interface Props {
  params: Promise<{ portfolioId: string }>;
}

export default async function PortfolioDetailPage({ params }: Props) {
  const { portfolioId } = await params;
  const pid = parseInt(portfolioId);
  const user = await requireAuth();

  const portfolio = await prisma.portfolio.findUnique({
    where: { id: pid, active: 1 },
    include: {
      bankAccount: true,
      _count: {
        select: {
          powerPlants: { where: { active: 1 } },
          users: { where: { active: 1 } },
        },
      },
    },
  });

  if (!portfolio) notFound();

  const canEdit = user.role === UserRole.MAESTRO;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
        <PortfolioLogo logoUrl={getPortfolioLogo(portfolio.id)} name={portfolio.name} size={36} />
        <Box sx={{ flex: 1 }}>
          <Typography variant="h5" fontWeight={700} color="text.primary">{portfolio.name}</Typography>
          {portfolio.description && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>{portfolio.description}</Typography>
          )}
        </Box>
        <Chip
          label={`${portfolio._count.powerPlants} ${portfolio._count.powerPlants === 1 ? "planta" : "plantas"}`}
          size="small"
          sx={{ backgroundColor: "#eff4ff", color: "text.secondary", fontWeight: 500 }}
        />
      </Box>

      <PortfolioDetailClient portfolio={portfolio} canEdit={canEdit} />
    </Box>
  );
}
