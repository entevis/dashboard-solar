"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import VisibilityOffOutlinedIcon from "@mui/icons-material/VisibilityOffOutlined";
import Image from "next/image";
import Link from "next/link";

const LOGIN_BACKGROUNDS = [
  "/login-bg/login-bg-1.png",
  "/login-bg/login-bg-2.png",
  "/login-bg/login-bg-3.jpg",
  "/login-bg/login-bg-4.jpg",
  "/login-bg/login-bg-5.jpg",
  "/login-bg/login-bg-6.jpg",
  "/login-bg/login-bg-7.png",
  "/login-bg/login-bg-8.jpg",
  "/login-bg/login-bg-9.png",
  "/login-bg/login-bg-10.png",
  "/login-bg/login-bg-11.jpg",
];

const inputSx = {
  "& .MuiOutlinedInput-root": {
    backgroundColor: "#eff4ff",
    "& fieldset": { borderColor: "transparent" },
    "&:hover fieldset": { borderColor: "transparent" },
    "&.Mui-focused fieldset": { borderColor: "#004ac6", borderWidth: 2 },
    "& input": { padding: "16.5px 14px" },
  },
};

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const bgImage = useMemo(
    () => LOGIN_BACKGROUNDS[Math.floor(Math.random() * LOGIN_BACKGROUNDS.length)],
    [],
  );

  useEffect(() => {
    const url = new URL(window.location.href);
    const qError = url.searchParams.get("error");
    if (qError === "session") {
      setError("Tu sesión ha expirado o el enlace ya no es válido. Solicita uno nuevo.");
      window.history.replaceState(null, "", "/login");
      return;
    }

    if (window.location.hash) {
      const hash = new URLSearchParams(window.location.hash.substring(1));
      const errorCode = hash.get("error_code");
      if (errorCode === "otp_expired") {
        setError("El enlace ha expirado o ya fue utilizado. Solicita uno nuevo desde \"¿Olvidaste tu contraseña?\".");
      } else if (hash.get("error")) {
        setError("El enlace no es válido. Solicita uno nuevo desde \"¿Olvidaste tu contraseña?\".");
      }
      if (hash.get("error")) {
        window.history.replaceState(null, "", "/login");
      }
    }
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { createClient } = await import("@/lib/supabase/client");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError("Credenciales inválidas. Intenta nuevamente.");
      setLoading(false);
      return;
    }

    fetch("/api/auth/track-login", { method: "POST" }).catch(() => {});
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      {/* Left — Background image */}
      <Box
        sx={{
          flex: 1,
          position: "relative",
          display: { xs: "none", md: "block" },
          minWidth: 0,
        }}
      >
        <Image
          src={bgImage}
          alt="Proyecto solar"
          fill
          priority
          style={{ objectFit: "cover" }}
        />
      </Box>

      {/* Right — Login form */}
      <Box
        sx={{
          flex: { xs: "1 1 100%", md: "0 0 480px" },
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#fff",
          px: { xs: 3, md: 6 },
          py: 4,
          width: { xs: "100%", md: 480 },
        }}
      >
        {/* Branding */}
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", mb: 5 }}>
          <Box sx={{ mb: 2.5, borderRadius: 3, overflow: "hidden", width: 88, height: 88, boxShadow: "0 4px 16px rgba(13,28,46,0.10)" }}>
            <Image src="/logo.jpg" alt="S-Invest" width={88} height={88} priority />
          </Box>
          <Typography fontSize="1.5rem" fontWeight={700} color="text.primary">
            Plataforma S-Invest
          </Typography>
          <Typography fontSize="0.9375rem" color="text.secondary" sx={{ mt: 0.5 }}>
            Bienvenido, ingresa tus credenciales
          </Typography>
        </Box>

        {/* Form */}
        <Box sx={{ width: "100%", maxWidth: 360 }}>
          <Typography fontSize="1.125rem" fontWeight={600} color="text.primary" sx={{ mb: 3 }}>
            Iniciar sesión
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2.5, fontSize: "0.875rem" }}>
              {error}
            </Alert>
          )}

          <Box
            component="form"
            onSubmit={handleSubmit}
            aria-label="Formulario de inicio de sesión"
            noValidate
            sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}
          >
            <TextField
              id="email"
              label="Correo electrónico"
              type="email"
              placeholder="tu@empresa.cl"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              slotProps={{
                inputLabel: { shrink: true },
                htmlInput: { "aria-required": "true", "aria-invalid": !!error },
              }}
              sx={inputSx}
            />

            <TextField
              id="password"
              label="Contraseña"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              slotProps={{
                inputLabel: { shrink: true },
                htmlInput: { "aria-required": "true" },
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        size="small"
                        edge="end"
                        onClick={() => setShowPassword((v) => !v)}
                        onMouseDown={(e) => e.preventDefault()}
                        aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                      >
                        {showPassword ? <VisibilityOffOutlinedIcon sx={{ fontSize: 20 }} /> : <VisibilityOutlinedIcon sx={{ fontSize: 20 }} />}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
              sx={inputSx}
            />

            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={loading}
              aria-busy={loading}
              sx={{ mt: 0.5, height: 46, fontSize: "0.9375rem" }}
            >
              {loading ? "Ingresando..." : "Ingresar"}
            </Button>

            <Typography
              component={Link}
              href="/forgot-password"
              variant="body2"
              sx={{ textAlign: "center", color: "primary.main", textDecoration: "none", mt: 0.5, "&:hover": { textDecoration: "underline" } }}
            >
              ¿Olvidaste tu contraseña?
            </Typography>
          </Box>
        </Box>

        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mt: 4 }}
        >
          Acceso proporcionado por el administrador del sistema
        </Typography>
      </Box>
    </Box>
  );
}
