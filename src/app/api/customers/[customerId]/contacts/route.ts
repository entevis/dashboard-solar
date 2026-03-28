import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { UserRole } from "@prisma/client";
import { z } from "zod";

const contactSchema = z.object({
  name: z.string().min(2),
  rut: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  role: z.string().optional().nullable(),
  email: z.string().email().optional().nullable().or(z.literal("")),
});

interface Params {
  params: Promise<{ customerId: string }>;
}

export async function GET(_req: NextRequest, { params }: Params) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { customerId } = await params;
  const id = parseInt(customerId);

  const contacts = await prisma.contact.findMany({
    where: { customerId: id, active: 1 },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(contacts);
}

export async function POST(req: NextRequest, { params }: Params) {
  const user = await getCurrentUser();
  if (!user || user.role !== UserRole.MAESTRO) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { customerId } = await params;
  const id = parseInt(customerId);

  const body = await req.json();
  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const contact = await prisma.contact.create({
    data: {
      customerId: id,
      name: parsed.data.name,
      rut: parsed.data.rut || null,
      phone: parsed.data.phone || null,
      role: parsed.data.role || null,
      email: parsed.data.email || null,
    },
  });

  return NextResponse.json(contact, { status: 201 });
}
