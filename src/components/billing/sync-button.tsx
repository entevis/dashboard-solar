"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { RefreshCw, ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";

export function SyncButton() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const router = useRouter();

  async function handleSync(mode: "incremental" | "full") {
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/billing/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode }),
      });
      const data = await res.json();

      if (!res.ok) {
        setResult(`Error: ${data.error ?? "Sync failed"}`);
        return;
      }

      const label = mode === "incremental" ? "nuevas" : "actualizadas";
      setResult(`✓ ${data.created} creadas · ${data.updated} ${label} · ${data.skipped} omitidas`);
      router.refresh();
    } catch {
      setResult("Error de conexión con el servidor");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center">
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleSync("incremental")}
          disabled={loading}
          className="gap-1.5 text-label h-8 rounded-r-none border-r-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          {loading ? "Sincronizando..." : "Sincronizar"}
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="sm"
              variant="outline"
              disabled={loading}
              className="h-8 w-7 px-0 rounded-l-none"
              aria-label="Opciones de sincronización"
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuItem onClick={() => handleSync("incremental")} className="text-label">
              <RefreshCw className="w-3.5 h-3.5 mr-2" />
              Sincronizar (solo nuevas)
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => handleSync("full")} className="text-label">
              <RefreshCw className="w-3.5 h-3.5 mr-2" />
              Sincronización completa
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {result && (
        <p className="text-caption text-(--color-muted-foreground)">{result}</p>
      )}
    </div>
  );
}
