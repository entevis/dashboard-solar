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

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface NavSection {
  title?: string;
  roles: UserRole[] | "all";
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    roles: "all",
    items: [
      { label: "Dashboard",     href: "/dashboard",     icon: LayoutDashboard },
      { label: "Plantas",       href: "/power-plants",  icon: Zap },
    ],
  },
  {
    roles: ["MAESTRO", "CLIENTE", "CLIENTE_PERFILADO"],
    items: [
      { label: "Reportes",    href: "/reports",  icon: FileText },
      { label: "Facturación", href: "/billing",  icon: ClipboardList },
    ],
  },
  {
    roles: ["MAESTRO", "OPERATIVO"],
    items: [
      { label: "Contingencias", href: "/contingencies", icon: AlertTriangle },
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

interface SidebarProps {
  userRole: UserRole;
}

export function Sidebar({ userRole }: SidebarProps) {
  const pathname = usePathname();

  const visibleSections = navSections.filter(
    (s) => s.roles === "all" || s.roles.includes(userRole)
  );

  return (
    <aside className="hidden lg:flex flex-col w-[240px] h-screen border-r border-[var(--color-border)] bg-white fixed left-0 top-0 z-30">
      <div className="flex items-center gap-3 px-5 h-16 border-b border-[var(--color-border)]">
        <Image src="/logo.jpg" alt="S-Invest" width={32} height={32} className="rounded-lg object-contain" />
        <span className="font-bold text-[15px] text-[var(--color-foreground)]">
          S-Invest
        </span>
      </div>

      <nav aria-label="Navegación principal" className="flex-1 py-4 px-3 overflow-y-auto space-y-0.5">
        {visibleSections.map((section, i) => (
          <div key={i} className={section.title ? "pt-3 mt-1 border-t border-[var(--color-border)]" : ""}>
            {section.title && (
              <div className="flex items-center gap-2 px-3 mb-1">
                <Settings2 className="w-3 h-3 text-[var(--color-muted-foreground)]" aria-hidden="true" />
                <span className="text-caption font-semibold uppercase tracking-wide text-[var(--color-muted-foreground)]">
                  {section.title}
                </span>
              </div>
            )}
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const isActive =
                  pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={isActive ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg text-label font-medium transition-colors duration-150",
                      isActive
                        ? "bg-[var(--color-primary)]/10 text-[var(--color-primary)]"
                        : "text-[var(--color-muted-foreground)] hover:bg-[var(--color-secondary)] hover:text-[var(--color-foreground)]"
                    )}
                  >
                    <item.icon className="w-[18px] h-[18px]" aria-hidden="true" />
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
