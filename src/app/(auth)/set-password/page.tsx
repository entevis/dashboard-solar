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
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";

const inputSx = {
  "& .MuiOutlinedInput-root": {
    backgroundColor: "#eff4ff",
    "& fieldset": { borderColor: "transparent" },
    "&:hover fieldset": { borderColor: "transparent" },
    "&.Mui-focused fieldset": { borderColor: "#004ac6", borderWidth: 2 },
  },
};

const rules = [
  { key: "length", label: "Mínimo 8 caracteres", test: (pw: string) => pw.length >= 8 },
  { key: "lower", label: "Al menos una letra minúscula", test: (pw: string) => /[a-z]/.test(pw) },
  { key: "upper", label: "Al menos una letra mayúscula", test: (pw: string) => /[A-Z]/.test(pw) },
  { key: "number", label: "Al menos un número", test: (pw: string) => /[0-9]/.test(pw) },
];

function PasswordChecklist({ password }: { password: string }) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
      {rules.map((rule) => {
        const passed = password.length > 0 && rule.test(password);
        return (
          <Box key={rule.key} sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
            {passed
              ? <CheckCircleIcon sx={{ fontSize: 16, color: "#16a34a" }} />
              : <RadioButtonUncheckedIcon sx={{ fontSize: 16, color: "#c3c6d7" }} />
            }
            <Typography
              sx={{
                fontSize: "0.75rem",
                color: passed ? "#16a34a" : "#737686",
                fontWeight: passed ? 500 : 400,
                transition: "color 0.15s",
              }}
            >
              {rule.label}
            </Typography>
          </Box>
        );
      })}
    </Box>
  );
}

function isPasswordValid(pw: string): boolean {
  return rules.every((r) => r.test(pw));
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

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setUserEmail(session.user.email ?? null);
        setChecking(false);
      }
    });

    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setUserEmail(data.user.email ?? null);
        setChecking(false);
      }
    });

    const timeout = setTimeout(() => {
      setChecking((current) => {
        if (current) router.replace("/login?error=session");
        return current;
      });
    }, 5000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, [router]);

  const valid = isPasswordValid(password);
  const matching = password === confirm;
  const canSubmit = valid && matching && confirm.length > 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!valid) { setError("La contraseña no cumple con los requisitos."); return; }
    if (!matching) { setError("Las contraseñas no coinciden."); return; }

    setLoading(true);
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      setError("No se pudo actualizar la contraseña. El enlace puede haber expirado.");
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
            <Image src="/logo.jpg" alt="S-Invest" width={64} height={64} priority />
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

            <PasswordChecklist password={password} />

            <TextField
              label="Confirmar contraseña"
              type={show ? "text" : "password"}
              size="small"
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
              sx={inputSx}
              error={confirm.length > 0 && !matching}
              helperText={confirm.length > 0 && !matching ? "Las contraseñas no coinciden" : ""}
            />

            <Button type="submit" variant="contained" fullWidth disabled={loading || !canSubmit} sx={{ mt: 0.5, height: 40 }}>
              {loading ? "Guardando..." : "Guardar contraseña"}
            </Button>
          </Box>
        </Card>
      </Box>
    </Box>
  );
}
