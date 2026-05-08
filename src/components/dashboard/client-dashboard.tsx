"use client";

import Link from "next/link";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import MuiTooltip from "@mui/material/Tooltip";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
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
import type { Plugin } from "chart.js";
import { Bar } from "react-chartjs-2";
import { GenerationCharts } from "@/components/generation/generation-charts";

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Filler, Tooltip, Legend);

const MONTH_SHORT = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
const ALL_MONTHS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
const FONT = { family: '"Archivo Narrow", sans-serif', size: 11 };

interface MonthlyGen {
  month: number;
  kwh: number;
  co2: number;
}

interface MonthlyBilling {
  month: number;
  pagadas: number;
  porVencer: number;
  vencidas: number;
}

interface PlantRow {
  name: string;
  city: string | null;
  status: string;
  capacityKw: number;
  kwhYear: number;
  co2Year: number;
  lastReportMonth: number | null;
  lastReportYear: number | null;
  lastReportDuemintId: string | null;
}

interface BillingSummary {
  pagadas: { total: number; count: number };
  porVencer: { total: number; count: number };
  vencidas: { total: number; count: number };
  notasCredito: { total: number; count: number };
}

interface TopPlant {
  name: string;
  kwh: number;
}

export interface ClientDashboardProps {
  customerName: string;
  year: number;
  plantsCount: number;
  plantsTotal: number;
  kwhYear: number;
  co2Year: number;
  equivalentTrees: number;
  equivalentCars: number;
  totalBillingYear: number;
  invoicesPorVencerCount: number;
  monthlyGeneration: MonthlyGen[];
  monthlyBilling: MonthlyBilling[];
  billingSummary: BillingSummary;
  topPlants: TopPlant[];
  plants: PlantRow[];
}

const LABEL_FONT = `500 9.5px "Archivo Narrow", sans-serif`;

const billingTotalLabels: Plugin<"bar"> = {
  id: "billingTotalLabels",
  afterDatasetsDraw(chart) {
    const { ctx, data } = chart;
    const n = data.labels?.length ?? 0;
    for (let i = 0; i < n; i++) {
      let total = 0;
      let topY = Infinity;
      for (let d = 0; d < data.datasets.length; d++) {
        const v = (data.datasets[d].data[i] as number) ?? 0;
        if (!v) continue;
        total += v;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const y = (chart.getDatasetMeta(d).data[i] as any)?.y;
        if (y !== undefined) topY = Math.min(topY, y);
      }
      if (!total || topY === Infinity) continue;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const x = (chart.getDatasetMeta(0).data[i] as any)?.x;
      if (x === undefined) continue;
      ctx.save();
      ctx.font = LABEL_FONT;
      ctx.fillStyle = "#434655";
      ctx.textAlign = "center";
      ctx.textBaseline = "bottom";
      ctx.fillText(formatCLPShort(total), x, topY - 3);
      ctx.restore();
    }
  },
};

const topPlantsLabels: Plugin<"bar"> = {
  id: "topPlantsLabels",
  afterDatasetsDraw(chart) {
    const { ctx } = chart;
    chart.getDatasetMeta(0).data.forEach((bar, index) => {
      const value = chart.data.datasets[0].data[index] as number;
      if (!value) return;
      ctx.save();
      ctx.font = LABEL_FONT;
      ctx.fillStyle = "#434655";
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ctx.fillText(`${Math.round(value / 1000)}k kWh`, (bar as any).x + 5, (bar as any).y);
      ctx.restore();
    });
  },
};

function formatCLPShort(amount: number): string {
  if (Math.abs(amount) >= 1_000_000) {
    return `$${(amount / 1_000_000).toFixed(1).replace(".", ",")}M`;
  }
  return `$${new Intl.NumberFormat("es-CL").format(Math.round(amount))}`;
}

function formatCLPFull(amount: number): string {
  return `$${new Intl.NumberFormat("es-CL").format(Math.round(amount))}`;
}

function formatNumber(n: number): string {
  return new Intl.NumberFormat("es-CL").format(Math.round(n));
}

