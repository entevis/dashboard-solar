"use client";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Card from "@mui/material/Card";
import Chip from "@mui/material/Chip";
import { Bar, Line } from "react-chartjs-2";
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

const MONTHS_FULL = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
const FONT = { family: '"Plus Jakarta Sans", sans-serif', size: 11 };

interface Props {
  rawJson: Record<string, unknown>;
  plantName: string | null;
  customerName: string | null;
  periodMonth: number;
  periodYear: number;
}

// Safe accessors
function get(obj: unknown, path: string): unknown {
  const parts = path.split(".");
  let current: unknown = obj;
  for (const part of parts) {
    if (current == null || typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}

function num(obj: unknown, path: string, fallback = 0): number {
  const v = get(obj, path);
  return typeof v === "number" ? v : fallback;
}

function str(obj: unknown, path: string, fallback = ""): string {
  const v = get(obj, path);
  return typeof v === "string" ? v : fallback;
}

function fmt(n: number, decimals = 0): string {
  return n.toLocaleString("es-CL", { maximumFractionDigits: decimals, minimumFractionDigits: decimals });
}

function fmtDate(iso: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("es-CL", { day: "numeric", month: "long" });
}

export function ReportView({ rawJson, plantName, periodMonth, periodYear }: Props) {
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
  const inversores = (get(planta, "inversores") ?? []) as Record<string, unknown>[];
  const tablaGen = (get(generacion, "tabla_generacion") ?? []) as Record<string, unknown>[];
  const tablaRend = (get(rendimiento, "tabla_rendimiento") ?? []) as Record<string, unknown>[];
  const fechaCreacion = str(datos, "fecha_creacion");

  const periodLabel = `${MONTHS_FULL[periodMonth - 1]} ${periodYear}`;

  // KPIs
  const produccionTotal = num(tecnico, "produccion_total");
  const pr = num(tecnico, "pr");
  const prSimulado = num(tecnico, "pr_simulado");
  const irradiacionTotal = num(tecnico, "irradiacion_total");
  const rendEspecifico = num(tecnico, "rend_especifico");
  const dispOm = num(tecnico, "disponibilidad_om");
  const dispReal = num(tecnico, "disponibilidad_real");
  const co2 = num(tecnico, "co2");

  // Relevant days
  const mayorFecha = str(tecnico, "mayor_produccion_fecha");
  const mayorValor = num(tecnico, "mayor_produccion_valor");
  const menorFecha = str(tecnico, "menor_produccion_fecha");
  const menorValor = num(tecnico, "menor_produccion_valor");
  const medianaFecha = str(tecnico, "mediana_fecha");
  const medianaValor = num(tecnico, "mediana_valor");
  const promedioDiario = num(tecnico, "promedio_diario");

  // Daily chart data
  const dailyLabels = tablaGen.map((d) => {
    const fecha = str(d, "Fecha");
    if (!fecha) return "";
    return new Date(fecha).getDate().toString();
  });
  const dailyTotals = tablaGen.map((d) => num(d, "Total"));

  // Historic
  const histGen = get(historico, "prod_real") as number | undefined;
  const histGenSim = get(historico, "prod_sim") as number | undefined;

  const kpiSx = {
    border: "1px solid",
    borderColor: "divider",
    borderRadius: 3,
    p: 2.5,
    transition: "all 200ms",
    "&:hover": { transform: "translateY(-2px)", boxShadow: "0 8px 24px rgba(13,28,46,0.10)" },
  };

  const labelSx = { fontSize: "0.6875rem", color: "text.secondary", letterSpacing: "0.02em", mb: 1.5 };
  const valueSx = { fontSize: "1.75rem", fontWeight: 600, letterSpacing: "-0.025em", lineHeight: 1 };
  const unitSx = { fontSize: "0.875rem", color: "text.secondary", fontWeight: 500, ml: 0.5 };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3, pb: 6 }}>

      {/* HERO */}
      <Box sx={{ pt: 2 }}>
        <Typography fontSize="0.75rem" color="primary.main" fontWeight={500} letterSpacing="0.05em" textTransform="uppercase" sx={{ mb: 1 }}>
          Planta Solar Fotovoltaica
        </Typography>
        <Typography variant="h4" fontWeight={600} letterSpacing="-0.03em" sx={{ mb: 0.5 }}>
          {plantName ?? "Planta"}
        </Typography>
        <Typography color="text.secondary" fontSize="0.9375rem">
          {pNom} kW nominales · {inversores.length} inversor{inversores.length !== 1 ? "es" : ""} · {periodLabel}
        </Typography>

        {fechaCreacion && (
          <Box sx={{ mt: 2, display: "inline-flex", gap: 2, alignItems: "center", border: "1px solid", borderColor: "divider", borderRadius: 3, px: 2, py: 1.5 }}>
            <Box>
              <Typography fontSize="0.6875rem" color="text.secondary" textTransform="uppercase" letterSpacing="0.07em">Periodo</Typography>
              <Typography fontSize="0.875rem" fontWeight={600}>{periodLabel}</Typography>
            </Box>
            <Box sx={{ width: 1, height: 36, backgroundColor: "divider" }} />
            <Box>
              <Typography fontSize="0.6875rem" color="text.secondary" textTransform="uppercase" letterSpacing="0.07em">Emitido</Typography>
              <Typography fontSize="0.875rem" fontWeight={600}>{new Date(fechaCreacion).toLocaleDateString("es-CL", { day: "numeric", month: "short", year: "numeric" })}</Typography>
            </Box>
          </Box>
        )}
      </Box>

      {/* KPI ROW 1 */}
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, 1fr)" }, gap: 2 }}>
        <Card elevation={0} sx={kpiSx}>
          <Typography sx={labelSx}>Producción total</Typography>
          <Typography sx={valueSx}>{fmt(produccionTotal)}<Typography component="span" sx={unitSx}>kWh</Typography></Typography>
        </Card>
        <Card elevation={0} sx={kpiSx}>
          <Typography sx={labelSx}>Performance Ratio O&M</Typography>
          <Typography sx={valueSx}>{fmt(pr, 2)}<Typography component="span" sx={unitSx}>%</Typography></Typography>
          <Typography fontSize="0.75rem" color={pr > prSimulado ? "#16a34a" : "#dc2626"} fontWeight={500} sx={{ mt: 1 }}>
            {pr > prSimulado ? "+" : ""}{fmt(pr - prSimulado, 1)} p.p. vs simulado
          </Typography>
        </Card>
        <Card elevation={0} sx={kpiSx}>
          <Typography sx={labelSx}>Irradiación total</Typography>
          <Typography sx={valueSx}>{fmt(irradiacionTotal, 2)}<Typography component="span" sx={unitSx}>kWh/m²</Typography></Typography>
        </Card>
        <Card elevation={0} sx={kpiSx}>
          <Typography sx={labelSx}>Rendimiento específico</Typography>
          <Typography sx={valueSx}>{fmt(rendEspecifico, 2)}<Typography component="span" sx={unitSx}>kWh/kWp</Typography></Typography>
        </Card>
      </Box>

      {/* KPI ROW 2 */}
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(3, 1fr)" }, gap: 2 }}>
        <Card elevation={0} sx={kpiSx}>
          <Typography sx={labelSx}>Disponibilidad O&M</Typography>
          <Typography sx={valueSx}>{fmt(dispOm, 2)}<Typography component="span" sx={unitSx}>%</Typography></Typography>
        </Card>
        <Card elevation={0} sx={kpiSx}>
          <Typography sx={labelSx}>Disponibilidad real</Typography>
          <Typography sx={valueSx}>{fmt(dispReal, 2)}<Typography component="span" sx={unitSx}>%</Typography></Typography>
        </Card>
        <Card elevation={0} sx={kpiSx}>
          <Typography sx={labelSx}>CO₂ evitado</Typography>
          <Typography sx={valueSx}>{fmt(co2, 2)}<Typography component="span" sx={unitSx}>toneladas</Typography></Typography>
        </Card>
      </Box>

      {/* DAILY PRODUCTION CHART */}
      {tablaGen.length > 0 && (
        <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 3, p: 3 }}>
          <Typography fontSize="1.125rem" fontWeight={600} letterSpacing="-0.02em" sx={{ mb: 0.5 }}>
            Generación diaria · {periodLabel}
          </Typography>
          <Typography fontSize="0.8125rem" color="text.secondary" sx={{ mb: 2.5 }}>
            Producción por día en kWh.
          </Typography>
          <Box sx={{ height: 340 }}>
            <Bar
              data={{
                labels: dailyLabels,
                datasets: [{
                  data: dailyTotals,
                  backgroundColor: dailyTotals.map((v) =>
                    v === mayorValor ? "#10B981" :
                    v === menorValor ? "#EF4444" :
                    "rgba(42, 110, 245, 0.85)"
                  ),
                  borderRadius: 4,
                  borderSkipped: false,
                }],
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { display: false },
                  tooltip: {
                    backgroundColor: "#0B1220",
                    titleColor: "#fff",
                    bodyColor: "#E5EAF2",
                    cornerRadius: 8,
                    padding: 12,
                    callbacks: {
                      title: (items) => `Día ${items[0].label} de ${MONTHS_FULL[periodMonth - 1].toLowerCase()}`,
                      label: (ctx) => `  ${(ctx.parsed.y ?? 0).toLocaleString("es-CL", { maximumFractionDigits: 1 })} kWh`,
                    },
                  },
                },
                scales: {
                  y: { beginAtZero: true, grid: { color: "#F1F5F9" }, ticks: { font: FONT, callback: (v) => `${Number(v) / 1000}k` }, border: { color: "#E5EAF2" } },
                  x: { grid: { display: false }, ticks: { font: FONT }, border: { color: "#E5EAF2" } },
                },
              }}
            />
          </Box>

          {/* Relevant days */}
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, 1fr)" }, gap: 1.5, mt: 2.5 }}>
            {[
              { label: "Mayor producción", value: `${fmt(mayorValor)} kWh`, sub: fmtDate(mayorFecha), color: "#E7F7F1" },
              { label: "Mediana", value: `${fmt(medianaValor)} kWh`, sub: fmtDate(medianaFecha), color: "#EAF1FF" },
              { label: "Menor producción", value: `${fmt(menorValor)} kWh`, sub: fmtDate(menorFecha), color: "#FEECEC" },
              { label: "Promedio diario", value: `${fmt(promedioDiario)} kWh`, sub: `${tablaGen.length} días operativos`, color: "#F6F8FB" },
            ].map((d) => (
              <Box key={d.label} sx={{ backgroundColor: d.color, borderRadius: 2, p: 2 }}>
                <Typography fontSize="0.6875rem" color="text.secondary" textTransform="uppercase" letterSpacing="0.07em" fontWeight={500} sx={{ mb: 1 }}>{d.label}</Typography>
                <Typography fontSize="1.25rem" fontWeight={600} letterSpacing="-0.02em">{d.value}</Typography>
                <Typography fontSize="0.8125rem" color="text.secondary" sx={{ mt: 0.5 }}>{d.sub}</Typography>
              </Box>
            ))}
          </Box>
        </Card>
      )}

      {/* INVERTER BREAKDOWN */}
      {tablaRend.length > 0 && (
        <>
          <Box sx={{ pt: 1 }}>
            <Typography fontSize="1.25rem" fontWeight={600} letterSpacing="-0.02em">Rendimiento por inversor</Typography>
            <Typography fontSize="0.8125rem" color="text.secondary">Desempeño individual de cada equipo del sistema.</Typography>
          </Box>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 2.5 }}>
            {tablaRend.map((inv, idx) => {
              const code = str(inv, "inversor");
              const modelo = inversores.find((i) => str(i, "codigo") === code);
              return (
                <Card key={code} elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 3, p: 3 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2.5 }}>
                    <Box sx={{ width: 34, height: 34, borderRadius: 2, backgroundColor: idx === 0 ? "#2A6EF5" : "#7C8DB5", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 600, fontSize: "1rem" }}>
                      {code}
                    </Box>
                    <Box>
                      <Typography fontSize="0.9375rem" fontWeight={600}>{modelo ? str(modelo, "modelo") : `Inversor ${code}`}</Typography>
                      <Typography fontSize="0.75rem" color="text.secondary">
                        {modelo ? `${str(modelo, "n_paneles")} paneles · ${str(modelo, "p_peak")} Wp` : ""}
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
                    <Box>
                      <Typography fontSize="0.75rem" color="text.secondary" sx={{ mb: 0.5 }}>Producción</Typography>
                      <Typography fontSize="1.125rem" fontWeight={600}>{fmt(num(inv, "generacion"))}<Typography component="span" sx={{ fontSize: "0.75rem", color: "text.secondary", ml: 0.5 }}>kWh</Typography></Typography>
                    </Box>
                    <Box>
                      <Typography fontSize="0.75rem" color="text.secondary" sx={{ mb: 0.5 }}>Rendimiento</Typography>
                      <Typography fontSize="1.125rem" fontWeight={600}>{fmt(num(inv, "rendimiento"), 2)}<Typography component="span" sx={{ fontSize: "0.75rem", color: "text.secondary", ml: 0.5 }}>kWh/kWp</Typography></Typography>
                    </Box>
                    <Box>
                      <Typography fontSize="0.75rem" color="text.secondary" sx={{ mb: 0.5 }}>PR O&M</Typography>
                      <Typography fontSize="1.125rem" fontWeight={600}>{fmt(num(inv, "pr"), 2)}%</Typography>
                      <Box sx={{ height: 5, backgroundColor: "#EEF2F8", borderRadius: 999, mt: 1, overflow: "hidden" }}>
                        <Box sx={{ height: "100%", width: `${Math.min(num(inv, "pr"), 100)}%`, backgroundColor: idx === 0 ? "#2A6EF5" : "#7C8DB5", borderRadius: 999 }} />
                      </Box>
                    </Box>
                    <Box>
                      <Typography fontSize="0.75rem" color="text.secondary" sx={{ mb: 0.5 }}>Disponibilidad real</Typography>
                      <Typography fontSize="1.125rem" fontWeight={600}>{fmt(num(inv, "disponibilidad_real"), 2)}%</Typography>
                      <Box sx={{ height: 5, backgroundColor: "#EEF2F8", borderRadius: 999, mt: 1, overflow: "hidden" }}>
                        <Box sx={{ height: "100%", width: `${Math.min(num(inv, "disponibilidad_real"), 100)}%`, backgroundColor: idx === 0 ? "#2A6EF5" : "#7C8DB5", borderRadius: 999 }} />
                      </Box>
                    </Box>
                  </Box>
                </Card>
              );
            })}
          </Box>
        </>
      )}

      {/* AVAILABILITY */}
      {disponibilidad && (
        <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 3, p: 3 }}>
          <Typography fontSize="1.125rem" fontWeight={600} letterSpacing="-0.02em" sx={{ mb: 2 }}>Disponibilidad y horas de operación</Typography>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, 1fr)" }, gap: 2, mb: 2 }}>
            <Box>
              <Typography fontSize="0.75rem" color="text.secondary">Disponibilidad O&M</Typography>
              <Typography fontSize="1.125rem" fontWeight={600}>{fmt(dispOm, 2)}%</Typography>
            </Box>
            <Box>
              <Typography fontSize="0.75rem" color="text.secondary">Horas totales de luz</Typography>
              <Typography fontSize="1.125rem" fontWeight={600}>{fmt(num(disponibilidad, "horas_totales"), 2)} h</Typography>
            </Box>
            <Box>
              <Typography fontSize="0.75rem" color="text.secondary">Duración promedio del día</Typography>
              <Typography fontSize="1.125rem" fontWeight={600}>{fmt(num(disponibilidad, "duracion_promedio"), 2)} h</Typography>
            </Box>
            <Box>
              <Typography fontSize="0.75rem" color="text.secondary">Eventos de indisponibilidad</Typography>
              <Typography fontSize="1.125rem" fontWeight={600}>{eventos.length} registrados</Typography>
            </Box>
          </Box>

          {/* Events table */}
          {eventos.length > 0 && (
            <Box sx={{ mt: 2, borderTop: "1px solid", borderColor: "divider", pt: 2 }}>
              <Typography fontSize="0.8125rem" fontWeight={600} sx={{ mb: 1.5 }}>Eventos de indisponibilidad</Typography>
              {eventos.map((ev, i) => (
                <Box key={i} sx={{ display: "flex", gap: 2, py: 1, borderBottom: i < eventos.length - 1 ? "1px solid" : "none", borderColor: "divider" }}>
                  <Chip label={str(ev, "evento") || "Desconocido"} size="small" sx={{ fontSize: "0.6875rem", height: 20 }} />
                  <Typography fontSize="0.8125rem" sx={{ flex: 1 }}>{str(ev, "descripcion")}</Typography>
                  <Typography fontSize="0.8125rem" color="text.secondary" sx={{ whiteSpace: "nowrap" }}>{str(ev, "fecha_incidencia")}</Typography>
                  <Typography fontSize="0.8125rem" fontWeight={500}>{fmt(num(ev, "horas_indisponibilidad"), 2)} h</Typography>
                </Box>
              ))}
            </Box>
          )}
        </Card>
      )}

      {/* FOOTER */}
      <Box sx={{ borderTop: "1px solid", borderColor: "divider", pt: 3, mt: 2, display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 2 }}>
        <Box>
          <Typography fontSize="0.8125rem" fontWeight={600} color="text.secondary">S-Invest · Dashboard del Inversor</Typography>
          <Typography fontSize="0.75rem" color="text.secondary">Datos operacionales provistos por Delta Activos · D-Plus</Typography>
        </Box>
        <Box sx={{ textAlign: "right" }}>
          <Typography fontSize="0.75rem" color="text.secondary">Reporte {plantName} · {periodLabel}</Typography>
          {fechaCreacion && <Typography fontSize="0.75rem" color="text.secondary">Emitido el {new Date(fechaCreacion).toLocaleDateString("es-CL", { day: "numeric", month: "long", year: "numeric" })}</Typography>}
        </Box>
      </Box>
    </Box>
  );
}
