import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { UserRole } from "@prisma/client";
import { logAction } from "@/lib/services/audit.service";
import { normalizeRut } from "@/lib/utils/formatters";
import { z } from "zod";

const updateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  rut: z.string().min(1).max(20).optional(),
  altName: z.string().nullable().optional(),
});

interface RouteContext {
  params: Promise<{ customerId: string }>;
}

export async function GET(_request: NextRequest, context: RouteContext) {
  const { customerId } = await context.params;
  const id = parseInt(customerId);
  if (isNaN(id)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // IDOR protection: CLIENTE/CLIENTE_PERFILADO can only access their own customer
  if (user.role === UserRole.CLIENTE || user.role === UserRole.CLIENTE_PERFILADO) {
    if (user.customerId !== id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const customer = await prisma.customer.findUnique({
    where: { id, active: 1 },
    include: {
      powerPlants: {
        where: { active: 1 },
        select: { id: true, name: true, capacityKw: true, status: true, location: true },
        orderBy: { name: "asc" },
      },
      _count: { select: { invoices: { where: { active: 1 } } } },
    },
  });

  if (!customer) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(customer);
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { customerId } = await context.params;
  const id = parseInt(customerId);
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

  const data = parsed.data.rut ? { ...parsed.data, rut: normalizeRut(parsed.data.rut) } : parsed.data;
  const updated = await prisma.customer.update({ where: { id }, data });
  logAction(user.id, "UPDATE", "customer", id, { changes: parsed.data });

  return NextResponse.json(updated);
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const { customerId } = await context.params;
  const id = parseInt(customerId);
  if (isNaN(id)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  const user = await getCurrentUser();
  if (!user || user.role !== UserRole.MAESTRO) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.customer.update({ where: { id }, data: { active: 0 } });
  logAction(user.id, "DELETE", "customer", id);

  return NextResponse.json({ success: true });
}
