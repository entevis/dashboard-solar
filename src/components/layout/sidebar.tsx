"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Zap,
  FileText,
  AlertTriangle,
  Users,
  Building2,
  ClipboardList,
  UserCircle,
  Settings2,
} from "lucide-react";
import type { UserRole } from "@prisma/client";

interface SidebarProps {
  userRole: UserRole;
  selectedPortfolioId?: number | null;
}

export function Sidebar({ userRole, selectedPortfolioId }: SidebarProps) {
  const pathname = usePathname();

  // Extract portfolioId from paths like /3/power-plants or /3/billing
  const urlMatch = pathname.match(/^\/(\d+)(\/|$)/);
  const urlPid = urlMatch?.[1];
  const pid = urlPid ?? (selectedPortfolioId ? String(selectedPortfolioId) : null);

  const p = (path: string) => (pid ? `/${pid}${path}` : path);

  type NavItem = { label: string; href: string; icon: React.ComponentType<{ className?: string }> };
  type NavSection = { title?: string; roles: UserRole[] | "all"; items: NavItem[] };

  const navSections: NavSection[] = [
    {
      roles: "all",
      items: [
        { label: "Dashboard",     href: "/dashboard",          icon: LayoutDashboard },
        { label: "Plantas",       href: p("/power-plants"),    icon: Zap },
      ],
    },
    {
      roles: ["MAESTRO", "CLIENTE", "CLIENTE_PERFILADO"],
      items: [
        { label: "Reportes",    href: p("/reports"),       icon: FileText },
        { label: "Facturación", href: p("/billing"),       icon: ClipboardList },
      ],
    },
    {
      roles: ["MAESTRO", "OPERATIVO"],
      items: [
        { label: "Contingencias", href: p("/contingencies"), icon: AlertTriangle },
      ],
    },
    {
      title: "Configuraciones",
      roles: ["MAESTRO"],
      items: [
        { label: "Usuarios",    href: "/admin/users",      icon: Users },
        { label: "Clientes",    href: "/admin/customers",  icon: UserCircle },
        { label: "Portafolios", href: "/admin/portfolios", icon: Building2 },
      ],
    },
  ];

  const visibleSections = navSections.filter(
    (s) => s.roles === "all" || s.roles.includes(userRole)
  );

  return (
    <aside className="hidden lg:flex flex-col w-60 h-screen border-r border-(--color-border) bg-white fixed left-0 top-0 z-30">
      <div className="flex items-center gap-3 px-5 h-16 border-b border-(--color-border)">
        <Image src="/logo.jpg" alt="S-Invest" width={32} height={32} className="rounded-lg object-contain" />
        <span className="font-bold text-ui text-(--color-foreground)">
          S-Invest
        </span>
      </div>

      <nav aria-label="Navegación principal" className="flex-1 py-4 px-3 overflow-y-auto space-y-0.5">
        {visibleSections.map((section, i) => (
          <div key={i} className={section.title ? "pt-3 mt-1 border-t border-(--color-border)" : ""}>
            {section.title && (
              <div className="flex items-center gap-2 px-3 mb-1">
                <Settings2 className="w-3 h-3 text-(--color-muted-foreground)" aria-hidden="true" />
                <span className="text-caption font-semibold uppercase tracking-wide text-(--color-muted-foreground)">
                  {section.title}
                </span>
              </div>
            )}
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={isActive ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg text-label font-medium transition-colors duration-150",
                      isActive
                        ? "bg-(--color-primary)/10 text-(--color-primary)"
                        : "text-(--color-muted-foreground) hover:bg-(--color-secondary) hover:text-(--color-foreground)"
                    )}
                  >
                    <item.icon className="w-4.5 h-4.5" aria-hidden="true" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
}
