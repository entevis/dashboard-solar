"use client";

import Link from "next/link";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import BoltOutlinedIcon from "@mui/icons-material/BoltOutlined";
import PlaceOutlinedIcon from "@mui/icons-material/PlaceOutlined";
import BusinessOutlinedIcon from "@mui/icons-material/BusinessOutlined";
import CalendarTodayOutlinedIcon from "@mui/icons-material/CalendarTodayOutlined";
import SolarPowerOutlinedIcon from "@mui/icons-material/SolarPowerOutlined";
import ArrowForwardOutlinedIcon from "@mui/icons-material/ArrowForwardOutlined";
import ArticleOutlinedIcon from "@mui/icons-material/ArticleOutlined";

interface Plant {
  id: number;
  name: string;
  location: string | null;
  city: string | null;
  capacityKw: number;
  status: string;
  contractType: string;
  portfolioId: number;
  distributorCompany: string | null;
  startDate: Date | null;
  customer: { name: string };
}

interface PlantCardsProps {
  plants: Plant[];
}

export function PlantCards({ plants }: PlantCardsProps) {
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "1fr 1fr 1fr" },
        gap: 2.5,
      }}
    >
      {plants.map((plant) => (
        <PlantCard key={plant.id} plant={plant} />
      ))}
    </Box>
  );
}

function PlantCard({ plant }: { plant: Plant }) {
  const isActive = plant.status === "active";
  const location = plant.city ?? plant.location;

  return (
    <Box
      component={Link}
      href={`/${plant.portfolioId}/power-plants/${plant.id}`}
      sx={{
        display: "flex",
        flexDirection: "column",
        backgroundColor: "#fff",
        borderRadius: "12px",
        p: "20px",
        boxShadow: "0 2px 8px rgba(13,28,46,0.06), 0 0 1px rgba(13,28,46,0.04)",
        textDecoration: "none",
        color: "inherit",
        transition: "transform 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease",
        // CTA: hidden by default, revealed on hover
        "& .plant-cta": {
          opacity: 0,
          transform: "translateY(4px)",
          transition: "opacity 0.2s ease, transform 0.2s ease",
        },
        "&:hover": {
          transform: "scale(1.025) translateY(-2px)",
          backgroundColor: "rgba(22, 163, 74, 0.05)",
          boxShadow: "0 12px 28px rgba(22,163,74,0.14), 0 2px 6px rgba(22,163,74,0.08)",
        },
        "&:hover .plant-cta": {
          opacity: 1,
          transform: "translateY(0)",
        },
      }}
    >
      {/* Header: ícono + estado */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
        <Box
          sx={{
            width: 44,
            height: 44,
            borderRadius: "10px",
            backgroundColor: "#eff4ff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <SolarPowerOutlinedIcon sx={{ color: "#004ac6", fontSize: 24 }} />
        </Box>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 0.75,
            px: 1,
            py: 0.375,
            borderRadius: "9999px",
            backgroundColor: isActive ? "#dcfce7" : "#fee2e2",
          }}
        >
          <Box
            sx={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              backgroundColor: isActive ? "#16a34a" : "#dc2626",
              flexShrink: 0,
            }}
          />
          <Typography
            fontSize="0.6875rem"
            fontWeight={600}
            sx={{ color: isActive ? "#16a34a" : "#dc2626", lineHeight: 1 }}
          >
            {isActive ? "Activo" : "No vigente"}
          </Typography>
        </Box>
      </Box>

      {/* Nombre y cliente */}
      <Typography
        fontWeight={700}
        fontSize="0.9375rem"
        color="text.primary"
        sx={{
          mb: 0.375,
          lineHeight: 1.3,
          overflow: "hidden",
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
        }}
      >
        {plant.name}
      </Typography>
      <Typography
        fontSize="0.8125rem"
        color="text.secondary"
        sx={{ mb: 2.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
      >
        {plant.customer.name}
      </Typography>

      {/* Datos */}
      <Box sx={{ display: "flex", flexDirection: "column", gap: 0.875, mt: "auto" }}>
        <DataRow
          icon={<BoltOutlinedIcon sx={{ fontSize: 14, color: "#004ac6", flexShrink: 0 }} />}
          label={`${plant.capacityKw} kWp`}
        />
        {location && (
          <DataRow
            icon={<PlaceOutlinedIcon sx={{ fontSize: 14, color: "text.disabled", flexShrink: 0 }} />}
            label={location}
          />
        )}
        {plant.distributorCompany && (
          <DataRow
            icon={<BusinessOutlinedIcon sx={{ fontSize: 14, color: "text.disabled", flexShrink: 0 }} />}
            label={plant.distributorCompany}
          />
        )}
        {plant.startDate && (
          <DataRow
            icon={<CalendarTodayOutlinedIcon sx={{ fontSize: 14, color: "text.disabled", flexShrink: 0 }} />}
            label={new Intl.DateTimeFormat("es-CL").format(new Date(plant.startDate))}
          />
        )}
        <DataRow
          icon={<ArticleOutlinedIcon sx={{ fontSize: 14, color: "text.disabled", flexShrink: 0 }} />}
          label={plant.contractType}
        />
      </Box>

      {/* CTA — visible solo en hover */}
      <Box
        className="plant-cta"
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 0.625,
          mt: 2,
          pt: 1.5,
          borderTop: "1px solid rgba(22,163,74,0.18)",
        }}
      >
        <Typography
          fontSize="0.75rem"
          fontWeight={600}
          sx={{ color: "#15803d" }}
        >
          Ver más información
        </Typography>
        <ArrowForwardOutlinedIcon sx={{ fontSize: 13, color: "#15803d" }} />
      </Box>
    </Box>
  );
}

function DataRow({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
      {icon}
      <Typography
        fontSize="0.8125rem"
        color="text.secondary"
        sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
      >
        {label}
      </Typography>
    </Box>
  );
}
