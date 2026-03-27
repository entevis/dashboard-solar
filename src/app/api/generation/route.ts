import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { getAccessiblePowerPlantIds } from "@/lib/auth/guards";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const accessibleIds = await getAccessiblePowerPlantIds(user);
  const { searchParams } = new URL(request.url);
  const powerPlantIdParam = searchParams.get("powerPlantId");
  const powerPlantId = powerPlantIdParam ? parseInt(powerPlantIdParam) : null;
  const year = searchParams.get("year");

  const where: Record<string, unknown> = { active: 1 };

  if (accessibleIds !== "all") {
    where.powerPlantId = { in: accessibleIds };
  }

  if (powerPlantId) {
    // Verify access
    if (accessibleIds !== "all" && !accessibleIds.includes(powerPlantId)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    where.powerPlantId = powerPlantId;
  }

  if (year) {
    where.periodYear = parseInt(year);
  }

  const reports = await prisma.generationReport.findMany({
    where,
    include: {
      powerPlant: { select: { name: true, portfolio: { select: { name: true } } } },
    },
    orderBy: [{ periodYear: "desc" }, { periodMonth: "desc" }],
  });

  return NextResponse.json(reports);
}
