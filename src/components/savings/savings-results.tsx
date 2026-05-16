"use client";

import React, { useMemo } from "react";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Alert from "@mui/material/Alert";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableRow from "@mui/material/TableRow";
import TableCell from "@mui/material/TableCell";
import Chip from "@mui/material/Chip";
import Tooltip from "@mui/material/Tooltip";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import TrendingUpOutlinedIcon from "@mui/icons-material/TrendingUpOutlined";
import BoltOutlinedIcon from "@mui/icons-material/BoltOutlined";
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";
import WarningAmberOutlinedIcon from "@mui/icons-material/WarningAmberOutlined";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import type { SavingsResult, MonthlyResult } from "@/lib/savings/types";

const MONTHS_SHORT = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
const MONTHS_FULL  = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
const CLIENT_COLORS = ["#1e3a8a", "#0f3460", "#1a2a5e", "#2d3b7a"];

const COL_LABEL_BG  = "#fafafa";
const COL_TOTAL_BG  = "#f5f7ff";
const ROW_HOVER     = "#f5f7ff";
const ROW_BORDER    = "1px solid #f0f4f8";
const SEC_BORDER    = "1px solid #d1d5db";

function clp(n: number) {
  return new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 }).format(n);
}
function kwh(n: number) {
  return new Intl.NumberFormat("es-CL", { maximumFractionDigits: 1 }).format(n) + " kWh";
}
function rate(n: number) {
  return new Intl.NumberFormat("es-CL", { maximumFractionDigits: 1 }).format(n) + " $/kWh";
}

const STICKY_LABEL: object = {
  position: "sticky",
  left: 0,
  zIndex: 1,
  bgcolor: COL_LABEL_BG,
  "tr:hover > &": { bgcolor: ROW_HOVER },
};

const STICKY_SECTION: object = {
  position: "sticky",
  left: 0,
  zIndex: 1,
  bgcolor: "#fff",
  "tr:hover > &": { bgcolor: "#fff" },
};

interface Props { result: SavingsResult }

export function SavingsResults({ result }: Props) {
  const pctAhorro =
    result.totalSinPlanta > 0
      ? ((result.totalAhorro / result.totalSinPlanta) * 100).toFixed(1)
      : "0";

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
      {/* Header */}
      <Box>
        <Typography variant="h6" fontWeight={700} color="text.primary">{result.plantName}</Typography>
        <Typography variant="caption" color="text.secondary">
          {result.months.length} {result.months.length === 1 ? "mes analizado" : "meses analizados"}
          {result.selfConsumptionDiscountPct !== null && ` · Autoconsumo: ${result.selfConsumptionDiscountPct}%`}
          {result.injectionDiscountPct !== null && ` · Inyección: ${result.injectionDiscountPct}%`}
        </Typography>
      </Box>

      {/* Alerts */}
      {result.fileErrors.length > 0 && (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          {result.fileErrors.map((e) => (
            <Alert key={e.fileName} severity="error" icon={<ErrorOutlineIcon />} sx={{ borderRadius: 1.5 }}>
              <strong>{e.fileName}</strong> — {e.error}
            </Alert>
          ))}
        </Box>
      )}
      {result.incompleteMths.length > 0 && (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          {result.incompleteMths.map((m) => (
            <Alert key={`${m.year}-${m.month}`} severity="warning" icon={<WarningAmberOutlinedIcon />} sx={{ borderRadius: 1.5 }}>
              <strong>{MONTHS_SHORT[m.month - 1]} {m.year}</strong> — {m.reason}
            </Alert>
          ))}
        </Box>
      )}
      {result.months.length === 0 && (
        <Alert severity="info">No se pudo construir ningún mes completo. Revisa los archivos subidos.</Alert>
      )}

      {result.months.length > 0 && (
        <>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, 1fr)" }, gap: 2 }}>
            <KpiCard icon={<TrendingUpOutlinedIcon sx={{ fontSize: 20, color: "#15803d" }} />} label="Ahorro total" value={clp(result.totalAhorro)} sub={`${pctAhorro}% de ahorro`} highlight />
            <KpiCard icon={<ReceiptLongOutlinedIcon sx={{ fontSize: 20, color: "#004ac6" }} />} label="Costo real con planta" value={clp(result.totalPagado)} sub="Lo que efectivamente pagaste" />
            <KpiCard icon={<ReceiptLongOutlinedIcon sx={{ fontSize: 20, color: "#dc2626" }} />} label="Costo hipotético sin planta" value={clp(result.totalSinPlanta)} sub="Lo que habrías pagado a la distribuidora" />
            <KpiCard icon={<BoltOutlinedIcon sx={{ fontSize: 20, color: "#a16207" }} />} label="Remanente acumulado" value={clp(result.remanente)} sub="Créditos banked en la distribuidora" />
          </Box>

          <VerticalView result={result} />
        </>
      )}

    </Box>
  );
}

