"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Divider from "@mui/material/Divider";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import MoreHorizOutlinedIcon from "@mui/icons-material/MoreHorizOutlined";
import OpenInNewOutlinedIcon from "@mui/icons-material/OpenInNewOutlined";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import { toast } from "@/lib/utils/toast";

interface Props {
  contingencyId: number;
  description: string;
  canWrite: boolean;
  canDelete: boolean;
}

export function ContingencyRowActions({ contingencyId, description, canWrite, canDelete }: Props) {
  const router = useRouter();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/contingencies/${contingencyId}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Contingencia eliminada");
      router.refresh();
    } catch {
      toast.error("Error al eliminar la contingencia");
    } finally {
      setDeleting(false);
      setDeleteOpen(false);
    }
  }

  return (
    <>
      <IconButton size="small" aria-label="Acciones" onClick={(e) => setAnchorEl(e.currentTarget)} sx={{ width: 28, height: 28, color: "text.secondary" }}>
        <MoreHorizOutlinedIcon sx={{ fontSize: 16 }} />
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
        slotProps={{ paper: { sx: { width: 160, mt: 0.5 } } }}
      >
        <MenuItem component="a" href={`/contingencies/${contingencyId}`} onClick={() => setAnchorEl(null)} sx={{ fontSize: "0.8125rem", gap: 1.5 }}>
          <OpenInNewOutlinedIcon sx={{ fontSize: 15, color: "text.secondary" }} />
          Ver detalle
        </MenuItem>
        {canDelete && <Divider />}
        {canDelete && (
          <MenuItem onClick={() => { setAnchorEl(null); setDeleteOpen(true); }} sx={{ fontSize: "0.8125rem", gap: 1.5, color: "error.main" }}>
            <DeleteOutlinedIcon sx={{ fontSize: 15 }} />
            Eliminar
          </MenuItem>
        )}
      </Menu>

      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ pb: 1 }}>
          <Typography fontWeight={700} fontSize="0.9375rem">Eliminar contingencia</Typography>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            ¿Eliminar esta contingencia? Esta acción no se puede deshacer.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button variant="contained" size="small" color="error" onClick={handleDelete} disabled={deleting}>
            {deleting ? "Eliminando..." : "Eliminar"}
          </Button>
          <Button variant="outlined" size="small" color="inherit" onClick={() => setDeleteOpen(false)} disabled={deleting} sx={{ borderColor: "#c3c6d7" }}>
            Cancelar
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
