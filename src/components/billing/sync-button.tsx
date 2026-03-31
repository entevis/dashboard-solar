"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";

export function SyncButton() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const router = useRouter();

  async function handleSync() {
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/billing/sync", { method: "POST" });
      const data = await res.json();

      if (!res.ok) {
        setResult(`Error: ${data.error ?? "Sync failed"}`);
        return;
      }

      setResult(`✓ ${data.created} nuevas · ${data.updated} actualizadas · ${data.skipped} sin cliente`);
      router.refresh();
    } catch {
      setResult("Error de conexión con el servidor");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        size="sm"
        variant="outline"
        onClick={handleSync}
        disabled={loading}
        className="gap-1.5 text-[13px] h-8"
      >
        <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
        {loading ? "Sincronizando..." : "Sincronizar Duemint"}
      </Button>
      {result && (
        <p className="text-[12px] text-(--color-muted-foreground)">{result}</p>
      )}
    </div>
  );
}