/* ─── Vertical transposed table ─────────────────────────────────────────────── */

function VerticalView({ result }: { result: SavingsResult }) {
  const { months } = result;

  const clientTotals = useMemo(() => {
    const map = new Map<string, { consumoKwh: number; inyeccionKwh: number; montoConsumos: number; descuentoMes: number; montoTotal: number }>();
    for (const m of months) {
      for (const c of m.clients) {
        const prev = map.get(c.clienteNum) ?? { consumoKwh: 0, inyeccionKwh: 0, montoConsumos: 0, descuentoMes: 0, montoTotal: 0 };
        map.set(c.clienteNum, {
          consumoKwh: prev.consumoKwh + c.consumoKwh,
          inyeccionKwh: prev.inyeccionKwh + c.inyeccionKwh,
          montoConsumos: prev.montoConsumos + c.montoConsumos,
          descuentoMes: prev.descuentoMes + c.descuentoMes,
          montoTotal: prev.montoTotal + c.montoTotal,
        });
      }
    }
    return map;
  }, [months]);

  const firstMonthClients = months[0]?.clients ?? [];
  const totalKwhGen       = months.reduce((s, m) => s + m.kwhGenerados, 0);
  const totalMontoSinvest = months.reduce((s, m) => s + m.montoNetoSinvest, 0);
  const ncols = months.length + 2;

  return (
    <Card elevation={0} sx={{ border: "1px solid #e6eeff", borderRadius: 1.5, overflow: "hidden" }}>
      <Box sx={{ overflowX: "auto" }}>
        <Table size="small">
          <TableBody>

            {/* ── Facturación S-Invest (months merged into section header) ── */}
            <VGroupRow months={months} ncols={ncols}>
              Facturación S-Invest
            </VGroupRow>
            <VDataRow label="kWh Generados" cells={months.map((m) => kwh(m.kwhGenerados))} total={kwh(totalKwhGen)} />
            <VDataRow label="$/kWh S-Invest" cells={months.map((m) => rate(m.precioKwhSinvest))} total="—" />
            <VDataRow label="Monto Neto S-Invest ($ s/ IVA)" cells={months.map((m) => clp(m.montoNetoSinvest))} total={clp(totalMontoSinvest)} />
            <VDataRow
              label="Folio Factura #"
              cells={months.map((m) => {
                if (!m.invoiceNumber) return "—";
                if (!m.creditNoteTotal) return `#${m.invoiceNumber}`;
                const ncNet = Math.round(m.creditNoteTotal / 1.19);
                const tooltipText = [
                  m.creditNoteNumber ? `Nota de crédito N°${m.creditNoteNumber}` : "Nota de crédito aplicada",
                  `Neto descontado: ${clp(ncNet)}`,
                  `Total c/IVA: ${clp(m.creditNoteTotal)}`,
                ].join(" · ");
                return (
                  <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.5 }}>
                    <span>{`#${m.invoiceNumber}`}</span>
                    <Tooltip title={tooltipText} placement="top" arrow>
                      <InfoOutlinedIcon sx={{ fontSize: 14, color: "#dc2626", cursor: "help", flexShrink: 0 }} />
                    </Tooltip>
                  </Box>
                );
              })}
              total="—"
            />

            {/* ── Per-client ── */}
            {firstMonthClients.map((c, i) => {
              const t = clientTotals.get(c.clienteNum);
              return (
                <React.Fragment key={c.clienteNum}>
                  <VGroupRow ncols={ncols} color={CLIENT_COLORS[i % CLIENT_COLORS.length]}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                      <span>{c.distribuidora} {c.clienteNum}{c.distributionPct !== null ? ` (${c.distributionPct}%)` : ""}</span>
                      <Chip
                        size="small"
                        label={c.isMain ? "⚡ principal" : "secundario"}
                        sx={{
                          height: 17,
                          fontSize: "0.5875rem",
                          fontWeight: 700,
                          bgcolor: c.isMain ? "#dbeafe" : "#f1f5f9",
                          color: c.isMain ? "#1e40af" : "#475569",
                          "& .MuiChip-label": { px: 0.75 },
                        }}
                      />
                    </Box>
                  </VGroupRow>
                  <VDataRow label="Consumo (kWh)" cells={months.map((m) => { const cl = m.clients.find((x) => x.clienteNum === c.clienteNum); return cl ? kwh(cl.consumoKwh) : "—"; })} total={t ? kwh(t.consumoKwh) : "—"} />
                  <VDataRow label="Inyección (kWh)" cells={months.map((m) => { const cl = m.clients.find((x) => x.clienteNum === c.clienteNum); return cl && cl.inyeccionKwh > 0 ? kwh(cl.inyeccionKwh) : "—"; })} total={t && t.inyeccionKwh > 0 ? kwh(t.inyeccionKwh) : "—"} />
                  <VDataRow label="Consumos ($)" cells={months.map((m) => { const cl = m.clients.find((x) => x.clienteNum === c.clienteNum); return cl ? clp(cl.montoConsumos) : "—"; })} total={t ? clp(t.montoConsumos) : "—"} />
                  <VDataRow
                    label="Descuento por Generación Distribuida ($)"
                    cells={months.map((m) => { const cl = m.clients.find((x) => x.clienteNum === c.clienteNum); return cl ? clp(cl.descuentoMes) : "—"; })}
                    total={t ? clp(t.descuentoMes) : "—"}
                    cellColor="#15803d"
                  />
                  <VDataRow label="Neto ($)" cells={months.map((m) => { const cl = m.clients.find((x) => x.clienteNum === c.clienteNum); return cl ? clp(cl.montoTotal) : "—"; })} total={t ? clp(t.montoTotal) : "—"} />
                </React.Fragment>
              );
            })}

            {/* ── Análisis de Ahorro ── */}
            <VGroupRow ncols={ncols} color="#166534">
              Análisis de Ahorro
            </VGroupRow>
            <VDataRow label="Consumo Mensual Cliente (kWh | Generación − Inyección)" cells={months.map((m) => kwh(m.totalConsumoMensual))} total="—" />
            <VDataRow label="Precio Tarifa Distribuidora sin Descuento ($)" cells={months.map((m) => rate(m.tresCargosDistro))} total="—" />
            <VDataRow label="Monto Neto sin Planta Fotovoltaica ($ s/ IVA)" cells={months.map((m) => clp(m.totalSinPlanta))} total={clp(result.totalSinPlanta)} />
            <VDataRow label="Monto Neto con Planta Fotovoltaica ($ s/ IVA)" cells={months.map((m) => clp(m.totalPagado))} total={clp(result.totalPagado)} />
            <TableRow sx={{ "&:hover": { bgcolor: ROW_HOVER } }}>
              <TableCell sx={{ ...STICKY_LABEL, fontSize: "0.8125rem", fontWeight: 500, color: "#1e293b", py: 0.875, whiteSpace: "nowrap", borderBottom: ROW_BORDER }}>
                Ahorro ($)
              </TableCell>
              {months.map((m) => (
                <TableCell key={`${m.year}-${m.month}`} align="center" sx={{ py: 0.875, borderBottom: ROW_BORDER }}>
                  <AhorroChip value={m.ahorro} />
                </TableCell>
              ))}
              <TableCell align="center" sx={{ py: 0.875, bgcolor: COL_TOTAL_BG, borderLeft: "1px solid #e2e8f0", borderBottom: ROW_BORDER }}>
                <AhorroChip value={result.totalAhorro} />
              </TableCell>
            </TableRow>

          </TableBody>
        </Table>
      </Box>
    </Card>
  );
}