export function ClientDashboard(props: ClientDashboardProps) {
  const {
    customerName,
    year,
    plantsCount,
    plantsTotal,
    kwhYear,
    co2Year,
    equivalentTrees,
    equivalentCars,
    totalBillingYear,
    invoicesPorVencerCount,
    monthlyGeneration,
    monthlyBilling,
    billingSummary,
    topPlants,
    plants,
  } = props;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      {/* Header */}
      <Box>
        <Typography variant="h5" fontWeight={700} color="text.primary">Resumen de Generación, Facturación e Impacto</Typography>
        <Typography variant="body2" fontWeight={700} color="text.primary" sx={{ mt: 0.25 }}>
          {customerName}
        </Typography>
      </Box>

      {/* KPI Row */}
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, 1fr)" }, gap: 2 }}>
        <KpiCard color="#2563eb" label="Plantas activas" value={String(plantsCount)} sub={`de ${plantsTotal} totales`} />
        <KpiCard color="#16a34a" label={`Generación acumulada ${year}`} value={formatNumber(kwhYear)} unit="kWh" />
        <KpiCard color="#16a34a" label={`CO₂ evitado ${year}`} value={co2Year.toFixed(1).replace(".", ",")} unit="ton" sub={`Equivale a ${formatNumber(equivalentTrees)} árboles`} />
        <KpiCard color="#a16207" label={`Facturación acumulada ${year}`} value={formatCLPShort(totalBillingYear)} sub={`${invoicesPorVencerCount} ${invoicesPorVencerCount === 1 ? "factura" : "facturas"} por vencer`} />
      </Box>

      {/* Charts: Generation + CO2 */}
      <GenerationCharts
        data={Array.from({ length: 12 }, (_, i) => {
          const m = i + 1;
          const found = monthlyGeneration.find((d) => d.month === m);
          return { month: m, year, kwh: found?.kwh ?? 0, co2: found?.co2 ?? 0 };
        })}
      />

      {/* Impact */}
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" }, gap: 2 }}>
        <ImpactCard icon="🌱" iconBg="#dcfce7" value={co2Year.toFixed(1).replace(".", ",")} label={`ton CO₂ evitadas en ${year}`} />
        <ImpactCard
          icon="🌳" iconBg="#dcfce7"
          value={formatNumber(equivalentTrees)}
          label="árboles equivalentes"
          tooltip="Un árbol absorbe en promedio 22 kg de CO₂ al año (EPA). Árboles equivalentes = (CO₂ evitado en kg) ÷ 22"
        />
        <ImpactCard
          icon="🚗" iconBg="#eff4ff"
          value={String(equivalentCars)}
          label="autos retirados de circulación"
          tooltip="Un auto promedio emite 4,6 toneladas de CO₂ al año (EPA). Autos equivalentes = CO₂ evitado (ton) ÷ 4,6"
        />
      </Box>

      {/* Billing Summary */}
      <Box>
        <Typography fontSize="0.9375rem" fontWeight={700} sx={{ mb: 0.5 }}>Resumen de facturación — {year}</Typography>
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 2 }}>Estado consolidado de tus facturas del año</Typography>
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, 1fr)" }, gap: 1.5 }}>
          <BillCard label="Pagadas" total={billingSummary.pagadas.total} count={billingSummary.pagadas.count} color="#15803d" />
          <BillCard label="Por vencer" total={billingSummary.porVencer.total} count={billingSummary.porVencer.count} color="#a16207" />
          <BillCard label="Vencidas" total={billingSummary.vencidas.total} count={billingSummary.vencidas.count} color="#dc2626" />
          <BillCard label="Notas de crédito" total={billingSummary.notasCredito.total} count={billingSummary.notasCredito.count} />
        </Box>
      </Box>

      {/* Charts: Billing monthly + Top plants */}
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 2 }}>
        <ChartCard title="Facturación mensual" subtitle="Monto facturado por mes (CLP)">
          <BillingStackedChart data={monthlyBilling} />
        </ChartCard>
        <ChartCard title="Generación por planta" subtitle={`Top 5 plantas por kWh generados en ${year}`}>
          <TopPlantsChart data={topPlants} />
        </ChartCard>
      </Box>

      {/* Plants Table */}
      <Box sx={{
        backgroundColor: "#ffffff",
        border: "1px solid #e6eeff",
        borderRadius: "12px",
        boxShadow: "0 2px 8px rgba(13,28,46,0.06)",
        overflow: "hidden",
      }}>
        <Box sx={{ px: 3, pt: 2.5, pb: 1.5 }}>
          <Typography fontSize="0.9375rem" fontWeight={700}>Mis plantas</Typography>
          <Typography variant="caption" color="text.secondary">Detalle de cada planta solar asociada a tu cuenta</Typography>
        </Box>
        <Box sx={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }} aria-label="Detalle de plantas solares">
            <thead>
              <tr>
                {["Planta", "Comuna", "Estado", "Potencia (kWp)", "Generación " + year + " (kWh)", "CO₂ evitado (ton)", "Último reporte"].map((h, i) => (
                  <th key={h} style={{
                    textAlign: i >= 3 ? "right" : "left",
                    padding: "10px 14px",
                    fontSize: "11px",
                    fontWeight: 600,
                    color: "#737686",
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                    borderBottom: "1px solid #e6eeff",
                    background: "#eff4ff",
                    whiteSpace: "nowrap",
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {plants.map((p) => (
                <tr key={p.name} style={{ cursor: "default" }} onMouseEnter={(e) => (e.currentTarget.style.background = "#eff4ff")} onMouseLeave={(e) => (e.currentTarget.style.background = "")}>
                  <td style={{ padding: "12px 14px", borderBottom: "1px solid #e6eeff", fontWeight: 600, color: "#004ac6" }}>{p.name}</td>
                  <td style={{ padding: "12px 14px", borderBottom: "1px solid #e6eeff" }}>{p.city || "—"}</td>
                  <td style={{ padding: "12px 14px", borderBottom: "1px solid #e6eeff" }}>
                    <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", marginRight: 6, background: p.status === "active" ? "#16a34a" : "#a16207" }} />
                    {p.status === "active" ? "Activa" : "Mantenimiento"}
                  </td>
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
        </Box>
      </Box>
    </Box>
  );
}

/* ─── Sub-components ───────────────────────────────────────── */

function KpiCard({ color, label, value, unit, sub }: { color: string; label: string; value: string; unit?: string; sub?: string }) {
  return (
    <Box sx={{
      backgroundColor: "#ffffff",
      border: "1px solid #e6eeff",
      borderRadius: "12px",
      padding: "20px 22px",
      position: "relative",
      overflow: "hidden",
      transition: "transform 0.15s, box-shadow 0.15s",
      "&:hover": { transform: "translateY(-2px)", boxShadow: "0 4px 16px rgba(13,28,46,0.10)" },
      "&::before": {
        content: '""', position: "absolute", left: 0, top: 0, bottom: 0, width: "3px",
        borderRadius: "0 3px 3px 0", background: color,
      },
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
    <Box sx={{
      backgroundColor: "#ffffff",
      border: "1px solid #e6eeff",
      borderRadius: "12px",
      padding: "22px 24px",
      boxShadow: "0 2px 8px rgba(13,28,46,0.06)",
    }}>
      <Typography sx={{ fontSize: "15px", fontWeight: 700, letterSpacing: "-0.01em", mb: "4px" }}>{title}</Typography>
      <Typography sx={{ fontSize: "12px", color: "#737686", mb: 2 }}>{subtitle}</Typography>
      <Box sx={{ position: "relative", height: 260 }}>{children}</Box>
    </Box>
  );
}

function ImpactCard({ icon, iconBg, value, label, tooltip }: { icon: string; iconBg: string; value: string; label: string; tooltip?: string }) {
  return (
    <Box sx={{
      backgroundColor: "#ffffff",
      border: "1px solid #e6eeff",
      borderRadius: "12px",
      padding: 3,
      textAlign: "center",
      position: "relative",
      transition: "transform 0.15s",
      "&:hover": { transform: "translateY(-2px)", boxShadow: "0 4px 16px rgba(13,28,46,0.10)" },
    }}>
      {tooltip && (
        <MuiTooltip
          title={tooltip}
          placement="top"
          arrow
          slotProps={{ tooltip: { sx: { fontSize: "12px", maxWidth: 260, lineHeight: 1.5, p: 1.5 } } }}
        >
          <InfoOutlinedIcon sx={{ position: "absolute", top: 12, right: 12, fontSize: 16, color: "#b4c5ff", cursor: "help", "&:hover": { color: "#004ac6" } }} />
        </MuiTooltip>
      )}
      <Box sx={{
        width: 48, height: 48, borderRadius: "14px", display: "inline-flex",
        alignItems: "center", justifyContent: "center", mb: 1.5, fontSize: "22px",
        backgroundColor: iconBg,
      }}><span aria-hidden="true">{icon}</span></Box>
      <Typography sx={{ fontSize: "32px", fontWeight: 700, letterSpacing: "-0.02em", mb: 0.5 }}>{value}</Typography>
      <Typography sx={{ fontSize: "13px", color: "#737686" }}>{label}</Typography>
    </Box>
  );
}

function BillCard({ label, total, count, color }: { label: string; total: number; count: number; color?: string }) {
  return (
    <Box sx={{
      backgroundColor: "#ffffff",
      border: "1px solid #e6eeff",
      borderRadius: "10px",
      padding: "16px 18px",
    }}>
      <Typography sx={{ fontSize: "11px", color: "#737686", textTransform: "uppercase", letterSpacing: "0.04em", mb: "6px", fontWeight: 500 }}>{label}</Typography>
      <Typography sx={{ fontSize: "20px", fontWeight: 700, color: color || "inherit" }}>{formatCLPFull(total)}</Typography>
      <Typography sx={{ fontSize: "12px", color: "#737686", mt: "2px" }}>{count} {count === 1 ? "factura" : "facturas"}</Typography>
    </Box>
  );
}

/* ─── Charts ───────────────────────────────────────────────── */

function BillingStackedChart({ data }: { data: MonthlyBilling[] }) {
  const byMonth = new Map(data.map((d) => [d.month, d]));
  const labels = ALL_MONTHS.map((m) => MONTH_SHORT[m - 1]);
  const get = (m: number) => byMonth.get(m) ?? { month: m, pagadas: 0, porVencer: 0, vencidas: 0 };

  return (
    <Bar
      plugins={[billingTotalLabels]}
      data={{
        labels,
        datasets: [
          { label: "Pagadas", data: ALL_MONTHS.map((m) => get(m).pagadas), backgroundColor: "#16a34a", borderRadius: 4, borderSkipped: false },
          { label: "Por vencer", data: ALL_MONTHS.map((m) => get(m).porVencer), backgroundColor: "#F59E0B", borderRadius: 4, borderSkipped: false },
          { label: "Vencidas", data: ALL_MONTHS.map((m) => get(m).vencidas), backgroundColor: "#dc2626", borderRadius: 4, borderSkipped: false },
        ],
      }}
      options={{
        responsive: true,
        maintainAspectRatio: false,
        layout: { padding: { top: 18 } },
        plugins: {
          legend: { position: "bottom", labels: { usePointStyle: true, boxWidth: 8, padding: 16, font: FONT } },
          tooltip: {
            backgroundColor: "#0B1220", cornerRadius: 8, padding: 12,
            callbacks: { label: (ctx) => `  ${ctx.dataset.label}: ${formatCLPShort(ctx.parsed.y ?? 0)}` },
          },
        },
        scales: {
          x: { stacked: true, grid: { display: false }, ticks: { font: FONT }, border: { color: "#e6eeff" } },
          y: { stacked: true, grid: { color: "#eff4ff" }, ticks: { font: FONT, callback: (v) => `$${Number(v) / 1_000_000}M` }, border: { color: "#e6eeff" } },
        },
      }}
    />
  );
}

function TopPlantsChart({ data }: { data: TopPlant[] }) {
  const barColors = ["#2563eb", "#60a5fa", "#93bbfd", "#b4c5ff", "#dbe1ff"];
  const padded = [...data.slice(0, 5)];
  while (padded.length < 5) padded.push({ name: "​".repeat(padded.length + 1), kwh: 0 });

  return (
    <Bar
      plugins={[topPlantsLabels]}
      data={{
        labels: padded.map((d) => d.name),
        datasets: [{
          data: padded.map((d) => d.kwh),
          backgroundColor: padded.map((d, i) => (d.kwh === 0 ? "transparent" : barColors[i] || barColors[barColors.length - 1])),
          borderRadius: 6,
          borderSkipped: false,
        }],
      }}
      options={{
        indexAxis: "y",
        responsive: true,
        maintainAspectRatio: false,
        layout: { padding: { right: 60 } },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: "#0B1220", cornerRadius: 8, padding: 12,
            filter: (ctx) => (ctx.parsed.x ?? 0) > 0,
            callbacks: { label: (ctx) => `  ${(ctx.parsed.x ?? 0).toLocaleString("es-CL")} kWh` },
          },
        },
        scales: {
          x: { beginAtZero: true, grid: { color: "#eff4ff" }, ticks: { font: FONT, callback: (v) => `${Number(v) / 1000}k` }, border: { color: "#e6eeff" } },
          y: { grid: { display: false }, ticks: { font: FONT }, border: { color: "#e6eeff" } },
        },
      }}
    />
  );
}
