import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { buildPlantAccessFilter } from "@/lib/auth/guards";
import { UserRole } from "@prisma/client";
import { logAction } from "@/lib/services/audit.service";
import { z } from "zod";

const createSchema = z.object({
  name: z.string().min(1).max(200),
  portfolioId: z.coerce.number().int().positive(),
  customerId: z.coerce.number().int().positive(),
  capacityKw: z.number().positive(),
  status: z.enum(["active", "maintenance"]).default("active"),
  solcorId: z.string().nullable().optional(),
  distributorCompany: z.string().nullable().optional(),
  tariffId: z.string().nullable().optional(),
  startDate: z.string().nullable().optional(),
  durationYears: z.number().positive().nullable().optional(),
  specificYield: z.number().positive().nullable().optional(),
  panelCount: z.number().int().positive().nullable().optional(),
  installationType: z.string().nullable().optional(),
  surfaceM2: z.number().positive().nullable().optional(),
  economicSector: z.string().nullable().optional(),
  economicSector2: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  address: z.object({
    address: z.string().nullable().optional(),
    reference: z.string().nullable().optional(),
    city: z.string().nullable().optional(),
    county: z.string().nullable().optional(),
    country: z.string().nullable().optional(),
  }).optional(),
});

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const portfolioIdRaw = searchParams.get("portfolioId");
  const customerIdRaw = searchParams.get("customerId");

  const plantFilter = await buildPlantAccessFilter(user);
  const where: Record<string, unknown> = { ...plantFilter };

  if (portfolioIdRaw) where.portfolioId = parseInt(portfolioIdRaw);
  if (customerIdRaw) where.customerId = parseInt(customerIdRaw);

  const plants = await prisma.powerPlant.findMany({
    where,
    include: {
      portfolio: { select: { name: true } },
      customer: { select: { name: true } },
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(plants);
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

  const { address, startDate, ...rest } = parsed.data;

  const plant = await prisma.powerPlant.create({
    data: {
      ...rest,
      ...(startDate ? { startDate: new Date(startDate) } : {}),
      ...(address ? { address: { create: address } } : {}),
    },
  });

  logAction(user.id, "CREATE", "power_plant", plant.id, { name: plant.name });

  return NextResponse.json(plant, { status: 201 });
}
