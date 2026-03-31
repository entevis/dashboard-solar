"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TablePagination, DEFAULT_PAGE_SIZE, type PageSize } from "@/components/ui/table-pagination";
import { formatRut } from "@/lib/utils/formatters";
import { CustomerRowActions } from "@/components/admin/customer-row-actions";
import { EmptyState } from "@/components/ui/empty-state";
import { Search, UserCircle } from "lucide-react";

interface Customer {
  id: number;
  name: string;
  rut: string;
  altName: string | null;
  createdAt: string;
  _count: { powerPlants: number; users: number };
}

export function CustomerTable({ customers }: { customers: Customer[] }) {
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<PageSize>(DEFAULT_PAGE_SIZE);

  const filtered = q
    ? customers.filter(
        (c) =>
          c.name.toLowerCase().includes(q.toLowerCase()) ||
          c.rut.includes(q) ||
          (c.altName ?? "").toLowerCase().includes(q.toLowerCase())
      )
    : customers;

  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  function handleSearch(value: string) {
    setQ(value);
    setPage(1);
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="shrink-0 p-3 border-b border-[var(--color-border)]">
        <div className="relative max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--color-muted-foreground)]" aria-hidden="true" />
          <Input
            value={q}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Buscar por razón social o RUT..."
            className="pl-8 h-9 text-[13px]"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={UserCircle}
          title={q ? "Sin resultados" : "No hay clientes registrados"}
          description={q ? `Ningún cliente coincide con "${q}"` : "Crea el primer cliente para comenzar."}
          size="sm"
        />
      ) : (
        <>
          <div className="flex-1 min-h-0 overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-[12px]">Razón Social</TableHead>
                  <TableHead className="text-[12px]">RUT</TableHead>
                  <TableHead className="text-[12px]">Nombre alternativo</TableHead>
                  <TableHead className="text-[12px]">Plantas</TableHead>
                  <TableHead className="text-[12px]">Usuarios</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginated.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="text-[13px] font-medium">{c.name}</TableCell>
                    <TableCell className="text-[13px] font-mono">{formatRut(c.rut)}</TableCell>
                    <TableCell className="text-[13px] text-[var(--color-muted-foreground)]">
                      {c.altName ?? "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-[12px]">{c._count.powerPlants}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-[12px]">{c._count.users}</Badge>
                    </TableCell>
                    <TableCell>
                      <CustomerRowActions customer={c} />
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
