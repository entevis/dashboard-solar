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
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import { InvoiceRowActions } from "@/components/billing/invoice-row-actions";
import { BillingPagination } from "@/components/billing/billing-pagination";
import { formatCLP } from "@/lib/utils/formatters";

export type BillingSortKey = "number" | "customer" | "issueDate" | "dueDate" | "total" | "status";
type SortDir = "asc" | "desc";

export interface SerializedInvoice {
  id: number;
  number: string | null;
  duemintId: string | null;
  clientTaxId: string | null;
  customer: { name: string };
  issueDate: string | null;
  dueDate: string | null;
  total: number | null;
  amountCredit: number | null;
  creditNoteNumber: string | null;
  statusCode: number | null;
  statusName: string | null;
  url: string | null;
  pdfUrl: string | null;
  kwhGenerated: number | null;
  co2Avoided: number | null;
  reportUrl: string | null;
  reportPeriodMonth: number | null;
  reportPeriodYear: number | null;
  reportPlantName: string | null;
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return "—";
  return new Intl.DateTimeFormat("es-CL", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(dateStr));
}

const MONTH_SHORT = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

function formatReportPeriod(month: number | null, year: number | null) {
  if (!month || !year) return "—";
  return `${MONTH_SHORT[month - 1]} ${year}`;
}

function isDocumento(statusCode: number | null) {
  return statusCode === 4;
}

function StatusChip({ statusCode, statusName }: { statusCode: number | null; statusName: string | null }) {
  if (!statusName) return <Typography variant="caption" color="text.secondary">—</Typography>;
  let sx = { backgroundColor: "#e6eeff", color: "#434655" };
  switch (statusCode) {
    case 1: sx = { backgroundColor: "#dcfce7", color: "#15803d" }; break; // Pagada
    case 2: sx = { backgroundColor: "#fef9c3", color: "#a16207" }; break; // Por vencer
    case 3: sx = { backgroundColor: "#fee2e2", color: "#dc2626" }; break; // Vencida
    case 4: sx = { backgroundColor: "#f1f5f9", color: "#64748b" }; break; // Documento
  }
  return <Chip label={statusName} size="small" sx={{ ...sx, fontSize: "0.6875rem", height: 20, fontWeight: 600 }} />;
}

const VALID_SORT_KEYS: BillingSortKey[] = ["number", "customer", "issueDate", "dueDate", "total", "status"];

const W = {
  number: 95,
  customer: 150,
  issueDate: 90,
  dueDate: 90,
  total: 100,
  status: 115,
  plantName: 150,
  reportPeriod: 80,
  kwh: 100,
  co2: 100,
  actions: 60,
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
  reportBackHref?: string;
}

