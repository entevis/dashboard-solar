import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { buildPlantAccessFilter } from "@/lib/auth/guards";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const portfolioIdRaw = searchParams.get("portfolioId");
  const customerIdRaw = searchParams.get("customerId");

  const plantFilter = await buildPlantAccessFilter(user);
  const where: Record<string, unknown> = { ...plantFilter };

  if (portfolioIdRaw) where.portfolioId = parseInt(portfolioIdRaw);
  if (customerIdRaw) where.customerId = parseInt(customerIdRaw);

  const plants = await prisma.powerPlant.findMany({
    where,
    include: {
      portfolio: { select: { name: true } },
      customer: { select: { name: true } },
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(plants);
}
