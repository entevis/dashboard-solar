"use client";

import { useState, useTransition } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Avatar from "@mui/material/Avatar";
import Chip from "@mui/material/Chip";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import SendOutlinedIcon from "@mui/icons-material/SendOutlined";
import ChatBubbleOutlineOutlinedIcon from "@mui/icons-material/ChatBubbleOutlineOutlined";
import { ROLE_LABELS } from "@/lib/auth/roles";
import type { UserRole } from "@prisma/client";

interface Comment {
  id: number;
  body: string;
  createdAt: string;
  user: { id: number; name: string; role: UserRole };
}

interface Props {
  contingencyId: number;
  initialComments: Comment[];
  canComment: boolean;
  currentUserId: number;
}

const roleChipSx: Record<UserRole, object> = {
  MAESTRO:           { backgroundColor: "#dbe1ff", color: "#004ac6" },
  OPERATIVO:         { backgroundColor: "#fef9c3", color: "#a16207" },
  CLIENTE:           { backgroundColor: "#dcfce7", color: "#15803d" },
  CLIENTE_PERFILADO: { backgroundColor: "#dcfce7", color: "#15803d" },
};

function getInitials(name: string) {
  return name.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase();
}

function formatDateTime(iso: string) {
  return new Intl.DateTimeFormat("es-CL", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(iso));
}

export function ContingencyComments({ contingencyId, initialComments, canComment, currentUserId }: Props) {
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit() {
    const trimmed = body.trim();
    if (!trimmed) return;
    setError(null);

    startTransition(async () => {
      const res = await fetch(`/api/contingencies/${contingencyId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: trimmed }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Error al publicar el comentario");
        return;
      }

      const created: Comment = await res.json();
      setComments((prev) => [...prev, { ...created, createdAt: created.createdAt }]);
      setBody("");
    });
  }

  return (
    <Box>
      <Divider sx={{ mb: 3 }} />

      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2.5 }}>
        <ChatBubbleOutlineOutlinedIcon sx={{ fontSize: 18, color: "text.secondary" }} />
        <Typography fontSize="0.875rem" fontWeight={600}>
          Comentarios
          {comments.length > 0 && (
            <Box component="span" sx={{ ml: 0.75, fontSize: "0.8125rem", color: "text.secondary", fontWeight: 400 }}>
              ({comments.length})
            </Box>
          )}
        </Typography>
      </Box>

      {comments.length === 0 && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Sin comentarios aún.
        </Typography>
      )}

      {comments.length > 0 && (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3, mb: 3 }}>
          {comments.map((c) => (
            <Box key={c.id} sx={{ display: "flex", gap: 1.5 }}>
              <Avatar sx={{ width: 32, height: 32, fontSize: "0.6875rem", fontWeight: 700, backgroundColor: "#e6eeff", color: "#004ac6", flexShrink: 0 }}>
                {getInitials(c.user.name)}
              </Avatar>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap", mb: 0.5 }}>
                  <Typography fontSize="0.8125rem" fontWeight={600}>{c.user.name}</Typography>
                  <Chip
                    label={ROLE_LABELS[c.user.role]}
                    size="small"
                    sx={{ ...roleChipSx[c.user.role], fontSize: "0.625rem", fontWeight: 600, height: 18 }}
                  />
                  <Typography variant="caption" color="text.secondary">{formatDateTime(c.createdAt)}</Typography>
                </Box>
                <Typography fontSize="0.8125rem" sx={{ lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                  {c.body}
                </Typography>
              </Box>
            </Box>
          ))}
        </Box>
      )}

      {canComment && (
        <Box sx={{ display: "flex", gap: 1.5 }}>
          <Avatar sx={{ width: 32, height: 32, fontSize: "0.6875rem", fontWeight: 700, backgroundColor: "#dbe1ff", color: "#004ac6", flexShrink: 0 }}>
            Yo
          </Avatar>
          <Box sx={{ flex: 1, display: "flex", flexDirection: "column", gap: 1 }}>
            <TextField
              multiline
              minRows={3}
              size="small"
              fullWidth
              placeholder="Escribe un comentario..."
              value={body}
              onChange={(e) => setBody(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSubmit(); }}
              error={!!error}
              helperText={error}
              inputProps={{ style: { fontSize: "0.8125rem" } }}
            />
            <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
              <Button
                variant="contained"
                size="small"
                onClick={handleSubmit}
                disabled={!body.trim() || isPending}
                startIcon={<SendOutlinedIcon />}
              >
                {isPending ? "Publicando..." : "Comentar"}
              </Button>
            </Box>
          </Box>
        </Box>
      )}

      {!canComment && (
        <Typography variant="caption" color="text.secondary" fontStyle="italic">
          La contingencia está cerrada. No se pueden agregar más comentarios.
        </Typography>
      )}
    </Box>
  );
}
