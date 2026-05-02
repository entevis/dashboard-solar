"use client";

import { useRef, useEffect } from "react";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
} from "chart.js";
import { Bar, Line } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Filler, Tooltip);

const MONTH_SHORT = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

const FONT = { family: '"Plus Jakarta Sans", sans-serif', size: 11 };

interface MonthlyData {
  month: number;
  year: number;
  kwh: number;
  co2: number;
}

interface Props {
  data: MonthlyData[];
}

function downloadExcel(sorted: MonthlyData[]) {
  import("xlsx").then((XLSX) => {
    const rows = sorted.map((d) => ({
      "Período": `${MONTH_SHORT[d.month - 1]} ${d.year}`,
      "Generación (kWh)": Math.round(d.kwh),
      "CO₂ Evitado (ton)": parseFloat(d.co2.toFixed(4)),
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    ws["!cols"] = [{ wch: 12 }, { wch: 18 }, { wch: 18 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Generación");
    const period = `${MONTH_SHORT[sorted[0].month - 1]}${sorted[0].year}-${MONTH_SHORT[sorted[sorted.length - 1].month - 1]}${sorted[sorted.length - 1].year}`;
    XLSX.writeFile(wb, `generacion-${period}.xlsx`);
  });
}

export function GenerationCharts({ data }: Props) {
  if (data.length === 0) return null;

  const sorted = [...data].sort((a, b) => a.year * 12 + a.month - (b.year * 12 + b.month));
  const labels = sorted.map((d) => `${MONTH_SHORT[d.month - 1]} ${d.year}`);
  const kwhValues = sorted.map((d) => Math.round(d.kwh));
  const kwhMax = Math.ceil((Math.max(...kwhValues, 0) + 20000) / 10000) * 10000;

  let acc = 0;
  const co2Accumulated = sorted.map((d) => {
    acc += d.co2;
    return parseFloat(acc.toFixed(2));
  });

  return (
    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 2 }}>
      <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", p: 2.5 }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
          <Typography fontSize="0.8125rem" fontWeight={700}>
            Generación mensual (kWh)
          </Typography>
          <Tooltip title="Descargar Excel">
            <IconButton size="small" onClick={() => downloadExcel(sorted)} sx={{ color: "text.secondary", "&:hover": { color: "#004ac6" } }}>
              <DownloadOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
        <Box sx={{ height: 260 }}>
          <Bar
            data={{
              labels,
              datasets: [{
                data: kwhValues,
                backgroundColor: "#2563eb",
                borderRadius: 6,
                borderSkipped: false,
                barThickness: 32,
              }],
            }}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { display: false }, tooltip: { callbacks: { label: (ctx) => `${(ctx.parsed.y ?? 0).toLocaleString("es-CL")} kWh` } } },
              scales: {
                y: {
                  beginAtZero: true,
                  max: kwhMax,
                  grid: { color: "#eff4ff" },
                  ticks: { font: FONT, callback: (v) => `${Number(v) / 1000}k` },
                  border: { color: "#c3c6d7" },
                },
                x: {
                  grid: { display: false },
                  ticks: { font: FONT, maxRotation: 45, minRotation: 45 },
                  border: { color: "#c3c6d7" },
                },
              },
            }}
          />
        </Box>
      </Card>

      <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", p: 2.5 }}>
        <Typography fontSize="0.8125rem" fontWeight={700} sx={{ mb: 2 }}>
          CO₂ evitado acumulado (ton)
        </Typography>
        <Box sx={{ height: 260 }}>
          <Co2AreaChart labels={labels} data={co2Accumulated} />
        </Box>
      </Card>
    </Box>
  );
}

function Co2AreaChart({ labels, data }: { labels: string[]; data: number[] }) {
  const chartRef = useRef<ChartJS<"line"> | null>(null);

  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;

    const ctx = chart.ctx;
    const chartArea = chart.chartArea;
    if (!chartArea) return;

    const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
    gradient.addColorStop(0, "rgba(22, 163, 106, 0.85)");
    gradient.addColorStop(1, "rgba(22, 163, 106, 0.15)");

    chart.data.datasets[0].backgroundColor = gradient;
    chart.update("none");
  });

  return (
    <Line
      ref={chartRef}
      data={{
        labels,
        datasets: [{
          data,
          borderColor: "#16a34a",
          backgroundColor: "rgba(22, 163, 106, 0.4)",
          fill: true,
          tension: 0.3,
          pointRadius: 4,
          pointBackgroundColor: "#16a34a",
          pointBorderColor: "#fff",
          pointBorderWidth: 2,
          borderWidth: 2.5,
        }],
      }}
      options={{
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: (ctx) => `${(ctx.parsed.y ?? 0).toFixed(2)} ton CO₂` } },
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: { color: "#eff4ff" },
            ticks: { font: FONT },
            border: { color: "#c3c6d7" },
          },
          x: {
            grid: { display: false },
            ticks: { font: FONT, maxRotation: 45, minRotation: 45 },
            border: { color: "#c3c6d7" },
          },
        },
      }}
    />
  );
}
