"use client";

import { useRef, useEffect } from "react";
import Link from "next/link";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import MuiTooltip from "@mui/material/Tooltip";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar, Line } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Filler, Tooltip, Legend);

const MONTH_SHORT = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
const ALL_MONTHS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
const FONT = { family: '"Archivo Narrow", sans-serif', size: 11 };

interface MonthlyGen { month: number; kwh: number; co2: number }
interface MonthlyBilling { month: number; pagadas: number; porVencer: number; vencidas: number }
interface BillingSummary { pagadas: { total: number; count: number }; porVencer: { total: number; count: number }; vencidas: { total: number; count: number }; notasCredito: { total: number; count: number } }

interface OverdueInvoice {
  customerName: string;
  total: number;
  daysOverdue: number;
}

interface ClientRow {
  id: number;
  name: string;
  plantsCount: number;
  capacityKw: number;
  kwhYear: number;
  co2Year: number;
  billingYear: number;
  pendingCount: number;
  pendingLabel: string;
}

interface PlantRow {
  name: string;
  customerName: string;
  city: string | null;
  capacityKw: number;
  kwhYear: number;
  co2Year: number;
  lastReportMonth: number | null;
  lastReportYear: number | null;
  lastReportDuemintId: string | null;
}

interface TopClient { name: string; total: number }

export interface PortfolioOverviewProps {
  portfolioName: string;
  logoUrl: string | null;
  year: number;
  plantsCount: number;
  clientsCount: number;
  totalCapacityKw: number;
  kwhYear: number;
  co2Year: number;
  equivalentTrees: number;
  equivalentCars: number;
  totalBillingYear: number;
  invoicesPorVencerCount: number;
  monthlyGeneration: MonthlyGen[];
  monthlyBilling: MonthlyBilling[];
  billingSummary: BillingSummary;
  overdueInvoices: OverdueInvoice[];
  topClients: ClientRow[];
  topPlants: PlantRow[];
  topClientsBilling: TopClient[];
}

