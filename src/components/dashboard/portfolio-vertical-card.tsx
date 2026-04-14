"use client";

import Link from "next/link";
import Image from "next/image";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Card from "@mui/material/Card";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import EnergySavingsLeafOutlinedIcon from "@mui/icons-material/EnergySavingsLeafOutlined";
import ParkOutlinedIcon from "@mui/icons-material/ParkOutlined";
import DirectionsCarOutlinedIcon from "@mui/icons-material/DirectionsCarOutlined";
import ArrowForwardOutlinedIcon from "@mui/icons-material/ArrowForwardOutlined";
import { calculateEquivalentTrees, calculateEquivalentCars } from "@/lib/utils/co2";

interface Props {
  isSelected?: boolean;
  name: string;
  description: string | null;
  logoUrl: string | null;
  customerCount: number;
  activePlants: number;
  totalCapacityKw: number;
  co2LastMonth: number;
  co2Year: number;
  lastMonthLabel: string;
  href: string;
}

export function PortfolioVerticalCard({ isSelected, name, description, logoUrl, customerCount, activePlants, totalCapacityKw, co2LastMonth, co2Year, lastMonthLabel, href }: Props) {
  const initials = name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
  const equivalentTrees = calculateEquivalentTrees(co2Year);
  const equivalentCars = calculateEquivalentCars(co2Year);

  return (
    <Card elevation={0} sx={{
      border: isSelected ? "2px solid" : "1px solid",
      borderColor: isSelected ? "#2563eb" : "divider",
      display: "flex", flexDirection: "column", height: "100%", overflow: "hidden",
      transition: "all 200ms",
      boxShadow: isSelected ? "0 0 0 3px rgba(37,99,235,0.12)" : "none",
      "&:hover": { boxShadow: isSelected ? "0 0 0 3px rgba(37,99,235,0.18)" : "0 4px 16px rgba(13,28,46,0.10)" },
    }}>

      {/* Header */}
      <Box sx={{ px: 3, pt: 3, pb: 2.5, display: "flex", flexDirection: "column", alignItems: "center", gap: 1.5 }}>
        <Box sx={{
          width: 80, height: 80, borderRadius: 2.5,
          backgroundColor: "#eff4ff",
          border: "1px solid", borderColor: "divider",
          display: "flex", alignItems: "center", justifyContent: "center",
          overflow: "hidden",
        }}>
          {logoUrl
            ? <Image src={logoUrl} alt={`Logo ${name}`} width={64} height={64} style={{ objectFit: "contain", maxWidth: 64, maxHeight: 64 }} />
            : <Typography fontWeight={700} fontSize="1.25rem" color="primary.dark">{initials}</Typography>
          }
        </Box>

        <Box sx={{ textAlign: "center" }}>
          <Typography fontSize="0.9375rem" fontWeight={700} color="text.primary" sx={{ lineHeight: 1.3 }}>{name}</Typography>
          {description && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.25, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
              {description}
            </Typography>
          )}
        </Box>
      </Box>

      <Divider />

      {/* Stats */}
      <Box sx={{ px: 3, py: 2 }}>
        <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)" }}>
          {[
            { label: "Clientes", value: customerCount },
            { label: "Plantas", value: activePlants },
            { label: "Capacidad", value: `${Math.round(totalCapacityKw).toLocaleString("es-CL")} kW` },
          ].map((stat, i) => (
            <Box key={i} sx={{ textAlign: "center", borderRight: i < 2 ? "1px solid" : "none", borderColor: "divider" }}>
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.25 }}>{stat.label}</Typography>
              <Typography fontSize="1.125rem" fontWeight={700} color="text.primary" sx={{ lineHeight: 1 }}>{stat.value}</Typography>
            </Box>
          ))}
        </Box>
      </Box>

      <Divider />

      {/* CO2 — Last month + Year */}
      <Box sx={{ px: 3, py: 2 }}>
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", textTransform: "uppercase", letterSpacing: "0.06em", mb: 1.25 }}>
          CO₂ evitado
        </Typography>
        <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.5 }}>
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.25 }}>{lastMonthLabel}</Typography>
            <Typography fontSize="1rem" fontWeight={700} sx={{ color: "#16a34a" }}>{co2LastMonth.toFixed(1)} <Typography component="span" fontSize="0.75rem" color="text.secondary">ton</Typography></Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.25 }}>Acumulado año</Typography>
            <Typography fontSize="1rem" fontWeight={700} sx={{ color: "#16a34a" }}>{co2Year.toFixed(1)} <Typography component="span" fontSize="0.75rem" color="text.secondary">ton</Typography></Typography>
          </Box>
        </Box>
      </Box>

      <Divider />

      {/* Impacto ambiental — based on year total */}
      <Box sx={{ px: 3, py: 2, flex: 1 }}>
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", textTransform: "uppercase", letterSpacing: "0.06em", mb: 1.25 }}>
          Impacto medioambiental (año)
        </Typography>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          {[
            { icon: <ParkOutlinedIcon sx={{ fontSize: 14, color: "#16a34a" }} />, value: equivalentTrees.toLocaleString("es-CL"), label: "árboles equivalentes" },
            { icon: <DirectionsCarOutlinedIcon sx={{ fontSize: 14, color: "#6b7280" }} />, value: equivalentCars.toFixed(1), label: "autos retirados" },
          ].map((item) => (
            <Box key={item.label} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              {item.icon}
              <Typography fontSize="0.8125rem" fontWeight={600}>{item.value}</Typography>
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
