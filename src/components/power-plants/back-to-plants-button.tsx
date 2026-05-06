"use client";

import Link from "next/link";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import ArrowBackOutlinedIcon from "@mui/icons-material/ArrowBackOutlined";

export function BackToPlantsButton({ href }: { href: string }) {
  return (
    <Box
      component={Link}
      href={href}
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 0.75,
        px: 1.5,
        py: 0.875,
        borderRadius: "8px",
        backgroundColor: "#dcfce7",
        color: "#15803d",
        textDecoration: "none",
        flexShrink: 0,
        transition: "background-color 0.15s ease",
        "&:hover": { backgroundColor: "#bbf7d0" },
      }}
    >
      <ArrowBackOutlinedIcon sx={{ fontSize: 16 }} />
      <Typography fontSize="0.8125rem" fontWeight={600} sx={{ color: "inherit" }}>
        Plantas
      </Typography>
    </Box>
  );
}
