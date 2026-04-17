import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAction } from "@/lib/services/audit.service";
import { sendInviteEmail } from "@/lib/services/email.service";
import { UserRole } from "@prisma/client";
import { z } from "zod";

const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2),
  role: z.nativeEnum(UserRole),
  customerId: z.coerce.number().int().positive().optional(),
  assignedPortfolioId: z.coerce.number().int().positive().optional(),
  portfolioIds: z.array(z.coerce.number().int().positive()).optional(),
});

function getAppUrl(request: NextRequest) {
  return process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
}

export async function POST(request: NextRequest) {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== UserRole.MAESTRO) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = createUserSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { email, name, role, customerId, assignedPortfolioId, portfolioIds } =
    parsed.data;

  if ((role === "CLIENTE" || role === "CLIENTE_PERFILADO") && !customerId) {
    return NextResponse.json(
      { error: "Se requiere un cliente para este rol" },
      { status: 400 }
    );
  }

  if (role === "OPERATIVO" && !assignedPortfolioId) {
    return NextResponse.json(
      { error: "Se requiere un portafolio asignado para el rol Operativo" },
      { status: 400 }
    );
  }

  if (role === "TECNICO" && (!portfolioIds || portfolioIds.length === 0)) {
    return NextResponse.json(
      { error: "Se requiere al menos un portafolio para el rol Técnico" },
      { status: 400 }
    );
  }

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    return NextResponse.json(
      { error: "Ya existe un usuario con este correo" },
      { status: 409 }
    );
  }

  const supabaseAdmin = createAdminClient();
  const appUrl = getAppUrl(request);

  const { data, error } = await supabaseAdmin.auth.admin.generateLink({
    type: "invite",
    email,
    options: { redirectTo: `${appUrl}/api/auth/callback?next=/set-password` },
  });
  if (error || !data.user) {
    return NextResponse.json(
      { error: "Error al generar invitación: " + error?.message },
      { status: 500 }
    );
  }

  const supabaseUserId = data.user.id;
  const inviteLink = data.properties?.action_link ?? null;

  const newUser = await prisma.user.create({
    data: {
      supabaseId: supabaseUserId,
      email,
      name,
      role,
      customerId: customerId || null,
      assignedPortfolioId: assignedPortfolioId || null,
    },
  });

  if (role === "TECNICO" && portfolioIds && portfolioIds.length > 0) {
    await prisma.userPortfolioPermission.createMany({
      data: portfolioIds.map((portfolioId) => ({ userId: newUser.id, portfolioId })),
    });
  }

  // Resolve portfolio name for email
  let portfolioName = "S-Invest";
  if (assignedPortfolioId) {
    const p = await prisma.portfolio.findUnique({ where: { id: assignedPortfolioId }, select: { name: true } });
    if (p) portfolioName = p.name;
  } else if (customerId) {
    const plant = await prisma.powerPlant.findFirst({ where: { customerId, active: 1 }, select: { portfolio: { select: { id: true, name: true } } } });
    if (plant) portfolioName = plant.portfolio.name;
  }

  // Send invite email
  let emailSent = false;
  if (inviteLink) {
    try {
      const portfolioId = assignedPortfolioId ?? undefined;
      await sendInviteEmail({
        to: email,
        userName: name,
        portfolioName,
        portfolioId,
        inviteLink,
      });
      emailSent = true;
    } catch (err) {
      console.error("[invite] Email send failed:", err);
    }
  }

  await logAction(currentUser.id, "CREATE_USER", "user", newUser.id, {
    email,
    role,
    emailSent,
  });

  return NextResponse.json({ user: newUser, emailSent }, { status: 201 });
}