/* ─── Table primitives ──────────────────────────────────────────────────────── */

function VGroupRow({
  children,
  ncols,
  months,
  color,
}: {
  children: React.ReactNode;
  ncols: number;
  months?: MonthlyResult[];
  color?: string;
}) {
  const titleSx = {
    fontWeight: 700,
    fontSize: "0.8125rem",
    color: color ?? "#0f172a",
    pt: 2,
    pb: 0.875,
    borderBottom: SEC_BORDER,
    whiteSpace: "nowrap" as const,
  };

  if (months) {
    return (
      <TableRow>
        <TableCell sx={{ ...STICKY_SECTION, ...titleSx, minWidth: 260 }}>
          {children}
        </TableCell>
        {months.map((m) => (
          <TableCell
            key={`${m.year}-${m.month}`}
            align="center"
            sx={{ fontWeight: 600, fontSize: "0.75rem", color: "#475569", whiteSpace: "nowrap", pt: 2, pb: 0.875, borderBottom: SEC_BORDER, minWidth: 150 }}
          >
            {MONTHS_FULL[m.month - 1]} {m.year}
          </TableCell>
        ))}
        <TableCell
          align="center"
          sx={{ fontWeight: 700, fontSize: "0.75rem", color: "#004ac6", whiteSpace: "nowrap", pt: 2, pb: 0.875, bgcolor: COL_TOTAL_BG, borderLeft: "1px solid #e2e8f0", borderBottom: SEC_BORDER, minWidth: 140 }}
        >
          Total
        </TableCell>
      </TableRow>
    );
  }

  return (
    <TableRow>
      <TableCell colSpan={ncols} sx={{ ...titleSx, pt: 2.5 }}>
        {children}
      </TableCell>
    </TableRow>
  );
}

