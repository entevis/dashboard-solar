"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@mui/material/Button";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import CircularProgress from "@mui/material/CircularProgress";
import MoreVertOutlinedIcon from "@mui/icons-material/MoreVertOutlined";
import PlayArrowOutlinedIcon from "@mui/icons-material/PlayArrowOutlined";
import CheckCircleOutlinedIcon from "@mui/icons-material/CheckCircleOutlined";
import { toast } from "@/lib/utils/toast";

interface Props {
  contingencyId: number;
  currentStatus: string;
}

export function ContingencyActions({ contingencyId, currentStatus }: Props) {
  const router = useRouter();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [loading, setLoading] = useState(false);

  async function updateStatus(newStatus: string) {
    setAnchorEl(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/contingencies/${contingencyId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error();
      const labels: Record<string, string> = { IN_PROGRESS: "en progreso", CLOSED: "cerrada" };
      toast.success(`Contingencia marcada como ${labels[newStatus] ?? newStatus}`);
      router.refresh();
    } catch {
      toast.error("Error al actualizar estado");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Button
        variant="outlined"
        size="small"
        disabled={loading}
        onClick={(e) => setAnchorEl(e.currentTarget)}
        endIcon={loading ? <CircularProgress size={12} color="inherit" /> : <MoreVertOutlinedIcon />}
        color="inherit"
        sx={{ borderColor: "#c3c6d7" }}
      >
        Acciones
      </Button>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
        slotProps={{ paper: { sx: { width: 200, mt: 0.5 } } }}
      >
        {currentStatus === "OPEN" && (
          <MenuItem onClick={() => updateStatus("IN_PROGRESS")} sx={{ fontSize: "0.8125rem", gap: 1.5 }}>
            <PlayArrowOutlinedIcon sx={{ fontSize: 16, color: "text.secondary" }} />
            Marcar en progreso
          </MenuItem>
        )}
        {(currentStatus === "OPEN" || currentStatus === "IN_PROGRESS") && (
          <MenuItem onClick={() => updateStatus("CLOSED")} sx={{ fontSize: "0.8125rem", gap: 1.5 }}>
            <CheckCircleOutlinedIcon sx={{ fontSize: 16, color: "text.secondary" }} />
            Cerrar contingencia
          </MenuItem>
        )}
      </Menu>
    </>
  );
}
