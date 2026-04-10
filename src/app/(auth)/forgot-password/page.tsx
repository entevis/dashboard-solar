import Link from "next/link";
import Image from "next/image";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";

export default function ForgotPasswordPage() {
  return (
    <Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#f5f7ff", px: 2 }}>
      <Box sx={{ width: "100%", maxWidth: 420 }}>
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", mb: 4 }}>
          <Box sx={{ mb: 2, borderRadius: 2, overflow: "hidden", width: 64, height: 64 }}>
            <Image src="/logo.jpg" alt="Dashboard Solar" width={64} height={64} priority />
          </Box>
          <Typography fontSize="1.125rem" fontWeight={700} color="text.primary">
            Recuperar contraseña
          </Typography>
        </Box>

        <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 3, p: 3, boxShadow: "0 4px 12px rgba(13,28,46,0.08)" }}>
          <Typography fontSize="0.875rem" color="text.primary" sx={{ mb: 1.5, fontWeight: 600 }}>
            ¿Olvidaste tu contraseña?
          </Typography>
          <Typography fontSize="0.8125rem" color="text.secondary" sx={{ mb: 2.5, lineHeight: 1.6 }}>
            Contacta al administrador del sistema para recibir un link de recuperación.
            Por seguridad, el link es de un solo uso y te permitirá definir una nueva contraseña.
          </Typography>

          <Button component={Link} href="/login" variant="contained" fullWidth sx={{ height: 40 }}>
            Volver a iniciar sesión
          </Button>
        </Card>
      </Box>
    </Box>
  );
}
