"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ROLE_LABELS } from "@/lib/auth/roles";
import { UserRowActions } from "@/components/admin/user-row-actions";
import { Search } from "lucide-react";
import type { UserRole } from "@prisma/client";

interface UserWithRelations {
  id: number;
  email: string;
  name: string;
  role: UserRole;
  customerId: number | null;
  assignedPortfolioId: number | null;
  customer: { id: number; name: string; rut: string } | null;
  assignedPortfolio: { id: number; name: string } | null;
  createdAt: Date;
}

interface Option { id: number; name: string }

interface UserTableProps {
  users: UserWithRelations[];
  customers: Option[];
  portfolios: Option[];
  currentUserId: number;
}

const roleBadgeColors: Record<UserRole, string> = {
  MAESTRO: "bg-[var(--color-primary)]/10 text-[var(--color-primary)]",
  OPERATIVO: "bg-[var(--color-warning)]/10 text-[var(--color-warning)]",
  CLIENTE: "bg-[var(--color-success)]/10 text-[var(--color-success)]",
  CLIENTE_PERFILADO: "bg-[var(--color-success)]/10 text-[var(--color-success)]",
};

export function UserTable({ users, customers, portfolios, currentUserId }: UserTableProps) {
  const [q, setQ] = useState("");

  const filtered = q
    ? users.filter(
        (u) =>
          u.name.toLowerCase().includes(q.toLowerCase()) ||
          u.email.toLowerCase().includes(q.toLowerCase())
      )
    : users;

  return (
    <div className="border border-[var(--color-border)] rounded-xl bg-white overflow-hidden">
      <div className="p-3 border-b border-[var(--color-border)]">
        <div className="relative max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--color-muted-foreground)]" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por nombre o email..."
            className="pl-8 h-8 text-[13px]"
          />
        </div>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-[12px]">Nombre</TableHead>
            <TableHead className="text-[12px]">Email</TableHead>
            <TableHead className="text-[12px]">Rol</TableHead>
            <TableHead className="text-[12px]">Cliente / Portafolio</TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.map((user) => (
            <TableRow key={user.id}>
              <TableCell className="text-[13px] font-medium">
                {user.name}
              </TableCell>
              <TableCell className="text-[13px] text-[var(--color-muted-foreground)]">
                {user.email}
              </TableCell>
              <TableCell>
                <Badge
                  variant="secondary"
                  className={`text-[11px] ${roleBadgeColors[user.role]}`}
                >
                  {ROLE_LABELS[user.role]}
                </Badge>
              </TableCell>
              <TableCell className="text-[13px] text-[var(--color-muted-foreground)]">
                {user.customer
                  ? user.customer.name
                  : user.assignedPortfolio
                    ? user.assignedPortfolio.name
                    : "—"}
              </TableCell>
              <TableCell>
                <UserRowActions
                  user={user}
                  customers={customers}
                  portfolios={portfolios}
                  currentUserId={currentUserId}
                />
              </TableCell>
            </TableRow>
          ))}
          {filtered.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={5}
                className="text-center text-[13px] text-[var(--color-muted-foreground)] py-8"
              >
                {q ? "Sin resultados" : "No hay usuarios registrados"}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
