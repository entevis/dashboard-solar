import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAction } from "@/lib/services/audit.service";
import { UserRole } from "@prisma/client";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== UserRole.MAESTRO) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { userId } = await params;
  const id = parseInt(userId);
  const target = await prisma.user.findUnique({ where: { id, active: 1 } });
  if (!target) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });

  const supabaseAdmin = createAdminClient();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
  const emailMode = process.env.AUTH_EMAIL_MODE ?? "manual";

  if (emailMode === "smtp") {
    const { error } = await supabaseAdmin.auth.resetPasswordForEmail(target.email, {
      redirectTo: `${appUrl}/api/auth/callback?next=/set-password`,
    });
    if (error) {
      return NextResponse.json(
        { error: "Error al enviar email de recuperación: " + error.message },
        { status: 500 }
      );
    }
    await logAction(currentUser.id, "SEND_RECOVERY_EMAIL", "user", target.id, { email: target.email });
    return NextResponse.json({ sent: true, recoveryLink: null });
  }

  const { data, error } = await supabaseAdmin.auth.admin.generateLink({
    type: "recovery",
    email: target.email,
    options: { redirectTo: `${appUrl}/api/auth/callback?next=/set-password` },
  });

  if (error || !data.properties?.action_link) {
    return NextResponse.json(
      { error: "Error al generar link de recuperación: " + error?.message },
      { status: 500 }
    );
  }

  await logAction(currentUser.id, "GENERATE_RECOVERY_LINK", "user", target.id, {
    email: target.email,
  });

  return NextResponse.json({ sent: false, recoveryLink: data.properties.action_link });
}
