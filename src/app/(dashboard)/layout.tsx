import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { Toaster } from "@/components/ui/sonner";
import NextTopLoader from "nextjs-toploader";
import { UserRole } from "@prisma/client";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  // Read persisted portfolio selection from cookie (MAESTRO only)
  const cookieStore = await cookies();
  const rawCookie = cookieStore.get("portfolio_id")?.value;
  const selectedPortfolioId = rawCookie ? parseInt(rawCookie) : null;

  // MAESTRO without a portfolio selected → force selection page
  if (user.role === UserRole.MAESTRO && !selectedPortfolioId) {
    redirect("/select-portfolio");
  }

  const portfolios =
    user.role === UserRole.MAESTRO
      ? await prisma.portfolio.findMany({
          where: { active: 1 },
          select: { id: true, name: true },
          orderBy: { id: "asc" },
        })
      : [];

  return (
    <div className="min-h-screen bg-(--color-background)">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-(--color-primary) focus:text-white focus:rounded-lg focus:text-label focus:font-medium"
      >
        Saltar al contenido principal
      </a>

      <NextTopLoader color="#004ac6" height={3} showSpinner={false} shadow={false} />
      <Sidebar
        userRole={user.role}
        selectedPortfolioId={selectedPortfolioId}
      />

      <div className="lg:pl-60 flex flex-col h-screen">
        <Topbar
          userName={user.name}
          userEmail={user.email}
          userRole={user.role}
          portfolios={portfolios}
          selectedPortfolioId={selectedPortfolioId}
        />

        <main id="main-content" className="flex-1 overflow-y-auto min-h-0 p-4 lg:p-6 flex flex-col">{children}</main>
      </div>

      <Toaster />
    </div>
  );
}
