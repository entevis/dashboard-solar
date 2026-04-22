import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { UserRole } from "@prisma/client";
import { logAction } from "@/lib/services/audit.service";
import { z } from "zod";

const updateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  role: z.nativeEnum(UserRole).optional(),
  customerId: z.coerce.number().int().positive().nullable().optional(),
  assignedPortfolioId: z.coerce.number().int().positive().nullable().optional(),
  phone: z.string().max(50).nullable().optional(),
  jobTitle: z.string().max(200).nullable().optional(),
  portfolioIds: z.array(z.coerce.number().int().positive()).optional(),
  plantIds: z.array(z.coerce.number().int().positive()).optional(),
});

interface RouteContext {
  params: Promise<{ userId: string }>;
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { userId } = await context.params;
  const id = parseInt(userId);
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

  const { portfolioIds, plantIds, ...userFields } = parsed.data;

  if (
    plantIds !== undefined &&
    plantIds.length > 0 &&
    (userFields.role === "CLIENTE_PERFILADO" || parsed.data.role === undefined) &&
    userFields.customerId
  ) {
    const ownedPlants = await prisma.powerPlant.count({
      where: { id: { in: plantIds }, customerId: userFields.customerId, active: 1 },
    });
    if (ownedPlants !== plantIds.length) {
      return NextResponse.json(
        { error: "Alguna planta seleccionada no pertenece al cliente" },
        { status: 400 }
      );
    }
  }

  const updated = await prisma.user.update({
    where: { id },
    data: userFields,
    include: {
      customer: { select: { name: true } },
      assignedPortfolio: { select: { name: true } },
    },
  });

  // Sync portfolio permissions if provided (TECNICO)
  if (portfolioIds !== undefined) {
    await prisma.userPortfolioPermission.deleteMany({ where: { userId: id } });
    if (portfolioIds.length > 0) {
      await prisma.userPortfolioPermission.createMany({
        data: portfolioIds.map((portfolioId) => ({ userId: id, portfolioId })),
      });
    }
  }

  // Sync plant permissions if provided (CLIENTE_PERFILADO)
  if (plantIds !== undefined) {
    await prisma.userPlantPermission.deleteMany({ where: { userId: id } });
    if (plantIds.length > 0) {
      await prisma.userPlantPermission.createMany({
        data: plantIds.map((powerPlantId) => ({ userId: id, powerPlantId })),
      });
    }
  }

  logAction(user.id, "UPDATE", "user", id, { changes: parsed.data });

  return NextResponse.json(updated);
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const { userId } = await context.params;
  const id = parseInt(userId);
  if (isNaN(id)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  const user = await getCurrentUser();
  if (!user || user.role !== UserRole.MAESTRO) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (user.id === id) {
    return NextResponse.json({ error: "No puedes eliminar tu propio usuario" }, { status: 400 });
  }

  await prisma.user.update({ where: { id }, data: { active: 0 } });
  logAction(user.id, "DELETE", "user", id);

  return NextResponse.json({ success: true });
}
