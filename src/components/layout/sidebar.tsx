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
} from "lucide-react";
import type { UserRole } from "@prisma/client";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: UserRole[] | "all";
}

const navItems: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    roles: "all",
  },
  {
    label: "Portafolios",
    href: "/admin/portfolios",
    icon: Building2,
    roles: ["MAESTRO"],
  },
  {
    label: "Plantas",
    href: "/power-plants",
    icon: Zap,
    roles: "all",
  },
  {
    label: "Clientes",
    href: "/admin/customers",
    icon: UserCircle,
    roles: ["MAESTRO"],
  },
  {
    label: "Reportes",
    href: "/reports",
    icon: FileText,
    roles: ["MAESTRO", "CLIENTE", "CLIENTE_PERFILADO"],
  },
  {
    label: "Facturación",
    href: "/billing",
    icon: ClipboardList,
    roles: ["MAESTRO", "CLIENTE", "CLIENTE_PERFILADO"],
  },
  {
    label: "Contingencias",
    href: "/contingencies",
    icon: AlertTriangle,
    roles: ["MAESTRO", "OPERATIVO"],
  },
  {
    label: "Usuarios",
    href: "/admin/users",
    icon: Users,
    roles: ["MAESTRO"],
  },
];

interface SidebarProps {
  userRole: UserRole;
}

export function Sidebar({ userRole }: SidebarProps) {
  const pathname = usePathname();

  const visibleItems = navItems.filter(
    (item) => item.roles === "all" || item.roles.includes(userRole)
  );

  return (
    <aside className="hidden lg:flex flex-col w-[240px] h-screen border-r border-[var(--color-border)] bg-white fixed left-0 top-0 z-30">
      <div className="flex items-center gap-3 px-5 h-16 border-b border-[var(--color-border)]">
        <Image src="/logo.jpg" alt="S-Invest" width={32} height={32} className="rounded-lg object-contain" />
        <span className="font-bold text-[15px] text-[var(--color-foreground)]">
          S-Invest
        </span>
      </div>

      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {visibleItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-colors",
                isActive
                  ? "bg-[var(--color-primary)]/10 text-[var(--color-primary)]"
                  : "text-[var(--color-muted-foreground)] hover:bg-[var(--color-secondary)] hover:text-[var(--color-foreground)]"
              )}
            >
              <item.icon className="w-[18px] h-[18px]" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
