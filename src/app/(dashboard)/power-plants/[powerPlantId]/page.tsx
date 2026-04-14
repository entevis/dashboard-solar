import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";

interface Props {
  params: Promise<{ powerPlantId: string }>;
}

/**
 * Redirect legacy /power-plants/:id URLs to the portfolio-scoped version.
 */
export default async function PowerPlantRedirect({ params }: Props) {
  const { powerPlantId } = await params;
  const id = parseInt(powerPlantId);
  if (isNaN(id)) notFound();

  const plant = await prisma.powerPlant.findUnique({
    where: { id, active: 1 },
    select: { portfolioId: true },
  });

  if (!plant) notFound();

  redirect(`/${plant.portfolioId}/power-plants/${id}`);
}
