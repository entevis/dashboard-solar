import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { UserRole } from "@prisma/client";
import { z } from "zod";

const updateSchema = z.object({
  name: z.string().min(2).optional(),
  rut: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  role: z.string().optional().nullable(),
  email: z.string().email().optional().nullable().or(z.literal("")),
});

interface Params {
  params: Promise<{ customerId: string; contactId: string }>;
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const user = await getCurrentUser();
  if (!user || user.role !== UserRole.MAESTRO) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { contactId } = await params;
  const id = parseInt(contactId);

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const contact = await prisma.contact.update({
    where: { id },
    data: {
      ...(parsed.data.name !== undefined && { name: parsed.data.name }),
      rut: parsed.data.rut ?? undefined,
      phone: parsed.data.phone ?? undefined,
      role: parsed.data.role ?? undefined,
      email: parsed.data.email || null,
    },
  });

  return NextResponse.json(contact);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const user = await getCurrentUser();
  if (!user || user.role !== UserRole.MAESTRO) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { contactId } = await params;
  const id = parseInt(contactId);

  await prisma.contact.update({ where: { id }, data: { active: 0 } });

  return NextResponse.json({ ok: true });
}
