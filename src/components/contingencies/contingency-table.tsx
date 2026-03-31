"use client";

import { useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TablePagination, DEFAULT_PAGE_SIZE, type PageSize } from "@/components/ui/table-pagination";
import { formatDate, formatCLP } from "@/lib/utils/formatters";
import { ContingencyRowActions } from "@/components/contingencies/contingency-row-actions";
import { EmptyState } from "@/components/ui/empty-state";
import { CheckCircle2 } from "lucide-react";

interface Contingency {
  id: number;
  type: string;
  description: string;
  status: string;
  cost: number | null;
  provider: string | null;
  createdAt: string;
  closedAt: string | null;
  powerPlant: { name: string; portfolio: { name: string } };
  createdBy: { name: string };
}

const statusConfig: Record<string, { label: string; className: string }> = {
  OPEN:        { label: "Abierta",     className: "bg-[var(--color-destructive)]/10 text-[var(--color-destructive)]" },
  IN_PROGRESS: { label: "En progreso", className: "bg-[var(--color-warning)]/10 text-[var(--color-warning)]" },
  CLOSED:      { label: "Cerrada",     className: "bg-[var(--color-success)]/10 text-[var(--color-success)]" },
};

const typeLabels: Record<string, string> = {
  PREVENTIVE: "Preventiva",
  CORRECTIVE: "Correctiva",
};

export function ContingencyTable({
  contingencies,
  canWrite = false,
}: {
  contingencies: Contingency[];
  canWrite?: boolean;
}) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<PageSize>(DEFAULT_PAGE_SIZE);

  if (contingencies.length === 0) {
    return (
      <EmptyState
        icon={CheckCircle2}
        title="Sin contingencias registradas"
        description="Todas las plantas operan con normalidad. Las mantenciones y alertas activas aparecerán aquí."
        size="sm"
      />
    );
  }

  const paginated = contingencies.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="flex-1 min-h-0 overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-[12px]">Planta</TableHead>
              <TableHead className="text-[12px]">Tipo</TableHead>
              <TableHead className="text-[12px]">Descripción</TableHead>
              <TableHead className="text-[12px]">Estado</TableHead>
              <TableHead className="text-[12px]">Costo</TableHead>
              <TableHead className="text-[12px]">Proveedor</TableHead>
              <TableHead className="text-[12px]">Creada</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginated.map((c) => {
              const status = statusConfig[c.status] ?? statusConfig.OPEN;
              return (
                <TableRow key={c.id} className="cursor-pointer hover:bg-[var(--color-secondary)]">
                  <TableCell className="text-[13px]">
                    <Link
                      href={`/contingencies/${c.id}`}
                      className="font-medium text-[var(--color-primary)] hover:underline"
                    >
                      {c.powerPlant.name}
                    </Link>
                    <p className="text-[12px] text-[var(--color-muted-foreground)]">
                      {c.powerPlant.portfolio.name}
                    </p>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[12px]">
                      {typeLabels[c.type] ?? c.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-[13px] max-w-[300px] truncate">{c.description}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={`text-[12px] ${status.className}`}>
                      {status.label}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-[13px]">{c.cost != null ? formatCLP(c.cost) : "—"}</TableCell>
                  <TableCell className="text-[13px]">{c.provider ?? "—"}</TableCell>
                  <TableCell className="text-[13px] text-[var(--color-muted-foreground)]">
                    {formatDate(c.createdAt)}
                  </TableCell>
                  <TableCell>
                    <ContingencyRowActions
                      contingencyId={c.id}
                      description={c.description}
                      canWrite={canWrite}
                    />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
      <TablePagination
        total={contingencies.length}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={(s) => { setPageSize(s); setPage(1); }}
      />
    </div>
  );
}
