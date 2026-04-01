import { redirect } from "next/navigation";

interface Props {
  params: Promise<{ portfolioId: string; contingencyId: string }>;
}

// The contingency detail page is not scoped to a specific portfolio.
// Redirect to the shared detail page which already enforces plant-level access.
export default async function PortfolioContingencyDetailPage({ params }: Props) {
  const { contingencyId } = await params;
  redirect(`/contingencies/${contingencyId}`);
}
