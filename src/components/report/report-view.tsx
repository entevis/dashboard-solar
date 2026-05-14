"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Card from "@mui/material/Card";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import MuiTooltip from "@mui/material/Tooltip";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ArrowBackOutlinedIcon from "@mui/icons-material/ArrowBackOutlined";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import BoltOutlinedIcon from "@mui/icons-material/BoltOutlined";
import AccessTimeOutlinedIcon from "@mui/icons-material/AccessTimeOutlined";
import WbSunnyOutlinedIcon from "@mui/icons-material/WbSunnyOutlined";
import SpeedOutlinedIcon from "@mui/icons-material/SpeedOutlined";
import CheckCircleOutlinedIcon from "@mui/icons-material/CheckCircleOutlined";
import TuneOutlinedIcon from "@mui/icons-material/TuneOutlined";
import EnergySavingsLeafOutlinedIcon from "@mui/icons-material/EnergySavingsLeafOutlined";
import { Bar } from "react-chartjs-2";
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

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Filler, Tooltip, Legend);

const MONTHS = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const MONTHS_SHORT = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

interface PeriodNeighbor {
  duemintId: string;
  periodMonth: number;
  periodYear: number;
}

interface Props {
  rawJson: Record<string, unknown>;
  plantName: string | null;
  customerName: string | null;
  periodMonth: number;
  periodYear: number;
  epcLogoUrl?: string | null;
  epcName?: string | null;
  prev?: PeriodNeighbor | null;
  next?: PeriodNeighbor | null;
  backHref?: string | null;
  backLabel?: string | null;
}

function get(obj: unknown, path: string): unknown {
  const parts = path.split(".");
  let c: unknown = obj;
  for (const p of parts) { if (c == null || typeof c !== "object") return undefined; c = (c as Record<string, unknown>)[p]; }
  return c;
}
function num(obj: unknown, path: string, fb = 0): number { const v = get(obj, path); return typeof v === "number" ? v : fb; }
function str(obj: unknown, path: string, fb = ""): string { const v = get(obj, path); return typeof v === "string" ? v : fb; }
function fmt(n: number, d = 0): string { return n.toLocaleString("es-CL", { maximumFractionDigits: d, minimumFractionDigits: d }); }
function fmtDate(iso: string): string {
  if (!iso) return "—";
  const dt = new Date(iso);
  const days = ["Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"];
  return `${days[dt.getDay()]}, ${dt.getDate()} de ${MONTHS[dt.getMonth()].toLowerCase()}`;
}

const brandBlue = "#2A6EF5";
const brandBlueSoft = "rgba(42, 110, 245, 0.85)";
const secondary = "#7C8DB5";
const greenColor = "#10B981";
const warningColor = "#F59E0B";
const dangerColor = "#EF4444";

const tooltipStyle = {
  backgroundColor: "#0B1220",
  titleColor: "#ffffff",
  bodyColor: "#E5EAF2",
  cornerRadius: 8,
  padding: 12,
  titleFont: { weight: 600 as const, size: 13 },
  bodyFont: { size: 12 },
  borderColor: "rgba(255,255,255,0.1)",
  borderWidth: 1,
  displayColors: true,
  boxPadding: 4,
};

const FONT = { family: '"Archivo Narrow", sans-serif', size: 12 };

