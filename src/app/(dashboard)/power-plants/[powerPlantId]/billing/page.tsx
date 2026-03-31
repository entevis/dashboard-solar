import { requireAuth, getAccessiblePowerPlantIds } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";

interface Props {
  params: Promise<{ powerPlantId: string }>;
}

export default async function PlantBillingPage({ params }: Props) {
  const { powerPlantId } = await params;
  const id = parseInt(powerPlantId);
  const user = await requireAuth();

  const accessibleIds = await getAccessiblePowerPlantIds(user);
  if (accessibleIds !== "all" && !accessibleIds.includes(id)) {
    notFound();
  }

  // Billing is now managed at the customer level — redirect to main billing page
  redirect("/billing");
}
