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
import { PlantRowActions } from "@/components/power-plants/plant-row-actions";

interface PlantAddress {
  address: string | null;
  reference: string | null;
  city: string | null;
  county: string | null;
  country: string | null;
}

interface Plant {
  id: number;
  name: string;
  location: string | null;
  city: string | null;
  capacityKw: number;
  status: string;
  portfolioId: number;
  customerId: number;
  solcorId: string | null;
  distributorCompany: string | null;
  tariffId: string | null;
  startDate: Date | null;
  durationYears: number | null;
  specificYield: number | null;
  address: PlantAddress | null;
  portfolio: { name: string };
  customer: { name: string };
}

interface Option { id: number; name: string }

interface PlantTableProps {
  plants: Plant[];
  portfolios: Option[];
  customers: Option[];
  canEdit: boolean;
}

export function PlantTable({ plants, portfolios, customers, canEdit }: PlantTableProps) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<PageSize>(DEFAULT_PAGE_SIZE);

  const paginated = plants.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="flex-1 min-h-0 overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-[12px] whitespace-nowrap">ID Solcor</TableHead>
              <TableHead className="text-[12px] whitespace-nowrap">Nombre Planta</TableHead>
              <TableHead className="text-[12px] whitespace-nowrap">Comuna</TableHead>
              <TableHead className="text-[12px] whitespace-nowrap">Empresa Distribuidora</TableHead>
              <TableHead className="text-[12px] whitespace-nowrap">ID Tarifa</TableHead>
              <TableHead className="text-[12px] whitespace-nowrap">Fecha Inicio (F6)</TableHead>
              <TableHead className="text-[12px] whitespace-nowrap">Duración (Años)</TableHead>
              <TableHead className="text-[12px] whitespace-nowrap">Potencia (kWp)</TableHead>
              <TableHead className="text-[12px] whitespace-nowrap leading-tight text-center">
                Rendimiento Anual Espec.<br />
                <span className="text-[12px] font-normal">(kWh/kWp)</span>
              </TableHead>
              <TableHead className="text-[12px] whitespace-nowrap">Estado</TableHead>
              {canEdit && <TableHead className="w-10" />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginated.map((plant) => (
              <TableRow key={plant.id}>
                <TableCell className="text-[13px] text-[var(--color-muted-foreground)] font-mono">
                  {plant.solcorId ?? "—"}
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  <Link
                    href={`/power-plants/${plant.id}`}
                    className="text-[13px] font-medium text-[var(--color-primary)] hover:underline"
                  >
                    {plant.name}
                  </Link>
                </TableCell>
                <TableCell className="text-[13px] text-[var(--color-foreground)] whitespace-nowrap">
                  {plant.city ?? plant.location ?? "—"}
                </TableCell>
                <TableCell className="text-[13px] text-[var(--color-foreground)] whitespace-nowrap">
                  {plant.distributorCompany ?? "—"}
                </TableCell>
                <TableCell className="text-[13px] text-[var(--color-foreground)] font-mono">
                  {plant.tariffId ?? "—"}
                </TableCell>
                <TableCell className="text-[13px] text-[var(--color-foreground)] whitespace-nowrap">
                  {plant.startDate
                    ? new Intl.DateTimeFormat("es-CL").format(new Date(plant.startDate))
                    : "—"}
                </TableCell>
                <TableCell className="text-[13px] text-[var(--color-foreground)] text-center">
                  {plant.durationYears ?? "—"}
                </TableCell>
                <TableCell className="text-[13px] text-[var(--color-foreground)] text-right tabular-nums">
                  {plant.capacityKw}
                </TableCell>
                <TableCell className="text-[13px] text-[var(--color-foreground)] text-right tabular-nums">
                  {plant.specificYield != null
                    ? plant.specificYield.toLocaleString("es-CL")
                    : "—"}
                </TableCell>
                <TableCell>
                  <Badge
                    variant="secondary"
                    className={`text-[12px] ${
                      plant.status === "active"
                        ? "bg-[var(--color-success)]/10 text-[var(--color-success)]"
                        : "bg-[var(--color-warning)]/10 text-[var(--color-warning)]"
                    }`}
                  >
                    {plant.status === "active" ? "Activa" : "Mantención"}
                  </Badge>
                </TableCell>
                {canEdit && (
                  <TableCell>
                    <PlantRowActions plant={plant} portfolios={portfolios} customers={customers} />
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <TablePagination
        total={plants.length}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={(s) => { setPageSize(s); setPage(1); }}
      />
    </div>
  );
}
