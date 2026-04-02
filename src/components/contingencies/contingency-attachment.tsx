"use client";

import { useRef, useState, useTransition } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import CircularProgress from "@mui/material/CircularProgress";
import Divider from "@mui/material/Divider";
import AttachFileOutlinedIcon from "@mui/icons-material/AttachFileOutlined";
import InsertDriveFileOutlinedIcon from "@mui/icons-material/InsertDriveFileOutlined";
import ImageOutlinedIcon from "@mui/icons-material/ImageOutlined";
import OpenInNewOutlinedIcon from "@mui/icons-material/OpenInNewOutlined";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import CloudUploadOutlinedIcon from "@mui/icons-material/CloudUploadOutlined";

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

export function ContingencyAttachment({ contingencyId, initialAttachment, canUpload }: Props) {
  const [attachment, setAttachment] = useState<Attachment | null>(initialAttachment);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  function uploadFile(file: File) {
    setError(null);
    if (file.size > 20 * 1024 * 1024) { setError("El archivo excede el tamaño máximo de 20MB."); return; }

    startTransition(async () => {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`/api/contingencies/${contingencyId}/attachment`, { method: "POST", body: formData });
      if (!res.ok) { const data = await res.json().catch(() => ({})); setError(data.error ?? "Error al subir el archivo"); return; }
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
      const res = await fetch(`/api/contingencies/${contingencyId}/attachment`, { method: "DELETE" });
      if (!res.ok) { const data = await res.json().catch(() => ({})); setError(data.error ?? "Error al eliminar el archivo"); return; }
      setAttachment(null);
    });
  }

  const isImage = attachment?.fileType?.startsWith("image/");

  return (
    <Box>
      <Divider sx={{ mb: 3 }} />

      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2.5 }}>
        <AttachFileOutlinedIcon sx={{ fontSize: 18, color: "text.secondary" }} />
        <Typography fontSize="0.875rem" fontWeight={600}>Adjunto</Typography>
      </Box>

      {attachment ? (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, p: 1.5, borderRadius: 1.5, border: "1px solid", borderColor: "divider", backgroundColor: "#fafafa" }}>
          {isImage
            ? <ImageOutlinedIcon sx={{ fontSize: 22, color: "#004ac6", flexShrink: 0 }} />
            : <InsertDriveFileOutlinedIcon sx={{ fontSize: 22, color: "#004ac6", flexShrink: 0 }} />
          }
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography fontSize="0.8125rem" fontWeight={500} noWrap>{attachment.fileName}</Typography>
            {attachment.fileSize && (
              <Typography variant="caption" color="text.secondary">{formatBytes(attachment.fileSize)}</Typography>
            )}
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, flexShrink: 0 }}>
            <IconButton size="small" component="a" href={attachment.fileUrl} target="_blank" rel="noopener noreferrer" title="Ver archivo">
              <OpenInNewOutlinedIcon sx={{ fontSize: 15 }} />
            </IconButton>
            <IconButton size="small" component="a" href={attachment.fileUrl} download={attachment.fileName} title="Descargar">
              <FileDownloadOutlinedIcon sx={{ fontSize: 15 }} />
            </IconButton>
            {canUpload && (
              <IconButton size="small" onClick={handleDelete} disabled={isPending} title="Eliminar adjunto" sx={{ color: "error.main" }}>
                {isPending ? <CircularProgress size={12} color="inherit" /> : <DeleteOutlinedIcon sx={{ fontSize: 15 }} />}
              </IconButton>
            )}
          </Box>
        </Box>
      ) : canUpload ? (
        <Box
          role="button"
          tabIndex={0}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") inputRef.current?.click(); }}
          sx={{
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 1,
            p: 3, borderRadius: 1.5, border: "2px dashed", cursor: "pointer", transition: "all 150ms",
            borderColor: isDragging ? "primary.main" : "divider",
            backgroundColor: isDragging ? "#eff4ff" : "#fafafa",
            opacity: isPending ? 0.5 : 1,
            pointerEvents: isPending ? "none" : "auto",
          }}
        >
          <CloudUploadOutlinedIcon sx={{ fontSize: 24, color: isDragging ? "primary.main" : "text.secondary" }} />
          <Typography fontSize="0.8125rem" color="text.secondary" textAlign="center">
            {isPending ? "Subiendo archivo..." : "Arrastra un archivo aquí o haz clic para seleccionar"}
          </Typography>
          <Typography variant="caption" color="text.secondary">Máximo 20MB</Typography>
          <input ref={inputRef} type="file" style={{ display: "none" }} onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadFile(f); }} />
        </Box>
      ) : (
        <Typography variant="body2" color="text.secondary">Sin adjuntos.</Typography>
      )}

      {error && <Typography variant="caption" color="error" sx={{ display: "block", mt: 1 }}>{error}</Typography>}
    </Box>
  );
}
