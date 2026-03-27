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
      <Sidebar userRole={user.role} />

      <div className="lg:pl-[240px]">
        <Topbar
          userName={user.name}
          userEmail={user.email}
          userRole={user.role}
        />

        <main className="p-4 lg:p-6">{children}</main>
      </div>

      <Toaster />
    </div>
  );
}
