"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";

interface Props {
  invoiceId: number;
}

export function RefreshInvoiceButton({ invoiceId }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  async function handleRefresh() {
    setLoading(true);
    setError(false);

    try {
      const res = await fetch(`/api/billing/invoices/${invoiceId}`, { method: "PATCH" });
      if (!res.ok) {
        setError(true);
        setTimeout(() => setError(false), 3000);
        return;
      }
      router.refresh();
    } catch {
      setError(true);
      setTimeout(() => setError(false), 3000);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleRefresh}
      disabled={loading}
      title={error ? "Error al actualizar" : "Actualizar desde Duemint"}
      className={`
        p-1 rounded transition-colors
        ${error
          ? "text-(--color-destructive)"
          : "text-(--color-muted-foreground) hover:text-(--color-primary)"
        }
        disabled:opacity-40 disabled:cursor-not-allowed
      `}
    >
      <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
    </button>
  );
}
