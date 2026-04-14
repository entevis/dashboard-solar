import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import EnergySavingsLeafOutlinedIcon from "@mui/icons-material/EnergySavingsLeafOutlined";
import ParkOutlinedIcon from "@mui/icons-material/ParkOutlined";
import DirectionsCarOutlinedIcon from "@mui/icons-material/DirectionsCarOutlined";

interface EnvironmentalImpactProps {
  co2Tonnes: number;
  equivalentTrees: number;
  equivalentCars: number;
  yearLabel?: string;
}

const items = [
  { icon: <EnergySavingsLeafOutlinedIcon sx={{ fontSize: 22, color: "#16a34a" }} />, bg: "#dcfce7" },
  { icon: <ParkOutlinedIcon sx={{ fontSize: 22, color: "#16a34a" }} />, bg: "#dcfce7" },
  { icon: <DirectionsCarOutlinedIcon sx={{ fontSize: 22, color: "#434655" }} />, bg: "#e6eeff" },
];

export function EnvironmentalImpact({ co2Tonnes, equivalentTrees, equivalentCars, yearLabel }: EnvironmentalImpactProps) {
  const stats = [
    { value: co2Tonnes.toFixed(1), label: "ton CO₂ evitadas" },
    { value: equivalentTrees.toLocaleString("es-CL"), label: "árboles equivalentes" },
    { value: String(equivalentCars), label: "autos retirados" },
  ];

  return (
    <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider" }}>
      <Box sx={{ px: 2, py: 1.5, borderBottom: "1px solid", borderColor: "divider" }}>
        <Typography fontSize="0.875rem" fontWeight={600}>Impacto medioambiental{yearLabel ? ` (${yearLabel})` : ""}</Typography>
      </Box>
      <CardContent>
        <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 3 }}>
          {stats.map((s, i) => (
            <Box key={s.label} sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
              <Box sx={{ width: 40, height: 40, borderRadius: 1.5, backgroundColor: items[i].bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {items[i].icon}
              </Box>
              <Typography variant="h6" fontWeight={700}>{s.value}</Typography>
              <Typography variant="caption" color="text.secondary" textAlign="center">{s.label}</Typography>
            </Box>
          ))}
        </Box>
      </CardContent>
    </Card>
  );
}
