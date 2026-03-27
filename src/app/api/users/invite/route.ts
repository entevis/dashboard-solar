import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAction } from "@/lib/services/audit.service";
import { UserRole } from "@prisma/client";
import { z } from "zod";

const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2),
  password: z.string().min(6),
  role: z.nativeEnum(UserRole),
  customerId: z.coerce.number().int().positive().optional(),
  assignedPortfolioId: z.coerce.number().int().positive().optional(),
});

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

  const { email, name, password, role, customerId, assignedPortfolioId } =
    parsed.data;

  // Validate role-specific fields
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

  // Check if email already exists
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    return NextResponse.json(
      { error: "Ya existe un usuario con este correo" },
      { status: 409 }
    );
  }

  // Create user in Supabase Auth
  const supabaseAdmin = createAdminClient();
  const { data: authData, error: authError } =
    await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

  if (authError || !authData.user) {
    return NextResponse.json(
      { error: "Error al crear usuario en autenticación: " + authError?.message },
      { status: 500 }
    );
  }

  // Create user in Prisma
  const newUser = await prisma.user.create({
    data: {
      supabaseId: authData.user.id,
      email,
      name,
      role,
      customerId: customerId || null,
      assignedPortfolioId: assignedPortfolioId || null,
    },
  });

  await logAction(currentUser.id, "CREATE_USER", "user", newUser.id, {
    email,
    role,
  });

  return NextResponse.json(newUser, { status: 201 });
}
