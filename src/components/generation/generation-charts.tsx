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
  Tooltip as ChartTooltip,
  Legend,
} from "chart.js";
import type { Plugin } from "chart.js";
import { Bar, Chart } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Filler, ChartTooltip, Legend);

const MONTH_SHORT = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

const FONT = { family: '"Archivo Narrow", sans-serif', size: 11 };
const LABEL_FONT = `500 10px "Archivo Narrow", sans-serif`;

interface MonthlyData {
  month: number;
  year: number;
  kwh: number;
  co2: number;
}

interface Props {
  data: MonthlyData[];
}

function niceStep(maxVal: number): number {
  if (maxVal <= 0) return 1;
  const rough = maxVal / 4;
  const pow = Math.pow(10, Math.floor(Math.log10(rough)));
  const norm = rough / pow;
  const nice = norm < 1.5 ? 1 : norm < 3.5 ? 2 : norm < 7.5 ? 5 : 10;
  return nice * pow;
}

function ExcelIcon({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size * (22 / 18)} viewBox="0 0 18 22" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Document page */}
      <path d="M2 2C2 0.9 2.9 0 4 0H12L18 6V20C18 21.1 17.1 22 16 22H4C2.9 22 2 21.1 2 20V2Z" fill="#E8F5E9" />
      {/* Folded corner */}
      <path d="M12 0L18 6H13C12.45 6 12 5.55 12 5V0Z" fill="#C8E6C9" />
      {/* Green badge overlay */}
      <rect x="0" y="11" width="13" height="11" rx="2" fill="#217346" />
      {/* White X */}
      <path d="M2.8 13L6.8 20.5" stroke="white" strokeWidth="2" strokeLinecap="round" />
      <path d="M6.8 13L2.8 20.5" stroke="white" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
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

const barDatalabels: Plugin<"bar"> = {
  id: "barDatalabels",
  afterDatasetsDraw(chart) {
    const { ctx } = chart;
    const meta = chart.getDatasetMeta(0);
    const topBound = chart.chartArea.top;
    let lastLabelRight = -Infinity;

    meta.data.forEach((bar, index) => {
      const value = chart.data.datasets[0].data[index] as number;
      if (!value) return;

      const label = `${Math.round(value / 1000)}k`;
      ctx.save();
      ctx.font = LABEL_FONT;

      const textWidth = ctx.measureText(label).width;
      const x = bar.x;
      if (x - textWidth / 2 < lastLabelRight + 4) {
        ctx.restore();
        return;
      }
      lastLabelRight = x + textWidth / 2;

      const yAbove = bar.y - 5;
      const fitsAbove = yAbove - 12 >= topBound;

      if (fitsAbove) {
        ctx.fillStyle = "#434655";
        ctx.textAlign = "center";
        ctx.textBaseline = "bottom";
        ctx.fillText(label, x, yAbove);
      } else {
        ctx.fillStyle = "#ffffff";
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        ctx.fillText(label, x, topBound + 4);
      }
      ctx.restore();
    });
  },
};

// Labels only on the accumulated line (dataset index 1 in Co2DualChart)
const co2AccumLabels: Plugin = {
  id: "co2AccumLabels",
  afterDatasetsDraw(chart) {
    const { ctx } = chart;
    const meta = chart.getDatasetMeta(1);
    if (!meta || !meta.data.length) return;

    const topBound = chart.chartArea.top;
    let lastLabelRight = -Infinity;

    meta.data.forEach((point, index) => {
      const value = chart.data.datasets[1].data[index] as number;
      if (value == null) return;

      const label = `${value.toLocaleString("es-CL", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ton`;
      ctx.save();
      ctx.font = LABEL_FONT;

      const textWidth = ctx.measureText(label).width;
      const x = point.x;
      if (x - textWidth / 2 < lastLabelRight + 4) {
        ctx.restore();
        return;
      }
      lastLabelRight = x + textWidth / 2;

      const yAbove = point.y - 12;
      ctx.fillStyle = "#16a34a";
      ctx.textAlign = "center";
      ctx.textBaseline = "bottom";
      ctx.fillText(label, x, Math.max(yAbove, topBound + 12));
      ctx.restore();
    });
  },
};

