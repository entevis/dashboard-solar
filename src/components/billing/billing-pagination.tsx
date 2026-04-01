"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { TablePagination, DEFAULT_PAGE_SIZE, type PageSize } from "@/components/ui/table-pagination";

export function BillingPagination({ total, page, pageSize = DEFAULT_PAGE_SIZE }: { total: number; page: number; pageSize?: PageSize }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function navigate(newPage: number, newSize: PageSize) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(newPage));
    params.set("size", String(newSize));
    router.push(`?${params.toString()}`);
  }

  return (
    <TablePagination
      total={total}
      page={page}
      pageSize={pageSize}
      onPageChange={(p) => navigate(p, pageSize)}
      onPageSizeChange={(s) => navigate(1, s)}
    />
  );
}
