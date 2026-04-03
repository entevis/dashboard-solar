import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { UserRole } from "@prisma/client";
import { logAction } from "@/lib/services/audit.service";
import { z } from "zod";

const bankAccountSchema = z.object({
  name: z.string().min(1).max(200),
  bankName: z.string().min(1).max(200),
  accountType: z.string().min(1).max(100),
  accountNumber: z.string().min(1).max(50),
  rut: z.string().min(1).max(20),
  receiptEmail: z.string().email().max(200).nullable().optional(),
});

const updateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().nullable().optional(),
  taxIdentification: z.string().max(50).nullable().optional(),
  country: z.string().max(100).nullable().optional(),
  contact: z.string().max(200).nullable().optional(),
  bankAccount: bankAccountSchema.nullable().optional(),
  duemintCompanyId: z.string().max(50).nullable().optional(),
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

  const { bankAccount, ...portfolioFields } = parsed.data;

  // Upsert bank account if data provided
  let bankAccountId: number | undefined;
  if (bankAccount) {
    const portfolio = await prisma.portfolio.findUnique({ where: { id }, select: { bankAccountId: true } });
    if (portfolio?.bankAccountId) {
      await prisma.bankAccount.update({ where: { id: portfolio.bankAccountId }, data: bankAccount });
      bankAccountId = portfolio.bankAccountId;
    } else {
      const created = await prisma.bankAccount.create({ data: bankAccount });
      bankAccountId = created.id;
    }
  }

  const updated = await prisma.portfolio.update({
    where: { id },
    data: { ...portfolioFields, ...(bankAccountId !== undefined ? { bankAccountId } : {}) },
  });

  logAction(user.id, "UPDATE", "portfolio", id, { changes: portfolioFields });

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