export function GenerationCharts({ data }: Props) {
  if (data.length === 0) return null;

  const sorted = [...data].sort((a, b) => a.year * 12 + a.month - (b.year * 12 + b.month));
  const labels = sorted.map((d) => `${MONTH_SHORT[d.month - 1]} ${d.year}`);
  const kwhValues = sorted.map((d) => Math.round(d.kwh));

  const maxKwh = Math.max(...kwhValues, 0);
  const kwhStep = niceStep(maxKwh);
  const kwhMax = (Math.ceil(maxKwh / kwhStep) + 1) * kwhStep;

  // Trim trailing months with no data
  const lastWithData = sorted.reduce((last, d, i) => (d.kwh > 0 || d.co2 > 0 ? i : last), -1);
  const co2Sorted = lastWithData >= 0 ? sorted.slice(0, lastWithData + 1) : sorted;
  const co2Labels = co2Sorted.map((d) => `${MONTH_SHORT[d.month - 1]} ${d.year}`);

  const co2Monthly = co2Sorted.map((d) => parseFloat(d.co2.toFixed(4)));

  let acc = 0;
  const co2Accumulated = co2Sorted.map((d) => {
    acc += d.co2;
    return parseFloat(acc.toFixed(2));
  });

  const maxAccum = Math.max(...co2Accumulated, 0);
  const accumStep = niceStep(maxAccum);
  const accumMax = (Math.ceil(maxAccum / accumStep) + 1) * accumStep;

  return (
    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 2 }}>
      <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", p: 2.5 }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
          <Typography fontSize="0.8125rem" fontWeight={700}>
            Generación mensual (kWh)
          </Typography>
          <Tooltip title="Descargar Excel">
            <IconButton size="small" onClick={() => downloadExcel(sorted)} sx={{ color: "text.secondary", gap: 0.5, "&:hover": { color: "#004ac6" } }}>
              <ExcelIcon />
              <DownloadOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
        <Box sx={{ height: 300 }}>
          <Bar
            plugins={[barDatalabels]}
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
              plugins: {
                legend: { display: false },
                tooltip: { callbacks: { label: (ctx) => `${(ctx.parsed.y ?? 0).toLocaleString("es-CL")} kWh` } },
              },
              scales: {
                y: {
                  beginAtZero: true,
                  max: kwhMax,
                  grid: { color: "#eff4ff" },
                  ticks: {
                    font: FONT,
                    stepSize: kwhStep,
                    callback: (v) => `${Math.round(Number(v) / 1000)}k`,
                  },
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
          CO₂ evitado (ton)
        </Typography>
        <Box sx={{ height: 300 }}>
          <Co2DualChart
            labels={co2Labels}
            monthly={co2Monthly}
            accumulated={co2Accumulated}
            accumStep={accumStep}
            accumMax={accumMax}
          />
        </Box>
      </Card>
    </Box>
  );
}

function Co2DualChart({
  labels,
  monthly,
  accumulated,
  accumStep,
  accumMax,
}: {
  labels: string[];
  monthly: number[];
  accumulated: number[];
  accumStep: number;
  accumMax: number;
}) {
  const chartRef = useRef<ChartJS | null>(null);

  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;
    const ctx = chart.ctx;
    const chartArea = chart.chartArea;
    if (!chartArea) return;

    const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
    gradient.addColorStop(0, "rgba(22, 163, 106, 0.35)");
    gradient.addColorStop(1, "rgba(22, 163, 106, 0.02)");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (chart.data.datasets[1] as any).backgroundColor = gradient;
    chart.update("none");
  });

  return (
    <Chart
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ref={chartRef as any}
      type="bar"
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      plugins={[co2AccumLabels as any]}
      data={{
        labels,
        datasets: [
          {
            type: "bar" as const,
            label: "Mensual",
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            data: monthly as any,
            backgroundColor: "rgba(74, 222, 128, 0.75)",
            borderRadius: 4,
            barThickness: 20,
            yAxisID: "y",
            order: 2,
          },
          {
            type: "line" as const,
            label: "Acumulado",
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            data: accumulated as any,
            borderColor: "#16a34a",
            backgroundColor: "rgba(22, 163, 106, 0.2)",
            fill: true,
            tension: 0.3,
            pointRadius: 4,
            pointBackgroundColor: "#16a34a",
            pointBorderColor: "#fff",
            pointBorderWidth: 2,
            borderWidth: 2.5,
            yAxisID: "y",
            order: 1,
          },
        ],
      }}
      options={{
        responsive: true,
        maintainAspectRatio: false,
        layout: { padding: { top: 16 } },
        plugins: {
          legend: {
            display: true,
            position: "top" as const,
            align: "end" as const,
            labels: {
              font: FONT,
              boxWidth: 8,
              boxHeight: 8,
              padding: 8,
              usePointStyle: true,
              pointStyle: "circle" as const,
            },
          },
          tooltip: {
            callbacks: {
              label: (ctx) => {
                const v = ctx.parsed.y ?? 0;
                if (ctx.datasetIndex === 0) return `${v.toFixed(4)} ton CO₂ mensual`;
                return `${v.toFixed(2)} ton CO₂ acumulado`;
              },
            },
          },
        },
        scales: {
          y: {
            type: "linear" as const,
            position: "left" as const,
            beginAtZero: true,
            max: accumMax,
            grid: { color: "#eff4ff" },
            ticks: { font: FONT, stepSize: accumStep },
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
