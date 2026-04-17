"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";

const inputSx = {
  "& .MuiOutlinedInput-root": {
    backgroundColor: "#eff4ff",
    "& fieldset": { borderColor: "transparent" },
    "&:hover fieldset": { borderColor: "transparent" },
    "&.Mui-focused fieldset": { borderColor: "#004ac6", borderWidth: 2 },
  },
};

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

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
    <Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#f5f7ff", px: 2 }}>
      <Box sx={{ width: "100%", maxWidth: 420 }}>
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", mb: 4 }}>
          <Box sx={{ mb: 2, borderRadius: 2, overflow: "hidden", width: 64, height: 64 }}>
            <Image src="/logo.jpg" alt="S-Invest" width={64} height={64} priority />
          </Box>
          <Typography fontSize="1.125rem" fontWeight={700} color="text.primary">
            Recuperar contraseña
          </Typography>
        </Box>

        <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 3, p: 3, boxShadow: "0 4px 12px rgba(13,28,46,0.08)" }}>
          {sent ? (
            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, py: 1 }}>
              <CheckCircleOutlineIcon sx={{ fontSize: 40, color: "#16a34a" }} />
              <Typography fontSize="0.875rem" fontWeight={600} textAlign="center">
                Correo enviado
              </Typography>
              <Typography fontSize="0.8125rem" color="text.secondary" textAlign="center" sx={{ lineHeight: 1.6 }}>
                Si existe una cuenta asociada a <strong>{email}</strong>, recibirás un correo con instrucciones para restablecer tu contraseña.
              </Typography>
              <Alert severity="info" sx={{ fontSize: "0.75rem", width: "100%", mt: 1 }}>
                Si no lo encuentras, revisa tu carpeta de spam o correo no deseado.
              </Alert>
              <Button component={Link} href="/login" variant="contained" fullWidth sx={{ mt: 1, height: 40 }}>
                Volver a iniciar sesión
              </Button>
            </Box>
          ) : (
            <Box component="form" onSubmit={handleSubmit} sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <Typography fontSize="0.8125rem" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña.
              </Typography>
              <TextField
                label="Correo electrónico"
                type="email"
                size="small"
                required
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                sx={inputSx}
              />
              <Button type="submit" variant="contained" fullWidth disabled={loading} sx={{ height: 40 }}>
                {loading ? "Enviando..." : "Enviar enlace de recuperación"}
              </Button>
              <Button component={Link} href="/login" variant="text" fullWidth sx={{ fontSize: "0.8125rem" }}>
                Volver a iniciar sesión
              </Button>
            </Box>
          )}
        </Card>
      </Box>
    </Box>
  );
}
