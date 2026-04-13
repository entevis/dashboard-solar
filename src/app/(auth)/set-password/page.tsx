"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import Image from "next/image";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import VisibilityOffOutlinedIcon from "@mui/icons-material/VisibilityOffOutlined";

const inputSx = {
  "& .MuiOutlinedInput-root": {
    backgroundColor: "#eff4ff",
    "& fieldset": { borderColor: "transparent" },
    "&:hover fieldset": { borderColor: "transparent" },
    "&.Mui-focused fieldset": { borderColor: "#004ac6", borderWidth: 2 },
  },
};

const MIN_LENGTH = 10;

function validatePassword(pw: string): string | null {
  if (pw.length < MIN_LENGTH) return `Debe tener al menos ${MIN_LENGTH} caracteres.`;
  if (!/[a-z]/.test(pw)) return "Debe incluir al menos una letra minúscula.";
  if (!/[A-Z]/.test(pw)) return "Debe incluir al menos una letra mayúscula.";
  if (!/[0-9]/.test(pw)) return "Debe incluir al menos un número.";
  return null;
}

export default function SetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        router.replace("/login?error=session");
        return;
      }
      setUserEmail(data.user.email ?? null);
      setChecking(false);
    });
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const validation = validatePassword(password);
    if (validation) {
      setError(validation);
      return;
    }
    if (password !== confirm) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      setError("No se pudo actualizar la contraseña. El link puede haber expirado.");
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  if (checking) {
    return (
      <Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#f5f7ff" }}>
        <Typography variant="body2" color="text.secondary">Verificando sesión...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#f5f7ff", px: 2 }}>
      <Box sx={{ width: "100%", maxWidth: 420 }}>
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", mb: 4 }}>
          <Box sx={{ mb: 2, borderRadius: 2, overflow: "hidden", width: 64, height: 64 }}>
            <Image src="/logo.jpg" alt="Dashboard Solar" width={64} height={64} priority />
          </Box>
          <Typography fontSize="1.125rem" fontWeight={700} color="text.primary">
            Define tu contraseña
          </Typography>
          {userEmail && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {userEmail}
            </Typography>
          )}
        </Box>

        <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 3, p: 3, boxShadow: "0 4px 12px rgba(13,28,46,0.08)" }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2, fontSize: "0.8125rem" }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <TextField
              label="Nueva contraseña"
              type={show ? "text" : "password"}
              size="small"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              sx={inputSx}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton size="small" edge="end" onClick={() => setShow((v) => !v)} tabIndex={-1} aria-label={show ? "Ocultar contraseña" : "Mostrar contraseña"}>
                      {show ? <VisibilityOffOutlinedIcon sx={{ fontSize: 18 }} /> : <VisibilityOutlinedIcon sx={{ fontSize: 18 }} />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              label="Confirmar contraseña"
              type={show ? "text" : "password"}
              size="small"
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
              sx={inputSx}
            />

            <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.5 }}>
              Mínimo {MIN_LENGTH} caracteres. Debe incluir minúsculas, mayúsculas y al menos un número.
            </Typography>

            <Button type="submit" variant="contained" fullWidth disabled={loading} sx={{ mt: 0.5, height: 40 }}>
              {loading ? "Guardando..." : "Guardar contraseña"}
            </Button>
          </Box>
        </Card>
      </Box>
    </Box>
  );
}
