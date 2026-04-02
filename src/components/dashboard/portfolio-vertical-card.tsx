"use client";

import Link from "next/link";
import Image from "next/image";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Card from "@mui/material/Card";
import Button from "@mui/material/Button";
import EnergySavingsLeafOutlinedIcon from "@mui/icons-material/EnergySavingsLeafOutlined";
import ParkOutlinedIcon from "@mui/icons-material/ParkOutlined";
import DirectionsCarOutlinedIcon from "@mui/icons-material/DirectionsCarOutlined";
import CheckCircleOutlinedIcon from "@mui/icons-material/CheckCircleOutlined";
import WarningAmberOutlinedIcon from "@mui/icons-material/WarningAmberOutlined";
import ArrowForwardOutlinedIcon from "@mui/icons-material/ArrowForwardOutlined";
import { calculateEquivalentTrees, calculateEquivalentCars } from "@/lib/utils/co2";

interface Props {
  name: string;
  description: string | null;
  logoUrl: string | null;
  customerCount: number;
  activePlants: number;
  totalCapacityKw: number;
  openContingencies: number;
  co2Avoided: number;
  href: string;
}

export function PortfolioVerticalCard({ name, description, logoUrl, customerCount, activePlants, totalCapacityKw, openContingencies, co2Avoided, href }: Props) {
  const initials = name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
  const equivalentTrees = calculateEquivalentTrees(co2Avoided);
  const equivalentCars = calculateEquivalentCars(co2Avoided);

  return (
    <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>

      {/* Header */}
      <Box sx={{ p: 3, pb: 2.5, backgroundColor: "#0d1c2e" }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 1, backgroundColor: "rgba(255,255,255,0.12)", px: 2, py: 1, mb: 2, mx: "auto", width: "fit-content", minWidth: 120, maxWidth: 160, height: 40 }}>
          {logoUrl
            ? <Image src={logoUrl} alt={`Logo ${name}`} width={120} height={28} style={{ objectFit: "contain", maxHeight: 28 }} />
            : <Typography fontWeight={700} fontSize="1rem" color="white">{initials}</Typography>
          }
        </Box>
        <Typography fontSize="1.0625rem" fontWeight={600} color="white" sx={{ lineHeight: 1.3 }}>{name}</Typography>
        {description && (
          <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.65)", mt: 0.5, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
            {description}
          </Typography>
        )}
      </Box>

      {/* Stats */}
      <Box sx={{ px: 3, py: 2.5, borderBottom: "1px solid", borderColor: "divider" }}>
        <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", divideX: "1px solid" }}>
          {[
            { label: "Clientes", value: customerCount },
            { label: "Plantas", value: activePlants },
            { label: `${Math.round(totalCapacityKw).toLocaleString("es-CL")} kW`, value: null, sublabel: "Capacidad" },
          ].map((stat, i) => (
            <Box key={i} sx={{ textAlign: "center", borderRight: i < 2 ? "1px solid" : "none", borderColor: "divider" }}>
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", textTransform: "uppercase", letterSpacing: "0.06em", mb: 0.5 }}>
                {stat.sublabel ?? stat.label}
              </Typography>
              <Typography fontSize={stat.value !== null ? "1.375rem" : "1.0625rem"} fontWeight={700} color="text.primary" sx={{ lineHeight: 1 }}>
                {stat.value !== null ? stat.value : stat.label}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>

      {/* Contingencias */}
      <Box sx={{ px: 3, py: 2, borderBottom: "1px solid", borderColor: "divider" }}>
        {openContingencies === 0 ? (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <CheckCircleOutlinedIcon sx={{ fontSize: 16, color: "#16a34a" }} />
            <Typography fontSize="0.8125rem" color="text.secondary">
              <Box component="span" fontWeight={600}>0</Box> Contingencias Abiertas
            </Typography>
          </Box>
        ) : (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, px: 1.5, py: 1, borderRadius: 1.5, backgroundColor: "#fef9c3" }}>
            <WarningAmberOutlinedIcon sx={{ fontSize: 16, color: "#a16207" }} />
            <Typography fontSize="0.8125rem" fontWeight={700} sx={{ color: "#a16207" }}>{openContingencies}</Typography>
            <Typography fontSize="0.8125rem" color="text.primary">Contingencias Abiertas</Typography>
          </Box>
        )}
      </Box>

      {/* Impacto ambiental */}
      <Box sx={{ px: 3, py: 2.5, flex: 1 }}>
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", textTransform: "uppercase", letterSpacing: "0.06em", mb: 1.5 }}>
          Impacto Medioambiental
        </Typography>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}>
          {[
            { icon: <EnergySavingsLeafOutlinedIcon sx={{ fontSize: 15, color: "#16a34a" }} />, value: co2Avoided.toFixed(1), label: "t CO₂ evitadas" },
            { icon: <ParkOutlinedIcon sx={{ fontSize: 15, color: "#16a34a" }} />, value: equivalentTrees.toLocaleString("es-CL"), label: "árboles equivalentes" },
            { icon: <DirectionsCarOutlinedIcon sx={{ fontSize: 15, color: "#434655" }} />, value: equivalentCars.toFixed(1), label: "autos equivalentes" },
          ].map((item) => (
            <Box key={item.label} sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
              {item.icon}
              <Typography fontSize="0.875rem" fontWeight={600}>{item.value}</Typography>
              <Typography fontSize="0.8125rem" color="text.secondary">{item.label}</Typography>
            </Box>
          ))}
        </Box>
      </Box>

      {/* CTA */}
      <Box sx={{ px: 3, pb: 3 }}>
        <Button
          component={Link}
          href={href}
          variant="outlined"
          fullWidth
          endIcon={<ArrowForwardOutlinedIcon />}
          color="inherit"
          sx={{ borderColor: "#c3c6d7", fontSize: "0.8125rem", "&:hover": { borderColor: "#004ac6", color: "#004ac6", backgroundColor: "#eff4ff" } }}
        >
          Ver detalle del portafolio
        </Button>
      </Box>
    </Card>
  );
}
