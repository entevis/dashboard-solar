"use client";

import { useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TableSortLabel from "@mui/material/TableSortLabel";
import Chip from "@mui/material/Chip";
import Typography from "@mui/material/Typography";
import { InvoiceRowActions } from "@/components/billing/invoice-row-actions";
import { BillingPagination } from "@/components/billing/billing-pagination";
import { formatCLP, formatKwh } from "@/lib/utils/formatters";

export type BillingSortKey = "number" | "customer" | "portfolio" | "issueDate" | "dueDate" | "total" | "amountDue" | "status";
type SortDir = "asc" | "desc";

export interface SerializedInvoice {
  id: number;
  number: string | null;
  duemintId: string | null;
  clientTaxId: string | null;
  customer: { name: string };
  portfolio: { name: string } | null;
  issueDate: string | null;
  dueDate: string | null;
  total: number | null;
  amountDue: number | null;
  statusName: string | null;
  url: string | null;
  pdfUrl: string | null;
  kwhGenerated: number | null;
  co2Avoided: number | null;
  reportUrl: string | null;
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return "—";
  return new Intl.DateTimeFormat("es-CL", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(dateStr));
}

function StatusChip({ statusName }: { statusName: string | null }) {
  if (!statusName) return <Typography variant="caption" color="text.secondary">—</Typography>;
  const n = statusName.toLowerCase();
  let sx = { backgroundColor: "#e6eeff", color: "#434655" };
  if (n.includes("pag") || n.includes("paid"))                    sx = { backgroundColor: "#dcfce7", color: "#15803d" };
  else if (n.includes("venc") || n.includes("overdue"))           sx = { backgroundColor: "#fee2e2", color: "#dc2626" };
  else if (n.includes("pend") || n.includes("emiti") || n.includes("vencer")) sx = { backgroundColor: "#fef9c3", color: "#a16207" };
  else if (n.includes("nul") || n.includes("cancel"))             sx = { backgroundColor: "#f1f5f9", color: "#64748b" };
  return <Chip label={statusName} size="small" sx={{ ...sx, fontSize: "0.6875rem", height: 20, fontWeight: 600 }} />;
}

const VALID_SORT_KEYS: BillingSortKey[] = ["number", "customer", "portfolio", "issueDate", "dueDate", "total", "amountDue", "status"];

interface Props {
  invoices: SerializedInvoice[];
  total: number;
  page: number;
  pageSize: number;
}

export function BillingTable({ invoices, total, page, pageSize }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const sortBy = (VALID_SORT_KEYS.includes(searchParams.get("sortBy") as BillingSortKey)
    ? searchParams.get("sortBy") as BillingSortKey
    : "issueDate");
  const sortDir = (searchParams.get("sortDir") === "asc" ? "asc" : "desc") as SortDir;

  function handleSort(key: BillingSortKey) {
    const params = new URLSearchParams(searchParams.toString());
    if (key === sortBy) {
      params.set("sortDir", sortDir === "asc" ? "desc" : "asc");
    } else {
      params.set("sortBy", key);
      params.set("sortDir", "asc");
    }
    params.set("page", "1");
    startTransition(() => { router.push(`?${params.toString()}`); });
  }

  function col(key: BillingSortKey) {
    return {
      active: sortBy === key,
      direction: sortBy === key ? sortDir : ("asc" as SortDir),
      onClick: () => handleSort(key),
    };
  }

  return (
    <>
      <TableContainer sx={{ flex: 1, minHeight: 0, overflow: "auto", opacity: isPending ? 0.6 : 1, transition: "opacity 0.15s" }}>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow
              sx={{
                "& .MuiTableCell-head": { backgroundColor: "#eff4ff" },
                "& .MuiTableSortLabel-root": { fontSize: "0.75rem", fontWeight: 600 },
                "& .MuiTableSortLabel-root.Mui-active": { color: "#004ac6" },
                "& .MuiTableSortLabel-icon": { fontSize: "0.9rem !important" },
              }}
            >
              <TableCell><TableSortLabel {...col("number")}>N° Factura</TableSortLabel></TableCell>
              <TableCell><TableSortLabel {...col("customer")}>Cliente</TableSortLabel></TableCell>
              <TableCell><TableSortLabel {...col("portfolio")}>Portafolio</TableSortLabel></TableCell>
              <TableCell><TableSortLabel {...col("issueDate")}>Emisión</TableSortLabel></TableCell>
              <TableCell><TableSortLabel {...col("dueDate")}>Vencimiento</TableSortLabel></TableCell>
              <TableCell align="right">
                <TableSortLabel {...col("total")} sx={{ justifyContent: "flex-end", width: "100%", flexDirection: "row-reverse" }}>
                  Total
                </TableSortLabel>
              </TableCell>
              <TableCell align="right">
                <TableSortLabel {...col("amountDue")} sx={{ justifyContent: "flex-end", width: "100%", flexDirection: "row-reverse" }}>
                  Por cobrar
                </TableSortLabel>
              </TableCell>
              <TableCell><TableSortLabel {...col("status")}>Estado</TableSortLabel></TableCell>
              <TableCell align="right">Generación</TableCell>
              <TableCell align="right">CO₂ evitado</TableCell>
              <TableCell sx={{ width: 40 }} />
            </TableRow>
          </TableHead>
          <TableBody>
            {invoices.map((inv) => (
              <TableRow key={inv.id} hover>
                <TableCell sx={{ fontFamily: "monospace", fontWeight: 500, fontSize: "0.8125rem" }}>
                  {inv.number ?? `#${inv.duemintId}`}
                </TableCell>
                <TableCell>
                  <Typography fontSize="0.8125rem" fontWeight={500}>{inv.customer.name}</Typography>
                  {inv.clientTaxId && (
                    <Typography variant="caption" color="text.secondary">{inv.clientTaxId}</Typography>
                  )}
                </TableCell>
                <TableCell sx={{ color: "text.secondary", fontSize: "0.8125rem" }}>{inv.portfolio?.name ?? "—"}</TableCell>
                <TableCell sx={{ color: "text.secondary", whiteSpace: "nowrap", fontSize: "0.8125rem" }}>{formatDate(inv.issueDate)}</TableCell>
                <TableCell sx={{ color: "text.secondary", whiteSpace: "nowrap", fontSize: "0.8125rem" }}>{formatDate(inv.dueDate)}</TableCell>
                <TableCell align="right" sx={{ fontVariantNumeric: "tabular-nums", fontWeight: 500, fontSize: "0.8125rem" }}>
                  {inv.total != null ? formatCLP(inv.total) : "—"}
                </TableCell>
                <TableCell align="right" sx={{ fontVariantNumeric: "tabular-nums", fontSize: "0.8125rem" }}>
                  {inv.amountDue != null ? formatCLP(inv.amountDue) : "—"}
                </TableCell>
                <TableCell><StatusChip statusName={inv.statusName} /></TableCell>
                <TableCell align="right" sx={{ fontVariantNumeric: "tabular-nums", fontSize: "0.8125rem" }}>
                  {inv.kwhGenerated != null ? formatKwh(inv.kwhGenerated) : <span style={{ color: "#737686" }}>—</span>}
                </TableCell>
                <TableCell align="right" sx={{ fontVariantNumeric: "tabular-nums", fontSize: "0.8125rem" }}>
                  {inv.co2Avoided != null ? (
                    <>{inv.co2Avoided.toFixed(2)} <span style={{ color: "#737686", fontSize: "0.75rem" }}>ton</span></>
                  ) : <span style={{ color: "#737686" }}>—</span>}
                </TableCell>
                <TableCell>
                  <InvoiceRowActions
                    invoiceId={inv.id}
                    isPaid={inv.statusName?.toLowerCase().includes("pag") || inv.statusName?.toLowerCase().includes("paid") || false}
                    url={inv.url ?? null}
                    pdfUrl={inv.pdfUrl ?? null}
                    reportUrl={inv.reportUrl ?? null}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <BillingPagination total={total} page={page} pageSize={pageSize} />
    </>
  );
}
