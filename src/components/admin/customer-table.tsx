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
import { formatRut } from "@/lib/utils/formatters";
import { CustomerRowActions } from "@/components/admin/customer-row-actions";
import { Search } from "lucide-react";

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

  const filtered = q
    ? customers.filter(
        (c) =>
          c.name.toLowerCase().includes(q.toLowerCase()) ||
          c.rut.includes(q) ||
          (c.altName ?? "").toLowerCase().includes(q.toLowerCase())
      )
    : customers;

  return (
    <div>
      <div className="p-3 border-b border-[var(--color-border)]">
        <div className="relative max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--color-muted-foreground)]" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por razón social o RUT..."
            className="pl-8 h-8 text-[13px]"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-[13px] text-[var(--color-muted-foreground)]">
          {q ? "Sin resultados" : "No hay clientes registrados"}
        </div>
      ) : (
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
            {filtered.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="text-[13px] font-medium">
                  {c.name}
                </TableCell>
                <TableCell className="text-[13px] font-mono">
                  {formatRut(c.rut)}
                </TableCell>
                <TableCell className="text-[13px] text-[var(--color-muted-foreground)]">
                  {c.altName ?? "—"}
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className="text-[11px]">
                    {c._count.powerPlants}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className="text-[11px]">
                    {c._count.users}
                  </Badge>
                </TableCell>
                <TableCell>
                  <CustomerRowActions customer={c} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
