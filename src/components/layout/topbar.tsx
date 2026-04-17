"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import Avatar from "@mui/material/Avatar";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Divider from "@mui/material/Divider";
import Chip from "@mui/material/Chip";
import { useState } from "react";
import { MobileNav } from "./mobile-nav";
import { PortfolioSelector } from "./portfolio-selector";
import { ROLE_LABELS } from "@/lib/auth/roles";
import type { UserRole } from "@prisma/client";
import LogoutOutlinedIcon from "@mui/icons-material/LogoutOutlined";
import LockResetOutlinedIcon from "@mui/icons-material/LockResetOutlined";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import { ChangePasswordDialog } from "./change-password-dialog";

interface TopbarProps {
  userName: string;
  userEmail: string;
  userRole: UserRole;
  portfolios?: { id: number; name: string }[];
  selectedPortfolioId?: number | null;
}

export function Topbar({ userName, userEmail, userRole, portfolios = [], selectedPortfolioId }: TopbarProps) {
  const router = useRouter();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    document.cookie = "portfolio_id=; path=/; max-age=0";
    router.push("/login");
    router.refresh();
  }

  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        backgroundColor: "rgba(255,255,255,0.85)",
        backdropFilter: "blur(20px)",
        boxShadow: "0 1px 0 0 #c3c6d7",
        zIndex: 20,
      }}
    >
      <Toolbar
        variant="dense"
        sx={{ minHeight: 52, px: { xs: 2, lg: 3 }, gap: 1.5 }}
      >
        {/* Mobile menu trigger */}
        <MobileNav userRole={userRole} selectedPortfolioId={selectedPortfolioId} />

        {/* Spacer */}
        <Box sx={{ flex: 1 }} />

        {/* Portfolio selector (MAESTRO only) */}
        {userRole === "MAESTRO" && portfolios.length > 0 && (
          <PortfolioSelector
            portfolios={portfolios}
            selectedPortfolioId={selectedPortfolioId}
          />
        )}

        {/* Role badge */}
        <Chip
          label={ROLE_LABELS[userRole]}
          size="small"
          sx={{
            display: { xs: "none", sm: "flex" },
            fontSize: "0.6875rem",
            fontWeight: 700,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            backgroundColor: "#e6eeff",
            color: "#434655",
            height: 22,
          }}
        />

        {/* User menu */}
        <Box
          component="button"
          onClick={(e) => setAnchorEl(e.currentTarget)}
          aria-label={`Menú de usuario: ${userName}`}
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            background: "none",
            border: "none",
            cursor: "pointer",
            borderRadius: 2,
            px: 1,
            py: 0.5,
            "&:hover": { backgroundColor: "#eff4ff" },
            "&:focus-visible": { outline: "2px solid #004ac6", outlineOffset: 2 },
            transition: "background-color 150ms",
          }}
        >
          <Avatar
            sx={{
              width: 28,
              height: 28,
              fontSize: "0.6875rem",
              fontWeight: 700,
              backgroundColor: "#dbe1ff",
              color: "#004ac6",
            }}
          >
            {initials}
          </Avatar>
          <Typography
            sx={{
              display: { xs: "none", sm: "block" },
              fontSize: "0.8125rem",
              fontWeight: 500,
              color: "#0d1c2e",
              fontFamily: '"Plus Jakarta Sans", sans-serif',
            }}
          >
            {userName}
          </Typography>
          <KeyboardArrowDownIcon sx={{ fontSize: 16, color: "#434655" }} />
        </Box>

        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={() => setAnchorEl(null)}
          transformOrigin={{ horizontal: "right", vertical: "top" }}
          anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
          slotProps={{
            paper: {
              sx: { width: 200, mt: 0.5 },
            },
          }}
        >
          <Box sx={{ px: 2, py: 1.25 }}>
            <Typography sx={{ fontSize: "0.8125rem", fontWeight: 600, color: "#0d1c2e" }}>
              {userName}
            </Typography>
            <Typography sx={{ fontSize: "0.75rem", color: "#434655" }}>
              {userEmail}
            </Typography>
          </Box>
          <Divider />
          <MenuItem
            onClick={() => { setAnchorEl(null); setChangePasswordOpen(true); }}
            sx={{ fontSize: "0.8125rem", gap: 1.5, color: "#0d1c2e", mt: 0.5 }}
          >
            <LockResetOutlinedIcon sx={{ fontSize: 16, color: "#434655" }} />
            Cambiar contraseña
          </MenuItem>
          <MenuItem
            onClick={() => { setAnchorEl(null); handleLogout(); }}
            sx={{ fontSize: "0.8125rem", gap: 1.5, color: "#0d1c2e" }}
          >
            <LogoutOutlinedIcon sx={{ fontSize: 16, color: "#434655" }} />
            Cerrar sesión
          </MenuItem>
        </Menu>

        <ChangePasswordDialog open={changePasswordOpen} onClose={() => setChangePasswordOpen(false)} />
      </Toolbar>
    </AppBar>
  );
}
