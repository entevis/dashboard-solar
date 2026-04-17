"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Image from "next/image";

function ActivateContent() {
  const searchParams = useSearchParams();
  const encodedLink = searchParams.get("link");
  const type = searchParams.get("type") ?? "invite";

  const link = encodedLink ? Buffer.from(encodedLink, "base64").toString("utf-8") : null;

  const isRecovery = type === "recovery";
  const title = isRecovery ? "Restablecer contraseña" : "Activar tu cuenta";
  const description = isRecovery
    ? "Haz clic en el botón de abajo para restablecer tu contraseña."
    : "Haz clic en el botón de abajo para activar tu cuenta y definir tu contraseña.";
  const buttonLabel = isRecovery ? "Restablecer contraseña" : "Activar mi cuenta";

  if (!link) {
    return (
      <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 3, p: 3, boxShadow: "0 4px 12px rgba(13,28,46,0.08)", textAlign: "center" }}>
        <Typography fontSize="0.875rem" color="text.secondary">
          El enlace no es válido o ha expirado.
        </Typography>
        <Button href="/login" variant="contained" fullWidth sx={{ mt: 2, height: 40 }}>
          Ir al inicio de sesión
        </Button>
      </Card>
    );
  }

  return (
    <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 3, p: 3, boxShadow: "0 4px 12px rgba(13,28,46,0.08)" }}>
      <Typography fontSize="0.9375rem" fontWeight={600} color="text.primary" sx={{ mb: 1.5 }}>
        {title}
      </Typography>
      <Typography fontSize="0.8125rem" color="text.secondary" sx={{ mb: 3, lineHeight: 1.6 }}>
        {description}
      </Typography>
      <Button href={link} variant="contained" fullWidth sx={{ height: 44, fontSize: "0.875rem" }}>
        {buttonLabel}
      </Button>
      <Typography variant="caption" color="text.secondary" sx={{ display: "block", textAlign: "center", mt: 2, lineHeight: 1.5 }}>
        Este enlace es de un solo uso y expira en 1 hora.
      </Typography>
    </Card>
  );
}

export default function ActivatePage() {
  return (
    <Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#f5f7ff", px: 2 }}>
      <Box sx={{ width: "100%", maxWidth: 420 }}>
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", mb: 4 }}>
          <Box sx={{ mb: 2, borderRadius: 2, overflow: "hidden", width: 64, height: 64 }}>
            <Image src="/logo.jpg" alt="S-Invest" width={64} height={64} priority />
          </Box>
          <Typography fontSize="1.125rem" fontWeight={700} color="text.primary">
            S-Invest
          </Typography>
        </Box>
        <Suspense fallback={<Typography textAlign="center" color="text.secondary">Cargando...</Typography>}>
          <ActivateContent />
        </Suspense>
      </Box>
    </Box>
  );
}
