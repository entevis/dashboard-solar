"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import Box from "@mui/material/Box";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import DashboardOutlinedIcon from "@mui/icons-material/DashboardOutlined";
import BoltOutlinedIcon from "@mui/icons-material/BoltOutlined";
import PeopleAltOutlinedIcon from "@mui/icons-material/PeopleAltOutlined";
import ApartmentOutlinedIcon from "@mui/icons-material/ApartmentOutlined";
import AssessmentOutlinedIcon from "@mui/icons-material/AssessmentOutlined";
import AccountCircleOutlinedIcon from "@mui/icons-material/AccountCircleOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";
import AttachMoneyOutlinedIcon from "@mui/icons-material/AttachMoneyOutlined";
import type { UserRole } from "@prisma/client";

interface SidebarProps {
  userRole: UserRole;
  selectedPortfolioId?: number | null;
}

type NavItem = {
  label: string;
  href: string;
  icon: React.ElementType;
  requiresPortfolio?: boolean;
};
type NavSection = {
  title?: string;
  roles: UserRole[] | "all";
  items: NavItem[];
};

export function Sidebar({ userRole, selectedPortfolioId }: SidebarProps) {
  const pathname = usePathname();

  const urlMatch = pathname.match(/^\/(\d+)(\/|$)/);
  const urlPid = urlMatch?.[1];
  const pid = urlPid ?? (selectedPortfolioId ? String(selectedPortfolioId) : null);
  const p = (path: string) => (pid ? `/${pid}${path}` : path);

  const navSections: NavSection[] = [
    {
      roles: ["MAESTRO"],
      items: [
        { label: "Resumen general",       href: "/dashboard",       icon: DashboardOutlinedIcon },
        { label: "Resumen del portafolio", href: p("/overview"),     icon: AssessmentOutlinedIcon, requiresPortfolio: true },
        { label: "Plantas Fotovoltaicas",  href: p("/power-plants"), icon: BoltOutlinedIcon,       requiresPortfolio: true },
      ],
    },
    {
      roles: ["OPERATIVO", "CLIENTE", "CLIENTE_PERFILADO"],
      items: [
        { label: "Resumen general",      href: "/dashboard",       icon: DashboardOutlinedIcon },
        { label: "Plantas Fotovoltaicas", href: p("/power-plants"), icon: BoltOutlinedIcon, requiresPortfolio: true },
      ],
    },
    {
      roles: ["MAESTRO", "CLIENTE", "CLIENTE_PERFILADO"],
      items: [
        { label: "Facturas y reportes", href: p("/billing"),          icon: ReceiptLongOutlinedIcon, requiresPortfolio: true },
        { label: "Análisis de Ahorro",  href: p("/savings-analysis"), icon: AttachMoneyOutlinedIcon, requiresPortfolio: true },
      ],
    },
    {
      title: "Configuraciones",
      roles: ["MAESTRO"],
      items: [
        { label: "Usuarios",    href: "/admin/users",      icon: PeopleAltOutlinedIcon },
        { label: "Clientes",    href: "/admin/customers",  icon: AccountCircleOutlinedIcon },
        { label: "Portafolios", href: "/admin/portfolios", icon: ApartmentOutlinedIcon },
      ],
    },
  ];

  const visibleSections = navSections.filter(
    (s) => s.roles === "all" || s.roles.includes(userRole)
  );

  return (
    <Box
      component="aside"
      sx={{
        display: { xs: "none", lg: "flex" },
        flexDirection: "column",
        width: 228,
        height: "100vh",
        position: "fixed",
        left: 0,
        top: 0,
        zIndex: 30,
        backgroundColor: "#ffffff",
        boxShadow: "1px 0 0 0 #c3c6d7",
      }}
    >
      {/* Logo */}
      <Box
        component={Link}
        href={userRole === "MAESTRO" ? "/dashboard" : p("/overview")}
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          px: 2.5,
          height: 56,
          textDecoration: "none",
          color: "inherit",
          transition: "opacity 0.15s",
          "&:hover": { opacity: 0.75 },
        }}
      >
        <Box sx={{ width: 30, height: 30, borderRadius: 1.5, overflow: "hidden", flexShrink: 0 }}>
          <Image src="/logo.jpg" alt="S-Invest" width={30} height={30} style={{ objectFit: "contain" }} />
        </Box>
        <Typography
          sx={{
            fontFamily: '"Archivo Narrow", sans-serif',
            fontWeight: 700,
            fontSize: "0.9375rem",
            color: "#0d1c2e",
          }}
        >
          S-Invest
        </Typography>
      </Box>

      {/* Tagline */}
      <Box sx={{ px: 2.5, pt: 0.5, pb: 2 }}>
        <Typography
          sx={{
            fontFamily: '"Archivo Narrow", sans-serif',
            fontSize: "0.6875rem",
            fontWeight: 400,
            fontStyle: "italic",
            color: "#7a8aaa",
            lineHeight: 1.55,
          }}
        >
          Un portafolio de proyectos fotovoltaicos bajo modalidad ESCO, gestionado para maximizar la generación de energía y los ahorros de nuestros clientes.
        </Typography>
      </Box>

      <Divider sx={{ mx: 2.5, borderStyle: "dashed", borderColor: "#c3cfe8" }} />

      {/* Nav */}
      <Box
        component="nav"
        aria-label="Navegación principal"
        sx={{ flex: 1, overflowY: "auto", pt: 2, pb: 1, px: 1 }}
      >
        {visibleSections.map((section, i) => (
          <Box key={i}>
            {section.title && (
              <>
                <Divider sx={{ mx: 1, my: 1, borderColor: "#e6eeff" }} />
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, px: 1.5, mb: 0.5, mt: 0.5 }}>
                  <SettingsOutlinedIcon sx={{ fontSize: 11, color: "#434655" }} />
                  <Typography
                    sx={{
                      fontSize: "0.625rem",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.09em",
                      color: "#434655",
                    }}
                  >
                    {section.title}
                  </Typography>
                </Box>
              </>
            )}
            <List disablePadding>
              {section.items.map((item) => {
                const disabled = !!item.requiresPortfolio && !pid;
                const isActive = !disabled &&
                  (pathname === item.href || pathname.startsWith(item.href + "/"));
                return (
                  <ListItemButton
                    key={item.href}
                    component={disabled ? "div" : Link}
                    {...(!disabled && { href: item.href })}
                    aria-current={isActive ? "page" : undefined}
                    selected={isActive}
                    disabled={disabled}
                    sx={{
                      borderRadius: 2,
                      mb: 0.25,
                      py: 0.875,
                      px: 1.25,
                      minHeight: 36,
                      ...(disabled && { opacity: 0.35, cursor: "default", pointerEvents: "none" }),
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 32 }}>
                      <item.icon
                        sx={{
                          fontSize: 18,
                          color: isActive ? "#004ac6" : "#434655",
                        }}
                      />
                    </ListItemIcon>
                    <ListItemText
                      primary={item.label}
                      slotProps={{
                        primary: {
                          sx: {
                            fontSize: "0.8125rem",
                            fontWeight: isActive ? 600 : 500,
                            color: isActive ? "#0d1c2e" : "#434655",
                            fontFamily: '"Archivo Narrow", sans-serif',
                          },
                        },
                      }}
                    />
                  </ListItemButton>
                );
              })}
            </List>
          </Box>
        ))}
      </Box>
    </Box>
  );
}