export function BillingTable({ invoices, total, page, pageSize, reportBackHref }: Props) {
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
              <TableCell sx={{ width: W.plantName }}>Planta</TableCell>
              <TableCell sx={{ width: W.issueDate }}><TableSortLabel {...col("issueDate")}>Emisión</TableSortLabel></TableCell>
              <TableCell sx={{ width: W.dueDate }}><TableSortLabel {...col("dueDate")}>Vencimiento</TableSortLabel></TableCell>
              <TableCell sx={{ width: W.total }} align="right">
                <TableSortLabel {...col("total")} sx={{ justifyContent: "flex-end", width: "100%", flexDirection: "row-reverse" }}>
                  Total
                </TableSortLabel>
              </TableCell>
              <TableCell sx={{ width: W.status }}><TableSortLabel {...col("status")}>Estado</TableSortLabel></TableCell>
              <TableCell sx={{ width: W.reportPeriod }}>Periodo reporte</TableCell>
              <TableCell sx={{ width: W.kwh }} align="right">Generación (kWh)</TableCell>
              <TableCell sx={{ width: W.co2 }} align="right">CO₂ evitado (ton)</TableCell>
              <TableCell sx={{ width: W.actions }}>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {invoices.map((inv) => {
              const numberText = inv.number ?? `#${inv.duemintId}`;
              const customerName = inv.customer.name;
              const effectiveTotal = inv.total != null ? inv.total - (inv.amountCredit ?? 0) : null;
              const totalText = effectiveTotal != null ? formatCLP(effectiveTotal) : "—";
              const hasNC = (inv.amountCredit ?? 0) > 0;
              const anulada = isDocumento(inv.statusCode);
              const periodText = anulada ? "--" : formatReportPeriod(inv.reportPeriodMonth, inv.reportPeriodYear);
              const kwhText = anulada ? "--" : (inv.kwhGenerated != null ? new Intl.NumberFormat("es-CL").format(Math.round(inv.kwhGenerated)) : "—");
              const co2Text = anulada ? "--" : (inv.co2Avoided != null ? inv.co2Avoided.toFixed(2) : "—");

              return (
                <TableRow key={inv.id} hover>
                  <TableCell sx={{ ...cellSx, fontVariantNumeric: "tabular-nums", fontWeight: 500 }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                      <Tooltip title={numberText} placement="top" enterDelay={400}><span style={truncSx}>{numberText}</span></Tooltip>
                      {hasNC && (
                        <Tooltip
                          placement="top"
                          arrow
                          title={[
                            inv.creditNoteNumber ? `Nota de crédito N°${inv.creditNoteNumber}` : "Nota de crédito aplicada",
                            `Total descontado: ${formatCLP(inv.amountCredit ?? 0)}`,
                            "(monto ya reflejado en el total)",
                          ].join(" · ")}
                        >
                          <InfoOutlinedIcon sx={{ fontSize: 13, color: "#dc2626", cursor: "help", flexShrink: 0 }} />
                        </Tooltip>
                      )}
                    </span>
                  </TableCell>
                  <TableCell sx={cellSx}>
                    <Tooltip title={`${customerName}${inv.clientTaxId ? ` · ${inv.clientTaxId}` : ""}`} placement="top" enterDelay={400}>
                      <span style={{ ...truncSx, display: "block", fontWeight: 500 }}>{customerName}</span>
                    </Tooltip>
                  </TableCell>
                  <TableCell sx={{ ...cellSx, color: "text.secondary" }}>
                    {inv.reportPlantName ? (
                      <Tooltip title={inv.reportPlantName} placement="top" enterDelay={400}>
                        <span style={truncSx}>{inv.reportPlantName}</span>
                      </Tooltip>
                    ) : <span style={{ color: "#737686" }}>—</span>}
                  </TableCell>
                  <TableCell sx={{ ...cellSx, color: "text.secondary" }}>{formatDate(inv.issueDate)}</TableCell>
                  <TableCell sx={{ ...cellSx, color: "text.secondary" }}>{formatDate(inv.dueDate)}</TableCell>
                  <TableCell align="right" sx={{ ...cellSx, fontVariantNumeric: "tabular-nums", fontWeight: 500 }}>{totalText}</TableCell>
                  <TableCell sx={cellSx}><StatusChip statusCode={inv.statusCode} statusName={inv.statusName} /></TableCell>
                  <TableCell sx={{ ...cellSx, color: "text.secondary" }}>
                    {periodText === "—" ? <span style={{ color: "#737686" }}>—</span> : periodText}
                  </TableCell>
                  <TableCell align="right" sx={{ ...cellSx, fontVariantNumeric: "tabular-nums" }}>
                    {kwhText === "—" ? <span style={{ color: "#737686" }}>—</span> : kwhText}
                  </TableCell>
                  <TableCell align="right" sx={{ ...cellSx, fontVariantNumeric: "tabular-nums" }}>
                    {co2Text === "—" ? <span style={{ color: "#737686" }}>—</span> : co2Text}
                  </TableCell>
                  <TableCell>
                    <InvoiceRowActions
                      invoiceId={inv.id}
                      duemintId={inv.duemintId ?? null}
                      isPaid={inv.statusCode === 1}
                      url={inv.url ?? null}
                      pdfUrl={inv.pdfUrl ?? null}
                      reportUrl={inv.reportUrl ?? null}
                      reportBackHref={reportBackHref}
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