function formatNumber(n: number): string { return new Intl.NumberFormat("es-CL").format(Math.round(n)); }
function formatCLPShort(amount: number): string {
  if (Math.abs(amount) >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1).replace(".", ",")}M`;
  return `$${new Intl.NumberFormat("es-CL").format(Math.round(amount))}`;
}
function formatCLPFull(amount: number): string { return `$${new Intl.NumberFormat("es-CL").format(Math.round(amount))}`; }

export function PortfolioOverview(props: PortfolioOverviewProps) {
  const {
    portfolioName, logoUrl, year, plantsCount, clientsCount, totalCapacityKw,
    kwhYear, co2Year, equivalentTrees, equivalentCars, totalBillingYear,
    invoicesPorVencerCount, monthlyGeneration, monthlyBilling, billingSummary,
    overdueInvoices, topClients, topPlants, topClientsBilling,
  } = props;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <Box>
          <Typography variant="h5" fontWeight={700} color="text.primary">{portfolioName}</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>Resumen del portafolio — {year}</Typography>
        </Box>
        {logoUrl && (
          <Box component="img" src={logoUrl} alt={portfolioName} sx={{ height: 40, borderRadius: "8px", objectFit: "contain", border: "1px solid #e6eeff", p: "4px 10px", background: "#fff" }} />
        )}
      </Box>

      {/* KPIs */}
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(5, 1fr)" }, gap: 2 }}>
        <KpiCard color="#2563eb" label="Plantas" value={String(plantsCount)} sub={`${plantsCount} activas · ${formatNumber(totalCapacityKw)} kWp`} />
        <KpiCard color="#2563eb" label="Clientes" value={String(clientsCount)} sub="con plantas en este portafolio" />
        <KpiCard color="#16a34a" label={`Generación ${year}`} value={formatNumber(kwhYear)} unit="kWh" />
        <KpiCard color="#16a34a" label={`CO₂ evitado ${year}`} value={co2Year.toFixed(1).replace(".", ",")} unit="ton" sub={`Equivale a ${formatNumber(equivalentTrees)} árboles`} />
        <KpiCard color="#a16207" label={`Facturación ${year}`} value={formatCLPShort(totalBillingYear)} sub={`${invoicesPorVencerCount} ${invoicesPorVencerCount === 1 ? "factura" : "facturas"} por vencer`} />
      </Box>

      {/* Charts: Generation + CO2 */}
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "3fr 2fr" }, gap: 2 }}>
        <ChartCard title="Generación mensual" subtitle="kWh generados por mes en este portafolio">
          <GenerationBarChart data={monthlyGeneration} />
        </ChartCard>
        <ChartCard title="CO₂ evitado acumulado" subtitle="Toneladas acumuladas en el año">
          <Co2AreaChart data={monthlyGeneration} />
        </ChartCard>
      </Box>

      {/* Overdue invoices */}
      {overdueInvoices.length > 0 && (
        <Box sx={{ backgroundColor: "#fff", border: "1px solid #e6eeff", borderRadius: "12px", p: "20px 22px", boxShadow: "0 2px 8px rgba(13,28,46,0.06)" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
            <Box sx={{ width: 32, height: 32, borderRadius: "8px", background: "#fee2e2", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>⚠️</Box>
            <Typography fontSize="0.875rem" fontWeight={700}>Facturas vencidas</Typography>
            <Box sx={{ ml: "auto" }}>
              <Box component="span" sx={{ fontSize: "11px", fontWeight: 600, p: "2px 8px", borderRadius: "4px", background: "#fee2e2", color: "#dc2626" }}>
                {overdueInvoices.length} {overdueInvoices.length === 1 ? "cliente" : "clientes"}
              </Box>
            </Box>
          </Box>
          {overdueInvoices.map((inv, i) => (
            <Box key={i} sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", py: 1, borderBottom: i < overdueInvoices.length - 1 ? "1px solid #e6eeff" : "none", fontSize: "13px" }}>
              <Typography fontSize="13px" fontWeight={500}>{inv.customerName}</Typography>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Box component="span" sx={{ fontSize: "11px", fontWeight: 600, p: "2px 8px", borderRadius: "4px", background: "#fee2e2", color: "#dc2626" }}>{formatCLPFull(inv.total)}</Box>
                <Typography fontSize="12px" color="text.secondary">· {inv.daysOverdue} días</Typography>
              </Box>
            </Box>
          ))}
        </Box>
      )}

      {/* Top clients table */}
      <TableCard title="Top 10 clientes por generación" subtitle={`Clientes con mayor generación acumulada en ${year}`}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }} aria-label="Top 10 clientes por generación">
          <thead>
            <tr>
              {["Cliente", "Plantas", "Capacidad (kWp)", `Generación ${year} (kWh)`, "CO₂ evitado (ton)", `Facturación ${year}`, "Estado"].map((h, i) => (
                <th key={h} style={{ textAlign: i >= 1 ? "right" : "left", padding: "10px 14px", fontSize: "11px", fontWeight: 600, color: "#737686", textTransform: "uppercase", letterSpacing: "0.04em", borderBottom: "1px solid #e6eeff", background: "#eff4ff", whiteSpace: "nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {topClients.map((c) => (
              <tr key={c.id} onMouseEnter={(e) => (e.currentTarget.style.background = "#eff4ff")} onMouseLeave={(e) => (e.currentTarget.style.background = "")}>
                <td style={{ padding: "12px 14px", borderBottom: "1px solid #e6eeff", fontWeight: 600, color: "#004ac6" }}>{c.name}</td>
                <td style={{ padding: "12px 14px", borderBottom: "1px solid #e6eeff", textAlign: "right" }}>{c.plantsCount}</td>
                <td style={{ padding: "12px 14px", borderBottom: "1px solid #e6eeff", textAlign: "right" }}>{formatNumber(c.capacityKw)}</td>
                <td style={{ padding: "12px 14px", borderBottom: "1px solid #e6eeff", textAlign: "right" }}>{c.kwhYear > 0 ? formatNumber(c.kwhYear) : "—"}</td>
                <td style={{ padding: "12px 14px", borderBottom: "1px solid #e6eeff", textAlign: "right" }}>{c.co2Year > 0 ? c.co2Year.toFixed(1).replace(".", ",") : "—"}</td>
                <td style={{ padding: "12px 14px", borderBottom: "1px solid #e6eeff", textAlign: "right" }}>{c.billingYear > 0 ? formatCLPFull(c.billingYear) : "—"}</td>
                <td style={{ padding: "12px 14px", borderBottom: "1px solid #e6eeff", textAlign: "right" }}>
                  <PendingPill count={c.pendingCount} label={c.pendingLabel} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableCard>

      {/* Billing */}
      <Box>
        <Typography fontSize="0.9375rem" fontWeight={700} sx={{ mb: 0.5 }}>Facturación — {year}</Typography>
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 2 }}>Estado de facturación del portafolio {portfolioName}</Typography>
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, 1fr)" }, gap: 1.5 }}>
          <BillCard label="Pagadas" total={billingSummary.pagadas.total} count={billingSummary.pagadas.count} color="#15803d" />
          <BillCard label="Por vencer" total={billingSummary.porVencer.total} count={billingSummary.porVencer.count} color="#a16207" />
          <BillCard label="Vencidas" total={billingSummary.vencidas.total} count={billingSummary.vencidas.count} color="#dc2626" />
          <BillCard label="Notas de crédito" total={billingSummary.notasCredito.total} count={billingSummary.notasCredito.count} />
        </Box>
      </Box>

      {/* Billing charts */}
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 2 }}>
        <ChartCard title="Facturación mensual" subtitle="Monto facturado por mes (CLP)">
          <BillingStackedChart data={monthlyBilling} />
        </ChartCard>
        <ChartCard title="Top 5 clientes por facturación" subtitle={`Clientes con mayor monto facturado en ${year}`}>
          <TopClientsChart data={topClientsBilling} />
        </ChartCard>
      </Box>

      {/* Top plants */}
      <TableCard title="Top 10 plantas por generación" subtitle={`Plantas con mayor producción acumulada en ${year}`}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }} aria-label="Top 10 plantas por generación">
          <thead>
            <tr>
              {["Planta", "Cliente", "Comuna", "Potencia (kWp)", `Generación ${year} (kWh)`, "CO₂ evitado (ton)", "Último reporte"].map((h, i) => (
                <th key={h} style={{ textAlign: i >= 3 ? "right" : "left", padding: "10px 14px", fontSize: "11px", fontWeight: 600, color: "#737686", textTransform: "uppercase", letterSpacing: "0.04em", borderBottom: "1px solid #e6eeff", background: "#eff4ff", whiteSpace: "nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {topPlants.map((p) => (
              <tr key={p.name} onMouseEnter={(e) => (e.currentTarget.style.background = "#eff4ff")} onMouseLeave={(e) => (e.currentTarget.style.background = "")}>
                <td style={{ padding: "12px 14px", borderBottom: "1px solid #e6eeff", fontWeight: 600, color: "#004ac6" }}>{p.name}</td>
                <td style={{ padding: "12px 14px", borderBottom: "1px solid #e6eeff", color: "#737686" }}>{p.customerName}</td>
                <td style={{ padding: "12px 14px", borderBottom: "1px solid #e6eeff" }}>{p.city || "—"}</td>
                <td style={{ padding: "12px 14px", borderBottom: "1px solid #e6eeff", textAlign: "right" }}>{formatNumber(p.capacityKw)}</td>
                <td style={{ padding: "12px 14px", borderBottom: "1px solid #e6eeff", textAlign: "right" }}>{p.kwhYear > 0 ? formatNumber(p.kwhYear) : "—"}</td>
                <td style={{ padding: "12px 14px", borderBottom: "1px solid #e6eeff", textAlign: "right" }}>{p.co2Year > 0 ? p.co2Year.toFixed(1).replace(".", ",") : "—"}</td>
                <td style={{ padding: "12px 14px", borderBottom: "1px solid #e6eeff", textAlign: "right" }}>
                  {p.lastReportMonth && p.lastReportYear ? (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                      {MONTH_SHORT[p.lastReportMonth - 1]} {p.lastReportYear}
                      {p.lastReportDuemintId && (
                        <Link href={`/report/${p.lastReportDuemintId}?back=/dashboard`} title="Ver reporte" style={{ display: "inline-flex", color: "#004ac6" }}>
                          <DescriptionOutlinedIcon sx={{ fontSize: 16 }} />
                        </Link>
                      )}
                    </span>
                  ) : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableCard>

      {/* Impact */}
      <Box>
        <Typography fontSize="0.9375rem" fontWeight={700} sx={{ mb: 0.5 }}>Impacto medioambiental — {year}</Typography>
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 2 }}>Equivalencias del portafolio {portfolioName}</Typography>
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" }, gap: 2 }}>
          <ImpactCard icon="🌱" iconBg="#dcfce7" value={co2Year.toFixed(1).replace(".", ",")} label={`ton CO₂ evitadas en ${year}`} />
          <ImpactCard icon="🌳" iconBg="#dcfce7" value={formatNumber(equivalentTrees)} label="árboles equivalentes" tooltip="Un árbol absorbe en promedio 22 kg de CO₂ al año (EPA). Árboles equivalentes = (CO₂ evitado en kg) ÷ 22" />
          <ImpactCard icon="🚗" iconBg="#eff4ff" value={String(equivalentCars)} label="autos retirados de circulación" tooltip="Un auto promedio emite 4,6 toneladas de CO₂ al año (EPA). Autos equivalentes = CO₂ evitado (ton) ÷ 4,6" />
        </Box>
      </Box>
    </Box>
  );
}

/* ─── Shared sub-components ─── */

function KpiCard({ color, label, value, unit, sub }: { color: string; label: string; value: string; unit?: string; sub?: string }) {
  return (
    <Box sx={{ backgroundColor: "#fff", border: "1px solid #e6eeff", borderRadius: "12px", padding: "18px 20px", position: "relative", overflow: "hidden", transition: "transform 0.15s, box-shadow 0.15s", "&:hover": { transform: "translateY(-2px)", boxShadow: "0 4px 16px rgba(13,28,46,0.10)" }, "&::before": { content: '""', position: "absolute", left: 0, top: 0, bottom: 0, width: "3px", borderRadius: "0 3px 3px 0", background: color } }}>
      <Typography sx={{ fontSize: "11px", color: "#737686", mb: "8px", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.03em" }}>{label}</Typography>
      <Typography sx={{ fontSize: "26px", fontWeight: 700, letterSpacing: "-0.025em", lineHeight: 1 }}>
        {value}{unit && <Typography component="span" sx={{ fontSize: "13px", color: "#737686", fontWeight: 500, ml: "3px" }}>{unit}</Typography>}
      </Typography>
      {sub && <Typography sx={{ fontSize: "11px", color: "#737686", mt: "6px" }}>{sub}</Typography>}
    </Box>
  );
}

function ChartCard({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <Box sx={{ backgroundColor: "#fff", border: "1px solid #e6eeff", borderRadius: "12px", padding: "22px 24px", boxShadow: "0 2px 8px rgba(13,28,46,0.06)" }}>
      <Typography sx={{ fontSize: "15px", fontWeight: 700, letterSpacing: "-0.01em", mb: "4px" }}>{title}</Typography>
      <Typography sx={{ fontSize: "12px", color: "#737686", mb: 2 }}>{subtitle}</Typography>
      <Box sx={{ position: "relative", height: 260 }}>{children}</Box>
    </Box>
  );
}

function TableCard({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <Box sx={{ backgroundColor: "#fff", border: "1px solid #e6eeff", borderRadius: "12px", boxShadow: "0 2px 8px rgba(13,28,46,0.06)", overflow: "hidden" }}>
      <Box sx={{ px: 3, pt: 2.5, pb: 1.5 }}>
        <Typography fontSize="0.9375rem" fontWeight={700}>{title}</Typography>
        <Typography variant="caption" color="text.secondary">{subtitle}</Typography>
      </Box>
      <Box sx={{ overflowX: "auto" }}>{children}</Box>
    </Box>
  );
}

function BillCard({ label, total, count, color }: { label: string; total: number; count: number; color?: string }) {
  return (
    <Box sx={{ backgroundColor: "#fff", border: "1px solid #e6eeff", borderRadius: "10px", padding: "16px 18px" }}>
      <Typography sx={{ fontSize: "11px", color: "#737686", textTransform: "uppercase", letterSpacing: "0.04em", mb: "6px", fontWeight: 500 }}>{label}</Typography>
      <Typography sx={{ fontSize: "20px", fontWeight: 700, color: color || "inherit" }}>{formatCLPFull(total)}</Typography>
      <Typography sx={{ fontSize: "12px", color: "#737686", mt: "2px" }}>{count} {count === 1 ? "factura" : "facturas"}</Typography>
    </Box>
  );
}

function ImpactCard({ icon, iconBg, value, label, tooltip }: { icon: string; iconBg: string; value: string; label: string; tooltip?: string }) {
  return (
    <Box sx={{ backgroundColor: "#fff", border: "1px solid #e6eeff", borderRadius: "12px", padding: 3, textAlign: "center", position: "relative", transition: "transform 0.15s", "&:hover": { transform: "translateY(-2px)", boxShadow: "0 4px 16px rgba(13,28,46,0.10)" } }}>
      {tooltip && (
        <MuiTooltip title={tooltip} placement="top" arrow slotProps={{ tooltip: { sx: { fontSize: "12px", maxWidth: 260, lineHeight: 1.5, p: 1.5 } } }}>
          <InfoOutlinedIcon sx={{ position: "absolute", top: 12, right: 12, fontSize: 16, color: "#b4c5ff", cursor: "help", "&:hover": { color: "#004ac6" } }} />
        </MuiTooltip>
      )}
      <Box sx={{ width: 48, height: 48, borderRadius: "14px", display: "inline-flex", alignItems: "center", justifyContent: "center", mb: 1.5, fontSize: "22px", backgroundColor: iconBg }}><span aria-hidden="true">{icon}</span></Box>
      <Typography sx={{ fontSize: "32px", fontWeight: 700, letterSpacing: "-0.02em", mb: 0.5 }}>{value}</Typography>
      <Typography sx={{ fontSize: "13px", color: "#737686" }}>{label}</Typography>
    </Box>
  );
}

function PendingPill({ count, label }: { count: number; label: string }) {
  if (count === 0) return <span style={{ display: "inline-block", fontSize: "11px", fontWeight: 600, padding: "2px 8px", borderRadius: "4px", background: "#dcfce7", color: "#16a34a" }}>Al día</span>;
  const isOverdue = label.includes("vencida");
  return <span style={{ display: "inline-block", fontSize: "11px", fontWeight: 600, padding: "2px 8px", borderRadius: "4px", background: isOverdue ? "#fee2e2" : "#fef9c3", color: isOverdue ? "#dc2626" : "#a16207" }}>{count} {label}</span>;
}

/* ─── Charts ─── */

function GenerationBarChart({ data }: { data: MonthlyGen[] }) {
  const byMonth = new Map(data.map((d) => [d.month, d]));
  return <Bar data={{ labels: ALL_MONTHS.map((m) => MONTH_SHORT[m - 1]), datasets: [{ data: ALL_MONTHS.map((m) => Math.round(byMonth.get(m)?.kwh ?? 0)), backgroundColor: "#2563eb", borderRadius: 6, borderSkipped: false }] }} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { backgroundColor: "#0B1220", cornerRadius: 8, padding: 12, callbacks: { label: (ctx) => `  ${(ctx.parsed.y ?? 0).toLocaleString("es-CL")} kWh` } } }, scales: { y: { beginAtZero: true, grid: { color: "#eff4ff" }, ticks: { font: FONT, callback: (v) => `${Number(v) / 1000}k` }, border: { color: "#e6eeff" } }, x: { grid: { display: false }, ticks: { font: FONT }, border: { color: "#e6eeff" } } } }} />;
}

function Co2AreaChart({ data }: { data: MonthlyGen[] }) {
  const byMonth = new Map(data.map((d) => [d.month, d]));
  let acc = 0;
  const values = ALL_MONTHS.map((m) => { acc += byMonth.get(m)?.co2 ?? 0; return parseFloat(acc.toFixed(2)); });
  const chartRef = useRef<ChartJS<"line"> | null>(null);
  useEffect(() => { const c = chartRef.current; if (!c?.chartArea) return; const g = c.ctx.createLinearGradient(0, c.chartArea.top, 0, c.chartArea.bottom); g.addColorStop(0, "rgba(22,163,74,0.3)"); g.addColorStop(1, "rgba(22,163,74,0.02)"); c.data.datasets[0].backgroundColor = g; c.update("none"); });
  return <Line ref={chartRef} data={{ labels: ALL_MONTHS.map((m) => MONTH_SHORT[m - 1]), datasets: [{ data: values, borderColor: "#16a34a", backgroundColor: "rgba(22,163,74,0.4)", fill: true, tension: 0.3, pointRadius: 5, pointBackgroundColor: "#16a34a", pointBorderColor: "#fff", pointBorderWidth: 2, borderWidth: 2.5 }] }} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { backgroundColor: "#0B1220", cornerRadius: 8, padding: 12, callbacks: { label: (ctx) => `  ${(ctx.parsed.y ?? 0).toFixed(1)} ton CO₂` } } }, scales: { y: { beginAtZero: true, grid: { color: "#eff4ff" }, ticks: { font: FONT }, border: { color: "#e6eeff" } }, x: { grid: { display: false }, ticks: { font: FONT }, border: { color: "#e6eeff" } } } }} />;
}

function BillingStackedChart({ data }: { data: MonthlyBilling[] }) {
  const byMonth = new Map(data.map((d) => [d.month, d]));
  const get = (m: number) => byMonth.get(m) ?? { month: m, pagadas: 0, porVencer: 0, vencidas: 0 };
  return <Bar data={{ labels: ALL_MONTHS.map((m) => MONTH_SHORT[m - 1]), datasets: [
    { label: "Pagadas", data: ALL_MONTHS.map((m) => get(m).pagadas), backgroundColor: "#16a34a", borderRadius: 4, borderSkipped: false },
    { label: "Por vencer", data: ALL_MONTHS.map((m) => get(m).porVencer), backgroundColor: "#F59E0B", borderRadius: 4, borderSkipped: false },
    { label: "Vencidas", data: ALL_MONTHS.map((m) => get(m).vencidas), backgroundColor: "#dc2626", borderRadius: 4, borderSkipped: false },
  ] }} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: "bottom", labels: { usePointStyle: true, boxWidth: 8, padding: 16, font: FONT } }, tooltip: { backgroundColor: "#0B1220", cornerRadius: 8, padding: 12, callbacks: { label: (ctx) => `  ${ctx.dataset.label}: ${formatCLPShort(ctx.parsed.y ?? 0)}` } } }, scales: { x: { stacked: true, grid: { display: false }, ticks: { font: FONT }, border: { color: "#e6eeff" } }, y: { stacked: true, grid: { color: "#eff4ff" }, ticks: { font: FONT, callback: (v) => `$${Number(v) / 1_000_000}M` }, border: { color: "#e6eeff" } } } }} />;
}

function TopClientsChart({ data }: { data: TopClient[] }) {
  const colors = ["#2563eb", "#60a5fa", "#93bbfd", "#b4c5ff", "#dbe1ff"];
  return <Bar data={{ labels: data.map((d) => d.name), datasets: [{ data: data.map((d) => d.total), backgroundColor: data.map((_, i) => colors[i] || colors[colors.length - 1]), borderRadius: 6, borderSkipped: false }] }} options={{ indexAxis: "y", responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { backgroundColor: "#0B1220", cornerRadius: 8, padding: 12, callbacks: { label: (ctx) => `  ${formatCLPShort(ctx.parsed.x ?? 0)}` } } }, scales: { x: { beginAtZero: true, grid: { color: "#eff4ff" }, ticks: { font: FONT, callback: (v) => `$${Number(v) / 1_000_000}M` }, border: { color: "#e6eeff" } }, y: { grid: { display: false }, ticks: { font: FONT }, border: { color: "#e6eeff" } } } }} />;
}
