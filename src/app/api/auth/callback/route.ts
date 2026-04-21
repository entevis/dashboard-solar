import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error, data } = await supabase.auth.exchangeCodeForSession(code);
    if (!error && data.user) {
      // Track login timestamp
      await prisma.user.updateMany({
        where: { supabaseId: data.user.id },
        data: { lastLoginAt: new Date() },
      }).catch(() => {});
      // Prevent open redirect: only allow internal paths
      let safePath = "/dashboard";
      try {
        const resolved = new URL(next, origin);
        if (resolved.origin === origin) {
          safePath = resolved.pathname + resolved.search;
        }
      } catch {
        // Invalid URL — fall back to dashboard
      }
      return NextResponse.redirect(`${origin}${safePath}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
