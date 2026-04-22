"use client";

import { useRef, useEffect } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import MuiTooltip from "@mui/material/Tooltip";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
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
const FONT = { family: '"Plus Jakarta Sans", sans-serif', size: 11 };
const PORTFOLIO_COLORS = ["#2563eb", "#8b5cf6", "#f59e0b", "#ec4899", "#14b8a6"];

interface PortfolioRow {
  id: number;
  name: string;
  plantsCount: number;
  capacityKw: number;
  kwhYear: number;
  co2Year: number;
  billingYear: number;
  porVencerCount: number;
  vencidasCount: number;
}

interface MonthlyByPortfolio {
  month: number;
  portfolioId: number;
  kwh: number;
  co2: number;
}

interface BillingSummary {
  pagadas: { total: number; count: number };
  porVencer: { total: number; count: number };
  vencidas: { total: number; count: number };
  notasCredito: { total: number; count: number };
}

interface MonthlyBilling {
  month: number;
  pagadas: number;
  porVencer: number;
  vencidas: number;
}

export interface MaestroDashboardProps {
  year: number;
  totalPlants: number;
  totalCapacityKw: number;
  totalKwhYear: number;
  totalCo2Year: number;
  totalClients: number;
  equivalentTrees: number;
  equivalentCars: number;
  portfolios: PortfolioRow[];
  monthlyByPortfolio: MonthlyByPortfolio[];
  billingSummary: BillingSummary;
  monthlyBilling: MonthlyBilling[];
  portfolioDistribution: { name: string; total: number }[];
}

function formatNumber(n: number): string {
  return new Intl.NumberFormat("es-CL").format(Math.round(n));
}

