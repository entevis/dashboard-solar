"use client";

import { useState, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { ROLE_LABELS } from "@/lib/auth/roles";
import { MessageSquare, Send } from "lucide-react";
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

const roleColors: Record<UserRole, string> = {
  MAESTRO:           "bg-[var(--color-primary)]/10 text-[var(--color-primary)]",
  OPERATIVO:         "bg-[var(--color-warning)]/10 text-[var(--color-warning)]",
  CLIENTE:           "bg-[var(--color-success)]/10 text-[var(--color-success)]",
  CLIENTE_PERFILADO: "bg-[var(--color-success)]/10 text-[var(--color-success)]",
};

function getInitials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

function formatDateTime(iso: string) {
  return new Intl.DateTimeFormat("es-CL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function ContingencyComments({
  contingencyId,
  initialComments,
  canComment,
  currentUserId,
}: Props) {
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
    <div>
      <Separator className="mb-6" />
      <div className="flex items-center gap-2 mb-4">
        <MessageSquare className="w-4 h-4 text-[var(--color-muted-foreground)]" />
        <h3 className="text-[14px] font-medium">
          Comentarios
          {comments.length > 0 && (
            <span className="ml-1.5 text-[var(--color-muted-foreground)] font-normal">
              ({comments.length})
            </span>
          )}
        </h3>
      </div>

      {comments.length === 0 && (
        <p className="text-[13px] text-[var(--color-muted-foreground)] mb-6">
          Sin comentarios aún.
        </p>
      )}

      {comments.length > 0 && (
        <div className="space-y-5 mb-6">
          {comments.map((c) => (
            <div key={c.id} className="flex gap-3">
              <div
                className="shrink-0 w-8 h-8 rounded-full bg-[var(--color-secondary)] flex items-center justify-center text-[11px] font-semibold text-[var(--color-foreground)]"
                aria-hidden="true"
              >
                {getInitials(c.user.name)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="text-[13px] font-medium">{c.user.name}</span>
                  <Badge
                    variant="secondary"
                    className={`text-[11px] py-0 h-5 ${roleColors[c.user.role]}`}
                  >
                    {ROLE_LABELS[c.user.role]}
                  </Badge>
                  <span className="text-[12px] text-[var(--color-muted-foreground)]">
                    {formatDateTime(c.createdAt)}
                  </span>
                </div>
                <p className="text-[13px] text-[var(--color-foreground)] leading-relaxed whitespace-pre-wrap">
                  {c.body}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {canComment && (
        <div className="flex gap-3">
          <div
            className="shrink-0 w-8 h-8 rounded-full bg-[var(--color-primary)]/10 flex items-center justify-center text-[11px] font-semibold text-[var(--color-primary)]"
            aria-hidden="true"
          >
            Yo
          </div>
          <div className="flex-1 space-y-2">
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Escribe un comentario..."
              className="text-[13px] min-h-[80px] resize-none"
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSubmit();
              }}
            />
            {error && (
              <p className="text-[12px] text-[var(--color-destructive)]">{error}</p>
            )}
            <div className="flex justify-end">
              <Button
                size="sm"
                onClick={handleSubmit}
                disabled={!body.trim() || isPending}
                className="gap-1.5 text-[13px] h-8"
              >
                <Send className="w-3.5 h-3.5" />
                {isPending ? "Publicando..." : "Comentar"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {!canComment && (
        <p className="text-[12px] text-[var(--color-muted-foreground)] italic">
          La contingencia está cerrada. No se pueden agregar más comentarios.
        </p>
      )}
    </div>
  );
}
