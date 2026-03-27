import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { getAccessiblePowerPlantIds } from "@/lib/auth/guards";
import { UserRole, ContingencyStatus, ContingencyType } from "@prisma/client";
import { logAction } from "@/lib/services/audit.service";
import { z } from "zod";

const createSchema = z.object({
  powerPlantId: z.coerce.number().int().positive(),
  type: z.nativeEnum(ContingencyType),
  description: z.string().min(1).max(2000),
  cost: z.number().nullable().optional(),
  provider: z.string().nullable().optional(),
  workDescription: z.string().nullable().optional(),
});

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const accessibleIds = await getAccessiblePowerPlantIds(user);
  const { searchParams } = new URL(request.url);

  const status = searchParams.get("status") as ContingencyStatus | null;
  const type = searchParams.get("type") as ContingencyType | null;
  const powerPlantIdRaw = searchParams.get("powerPlantId");

  const where: Record<string, unknown> = { active: 1 };

  if (accessibleIds !== "all") {
    where.powerPlantId = { in: accessibleIds };
  }

  if (status) where.status = status;
  if (type) where.type = type;
  if (powerPlantIdRaw) where.powerPlantId = parseInt(powerPlantIdRaw);

  const contingencies = await prisma.contingency.findMany({
    where,
    include: {
      powerPlant: { select: { name: true, portfolio: { select: { name: true } } } },
      createdBy: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(contingencies);
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (user.role !== UserRole.MAESTRO && user.role !== UserRole.OPERATIVO) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const accessibleIds = await getAccessiblePowerPlantIds(user);
  if (accessibleIds !== "all" && !accessibleIds.includes(parsed.data.powerPlantId)) {
    return NextResponse.json({ error: "No access to this plant" }, { status: 403 });
  }

  const contingency = await prisma.contingency.create({
    data: { ...parsed.data, createdById: user.id },
    include: { powerPlant: { select: { name: true } } },
  });

  logAction(user.id, "CREATE", "contingency", contingency.id, {
    powerPlantId: parsed.data.powerPlantId,
    type: parsed.data.type,
  });

  return NextResponse.json(contingency, { status: 201 });
}
