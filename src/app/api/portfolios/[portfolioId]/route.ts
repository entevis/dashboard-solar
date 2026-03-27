import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { UserRole } from "@prisma/client";
import { logAction } from "@/lib/services/audit.service";
import { z } from "zod";

const updateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().nullable().optional(),
});

interface RouteContext {
  params: Promise<{ portfolioId: string }>;
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { portfolioId } = await context.params;
  const id = parseInt(portfolioId);
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

  const updated = await prisma.portfolio.update({
    where: { id },
    data: parsed.data,
  });

  logAction(user.id, "UPDATE", "portfolio", id, { changes: parsed.data });

  return NextResponse.json(updated);
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const { portfolioId } = await context.params;
  const id = parseInt(portfolioId);
  if (isNaN(id)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  const user = await getCurrentUser();
  if (!user || user.role !== UserRole.MAESTRO) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.portfolio.update({ where: { id }, data: { active: 0 } });
  logAction(user.id, "DELETE", "portfolio", id);

  return NextResponse.json({ success: true });
}
