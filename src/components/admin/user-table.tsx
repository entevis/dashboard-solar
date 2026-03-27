"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ROLE_LABELS } from "@/lib/auth/roles";
import type { UserRole } from "@prisma/client";

interface UserWithRelations {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  customer: { name: string; rut: string } | null;
  assignedPortfolio: { name: string } | null;
  createdAt: Date;
}

interface UserTableProps {
  users: UserWithRelations[];
}

const roleBadgeColors: Record<UserRole, string> = {
  MAESTRO: "bg-[var(--color-primary)]/10 text-[var(--color-primary)]",
  OPERATIVO: "bg-[var(--color-warning)]/10 text-[var(--color-warning)]",
  CLIENTE: "bg-[var(--color-success)]/10 text-[var(--color-success)]",
  CLIENTE_PERFILADO: "bg-[var(--color-success)]/10 text-[var(--color-success)]",
};

export function UserTable({ users }: UserTableProps) {
  return (
    <div className="border border-[var(--color-border)] rounded-xl bg-white overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-[12px]">Nombre</TableHead>
            <TableHead className="text-[12px]">Email</TableHead>
            <TableHead className="text-[12px]">Rol</TableHead>
            <TableHead className="text-[12px]">Cliente / Portafolio</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
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
            </TableRow>
          ))}
          {users.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={4}
                className="text-center text-[13px] text-[var(--color-muted-foreground)] py-8"
              >
                No hay usuarios registrados
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
