import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { getAccessiblePowerPlantIds } from "@/lib/auth/guards";
import { z } from "zod";

interface RouteContext {
  params: Promise<{ contingencyId: string }>;
}

const createSchema = z.object({
  body: z.string().min(1).max(2000),
});

async function getContingencyWithAccess(id: number, userId: number, userRole: string) {
  const contingency = await prisma.contingency.findUnique({
    where: { id, active: 1 },
    select: { id: true, status: true, powerPlantId: true },
  });
  if (!contingency) return null;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return null;

  const accessibleIds = await getAccessiblePowerPlantIds(user);
  if (accessibleIds !== "all" && !accessibleIds.includes(contingency.powerPlantId)) {
    return null;
  }
  return contingency;
}

export async function GET(_req: NextRequest, context: RouteContext) {
  const { contingencyId } = await context.params;
  const id = parseInt(contingencyId);
  if (isNaN(id)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const contingency = await getContingencyWithAccess(id, user.id, user.role);
  if (!contingency) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const comments = await prisma.contingencyComment.findMany({
    where: { contingencyId: id, active: 1 },
    include: { user: { select: { id: true, name: true, role: true } } },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(comments);
}

export async function POST(request: NextRequest, context: RouteContext) {
  const { contingencyId } = await context.params;
  const id = parseInt(contingencyId);
  if (isNaN(id)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const contingency = await getContingencyWithAccess(id, user.id, user.role);
  if (!contingency) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (contingency.status === "CLOSED") {
    return NextResponse.json({ error: "Cannot comment on a closed contingency" }, { status: 422 });
  }

  const body = await request.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const comment = await prisma.contingencyComment.create({
    data: {
      contingencyId: id,
      userId: user.id,
      body: parsed.data.body,
    },
    include: { user: { select: { id: true, name: true, role: true } } },
  });

  return NextResponse.json(comment, { status: 201 });
}
