"use client";

import { useState } from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import VisibilityOffOutlinedIcon from "@mui/icons-material/VisibilityOffOutlined";
import { toast } from "@/lib/utils/toast";

const inputSx = {
  "& .MuiOutlinedInput-root": {
    backgroundColor: "#eff4ff",
    "& fieldset": { borderColor: "transparent" },
    "&:hover fieldset": { borderColor: "transparent" },
    "&.Mui-focused fieldset": { borderColor: "#004ac6", borderWidth: 2 },
  },
};

const MIN_LENGTH = 8;

function validatePassword(pw: string): string | null {
  if (pw.length < MIN_LENGTH) return `Debe tener al menos ${MIN_LENGTH} caracteres.`;
  if (!/[a-z]/.test(pw)) return "Debe incluir al menos una letra minúscula.";
  if (!/[A-Z]/.test(pw)) return "Debe incluir al menos una letra mayúscula.";
  if (!/[0-9]/.test(pw)) return "Debe incluir al menos un número.";
  return null;
}

interface Props {
  open: boolean;
  onClose: () => void;
}

export function ChangePasswordDialog({ open, onClose }: Props) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleClose() {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setError("");
    setShowCurrent(false);
    setShowNew(false);
    onClose();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const validation = validatePassword(newPassword);
    if (validation) { setError(validation); return; }

    if (newPassword !== confirmPassword) {
      setError("Las contraseñas nuevas no coinciden.");
      return;
    }

    if (currentPassword === newPassword) {
      setError("La nueva contraseña debe ser diferente a la actual.");
      return;
    }

    setLoading(true);
    const res = await fetch("/api/auth/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Error al cambiar la contraseña");
      setLoading(false);
      return;
    }

    toast.success("Contraseña actualizada correctamente");
    setLoading(false);
    handleClose();
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontSize: "0.9375rem", fontWeight: 700, pb: 1 }}>Cambiar contraseña</DialogTitle>
      <Box component="form" onSubmit={handleSubmit}>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
          {error && <Alert severity="error" sx={{ fontSize: "0.8125rem" }}>{error}</Alert>}

          <TextField
            label="Contraseña actual"
            type={showCurrent ? "text" : "password"}
            size="small"
            required
            autoFocus
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            autoComplete="current-password"
            sx={inputSx}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton size="small" edge="end" onClick={() => setShowCurrent((v) => !v)} tabIndex={-1}>
                    {showCurrent ? <VisibilityOffOutlinedIcon sx={{ fontSize: 18 }} /> : <VisibilityOutlinedIcon sx={{ fontSize: 18 }} />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <TextField
            label="Nueva contraseña"
            type={showNew ? "text" : "password"}
            size="small"
            required
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            autoComplete="new-password"
            sx={inputSx}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton size="small" edge="end" onClick={() => setShowNew((v) => !v)} tabIndex={-1}>
                    {showNew ? <VisibilityOffOutlinedIcon sx={{ fontSize: 18 }} /> : <VisibilityOutlinedIcon sx={{ fontSize: 18 }} />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <TextField
            label="Confirmar nueva contraseña"
            type={showNew ? "text" : "password"}
            size="small"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
            sx={inputSx}
          />

          <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.5 }}>
            Mínimo {MIN_LENGTH} caracteres. Debe incluir minúsculas, mayúsculas y al menos un número.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button variant="outlined" color="inherit" size="small" onClick={handleClose} sx={{ borderColor: "#c3c6d7" }}>
            Cancelar
          </Button>
          <Button type="submit" variant="contained" size="small" disabled={loading}>
            {loading ? "Guardando..." : "Cambiar contraseña"}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}
