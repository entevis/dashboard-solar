import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { UserRole } from "@prisma/client";
import { logAction } from "@/lib/services/audit.service";
import { z } from "zod";

const createSchema = z.object({
  name: z.string().min(1).max(200),
  rut: z.string().min(1).max(20),
  altName: z.string().nullable().optional(),
});

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // All roles can see customers, but content varies by role
  const where: Record<string, unknown> = { active: 1 };

  if (user.role === UserRole.CLIENTE || user.role === UserRole.CLIENTE_PERFILADO) {
    if (user.customerId) {
      where.id = user.customerId;
    } else {
      return NextResponse.json([]);
    }
  }

  const customers = await prisma.customer.findMany({
    where,
    include: {
      _count: { select: { powerPlants: { where: { active: 1 } } } },
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(customers);
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== UserRole.MAESTRO) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  // Check RUT uniqueness
  const existing = await prisma.customer.findUnique({
    where: { rut: parsed.data.rut },
  });
  if (existing) {
    return NextResponse.json({ error: "Ya existe un cliente con este RUT" }, { status: 409 });
  }

  const customer = await prisma.customer.create({
    data: parsed.data,
  });

  logAction(user.id, "CREATE", "customer", customer.id, { rut: parsed.data.rut });

  return NextResponse.json(customer, { status: 201 });
}
