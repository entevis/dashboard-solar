"use client";

import { useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Upload,
  FileText,
  ImageIcon,
  ExternalLink,
  Download,
  Trash2,
  Paperclip,
} from "lucide-react";

interface Attachment {
  id: number;
  fileName: string;
  fileUrl: string;
  fileSize: number | null;
  fileType: string | null;
}

interface Props {
  contingencyId: number;
  initialAttachment: Attachment | null;
  canUpload: boolean;
}

function formatBytes(bytes: number | null) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function FileIcon({ fileType }: { fileType: string | null }) {
  if (fileType?.startsWith("image/")) return <ImageIcon className="w-5 h-5 text-[var(--color-primary)]" />;
  return <FileText className="w-5 h-5 text-[var(--color-primary)]" />;
}

export function ContingencyAttachment({ contingencyId, initialAttachment, canUpload }: Props) {
  const [attachment, setAttachment] = useState<Attachment | null>(initialAttachment);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  function uploadFile(file: File) {
    setError(null);
    if (file.size > 20 * 1024 * 1024) {
      setError("El archivo excede el tamaño máximo de 20MB.");
      return;
    }

    startTransition(async () => {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`/api/contingencies/${contingencyId}/attachment`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Error al subir el archivo");
        return;
      }

      const created: Attachment = await res.json();
      setAttachment(created);
    });
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) uploadFile(file);
  }

  function handleDelete() {
    setError(null);
    startTransition(async () => {
      const res = await fetch(`/api/contingencies/${contingencyId}/attachment`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Error al eliminar el archivo");
        return;
      }
      setAttachment(null);
    });
  }

  return (
    <div>
      <Separator className="mb-6" />
      <div className="flex items-center gap-2 mb-4">
        <Paperclip className="w-4 h-4 text-[var(--color-muted-foreground)]" />
        <h3 className="text-[14px] font-medium">Adjunto</h3>
      </div>

      {attachment ? (
        <div className="flex items-center gap-3 p-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-secondary)]/40">
          <FileIcon fileType={attachment.fileType} />
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-medium truncate">{attachment.fileName}</p>
            {attachment.fileSize && (
              <p className="text-[12px] text-[var(--color-muted-foreground)]">
                {formatBytes(attachment.fileSize)}
              </p>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
              <a href={attachment.fileUrl} target="_blank" rel="noopener noreferrer" title="Ver archivo">
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
              <a href={attachment.fileUrl} download={attachment.fileName} title="Descargar">
                <Download className="w-3.5 h-3.5" />
              </a>
            </Button>
            {canUpload && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-[var(--color-destructive)] hover:text-[var(--color-destructive)]"
                onClick={handleDelete}
                disabled={isPending}
                title="Eliminar adjunto"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>
        </div>
      ) : canUpload ? (
        <div
          role="button"
          tabIndex={0}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") inputRef.current?.click(); }}
          className={`
            flex flex-col items-center justify-center gap-2 p-6 rounded-lg border-2 border-dashed cursor-pointer transition-colors
            ${isDragging
              ? "border-[var(--color-primary)] bg-[var(--color-primary)]/5"
              : "border-[var(--color-border)] hover:border-[var(--color-primary)]/50 hover:bg-[var(--color-secondary)]/40"
            }
            ${isPending ? "opacity-50 pointer-events-none" : ""}
          `}
        >
          <Upload className="w-5 h-5 text-[var(--color-muted-foreground)]" />
          <p className="text-[13px] text-[var(--color-muted-foreground)] text-center">
            {isPending
              ? "Subiendo archivo..."
              : "Arrastra un archivo aquí o haz clic para seleccionar"}
          </p>
          <p className="text-[12px] text-[var(--color-muted-foreground)]">Máximo 20MB</p>
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadFile(f); }}
          />
        </div>
      ) : (
        <p className="text-[13px] text-[var(--color-muted-foreground)]">
          Sin adjuntos.
        </p>
      )}

      {error && (
        <p className="mt-2 text-[12px] text-[var(--color-destructive)]">{error}</p>
      )}
    </div>
  );
}
