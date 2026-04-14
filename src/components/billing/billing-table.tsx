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
import Tooltip from "@mui/material/Tooltip";
import Chip from "@mui/material/Chip";
import Typography from "@mui/material/Typography";
import { InvoiceRowActions } from "@/components/billing/invoice-row-actions";
import { BillingPagination } from "@/components/billing/billing-pagination";
import { formatCLP } from "@/lib/utils/formatters";

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

// Fixed column widths
const W = {
  number: 100,
  customer: 160,
  portfolio: 120,
  issueDate: 95,
  dueDate: 95,
  total: 100,
  amountDue: 100,
  status: 120,
  kwh: 100,
  co2: 100,
  actions: 40,
};

const truncSx = {
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
} as const;

const cellSx = {
  fontSize: "0.8125rem",
  ...truncSx,
} as const;

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
        <Table stickyHeader size="small" sx={{ tableLayout: "fixed" }}>
          <TableHead>
            <TableRow
              sx={{
                "& .MuiTableCell-head": { backgroundColor: "#eff4ff" },
                "& .MuiTableSortLabel-root": { fontSize: "0.75rem", fontWeight: 600 },
                "& .MuiTableSortLabel-root.Mui-active": { color: "#004ac6" },
                "& .MuiTableSortLabel-icon": { fontSize: "0.9rem !important" },
              }}
            >
              <TableCell sx={{ width: W.number }}><TableSortLabel {...col("number")}>N° Factura</TableSortLabel></TableCell>
              <TableCell sx={{ width: W.customer }}><TableSortLabel {...col("customer")}>Cliente</TableSortLabel></TableCell>
              <TableCell sx={{ width: W.portfolio }}><TableSortLabel {...col("portfolio")}>Portafolio</TableSortLabel></TableCell>
              <TableCell sx={{ width: W.issueDate }}><TableSortLabel {...col("issueDate")}>Emisión</TableSortLabel></TableCell>
              <TableCell sx={{ width: W.dueDate }}><TableSortLabel {...col("dueDate")}>Vencimiento</TableSortLabel></TableCell>
              <TableCell sx={{ width: W.total }} align="right">
                <TableSortLabel {...col("total")} sx={{ justifyContent: "flex-end", width: "100%", flexDirection: "row-reverse" }}>
                  Total
                </TableSortLabel>
              </TableCell>
              <TableCell sx={{ width: W.amountDue }} align="right">
                <TableSortLabel {...col("amountDue")} sx={{ justifyContent: "flex-end", width: "100%", flexDirection: "row-reverse" }}>
                  Por cobrar
                </TableSortLabel>
              </TableCell>
              <TableCell sx={{ width: W.status }}><TableSortLabel {...col("status")}>Estado</TableSortLabel></TableCell>
              <TableCell sx={{ width: W.kwh }} align="right">Generación (kWh)</TableCell>
              <TableCell sx={{ width: W.co2 }} align="right">CO₂ evitado (ton)</TableCell>
              <TableCell sx={{ width: W.actions }} />
            </TableRow>
          </TableHead>
          <TableBody>
            {invoices.map((inv) => {
              const numberText = inv.number ?? `#${inv.duemintId}`;
              const customerName = inv.customer.name;
              const portfolioName = inv.portfolio?.name ?? "—";
              const totalText = inv.total != null ? formatCLP(inv.total) : "—";
              const dueText = inv.amountDue != null ? formatCLP(inv.amountDue) : "—";
              const kwhText = inv.kwhGenerated != null ? new Intl.NumberFormat("es-CL").format(Math.round(inv.kwhGenerated)) : "—";
              const co2Text = inv.co2Avoided != null ? inv.co2Avoided.toFixed(2) : "—";

              return (
                <TableRow key={inv.id} hover>
                  <TableCell sx={{ ...cellSx, fontVariantNumeric: "tabular-nums", fontWeight: 500 }}>
                    <Tooltip title={numberText} placement="top" enterDelay={400}><span style={truncSx}>{numberText}</span></Tooltip>
                  </TableCell>
                  <TableCell sx={cellSx}>
                    <Tooltip title={`${customerName}${inv.clientTaxId ? ` · ${inv.clientTaxId}` : ""}`} placement="top" enterDelay={400}>
                      <span style={{ ...truncSx, display: "block", fontWeight: 500 }}>{customerName}</span>
                    </Tooltip>
                  </TableCell>
                  <TableCell sx={{ ...cellSx, color: "text.secondary" }}>
                    <Tooltip title={portfolioName} placement="top" enterDelay={400}><span style={truncSx}>{portfolioName}</span></Tooltip>
                  </TableCell>
                  <TableCell sx={{ ...cellSx, color: "text.secondary" }}>{formatDate(inv.issueDate)}</TableCell>
                  <TableCell sx={{ ...cellSx, color: "text.secondary" }}>{formatDate(inv.dueDate)}</TableCell>
                  <TableCell align="right" sx={{ ...cellSx, fontVariantNumeric: "tabular-nums", fontWeight: 500 }}>{totalText}</TableCell>
                  <TableCell align="right" sx={{ ...cellSx, fontVariantNumeric: "tabular-nums" }}>{dueText}</TableCell>
                  <TableCell sx={cellSx}><StatusChip statusName={inv.statusName} /></TableCell>
                  <TableCell align="right" sx={{ ...cellSx, fontVariantNumeric: "tabular-nums" }}>
                    {kwhText === "—" ? <span style={{ color: "#737686" }}>—</span> : kwhText}
                  </TableCell>
                  <TableCell align="right" sx={{ ...cellSx, fontVariantNumeric: "tabular-nums" }}>
                    {co2Text === "—" ? <span style={{ color: "#737686" }}>—</span> : co2Text}
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
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
      <BillingPagination total={total} page={page} pageSize={pageSize} />
    </>
  );
}
