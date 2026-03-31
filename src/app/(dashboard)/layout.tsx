import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { Toaster } from "@/components/ui/sonner";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-[var(--color-background)]">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-[var(--color-primary)] focus:text-white focus:rounded-lg focus:text-[13px] focus:font-medium"
      >
        Saltar al contenido principal
      </a>

      <Sidebar userRole={user.role} />

      <div className="lg:pl-[240px] flex flex-col h-screen">
        <Topbar
          userName={user.name}
          userEmail={user.email}
          userRole={user.role}
        />

        <main id="main-content" className="flex-1 overflow-y-auto min-h-0 p-4 lg:p-6 flex flex-col">{children}</main>
      </div>

      <Toaster />
    </div>
  );
}
