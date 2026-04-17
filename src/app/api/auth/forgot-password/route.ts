import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendRecoveryEmail } from "@/lib/services/email.service";

export async function POST(request: NextRequest) {
  const { email } = await request.json();

  if (!email || typeof email !== "string") {
    return NextResponse.json({ error: "Email requerido" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim(), active: 1 },
    select: { name: true, supabaseId: true },
  });

  // Always return success to prevent email enumeration
  if (!user) {
    return NextResponse.json({ success: true });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
  const supabaseAdmin = createAdminClient();

  const { data, error } = await supabaseAdmin.auth.admin.generateLink({
    type: "recovery",
    email,
    options: { redirectTo: `${appUrl}/api/auth/callback?next=/set-password` },
  });

  if (error || !data.properties?.action_link) {
    console.error("[forgot-password] generateLink error:", error?.message);
    return NextResponse.json({ success: true });
  }

  try {
    await sendRecoveryEmail({
      to: email,
      userName: user.name,
      recoveryLink: data.properties.action_link,
    });
  } catch (err) {
    console.error("[forgot-password] Email send failed:", err);
  }

  return NextResponse.json({ success: true });
}
