import { redirect } from "next/navigation";

interface Props {
  params: Promise<{ portfolioId: string; powerPlantId: string }>;
}

export default async function PortfolioPlantGenerationPage({ params }: Props) {
  const { portfolioId, powerPlantId } = await params;
  redirect(`/${portfolioId}/power-plants/${powerPlantId}`);
}
