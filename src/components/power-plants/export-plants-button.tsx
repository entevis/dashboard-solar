"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Button from "@mui/material/Button";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import { toast } from "@/lib/utils/toast";

export function ExportPlantsButton() {
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();

  async function handleExport() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      const portfolioId = searchParams.get("portfolioId");
      const customerId = searchParams.get("customerId");
      const q = searchParams.get("q");
      if (portfolioId) params.set("portfolioId", portfolioId);
      if (customerId) params.set("customerId", customerId);
      if (q) params.set("q", q);

      const res = await fetch(`/api/power-plants/export?${params.toString()}`);
      if (!res.ok) throw new Error("Error al exportar");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `plantas_${new Date().toISOString().split("T")[0]}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Error al exportar plantas");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      variant="outlined"
      size="small"
      startIcon={<FileDownloadOutlinedIcon />}
      onClick={handleExport}
      disabled={loading}
      sx={{ borderColor: "#c3c6d7", color: "text.primary", "&:hover": { borderColor: "#004ac6", color: "#004ac6" } }}
    >
      {loading ? "Exportando..." : "Exportar"}
    </Button>
  );
}
