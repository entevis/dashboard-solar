"use client";

import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import Typography from "@mui/material/Typography";
import { BarChart } from "@mui/x-charts/BarChart";
import { LineChart } from "@mui/x-charts/LineChart";

const MONTH_SHORT = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

interface MonthlyData {
  month: number;
  year: number;
  kwh: number;
  co2: number;
}

interface Props {
  data: MonthlyData[];
}

export function GenerationCharts({ data }: Props) {
  if (data.length === 0) return null;

  // Sort chronologically
  const sorted = [...data].sort((a, b) => a.year * 12 + a.month - (b.year * 12 + b.month));

  const labels = sorted.map((d) => `${MONTH_SHORT[d.month - 1]} ${d.year}`);
  const kwhValues = sorted.map((d) => Math.round(d.kwh));

  // CO2 acumulado
  let acc = 0;
  const co2Accumulated = sorted.map((d) => {
    acc += d.co2;
    return parseFloat(acc.toFixed(2));
  });

  return (
    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 2 }}>
      {/* Bar Chart: Generación mensual */}
      <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", p: 2.5 }}>
        <Typography fontSize="0.8125rem" fontWeight={700} sx={{ mb: 2 }}>
          Generación mensual (kWh)
        </Typography>
        <BarChart
          height={260}
          xAxis={[{
            data: labels,
            scaleType: "band",
            tickLabelStyle: { fontSize: 10, fontFamily: '"Plus Jakarta Sans", sans-serif' },
          }]}
          yAxis={[{
            tickLabelStyle: { fontSize: 10, fontFamily: '"Plus Jakarta Sans", sans-serif' },
            valueFormatter: (v: number | null) => v != null ? `${(v / 1000).toFixed(0)}k` : "",
          }]}
          series={[{
            data: kwhValues,
            color: "#2563eb",
            label: "kWh",
          }]}
          hideLegend
          grid={{ horizontal: true }}
          sx={{
            "& .MuiChartsGrid-line": { stroke: "#eff4ff" },
            "& .MuiChartsAxis-line": { stroke: "#c3c6d7" },
            "& .MuiChartsAxis-tick": { stroke: "#c3c6d7" },
          }}
          borderRadius={6}
        />
      </Card>

      {/* Area Chart: CO2 acumulado */}
      <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", p: 2.5 }}>
        <Typography fontSize="0.8125rem" fontWeight={700} sx={{ mb: 2 }}>
          CO₂ evitado acumulado (ton)
        </Typography>
        <LineChart
          height={260}
          xAxis={[{
            data: labels,
            scaleType: "point",
            tickLabelStyle: { fontSize: 10, fontFamily: '"Plus Jakarta Sans", sans-serif' },
          }]}
          yAxis={[{
            tickLabelStyle: { fontSize: 10, fontFamily: '"Plus Jakarta Sans", sans-serif' },
            valueFormatter: (v: number | null) => v != null ? v.toFixed(1) : "",
          }]}
          series={[{
            data: co2Accumulated,
            color: "#16a34a",
            area: true,
            label: "CO₂ (ton)",
            curve: "monotoneX",
          }]}
          hideLegend
          grid={{ horizontal: true }}
          sx={{
            "& .MuiChartsGrid-line": { stroke: "#eff4ff" },
            "& .MuiChartsAxis-line": { stroke: "#c3c6d7" },
            "& .MuiChartsAxis-tick": { stroke: "#c3c6d7" },
            "& .MuiAreaElement-root": { fillOpacity: 0.15 },
          }}
        />
      </Card>
    </Box>
  );
}
