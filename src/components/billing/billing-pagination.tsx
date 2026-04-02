"use client";

import { useRouter, useSearchParams } from "next/navigation";
import TablePagination from "@mui/material/TablePagination";

const PAGE_SIZES = [15, 50, 100];

export function BillingPagination({ total, page, pageSize = 15 }: { total: number; page: number; pageSize?: number }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function navigate(newPage: number, newSize: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(newPage));
    params.set("size", String(newSize));
    router.push(`?${params.toString()}`);
  }

  return (
    <TablePagination
      component="div"
      count={total}
      page={page - 1}
      onPageChange={(_, p) => navigate(p + 1, pageSize)}
      rowsPerPage={pageSize}
      onRowsPerPageChange={(e) => navigate(1, parseInt(e.target.value))}
      rowsPerPageOptions={PAGE_SIZES}
      labelRowsPerPage="Filas:"
      labelDisplayedRows={({ from, to, count }) => `${from}–${to} de ${count}`}
      sx={{
        borderTop: "none",
        flexShrink: 0,
        fontSize: "0.75rem",
        "& .MuiTablePagination-toolbar": { minHeight: 40, px: 1.5 },
        "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows": { fontSize: "0.75rem" },
      }}
    />
  );
}