function NALabel() {
  return (
    <Typography component="span" sx={{ fontSize: "0.625rem", color: "#cbd5e1", fontStyle: "italic", letterSpacing: "0.01em" }}>
      no aplica
    </Typography>
  );
}

function VDataRow({
  label,
  cells,
  total,
  cellColor,
}: {
  label: string;
  cells: React.ReactNode[];
  total: React.ReactNode;
  cellColor?: string;
}) {
  return (
    <TableRow sx={{ "&:hover": { bgcolor: ROW_HOVER } }}>
      <TableCell sx={{ ...STICKY_LABEL, fontSize: "0.8125rem", fontWeight: 500, color: "#1e293b", py: 0.875, whiteSpace: "nowrap", borderBottom: ROW_BORDER }}>
        {label}
      </TableCell>
      {cells.map((c, i) => (
        <TableCell
          key={i}
          align="center"
          sx={{ fontSize: "0.8125rem", color: cellColor ?? "#1e293b", py: 0.875, whiteSpace: "nowrap", borderBottom: ROW_BORDER }}
        >
          {c}
        </TableCell>
      ))}
      <TableCell
        align="center"
        sx={{ fontSize: "0.8125rem", fontWeight: 700, color: total === "—" ? undefined : (cellColor ?? "#1e293b"), py: 0.875, whiteSpace: "nowrap", bgcolor: COL_TOTAL_BG, borderLeft: "1px solid #e2e8f0", borderBottom: ROW_BORDER }}
      >
        {total === "—" ? <NALabel /> : (total ?? <NALabel />)}
      </TableCell>
    </TableRow>
  );
}

/* ─── Shared primitives ─────────────────────────────────────────────────────── */

function AhorroChip({ value }: { value: number }) {
  return (
    <Chip
      label={clp(value)}
      size="small"
      sx={{ bgcolor: value >= 0 ? "#dcfce7" : "#fee2e2", color: value >= 0 ? "#15803d" : "#dc2626", fontWeight: 700, fontSize: "0.75rem" }}
    />
  );
}

function KpiCard({ icon, label, value, sub, highlight }: { icon: React.ReactNode; label: string; value: string; sub: string; highlight?: boolean }) {
  return (
    <Card elevation={0} sx={{ border: "1px solid", borderColor: highlight ? "#bbf7d0" : "#e6eeff", bgcolor: highlight ? "#f0fdf4" : "#fff", borderRadius: 1.5 }}>
      <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>{icon}<Typography variant="caption" color="text.secondary" fontWeight={600}>{label}</Typography></Box>
        <Typography fontWeight={700} fontSize="1.125rem" color={highlight ? "#15803d" : "text.primary"}>{value}</Typography>
        <Typography variant="caption" color="text.secondary">{sub}</Typography>
      </CardContent>
    </Card>
  );
}