export function ReportView({ rawJson, plantName, periodMonth, periodYear, epcLogoUrl, epcName, prev, next, backHref, backLabel }: Props) {
  const planta = rawJson.planta as Record<string, unknown> | undefined;
  const reporte = rawJson.reporte as Record<string, unknown> | undefined;
  const datos = get(reporte, "datos_reporte") as Record<string, unknown> | undefined;
  const tecnico = get(datos, "tecnico") as Record<string, unknown> | undefined;
  const generacion = get(datos, "generacion") as Record<string, unknown> | undefined;
  const rendimiento = get(datos, "rendimiento") as Record<string, unknown> | undefined;
  const disponibilidad = get(datos, "disponibilidad") as Record<string, unknown> | undefined;
  const historico = get(datos, "historico") as Record<string, unknown> | undefined;
  const eventos = (get(datos, "eventos_indisponibilidad") ?? []) as Record<string, unknown>[];

  const pNom = num(planta, "p_nom");
  const portafolio = str(planta, "portafolio");
  const sigla = str(planta, "sigla");
  const inversores = (get(planta, "inversores") ?? []) as Record<string, unknown>[];
  const tablaGen = (get(generacion, "tabla_generacion") ?? []) as Record<string, unknown>[];
  const tablaRend = (get(rendimiento, "tabla_rendimiento") ?? []) as Record<string, unknown>[];
  const codigo = str(reporte, "codigo");
  const fechaCreacion = str(datos, "fecha_creacion");
  const periodLabel = `${MONTHS[periodMonth - 1]} ${periodYear}`;

  // KPIs
  const produccionTotal = num(tecnico, "produccion_total");
  const pr = num(tecnico, "pr");
  const prSim = num(tecnico, "pr_simulado");
  const irr = num(tecnico, "irradiacion_total");
  const rendEsp = num(tecnico, "rend_especifico");
  const dispOm = num(tecnico, "disponibilidad_om");
  const dispReal = num(tecnico, "disponibilidad_real");
  const co2 = num(tecnico, "co2");
  const mayorVal = num(tecnico, "mayor_produccion_valor");
  const mayorFecha = str(tecnico, "mayor_produccion_fecha");
  const menorVal = num(tecnico, "menor_produccion_valor");
  const menorFecha = str(tecnico, "menor_produccion_fecha");
  const medianaVal = num(tecnico, "mediana_valor");
  const medianaFecha = str(tecnico, "mediana_fecha");
  const promDiario = num(tecnico, "promedio_diario");

  // Inverter codes from daily table
  const invCodes = tablaGen.length > 0
    ? Object.keys(tablaGen[0]).filter((k) => !["Fecha", "Total"].includes(k)).sort()
    : [];

  // Daily data
  const dailyLabels = tablaGen.map((d) => { const f = str(d, "Fecha"); return f ? String(new Date(f).getDate()) : ""; });
  const dailyTotals = tablaGen.map((d) => num(d, "Total"));
  const maxDay = Math.max(...dailyTotals);
  const minDay = Math.min(...dailyTotals);
  const avg = promDiario || (dailyTotals.reduce((a, b) => a + b, 0) / (dailyTotals.length || 1));

  // Historic
  const histProdReal = num(historico, "prod_real");
  const histProdSim = num(historico, "prod_sim");
  const histIrrReal = num(historico, "irr_real");
  const histIrrSim = num(historico, "irr_sim");
  const histPr = num(historico, "pr");
  const histPrSim = num(historico, "pr_sim");
  const histDisp = num(historico, "disp");
  const histDispSim = num(historico, "disp_sim");

  const [dailyView, setDailyView] = useState<"total" | "inverters">("total");
  const [histView, setHistView] = useState<"gen" | "rad">("gen");
  const [search, setSearch] = useState("");
  const [showAllInverters, setShowAllInverters] = useState(false);

  // Styles
  const kpiSx = {
    border: "1px solid", borderColor: "#E5EAF2", borderRadius: "14px", p: "20px 22px",
    position: "relative", overflow: "hidden", cursor: "default",
    transition: "transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease",
    "&::before": { content: '""', position: "absolute", left: 0, top: 0, bottom: 0, width: 3, background: brandBlue, opacity: 0, transition: "opacity 0.18s" },
    "&:hover": { transform: "translateY(-2px)", boxShadow: "0 1px 3px rgba(15,23,42,0.06), 0 18px 40px -18px rgba(15,23,42,0.14)", borderColor: "#D5DEEC", "&::before": { opacity: 1 } },
  };
  const kLabel = { fontSize: "0.75rem", color: "#64748B", letterSpacing: "0.02em", mb: 1.5, display: "flex", alignItems: "center", gap: 0.75 };
  const kValue = { fontSize: "1.75rem", fontWeight: 600, letterSpacing: "-0.025em", lineHeight: 1, mb: 0.5 };
  const kUnit = { fontSize: "0.875rem", color: "#64748B", fontWeight: 500, ml: 0.5 };
  const kDelta = { fontSize: "0.75rem", fontWeight: 500, mt: 1, display: "inline-flex", alignItems: "center", gap: 0.5 };
  const iconSx = { fontSize: 16, color: brandBlue };

  const toggleSx = (active: boolean) => ({
    border: 0, borderRadius: "8px", px: 1.75, py: 0.75, fontSize: "0.8125rem", fontWeight: 500, cursor: "pointer", minWidth: 0,
    background: active ? "#fff" : "transparent", color: active ? "#0B1220" : "#64748B",
    boxShadow: active ? "0 1px 2px rgba(15,23,42,0.04)" : "none",
    "&:hover": { color: "#334155" },
  });

  const tileSx = (color: string) => ({ backgroundColor: color, borderRadius: "10px", p: 2 });
  const tileLabel = { fontSize: "0.6875rem", textTransform: "uppercase" as const, letterSpacing: "0.07em", color: "#64748B", fontWeight: 500, mb: 1 };
  const tileValue = { fontSize: "1.375rem", fontWeight: 600, letterSpacing: "-0.02em", lineHeight: 1.1 };
  const tileSub = { fontSize: "0.8125rem", color: "#334155", mt: 0.5 };

  // Build daily chart
  function getDailyDatasets() {
    if (dailyView === "total") {
      return [{
        type: "bar" as const, label: "Producción diaria", data: dailyTotals,
        backgroundColor: dailyTotals.map((v) => v === maxDay ? greenColor : v === minDay ? dangerColor : brandBlueSoft),
        borderRadius: 4, borderSkipped: false as const, yAxisID: "y", order: 2,
      }];
    }
    const colors = [brandBlue, secondary, "#F59E0B", "#10B981", "#EF4444", "#8B5CF6", "#EC4899"];
    return invCodes.map((code, i) => ({
      type: "bar" as const,
      label: `Inversor ${code}`,
      data: tablaGen.map((d) => num(d, code)),
      backgroundColor: colors[i % colors.length],
      borderRadius: 4, borderSkipped: false as const, stack: "inv", yAxisID: "y", order: 2,
    }));
  }

  // Filtered table data
  const filteredDaily = tablaGen.filter((d) => {
    if (!search) return true;
    const day = String(new Date(str(d, "Fecha")).getDate()).padStart(2, "0");
    return day.includes(search) || `${day} ${MONTHS_SHORT[periodMonth - 1].toLowerCase()}`.includes(search.toLowerCase());
  });

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3, pb: 6 }}>

      {/* ── HERO ── */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 3 }}>
        <Box>
          <Typography fontSize="0.75rem" color={brandBlue} fontWeight={500} letterSpacing="0.05em" textTransform="uppercase" sx={{ mb: 1 }}>
            Planta Solar Fotovoltaica
          </Typography>
          <Typography sx={{ fontSize: "2.125rem", fontWeight: 600, letterSpacing: "-0.03em", lineHeight: 1.1, mb: 0.75 }}>
            {plantName ?? "Planta"}
          </Typography>
          <Typography sx={{ color: "#64748B", fontSize: "0.9375rem" }}>
            {pNom} kW nominales · {inversores.length} inversor{inversores.length !== 1 ? "es" : ""}{portafolio ? ` · Portafolio ${portafolio}` : ""}
          </Typography>
        </Box>
        <Box sx={{ display: "inline-flex", alignItems: "center", gap: 1.5 }}>
          {backHref && (
            <Box
              component={Link}
              href={backHref}
              sx={{
                display: "inline-flex", alignItems: "center", gap: 0.75,
                px: 1.5, py: 0.875, borderRadius: "10px",
                background: "#F6F8FB", color: "#334155",
                fontSize: "0.8125rem", fontWeight: 500, textDecoration: "none",
                boxShadow: "0 1px 2px rgba(15,23,42,0.04)",
                border: "1px solid #E5EAF2",
                transition: "background 0.15s, color 0.15s",
                "&:hover": { background: "#EAF1FF", color: brandBlue, borderColor: "#C7D9FF" },
              }}
            >
              <ArrowBackOutlinedIcon sx={{ fontSize: 15 }} />
              {backLabel ?? "Volver"}
            </Box>
          )}
          <Box sx={{ background: "#fff", border: "1px solid #E5EAF2", borderRadius: "14px", padding: "10px 12px 10px 8px", display: "inline-flex", alignItems: "center", gap: "12px", boxShadow: "0 1px 2px rgba(15,23,42,0.04)" }}>
            <PeriodNavButton dir="prev" target={prev} backHref={backHref} />
            <Box sx={{ whiteSpace: "nowrap" }}>
              <Typography sx={{ fontSize: "0.6875rem", textTransform: "uppercase", color: "#64748B", letterSpacing: "0.07em", marginBottom: "3px" }}>Periodo</Typography>
              <Typography sx={{ fontWeight: 600, fontSize: "0.875rem" }}>{periodLabel}</Typography>
            </Box>
            <PeriodNavButton dir="next" target={next} backHref={backHref} />
            <Box sx={{ width: "1px", height: "36px", backgroundColor: "#E5EAF2", flexShrink: 0 }} />
            <Box sx={{ whiteSpace: "nowrap", pr: 1 }}>
              <Typography sx={{ fontSize: "0.6875rem", textTransform: "uppercase", color: "#64748B", letterSpacing: "0.07em", marginBottom: "3px" }}>Emitido</Typography>
              <Typography sx={{ fontWeight: 600, fontSize: "0.875rem", textTransform: "capitalize" }}>{fechaCreacion ? new Date(fechaCreacion).toLocaleDateString("es-CL", { day: "numeric", month: "short", year: "numeric" }) : "—"}</Typography>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* ── KPI ROW 1 ── */}
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, 1fr)" }, gap: 2 }}>
        <Card elevation={0} sx={kpiSx}>
          <Typography sx={kLabel}><BoltOutlinedIcon sx={iconSx} /> Producción total</Typography>
          <Typography sx={kValue}>{fmt(produccionTotal)}<Typography component="span" sx={kUnit}>kWh</Typography></Typography>
        </Card>
        <Card elevation={0} sx={kpiSx}>
          <Typography sx={kLabel}><AccessTimeOutlinedIcon sx={iconSx} /> Performance Ratio O&M</Typography>
          <Typography sx={kValue}>{fmt(pr, 2)}<Typography component="span" sx={kUnit}>%</Typography></Typography>
          <Typography sx={{ ...kDelta, color: pr >= prSim ? greenColor : dangerColor }}>{pr >= prSim ? "+" : ""}{fmt(pr - prSim, 1)} p.p. vs simulado</Typography>
        </Card>
        <Card elevation={0} sx={kpiSx}>
          <Typography sx={kLabel}><WbSunnyOutlinedIcon sx={iconSx} /> Irradiación total</Typography>
          <Typography sx={kValue}>{fmt(irr, 2)}<Typography component="span" sx={kUnit}>kWh/m²</Typography></Typography>
        </Card>
        <Card elevation={0} sx={kpiSx}>
          <Typography sx={kLabel}><SpeedOutlinedIcon sx={iconSx} /> Rendimiento específico</Typography>
          <Typography sx={kValue}>{fmt(rendEsp, 2)}<Typography component="span" sx={kUnit}>kWh/kWp</Typography></Typography>
        </Card>
      </Box>

      {/* ── KPI ROW 2 ── */}
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(3, 1fr)" }, gap: 2 }}>
        <Card elevation={0} sx={kpiSx}>
          <Typography sx={kLabel}><CheckCircleOutlinedIcon sx={iconSx} /> Disponibilidad O&M</Typography>
          <Typography sx={kValue}>{fmt(dispOm, 2)}<Typography component="span" sx={kUnit}>%</Typography></Typography>
          <Typography sx={{ ...kDelta, color: greenColor }}>Garantía 97% · +{fmt(dispOm - 97, 1)} p.p.</Typography>
        </Card>
        <Card elevation={0} sx={kpiSx}>
          <Typography sx={kLabel}><TuneOutlinedIcon sx={iconSx} /> Disponibilidad real</Typography>
          <Typography sx={kValue}>{fmt(dispReal, 2)}<Typography component="span" sx={kUnit}>%</Typography></Typography>
          <Typography sx={{ ...kDelta, color: "#64748B" }}>{eventos.length === 0 ? "Sin eventos registrados" : `${eventos.length} evento${eventos.length > 1 ? "s" : ""}`}</Typography>
        </Card>
        <Card elevation={0} sx={kpiSx}>
          <Typography sx={kLabel}><EnergySavingsLeafOutlinedIcon sx={iconSx} /> CO₂ evitado</Typography>
          <Typography sx={kValue}>{fmt(co2, 2)}<Typography component="span" sx={kUnit}>toneladas</Typography></Typography>
        </Card>
      </Box>

      {/* ── DAILY PRODUCTION ── */}
      {tablaGen.length > 0 && (
        <Card elevation={0} sx={{ border: "1px solid #E5EAF2", borderRadius: "14px", p: 3 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 2.5, flexWrap: "wrap", gap: 2 }}>
            <Box>
              <Typography sx={{ fontSize: "1.125rem", fontWeight: 600, letterSpacing: "-0.02em", mb: 0.25 }}>Generación diaria · {periodLabel}</Typography>
              <Typography sx={{ color: "#64748B", fontSize: "0.8125rem" }}>Producción por día en kWh. Pasá el cursor por las barras para ver el detalle.</Typography>
            </Box>
            <Box sx={{ display: "inline-flex", background: "#EEF2F8", borderRadius: "10px", p: "3px", gap: "2px" }}>
              <Button disableElevation sx={toggleSx(dailyView === "total")} onClick={() => setDailyView("total")}>Total</Button>
              <Button disableElevation sx={toggleSx(dailyView === "inverters")} onClick={() => setDailyView("inverters")}>Por inversor</Button>
            </Box>
          </Box>

          <Box sx={{ height: 380 }}>
            <Bar
              data={{ labels: dailyLabels, datasets: getDailyDatasets() }}
              options={{
                responsive: true, maintainAspectRatio: false,
                interaction: { mode: "index" as const, intersect: false },
                plugins: {
                  legend: {
                    display: true, position: "bottom" as const,
                    labels: {
                      usePointStyle: true, boxWidth: 8, padding: 16, font: FONT,
                      ...(dailyView === "total" && {
                        generateLabels: () => [
                          { text: "Mayor producción", fillStyle: greenColor, strokeStyle: greenColor, pointStyle: "circle" as const, hidden: false },
                          { text: "Menor producción", fillStyle: dangerColor, strokeStyle: dangerColor, pointStyle: "circle" as const, hidden: false },
                          { text: "Producción diaria", fillStyle: brandBlueSoft, strokeStyle: brandBlueSoft, pointStyle: "circle" as const, hidden: false },
                        ],
                      }),
                    },
                  },
                  tooltip: { ...tooltipStyle, callbacks: {
                    title: (items) => `Día ${items[0].label} de ${MONTHS[periodMonth - 1].toLowerCase()}`,
                    label: (ctx) => `  ${ctx.dataset.label}: ${(ctx.parsed.y ?? 0).toLocaleString("es-CL", { maximumFractionDigits: 1 })} kWh`,
                  }},
                },
                scales: {
                  x: { grid: { display: false }, stacked: dailyView === "inverters", ticks: { color: "#94A3B8", font: FONT }, border: { color: "#E5EAF2" } },
                  y: { position: "left" as const, beginAtZero: true, stacked: dailyView === "inverters", grid: { color: "#F1F5F9" }, ticks: { color: "#94A3B8", font: FONT, callback: (v: string | number) => `${Number(v) / 1000}k` }, border: { color: "#E5EAF2" }, title: { display: true, text: "Generación (kWh)", color: "#64748B", font: { ...FONT, size: 11 } } },
                },
              }}
            />
          </Box>

          {/* Relevant days */}
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, 1fr)" }, gap: 1.5, mt: 2.5 }}>
            <Box sx={tileSx("#E7F7F1")}>
              <Typography sx={tileLabel}>Día de mayor producción</Typography>
              <Typography sx={tileValue}>{fmt(mayorVal)} kWh</Typography>
              <Typography sx={tileSub}>{fmtDate(mayorFecha)}</Typography>
            </Box>
            <Box sx={tileSx("#EAF1FF")}>
              <Typography sx={tileLabel}>Mediana</Typography>
              <Typography sx={tileValue}>{fmt(medianaVal)} kWh</Typography>
              <Typography sx={tileSub}>{fmtDate(medianaFecha)}</Typography>
            </Box>
            <Box sx={tileSx("#FEECEC")}>
              <Typography sx={tileLabel}>Día de menor producción</Typography>
              <Typography sx={tileValue}>{fmt(menorVal)} kWh</Typography>
              <Typography sx={tileSub}>{fmtDate(menorFecha)}</Typography>
            </Box>
            <Box sx={tileSx("#F6F8FB")}>
              <Typography sx={tileLabel}>Promedio diario</Typography>
              <Typography sx={tileValue}>{fmt(promDiario)} kWh</Typography>
              <Typography sx={tileSub}>{tablaGen.length} días operativos</Typography>
            </Box>
          </Box>
        </Card>
      )}

      {/* ── INVERTER BREAKDOWN ── */}
      {tablaRend.length > 0 && (
        <>
          <Box sx={{ pt: 1 }}>
            <Typography sx={{ fontSize: "1.25rem", fontWeight: 600, letterSpacing: "-0.02em" }}>Rendimiento por inversor</Typography>
            <Typography sx={{ fontSize: "0.8125rem", color: "#64748B" }}>Desempeño individual de cada equipo del sistema.</Typography>
          </Box>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 2.5 }}>
            {(showAllInverters ? tablaRend : tablaRend.slice(0, 2)).map((inv, idx) => {
              const code = str(inv, "inversor");
              const modelo = inversores.find((i) => str(i, "codigo") === code);
              const color = idx === 0 ? brandBlue : secondary;
              return (
                <Card key={code} elevation={0} sx={{ border: "1px solid #E5EAF2", borderRadius: "14px", p: 3, position: "relative", overflow: "hidden", "&::before": { content: '""', position: "absolute", top: 0, right: 0, bottom: 0, width: 120, background: `linear-gradient(135deg, transparent, ${idx === 0 ? "#EAF1FF" : "#F1F3F8"} 150%)`, pointerEvents: "none" } }}>
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2.5, position: "relative" }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                      <Box sx={{ width: 34, height: 34, borderRadius: "10px", background: color, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 600, fontSize: "1rem" }}>{code}</Box>
                      <Box>
                        <Typography sx={{ fontSize: "0.9375rem", fontWeight: 600 }}>{modelo ? str(modelo, "modelo") : `Inversor ${code}`}</Typography>
                        <Typography sx={{ fontSize: "0.75rem", color: "#64748B" }}>{modelo ? `${str(modelo, "n_paneles")} paneles · ${Number(str(modelo, "p_peak")) / 1000} kWp` : ""}</Typography>
                      </Box>
                    </Box>
                    <Box sx={{ fontSize: "0.6875rem", px: 1.25, py: 0.5, background: "#EAF1FF", color: "#1E57D4", borderRadius: "6px", fontWeight: 500 }}>{idx === 0 ? "Principal" : "Secundario"}</Box>
                  </Box>
                  <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px 20px", position: "relative" }}>
                    <Box>
                      <Typography sx={{ fontSize: "0.75rem", color: "#64748B", mb: 0.25 }}>Producción</Typography>
                      <Typography sx={{ fontSize: "1.125rem", fontWeight: 600 }}>{fmt(num(inv, "generacion"))}<Typography component="span" sx={{ fontSize: "0.75rem", color: "#64748B", ml: 0.5 }}>kWh</Typography></Typography>
                    </Box>
                    <Box>
                      <Typography sx={{ fontSize: "0.75rem", color: "#64748B", mb: 0.25 }}>Rendimiento</Typography>
                      <Typography sx={{ fontSize: "1.125rem", fontWeight: 600 }}>{fmt(num(inv, "rendimiento"), 2)}<Typography component="span" sx={{ fontSize: "0.75rem", color: "#64748B", ml: 0.5 }}>kWh/kWp</Typography></Typography>
                    </Box>
                    <Box>
                      <Typography sx={{ fontSize: "0.75rem", color: "#64748B", mb: 0.25 }}>Performance Ratio</Typography>
                      <Typography sx={{ fontSize: "1.125rem", fontWeight: 600 }}>{fmt(num(inv, "pr"), 2)}%</Typography>
                      <Box sx={{ height: 6, background: "#EEF2F8", borderRadius: 999, mt: 1.5, overflow: "hidden" }}>
                        <Box sx={{ height: "100%", width: `${Math.min(num(inv, "pr"), 100)}%`, background: color, borderRadius: 999 }} />
                      </Box>
                    </Box>
                    <Box>
                      <Typography sx={{ fontSize: "0.75rem", color: "#64748B", mb: 0.25 }}>Disponibilidad real</Typography>
                      <Typography sx={{ fontSize: "1.125rem", fontWeight: 600 }}>{fmt(num(inv, "disponibilidad_real"), 2)}%</Typography>
                      <Box sx={{ height: 6, background: "#EEF2F8", borderRadius: 999, mt: 1.5, overflow: "hidden" }}>
                        <Box sx={{ height: "100%", width: `${Math.min(num(inv, "disponibilidad_real"), 100)}%`, background: color, borderRadius: 999 }} />
                      </Box>
                    </Box>
                  </Box>
                </Card>
              );
            })}
          </Box>
          {tablaRend.length > 2 && !showAllInverters && (
            <Box sx={{ display: "flex", justifyContent: "center", mt: 1 }}>
              <Button
                variant="outlined"
                size="small"
                color="inherit"
                onClick={() => setShowAllInverters(true)}
                sx={{ borderColor: "#E5EAF2", color: "#334155", fontSize: "0.8125rem", fontWeight: 500, borderRadius: "10px", px: 3, "&:hover": { borderColor: brandBlue, color: brandBlue, background: "#EAF1FF" } }}
              >
                Ver {tablaRend.length - 2} inversor{tablaRend.length - 2 > 1 ? "es" : ""} más
              </Button>
            </Box>
          )}
          {tablaRend.length > 2 && showAllInverters && (
            <Box sx={{ display: "flex", justifyContent: "center", mt: 1 }}>
              <Button
                variant="outlined"
                size="small"
                color="inherit"
                onClick={() => setShowAllInverters(false)}
                sx={{ borderColor: "#E5EAF2", color: "#64748B", fontSize: "0.8125rem", fontWeight: 500, borderRadius: "10px", px: 3, "&:hover": { borderColor: "#c3c6d7" } }}
              >
                Ver menos
              </Button>
            </Box>
          )}
        </>
      )}

      {/* ── AVAILABILITY ── */}
      {disponibilidad && (
        <Card elevation={0} sx={{ border: "1px solid #E5EAF2", borderRadius: "14px", p: 3 }}>
          <Typography sx={{ fontSize: "1.125rem", fontWeight: 600, letterSpacing: "-0.02em", mb: 0.25 }}>Disponibilidad y horas de operación</Typography>
          <Typography sx={{ fontSize: "0.8125rem", color: "#64748B", mb: 2.5 }}>Horas de operación diaria sobre el umbral mínimo de irradiancia (MIT).</Typography>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", md: "250px 1fr" }, gap: 3, alignItems: "center" }}>
            {/* Ring */}
            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
              <Box sx={{ position: "relative", width: 180, height: 180 }}>
                <svg viewBox="0 0 180 180" width="180" height="180">
                  <circle cx="90" cy="90" r="78" fill="none" stroke="#EEF2F8" strokeWidth="12" />
                  <circle cx="90" cy="90" r="78" fill="none" stroke={brandBlue} strokeWidth="12" strokeLinecap="round"
                    strokeDasharray="490" strokeDashoffset={490 * (1 - dispReal / 100)} transform="rotate(-90 90 90)" />
                </svg>
                <Box sx={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
                  <Typography sx={{ fontSize: "2rem", fontWeight: 600, letterSpacing: "-0.025em", lineHeight: 1 }}>{fmt(dispReal, 2)}%</Typography>
                  <Typography sx={{ fontSize: "0.6875rem", color: "#64748B", textTransform: "uppercase", letterSpacing: "0.07em", mt: 0.5 }}>Disponibilidad</Typography>
                </Box>
              </Box>
            </Box>
            <Box>
              <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2, mb: 2 }}>
                <Box><Typography sx={{ fontSize: "0.75rem", color: "#64748B", mb: 0.25 }}>Horas totales de luz (sobre MIT)</Typography><Typography sx={{ fontSize: "1.125rem", fontWeight: 600 }}>{fmt(num(disponibilidad, "horas_totales"), 2)} h</Typography></Box>
                <Box><Typography sx={{ fontSize: "0.75rem", color: "#64748B", mb: 0.25 }}>Duración promedio del día</Typography><Typography sx={{ fontSize: "1.125rem", fontWeight: 600 }}>{fmt(num(disponibilidad, "duracion_promedio"), 2)} h</Typography></Box>
                <Box><Typography sx={{ fontSize: "0.75rem", color: "#64748B", mb: 0.25 }}>Eventos de indisponibilidad</Typography><Typography sx={{ fontSize: "1.125rem", fontWeight: 600 }}>{eventos.length} registrados</Typography></Box>
                <Box><Typography sx={{ fontSize: "0.75rem", color: "#64748B", mb: 0.25 }}>Mantenimiento correctivo</Typography><Typography sx={{ fontSize: "1.125rem", fontWeight: 600 }}>{eventos.length > 0 ? `${eventos.length} intervención${eventos.length > 1 ? "es" : ""}` : "Sin intervenciones"}</Typography></Box>
              </Box>
            </Box>
          </Box>

          {/* Events */}
          {eventos.length > 0 && (
            <Box sx={{ mt: 2.5, borderTop: "1px solid #EEF2F8", pt: 2 }}>
              <Typography sx={{ fontSize: "0.8125rem", fontWeight: 600, mb: 1.5 }}>Eventos de indisponibilidad</Typography>
              <Box sx={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8125rem" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid #E5EAF2" }}>
                      <th style={{ textAlign: "left", padding: "8px 12px", fontSize: "0.6875rem", color: "#64748B", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 500 }}>N°</th>
                      <th style={{ textAlign: "left", padding: "8px 12px", fontSize: "0.6875rem", color: "#64748B", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 500 }}>Tipo</th>
                      <th style={{ textAlign: "left", padding: "8px 12px", fontSize: "0.6875rem", color: "#64748B", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 500 }}>Descripción</th>
                      <th style={{ textAlign: "left", padding: "8px 12px", fontSize: "0.6875rem", color: "#64748B", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 500 }}>Fecha</th>
                      <th style={{ textAlign: "right", padding: "8px 12px", fontSize: "0.6875rem", color: "#64748B", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 500 }}>Horas</th>
                    </tr>
                  </thead>
                  <tbody>
                    {eventos.map((ev, i) => (
                      <tr key={i} style={{ borderBottom: "1px solid #EEF2F8" }}>
                        <td style={{ padding: "10px 12px" }}>{i + 1}</td>
                        <td style={{ padding: "10px 12px" }}>{str(ev, "evento") || "Desconocido"}</td>
                        <td style={{ padding: "10px 12px" }}>{str(ev, "descripcion")}</td>
                        <td style={{ padding: "10px 12px", whiteSpace: "nowrap" }}>{str(ev, "fecha_incidencia")}</td>
                        <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 500 }}>{fmt(num(ev, "horas_indisponibilidad"), 2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Box>
            </Box>
          )}
        </Card>
      )}

      {/* ── HISTORIC ── */}
      {historico && (
        <Card elevation={0} sx={{ border: "1px solid #E5EAF2", borderRadius: "14px", p: 3 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 2.5, flexWrap: "wrap", gap: 2 }}>
            <Box>
              <Typography sx={{ fontSize: "1.125rem", fontWeight: 600, letterSpacing: "-0.02em", mb: 0.25 }}>Resumen histórico · Año {periodYear}</Typography>
              <Typography sx={{ fontSize: "0.8125rem", color: "#64748B" }}>Comparativo acumulado real vs. simulado.</Typography>
            </Box>
          </Box>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, 1fr)" }, gap: 2, mb: 2.5, pb: 2.5, borderBottom: "1px solid #EEF2F8" }}>
            {[
              { label: "Generación acumulada", value: `${fmt(histProdReal)} kWh`, diff: histProdSim ? ((histProdReal / histProdSim - 1) * 100) : 0, sub: `vs. ${fmt(histProdSim)} kWh simulados` },
              { label: "Irradiación acumulada", value: `${fmt(histIrrReal, 0)} kWh/m²`, diff: histIrrSim ? ((histIrrReal / histIrrSim - 1) * 100) : 0, sub: `vs. ${fmt(histIrrSim, 0)} kWh/m² simulados` },
              { label: "PR O&M promedio", value: `${fmt(histPr, 1)}%`, diff: histPr - histPrSim, sub: `vs. ${fmt(histPrSim, 1)}% simulado` },
              { label: "Disponibilidad promedio", value: `${fmt(histDisp, 1)}%`, diff: histDisp - histDispSim, sub: `vs. ${fmt(histDispSim, 1)}% garantizado` },
            ].map((s) => (
              <Box key={s.label}>
                <Typography sx={{ fontSize: "0.75rem", color: "#64748B", mb: 0.75 }}>{s.label}</Typography>
                <Box sx={{ display: "flex", alignItems: "baseline", gap: 1 }}>
                  <Typography sx={{ fontSize: "1.375rem", fontWeight: 600, letterSpacing: "-0.02em" }}>{s.value}</Typography>
                  <Typography sx={{ fontSize: "0.75rem", fontWeight: 500, px: 1, py: 0.25, borderRadius: "6px", background: s.diff >= 0 ? "#E7F7F1" : "#FEECEC", color: s.diff >= 0 ? greenColor : dangerColor }}>
                    {s.diff >= 0 ? "+" : ""}{fmt(s.diff, 1)}%
                  </Typography>
                </Box>
                <Typography sx={{ fontSize: "0.75rem", color: "#64748B", mt: 0.25 }}>{s.sub}</Typography>
              </Box>
            ))}
          </Box>
        </Card>
      )}

      {/* ── DATA TABLE ── */}
      {tablaGen.length > 0 && (
        <Card elevation={0} sx={{ border: "1px solid #E5EAF2", borderRadius: "14px", p: 3 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 2, flexWrap: "wrap", gap: 2 }}>
            <Box>
              <Typography sx={{ fontSize: "1.125rem", fontWeight: 600, letterSpacing: "-0.02em", mb: 0.25 }}>Detalle diario por inversor</Typography>
              <Typography sx={{ fontSize: "0.8125rem", color: "#64748B" }}>Generación día a día.</Typography>
            </Box>
            <TextField
              size="small"
              placeholder="Filtrar por día..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchOutlinedIcon sx={{ fontSize: 14, color: "#64748B" }} /></InputAdornment> } }}
              sx={{ width: 220, "& .MuiOutlinedInput-root": { fontSize: "0.8125rem" } }}
            />
          </Box>
          <Box sx={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8125rem" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #E5EAF2" }}>
                  <th style={{ textAlign: "left", padding: "10px 14px", fontSize: "0.6875rem", color: "#64748B", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 500 }}>Día</th>
                  {invCodes.map((c) => (
                    <th key={c} style={{ textAlign: "right", padding: "10px 14px", fontSize: "0.6875rem", color: "#64748B", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 500 }}>Inv {c} (kWh)</th>
                  ))}
                  <th style={{ textAlign: "right", padding: "10px 14px", fontSize: "0.6875rem", color: "#64748B", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 500 }}>Total (kWh)</th>
                  <th style={{ padding: "10px 14px", fontSize: "0.6875rem", color: "#64748B", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 500, minWidth: 140 }}>vs promedio</th>
                </tr>
              </thead>
              <tbody>
                {filteredDaily.map((d) => {
                  const day = new Date(str(d, "Fecha")).getDate();
                  const total = num(d, "Total");
                  const pct = avg ? (total / avg * 100) : 0;
                  const ratio = maxDay ? (total / maxDay * 100) : 0;
                  const color = total >= avg ? greenColor : total < avg * 0.7 ? dangerColor : warningColor;
                  return (
                    <tr key={day} style={{ borderBottom: "1px solid #EEF2F8" }}>
                      <td style={{ padding: "11px 14px", color: total === maxDay ? greenColor : total === minDay ? dangerColor : undefined, fontWeight: total === maxDay || total === minDay ? 600 : 400 }}>
                        {String(day).padStart(2, "0")} {MONTHS_SHORT[periodMonth - 1].toLowerCase()}
                      </td>
                      {invCodes.map((c) => (
                        <td key={c} style={{ padding: "11px 14px", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{fmt(num(d, c), 1)}</td>
                      ))}
                      <td style={{ padding: "11px 14px", textAlign: "right", fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{fmt(total, 1)}</td>
                      <td style={{ padding: "11px 14px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{ flex: 1, background: "#EEF2F8", borderRadius: 3, height: 4, overflow: "hidden" }}>
                            <div style={{ height: "100%", width: `${ratio}%`, background: color, borderRadius: 3, opacity: 0.85 }} />
                          </div>
                          <span style={{ color: "#64748B", fontSize: "0.75rem", minWidth: 42, textAlign: "right" }}>{fmt(pct, 0)}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Box>
        </Card>
      )}

      {/* ── FOOTER ── */}
      <Box sx={{ borderTop: "1px solid #E5EAF2", pt: 3, mt: 2, display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 2, alignItems: "flex-end" }}>
        <Box>
          <Typography sx={{ fontWeight: 600, fontSize: "0.8125rem", color: "#334155", mb: 0.5 }}>S-Invest · Dashboard del Inversor</Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography sx={{ fontSize: "0.75rem", color: "#64748B" }}>Datos operacionales provistos por</Typography>
            <Image src="/logos/epc/delta-activos.png" alt="Delta Activos" width={100} height={28} style={{ objectFit: "contain" }} />
          </Box>
        </Box>
        <Box sx={{ textAlign: "right" }}>
          {codigo && <Typography sx={{ fontSize: "0.75rem", color: "#64748B" }}>Reporte {plantName} · código {codigo}</Typography>}
          {fechaCreacion && <Typography sx={{ fontSize: "0.75rem", color: "#64748B" }}>Emitido el {new Date(fechaCreacion).toLocaleDateString("es-CL", { day: "numeric", month: "long", year: "numeric" })}</Typography>}
        </Box>
      </Box>
    </Box>
  );
}

function PeriodNavButton({ dir, target, backHref }: { dir: "prev" | "next"; target?: PeriodNeighbor | null; backHref?: string | null }) {
  const Icon = dir === "prev" ? ChevronLeftIcon : ChevronRightIcon;
  const baseSx = {
    width: 32,
    height: 32,
    borderRadius: "8px",
    color: "#334155",
    background: "#F6F8FB",
    "&:hover": { background: "#EAF1FF", color: brandBlue },
    "&.Mui-disabled": { color: "#CBD5E1", background: "#F6F8FB" },
  };
  if (!target) {
    return (
      <IconButton size="small" disabled sx={baseSx} aria-label={dir === "prev" ? "Periodo anterior" : "Periodo siguiente"}>
        <Icon sx={{ fontSize: 20 }} />
      </IconButton>
    );
  }
  const label = `${MONTHS[target.periodMonth - 1]} ${target.periodYear}`;
  const href = backHref
    ? `/report/${target.duemintId}?back=${encodeURIComponent(backHref)}`
    : `/report/${target.duemintId}`;
  return (
    <MuiTooltip title={label} placement="top">
      <IconButton
        size="small"
        component={Link}
        href={href}
        sx={baseSx}
        aria-label={`${dir === "prev" ? "Periodo anterior" : "Periodo siguiente"}: ${label}`}
      >
        <Icon sx={{ fontSize: 20 }} />
      </IconButton>
    </MuiTooltip>
  );
}
