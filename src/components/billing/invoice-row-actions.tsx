"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, RefreshCw, ExternalLink, FileText, Loader2 } from "lucide-react";

interface Props {
  invoiceId: number;
  isPaid: boolean;
  url: string | null;
  pdfUrl: string | null;
}

export function InvoiceRowActions({ invoiceId, isPaid, url, pdfUrl }: Props) {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);

  async function handleRefresh() {
    setRefreshing(true);
    try {
      await fetch(`/api/billing/invoices/${invoiceId}`, { method: "PATCH" });
      router.refresh();
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-(--color-muted-foreground)"
          aria-label="Acciones"
        >
          {refreshing
            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
            : <MoreHorizontal className="w-3.5 h-3.5" />
          }
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {!isPaid && (
          <>
            <DropdownMenuItem
              className="text-label gap-2"
              onSelect={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Actualizar estado
            </DropdownMenuItem>
            {(url || pdfUrl) && <DropdownMenuSeparator />}
          </>
        )}
        {url && (
          <DropdownMenuItem className="text-label gap-2" asChild>
            <a href={url} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="w-3.5 h-3.5" />
              Ver en Duemint
            </a>
          </DropdownMenuItem>
        )}
        {pdfUrl && (
          <DropdownMenuItem className="text-label gap-2" asChild>
            <a href={pdfUrl} target="_blank" rel="noopener noreferrer">
              <FileText className="w-3.5 h-3.5" />
              Descargar PDF
            </a>
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
