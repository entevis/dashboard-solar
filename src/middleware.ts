import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options as Record<string, string>)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  const isPublicPath = pathname.startsWith("/login") || pathname.startsWith("/api/auth") || pathname.startsWith("/api/webhooks") || pathname.startsWith("/api/cron") || pathname.startsWith("/forgot-password") || pathname.startsWith("/activate");
  const isSetPassword = pathname.startsWith("/set-password");
  const isSelectPortfolio = pathname.startsWith("/select-portfolio");

  if (!user) {
    // For Next.js prefetch requests, return 401 instead of redirecting.
    // Concurrent prefetches can hit a Supabase refresh-token rotation race
    // condition ("Refresh Token Not Found"), which would otherwise cause a
    // spurious /login → /dashboard redirect loop while the user is already
    // on the page. A 401 tells the client to re-fetch on actual navigation.
    const isPrefetch = request.headers.get("next-router-prefetch") === "1";
    if (isPrefetch && !isPublicPath && !isSetPassword) {
      return new NextResponse(null, { status: 401 });
    }

    // Redirect unauthenticated users to login
    if (!isPublicPath && !isSelectPortfolio && !isSetPassword) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }

    // Unauthenticated user trying to access select-portfolio → login
    if (isSelectPortfolio) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }
  }

  // Redirect authenticated users away from login (but NOT from select-portfolio)
  if (user && pathname.startsWith("/login")) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
