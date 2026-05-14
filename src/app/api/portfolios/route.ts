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

const createSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().nullable().optional(),
  taxIdentification: z.string().max(50).nullable().optional(),
  country: z.string().max(100).nullable().optional(),
  contact: z.string().max(200).nullable().optional(),
  bankAccount: bankAccountSchema.nullable().optional(),
});

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== UserRole.MAESTRO) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const portfolios = await prisma.portfolio.findMany({
    where: { active: 1 },
    include: {
      _count: { select: { powerPlants: { where: { active: 1 } } } },
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(portfolios);
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

  const { bankAccount, ...portfolioFields } = parsed.data;

  let bankAccountId: number | undefined;
  if (bankAccount) {
    const created = await prisma.bankAccount.create({ data: bankAccount });
    bankAccountId = created.id;
  }

  const portfolio = await prisma.portfolio.create({
    data: { ...portfolioFields, ...(bankAccountId !== undefined ? { bankAccountId } : {}) },
  });

  logAction(user.id, "CREATE", "portfolio", portfolio.id, { name: parsed.data.name });

  return NextResponse.json(portfolio, { status: 201 });
}
