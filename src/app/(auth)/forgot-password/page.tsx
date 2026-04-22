"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";

const LOGIN_BACKGROUNDS = [
  "/login-bg/login-bg-1.jpg",
  "/login-bg/login-bg-2.jpg",
  "/login-bg/login-bg-3.jpg",
  "/login-bg/login-bg-4.jpg",
  "/login-bg/login-bg-5.jpg",
  "/login-bg/login-bg-6.jpg",
  "/login-bg/login-bg-7.jpg",
  "/login-bg/login-bg-8.jpg",
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

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const bgImage = useMemo(
    () => LOGIN_BACKGROUNDS[Math.floor(Math.random() * LOGIN_BACKGROUNDS.length)],
    [],
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim() }),
    });

    setSent(true);
    setLoading(false);
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

      {/* Right — Forgot password form */}
      <Box
        sx={{
          flex: "0 0 480px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#fff",
          px: 6,
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
            Recupera el acceso a tu cuenta
          </Typography>
        </Box>

        {/* Form */}
        <Box sx={{ width: "100%", maxWidth: 360 }}>
          <Typography fontSize="1.125rem" fontWeight={600} color="text.primary" sx={{ mb: 3 }}>
            Recuperar contraseña
          </Typography>

          {sent ? (
            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
              <CheckCircleOutlineIcon sx={{ fontSize: 44, color: "#16a34a" }} />
              <Typography fontSize="0.9375rem" fontWeight={600} textAlign="center">
                Correo enviado
              </Typography>
              <Typography fontSize="0.875rem" color="text.secondary" textAlign="center" sx={{ lineHeight: 1.6 }}>
                Si existe una cuenta asociada a <strong>{email}</strong>, recibirás un correo con instrucciones para restablecer tu contraseña.
              </Typography>
              <Alert severity="info" sx={{ fontSize: "0.8125rem", width: "100%", mt: 0.5 }}>
                Si no lo encuentras, revisa tu carpeta de spam o correo no deseado.
              </Alert>
              <Button
                component={Link}
                href="/login"
                variant="contained"
                fullWidth
                sx={{ mt: 1, height: 46, fontSize: "0.9375rem" }}
              >
                Volver a iniciar sesión
              </Button>
            </Box>
          ) : (
            <Box
              component="form"
              onSubmit={handleSubmit}
              aria-label="Formulario de recuperación de contraseña"
              noValidate
              sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}
            >
              <Typography fontSize="0.875rem" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña.
              </Typography>

              <TextField
                id="email"
                label="Correo electrónico"
                type="email"
                placeholder="tu@empresa.cl"
                required
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                slotProps={{
                  inputLabel: { shrink: true },
                  htmlInput: { "aria-required": "true" },
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
                {loading ? "Enviando..." : "Enviar enlace de recuperación"}
              </Button>

              <Typography
                component={Link}
                href="/login"
                variant="body2"
                sx={{ textAlign: "center", color: "primary.main", textDecoration: "none", mt: 0.5, "&:hover": { textDecoration: "underline" } }}
              >
                Volver a iniciar sesión
              </Typography>
            </Box>
          )}
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
