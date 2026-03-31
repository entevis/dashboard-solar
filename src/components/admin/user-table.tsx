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
import { TablePagination, DEFAULT_PAGE_SIZE, type PageSize } from "@/components/ui/table-pagination";
import { ROLE_LABELS } from "@/lib/auth/roles";
import { UserRowActions } from "@/components/admin/user-row-actions";
import { EmptyState } from "@/components/ui/empty-state";
import { Search, Users } from "lucide-react";
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
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<PageSize>(DEFAULT_PAGE_SIZE);

  const filtered = q
    ? users.filter(
        (u) =>
          u.name.toLowerCase().includes(q.toLowerCase()) ||
          u.email.toLowerCase().includes(q.toLowerCase())
      )
    : users;

  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  function handleSearch(value: string) {
    setQ(value);
    setPage(1);
  }

  return (
    <div className="flex flex-col flex-1 min-h-0 border border-[var(--color-border)] rounded-xl bg-white overflow-hidden shadow-sm">
      <div className="shrink-0 p-3 border-b border-[var(--color-border)]">
        <div className="relative max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--color-muted-foreground)]" aria-hidden="true" />
          <Input
            value={q}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Buscar por nombre o email..."
            className="pl-8 h-9 text-[13px]"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Users}
          title={q ? "Sin resultados" : "Sin usuarios registrados"}
          description={
            q
              ? `Ningún usuario coincide con "${q}".`
              : "Crea el primer usuario para dar acceso al sistema."
          }
          size="sm"
        />
      ) : (
        <>
          <div className="flex-1 min-h-0 overflow-auto">
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
                {paginated.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="text-[13px] font-medium">{user.name}</TableCell>
                    <TableCell className="text-[13px] text-[var(--color-muted-foreground)]">{user.email}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={`text-[12px] ${roleBadgeColors[user.role]}`}>
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
              </TableBody>
            </Table>
          </div>
          <TablePagination
            total={filtered.length}
            page={page}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={(s) => { setPageSize(s); setPage(1); }}
          />
        </>
      )}
    </div>
  );
}
