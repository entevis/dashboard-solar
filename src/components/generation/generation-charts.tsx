"use client";

import { useRef, useEffect } from "react";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import Typography from "@mui/material/Typography";
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

export function GenerationCharts({ data }: Props) {
  if (data.length === 0) return null;

  const sorted = [...data].sort((a, b) => a.year * 12 + a.month - (b.year * 12 + b.month));
  const labels = sorted.map((d) => `${MONTH_SHORT[d.month - 1]} ${d.year}`);
  const kwhValues = sorted.map((d) => Math.round(d.kwh));

  let acc = 0;
  const co2Accumulated = sorted.map((d) => {
    acc += d.co2;
    return parseFloat(acc.toFixed(2));
  });

  return (
    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 2 }}>
      <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", p: 2.5 }}>
        <Typography fontSize="0.8125rem" fontWeight={700} sx={{ mb: 2 }}>
          Generación mensual (kWh)
        </Typography>
        <Box sx={{ height: 260 }}>
          <Bar
            data={{
              labels,
              datasets: [{
                data: kwhValues,
                backgroundColor: "#2563eb",
                borderRadius: 6,
                borderSkipped: false,
              }],
            }}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { display: false }, tooltip: { callbacks: { label: (ctx) => `${(ctx.parsed.y ?? 0).toLocaleString("es-CL")} kWh` } } },
              scales: {
                y: {
                  beginAtZero: true,
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