function formatCLPShort(amount: number): string {
  if (Math.abs(amount) >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1).replace(".", ",")}M`;
  return `$${new Intl.NumberFormat("es-CL").format(Math.round(amount))}`;
}

function formatCLPFull(amount: number): string {
  return `$${new Intl.NumberFormat("es-CL").format(Math.round(amount))}`;
}

export function MaestroDashboard(props: MaestroDashboardProps) {
  const {
    year, totalPlants, totalCapacityKw, totalKwhYear, totalCo2Year, totalClients,
    equivalentTrees, equivalentCars, portfolios, monthlyByPortfolio,
    billingSummary, monthlyBilling, portfolioDistribution,
  } = props;

  const portfolioColorMap = new Map<number, string>();
  portfolios.forEach((p, i) => portfolioColorMap.set(p.id, PORTFOLIO_COLORS[i % PORTFOLIO_COLORS.length]));

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <Box>
        <Typography variant="h5" fontWeight={700} color="text.primary">Dashboard</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
          Vista consolidada de todos los portafolios — {year}
        </Typography>
      </Box>

      {/* KPIs */}
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, 1fr)" }, gap: 2 }}>
        <KpiCard color="#2563eb" label="Plantas activas" value={String(totalPlants)} sub={`en ${portfolios.length} portafolios · ${totalClients} clientes`} />
        <KpiCard color="#2563eb" label="Capacidad instalada" value={formatNumber(totalCapacityKw)} unit="kWp" />
        <KpiCard color="#16a34a" label={`Generación acumulada ${year}`} value={formatNumber(totalKwhYear)} unit="kWh" />
        <KpiCard color="#16a34a" label={`CO₂ evitado ${year}`} value={formatNumber(totalCo2Year)} unit="ton" sub={`Equivale a ${formatNumber(equivalentTrees)} árboles`} />
      </Box>

      {/* Portfolio table */}
      <Box sx={{ backgroundColor: "#fff", border: "1px solid #e6eeff", borderRadius: "12px", boxShadow: "0 2px 8px rgba(13,28,46,0.06)", overflow: "hidden" }}>
        <Box sx={{ px: 3, pt: 2.5, pb: 1.5 }}>
          <Typography fontSize="0.9375rem" fontWeight={700}>Portafolios</Typography>
          <Typography variant="caption" color="text.secondary">Comparativa de rendimiento y facturación por portafolio</Typography>
        </Box>
        <Box sx={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }} aria-label="Comparativa de portafolios">
            <thead>
              <tr>
                {["Portafolio", "Plantas", "Capacidad (kWp)", `Generación ${year} (kWh)`, "CO₂ evitado (ton)", `Facturación ${year}`, "Por vencer", "Vencidas"].map((h, i) => (
                  <th key={h} style={{
                    textAlign: i >= 1 ? "right" : "left", padding: "10px 14px",
                    fontSize: "11px", fontWeight: 600, color: "#737686", textTransform: "uppercase",
                    letterSpacing: "0.04em", borderBottom: "1px solid #e6eeff", background: "#eff4ff", whiteSpace: "nowrap",
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {portfolios.map((p, i) => (
                <tr key={p.id} style={{ cursor: "default" }} onMouseEnter={(e) => (e.currentTarget.style.background = "#eff4ff")} onMouseLeave={(e) => (e.currentTarget.style.background = "")}>
                  <td style={{ padding: "14px", borderBottom: "1px solid #e6eeff", fontWeight: 600, color: "#0d1c2e" }}>
                    <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: PORTFOLIO_COLORS[i % PORTFOLIO_COLORS.length], marginRight: 8, verticalAlign: "middle" }} />
                    {p.name}
                  </td>
                  <td style={{ padding: "14px", borderBottom: "1px solid #e6eeff", textAlign: "right" }}>{p.plantsCount}</td>
                  <td style={{ padding: "14px", borderBottom: "1px solid #e6eeff", textAlign: "right" }}>{formatNumber(p.capacityKw)}</td>
                  <td style={{ padding: "14px", borderBottom: "1px solid #e6eeff", textAlign: "right" }}>{formatNumber(p.kwhYear)}</td>
                  <td style={{ padding: "14px", borderBottom: "1px solid #e6eeff", textAlign: "right" }}>{p.co2Year.toFixed(1).replace(".", ",")}</td>
                  <td style={{ padding: "14px", borderBottom: "1px solid #e6eeff", textAlign: "right" }}>{formatCLPFull(p.billingYear)}</td>
                  <td style={{ padding: "14px", borderBottom: "1px solid #e6eeff", textAlign: "right" }}>
                    {p.porVencerCount > 0
                      ? <span style={{ fontSize: "11px", fontWeight: 600, padding: "2px 8px", borderRadius: "4px", background: "#fef9c3", color: "#a16207" }}>{p.porVencerCount}</span>
                      : <span style={{ color: "#737686" }}>0</span>}
                  </td>
                  <td style={{ padding: "14px", borderBottom: "1px solid #e6eeff", textAlign: "right" }}>
                    {p.vencidasCount > 0
                      ? <span style={{ fontSize: "11px", fontWeight: 600, padding: "2px 8px", borderRadius: "4px", background: "#fee2e2", color: "#dc2626" }}>{p.vencidasCount}</span>
                      : <span style={{ color: "#737686" }}>0</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Box>
      </Box>

      {/* Charts: Generation by portfolio + CO2 */}
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "3fr 2fr" }, gap: 2 }}>
        <ChartCard title="Generación mensual por portafolio" subtitle="kWh generados por mes, desglosados por portafolio">
          <GenStackedChart data={monthlyByPortfolio} portfolios={portfolios} colors={portfolioColorMap} />
        </ChartCard>
        <ChartCard title="CO₂ evitado acumulado" subtitle="Toneladas acumuladas por portafolio">
          <Co2LinesChart data={monthlyByPortfolio} portfolios={portfolios} colors={portfolioColorMap} />
        </ChartCard>
      </Box>

      {/* Billing */}
      <Box>
        <Typography fontSize="0.9375rem" fontWeight={700} sx={{ mb: 0.5 }}>Facturación consolidada — {year}</Typography>
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 2 }}>Estado de facturación de todos los portafolios</Typography>
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, 1fr)" }, gap: 1.5 }}>
          <BillCard label="Pagadas" total={billingSummary.pagadas.total} count={billingSummary.pagadas.count} color="#15803d" />
          <BillCard label="Por vencer" total={billingSummary.porVencer.total} count={billingSummary.porVencer.count} color="#a16207" />
          <BillCard label="Vencidas" total={billingSummary.vencidas.total} count={billingSummary.vencidas.count} color="#dc2626" />
          <BillCard label="Notas de crédito" total={billingSummary.notasCredito.total} count={billingSummary.notasCredito.count} />
        </Box>
      </Box>

      {/* Charts: Billing monthly + Distribution */}
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 2 }}>
        <ChartCard title="Facturación mensual" subtitle="Monto facturado por mes, stacked por estado">
          <BillingStackedChart data={monthlyBilling} />
        </ChartCard>
        <ChartCard title="Distribución por portafolio" subtitle={`Facturación acumulada ${year} por portafolio`}>
          <DistributionChart data={portfolioDistribution} portfolios={portfolios} />
        </ChartCard>
      </Box>

      {/* Impact */}
      <Box>
        <Typography fontSize="0.9375rem" fontWeight={700} sx={{ mb: 0.5 }}>Impacto medioambiental — {year}</Typography>
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 2 }}>Equivalencias consolidadas de todos los portafolios</Typography>
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" }, gap: 2 }}>
          <ImpactCard icon="🌱" iconBg="#dcfce7" value={formatNumber(totalCo2Year)} label={`ton CO₂ evitadas en ${year}`} />
          <ImpactCard icon="🌳" iconBg="#dcfce7" value={formatNumber(equivalentTrees)} label="árboles equivalentes" tooltip="Un árbol absorbe en promedio 22 kg de CO₂ al año (EPA). Árboles equivalentes = (CO₂ evitado en kg) ÷ 22" />
          <ImpactCard icon="🚗" iconBg="#eff4ff" value={String(equivalentCars)} label="autos retirados de circulación" tooltip="Un auto promedio emite 4,6 toneladas de CO₂ al año (EPA). Autos equivalentes = CO₂ evitado (ton) ÷ 4,6" />
        </Box>
      </Box>
    </Box>
  );
}

/* ─── Sub-components ─── */

function KpiCard({ color, label, value, unit, sub }: { color: string; label: string; value: string; unit?: string; sub?: string }) {
  return (
    <Box sx={{
      backgroundColor: "#fff", border: "1px solid #e6eeff", borderRadius: "12px",
      padding: "20px 22px", position: "relative", overflow: "hidden",
      transition: "transform 0.15s, box-shadow 0.15s",
      "&:hover": { transform: "translateY(-2px)", boxShadow: "0 4px 16px rgba(13,28,46,0.10)" },
      "&::before": { content: '""', position: "absolute", left: 0, top: 0, bottom: 0, width: "3px", borderRadius: "0 3px 3px 0", background: color },
    }}>
      <Typography sx={{ fontSize: "12px", color: "#737686", mb: "10px", fontWeight: 500 }}>{label}</Typography>
      <Typography sx={{ fontSize: "28px", fontWeight: 700, letterSpacing: "-0.025em", lineHeight: 1 }}>
        {value}
        {unit && <Typography component="span" sx={{ fontSize: "14px", color: "#737686", fontWeight: 500, ml: "4px" }}>{unit}</Typography>}
      </Typography>
      {sub && <Typography sx={{ fontSize: "12px", color: "#737686", mt: "8px" }}>{sub}</Typography>}
    </Box>
  );
}

function ChartCard({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <Box sx={{ backgroundColor: "#fff", border: "1px solid #e6eeff", borderRadius: "12px", padding: "22px 24px", boxShadow: "0 2px 8px rgba(13,28,46,0.06)" }}>
      <Typography sx={{ fontSize: "15px", fontWeight: 700, letterSpacing: "-0.01em", mb: "4px" }}>{title}</Typography>
      <Typography sx={{ fontSize: "12px", color: "#737686", mb: 2 }}>{subtitle}</Typography>
      <Box sx={{ position: "relative", height: 280 }}>{children}</Box>
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
    <Box sx={{
      backgroundColor: "#fff", border: "1px solid #e6eeff", borderRadius: "12px",
      padding: 3, textAlign: "center", position: "relative",
      transition: "transform 0.15s", "&:hover": { transform: "translateY(-2px)", boxShadow: "0 4px 16px rgba(13,28,46,0.10)" },
    }}>
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

/* ─── Charts ─── */

function GenStackedChart({ data, portfolios, colors }: { data: MonthlyByPortfolio[]; portfolios: PortfolioRow[]; colors: Map<number, string> }) {
  const labels = ALL_MONTHS.map((m) => MONTH_SHORT[m - 1]);

  const datasets = portfolios.map((p) => ({
    label: p.name,
    data: ALL_MONTHS.map((m) => data.find((d) => d.month === m && d.portfolioId === p.id)?.kwh ?? 0),
    backgroundColor: colors.get(p.id) || "#ccc",
    borderRadius: 4,
    borderSkipped: false as const,
  }));

  return (
    <Bar data={{ labels, datasets }} options={{
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { position: "bottom", labels: { usePointStyle: true, boxWidth: 8, padding: 16, font: FONT } },
        tooltip: { backgroundColor: "#0B1220", cornerRadius: 8, padding: 12, callbacks: { label: (ctx) => `  ${ctx.dataset.label}: ${Math.round((ctx.parsed.y ?? 0) / 1000)}k kWh` } },
      },
      scales: {
        x: { stacked: true, grid: { display: false }, ticks: { font: FONT }, border: { color: "#e6eeff" } },
        y: { stacked: true, grid: { color: "#eff4ff" }, ticks: { font: FONT, callback: (v) => `${(Number(v) / 1_000_000).toFixed(1)}M` }, border: { color: "#e6eeff" } },
      },
    }} />
  );
}

function Co2LinesChart({ data, portfolios, colors }: { data: MonthlyByPortfolio[]; portfolios: PortfolioRow[]; colors: Map<number, string> }) {
  const labels = ALL_MONTHS.map((m) => MONTH_SHORT[m - 1]);

  const datasets = portfolios.map((p) => {
    const c = colors.get(p.id) || "#ccc";
    let acc = 0;
    const values = ALL_MONTHS.map((m) => { acc += data.find((d) => d.month === m && d.portfolioId === p.id)?.co2 ?? 0; return parseFloat(acc.toFixed(2)); });
    return {
      label: p.name, data: values, borderColor: c, backgroundColor: c + "20",
      fill: true, tension: 0.3, pointRadius: 4, pointBackgroundColor: c,
      pointBorderColor: "#fff", pointBorderWidth: 2, borderWidth: 2.5,
    };
  });

  return (
    <Line data={{ labels, datasets }} options={{
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { position: "bottom", labels: { usePointStyle: true, boxWidth: 8, padding: 16, font: FONT } },
        tooltip: { backgroundColor: "#0B1220", cornerRadius: 8, padding: 12, callbacks: { label: (ctx) => `  ${ctx.dataset.label}: ${(ctx.parsed.y ?? 0).toFixed(1)} ton` } },
      },
      scales: {
        y: { beginAtZero: true, grid: { color: "#eff4ff" }, ticks: { font: FONT }, border: { color: "#e6eeff" } },
        x: { grid: { display: false }, ticks: { font: FONT }, border: { color: "#e6eeff" } },
      },
    }} />
  );
}

function BillingStackedChart({ data }: { data: MonthlyBilling[] }) {
  const byMonth = new Map(data.map((d) => [d.month, d]));
  const labels = ALL_MONTHS.map((m) => MONTH_SHORT[m - 1]);
  const get = (m: number) => byMonth.get(m) ?? { month: m, pagadas: 0, porVencer: 0, vencidas: 0 };
  return (
    <Bar data={{
      labels,
      datasets: [
        { label: "Pagadas", data: ALL_MONTHS.map((m) => get(m).pagadas), backgroundColor: "#16a34a", borderRadius: 4, borderSkipped: false },
        { label: "Por vencer", data: ALL_MONTHS.map((m) => get(m).porVencer), backgroundColor: "#F59E0B", borderRadius: 4, borderSkipped: false },
        { label: "Vencidas", data: ALL_MONTHS.map((m) => get(m).vencidas), backgroundColor: "#dc2626", borderRadius: 4, borderSkipped: false },
      ],
    }} options={{
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { position: "bottom", labels: { usePointStyle: true, boxWidth: 8, padding: 16, font: FONT } },
        tooltip: { backgroundColor: "#0B1220", cornerRadius: 8, padding: 12, callbacks: { label: (ctx) => `  ${ctx.dataset.label}: ${formatCLPShort(ctx.parsed.y ?? 0)}` } },
      },
      scales: {
        x: { stacked: true, grid: { display: false }, ticks: { font: FONT }, border: { color: "#e6eeff" } },
        y: { stacked: true, grid: { color: "#eff4ff" }, ticks: { font: FONT, callback: (v) => `$${Number(v) / 1_000_000}M` }, border: { color: "#e6eeff" } },
      },
    }} />
  );
}

function DistributionChart({ data, portfolios }: { data: { name: string; total: number }[]; portfolios: PortfolioRow[] }) {
  return (
    <Bar data={{
      labels: data.map((d) => d.name),
      datasets: [{
        data: data.map((d) => d.total),
        backgroundColor: data.map((_, i) => PORTFOLIO_COLORS[i % PORTFOLIO_COLORS.length]),
        borderRadius: 6, borderSkipped: false,
      }],
    }} options={{
      indexAxis: "y", responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { backgroundColor: "#0B1220", cornerRadius: 8, padding: 12, callbacks: { label: (ctx) => `  ${formatCLPShort(ctx.parsed.x ?? 0)}` } },
      },
      scales: {
        x: { beginAtZero: true, grid: { color: "#eff4ff" }, ticks: { font: FONT, callback: (v) => `$${Number(v) / 1_000_000}M` }, border: { color: "#e6eeff" } },
        y: { grid: { display: false }, ticks: { font: FONT }, border: { color: "#e6eeff" } },
      },
    }} />
  );
}
