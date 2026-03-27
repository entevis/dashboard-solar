"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LogOut, ChevronDown } from "lucide-react";
import { MobileNav } from "./mobile-nav";
import { ROLE_LABELS } from "@/lib/auth/roles";
import type { UserRole } from "@prisma/client";

interface TopbarProps {
  userName: string;
  userEmail: string;
  userRole: UserRole;
}

export function Topbar({ userName, userEmail, userRole }: TopbarProps) {
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <header className="h-16 border-b border-[var(--color-border)] bg-white flex items-center justify-between px-4 lg:px-6">
      <div className="flex items-center gap-3">
        <MobileNav userRole={userRole} />
      </div>

      <div className="flex items-center gap-3">
        <Badge
          variant="secondary"
          className="hidden sm:inline-flex text-[11px] font-medium"
        >
          {ROLE_LABELS[userRole]}
        </Badge>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 h-9 px-2">
              <Avatar className="w-7 h-7">
                <AvatarFallback className="text-[11px] bg-[var(--color-primary)]/10 text-[var(--color-primary)] font-medium">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <span className="hidden sm:inline text-[13px] font-medium text-[var(--color-foreground)]">
                {userName}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-[var(--color-muted-foreground)]" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[200px]">
            <div className="px-2 py-1.5">
              <p className="text-[13px] font-medium">{userName}</p>
              <p className="text-[12px] text-[var(--color-muted-foreground)]">
                {userEmail}
              </p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-[13px]">
              <LogOut className="w-4 h-4 mr-2" />
              Cerrar sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
