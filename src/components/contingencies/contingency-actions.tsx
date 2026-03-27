"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Play, CheckCircle } from "lucide-react";
import { toast } from "sonner";

interface Props {
  contingencyId: number;
  currentStatus: string;
}

export function ContingencyActions({ contingencyId, currentStatus }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function updateStatus(newStatus: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/contingencies/${contingencyId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) throw new Error("Error al actualizar estado");

      const labels: Record<string, string> = {
        IN_PROGRESS: "en progreso",
        CLOSED: "cerrada",
      };
      toast.success(`Contingencia marcada como ${labels[newStatus] ?? newStatus}`);
      router.refresh();
    } catch {
      toast.error("Error al actualizar estado");
    } finally {
      setLoading(false);
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={loading}>
          <MoreHorizontal className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {currentStatus === "OPEN" && (
          <DropdownMenuItem onClick={() => updateStatus("IN_PROGRESS")}>
            <Play className="w-4 h-4 mr-2" />
            Marcar en progreso
          </DropdownMenuItem>
        )}
        {(currentStatus === "OPEN" || currentStatus === "IN_PROGRESS") && (
          <DropdownMenuItem onClick={() => updateStatus("CLOSED")}>
            <CheckCircle className="w-4 h-4 mr-2" />
            Cerrar contingencia
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
