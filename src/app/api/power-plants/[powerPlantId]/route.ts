import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { UserRole } from "@prisma/client";
import { logAction } from "@/lib/services/audit.service";
import { z } from "zod";

const updateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  location: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  capacityKw: z.number().positive().optional(),
  status: z.enum(["active", "maintenance"]).optional(),
  portfolioId: z.coerce.number().int().positive().optional(),
  customerId: z.coerce.number().int().positive().optional(),
  solcorId: z.string().nullable().optional(),
  distributorCompany: z.string().nullable().optional(),
  tariffId: z.string().nullable().optional(),
  startDate: z.string().nullable().optional(),
  durationYears: z.number().positive().nullable().optional(),
  specificYield: z.number().positive().nullable().optional(),
});

interface RouteContext {
  params: Promise<{ powerPlantId: string }>;
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { powerPlantId } = await context.params;
  const id = parseInt(powerPlantId);
  if (isNaN(id)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  const user = await getCurrentUser();
  if (!user || user.role !== UserRole.MAESTRO) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { startDate, ...rest } = parsed.data;
  const updateData = {
    ...rest,
    ...(startDate !== undefined ? { startDate: startDate ? new Date(startDate) : null } : {}),
  };

  const updated = await prisma.powerPlant.update({
    where: { id },
    data: updateData,
    include: {
      portfolio: { select: { name: true } },
      customer: { select: { name: true } },
    },
  });

  logAction(user.id, "UPDATE", "power_plant", id, { changes: parsed.data });

  return NextResponse.json(updated);
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const { powerPlantId } = await context.params;
  const id = parseInt(powerPlantId);
  if (isNaN(id)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  const user = await getCurrentUser();
  if (!user || user.role !== UserRole.MAESTRO) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.powerPlant.update({
    where: { id },
    data: { active: 0 },
  });

  logAction(user.id, "DELETE", "power_plant", id);

  return NextResponse.json({ success: true });
}
