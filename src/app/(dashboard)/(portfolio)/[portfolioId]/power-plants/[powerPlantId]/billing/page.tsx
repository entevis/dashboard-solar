import { requireAuth, getAccessiblePowerPlantIds } from "@/lib/auth/guards";
import { notFound, redirect } from "next/navigation";

interface Props {
  params: Promise<{ portfolioId: string; powerPlantId: string }>;
}

export default async function PortfolioPlantBillingPage({ params }: Props) {
  const { portfolioId, powerPlantId } = await params;
  const pid = parseInt(portfolioId);
  const id = parseInt(powerPlantId);
  const user = await requireAuth();

  const accessibleIds = await getAccessiblePowerPlantIds(user);
  if (accessibleIds !== "all" && !accessibleIds.includes(id)) {
    notFound();
  }

  // Billing is managed at the portfolio level
  redirect(`/${pid}/billing`);
}
