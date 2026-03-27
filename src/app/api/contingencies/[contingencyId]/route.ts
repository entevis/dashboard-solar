import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { getAccessiblePowerPlantIds } from "@/lib/auth/guards";
import { UserRole, ContingencyStatus } from "@prisma/client";
import { logAction } from "@/lib/services/audit.service";
import { z } from "zod";

const updateSchema = z.object({
  status: z.nativeEnum(ContingencyStatus).optional(),
  description: z.string().min(1).max(2000).optional(),
  cost: z.number().nullable().optional(),
  provider: z.string().nullable().optional(),
  workDescription: z.string().nullable().optional(),
});

interface RouteContext {
  params: Promise<{ contingencyId: string }>;
}

export async function GET(_request: NextRequest, context: RouteContext) {
  const { contingencyId } = await context.params;
  const id = parseInt(contingencyId);
  if (isNaN(id)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const contingency = await prisma.contingency.findUnique({
    where: { id, active: 1 },
    include: {
      powerPlant: { select: { name: true, location: true, portfolio: { select: { name: true } } } },
      createdBy: { select: { name: true, email: true } },
    },
  });

  if (!contingency) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const accessibleIds = await getAccessiblePowerPlantIds(user);
  if (accessibleIds !== "all" && !accessibleIds.includes(contingency.powerPlantId)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json(contingency);
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { contingencyId } = await context.params;
  const id = parseInt(contingencyId);
  if (isNaN(id)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (user.role !== UserRole.MAESTRO && user.role !== UserRole.OPERATIVO) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const existing = await prisma.contingency.findUnique({ where: { id, active: 1 } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const accessibleIds = await getAccessiblePowerPlantIds(user);
  if (accessibleIds !== "all" && !accessibleIds.includes(existing.powerPlantId)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const data: Record<string, unknown> = { ...parsed.data };
  if (parsed.data.status === ContingencyStatus.CLOSED) {
    data.closedAt = new Date();
  }

  const updated = await prisma.contingency.update({
    where: { id },
    data,
    include: { powerPlant: { select: { name: true } } },
  });

  logAction(user.id, "UPDATE", "contingency", id, { changes: parsed.data });

  return NextResponse.json(updated);
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const { contingencyId } = await context.params;
  const id = parseInt(contingencyId);
  if (isNaN(id)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  const user = await getCurrentUser();
  if (!user || user.role !== UserRole.MAESTRO) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.contingency.update({ where: { id }, data: { active: 0 } });
  logAction(user.id, "DELETE", "contingency", id);

  return NextResponse.json({ success: true });
}
