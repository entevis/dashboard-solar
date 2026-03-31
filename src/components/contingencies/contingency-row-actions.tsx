"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog";
import { MoreHorizontal, ExternalLink, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface Props {
  contingencyId: number;
  description: string;
  canWrite: boolean;
}

export function ContingencyRowActions({ contingencyId, description, canWrite }: Props) {
  const router = useRouter();
  const [deleteOpen, setDeleteOpen] = useState(false);

  async function handleDelete() {
    const res = await fetch(`/api/contingencies/${contingencyId}`, { method: "DELETE" });
    if (!res.ok) throw new Error();
    toast.success("Contingencia eliminada");
    router.refresh();
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-[var(--color-muted-foreground)]" aria-label="Acciones para esta contingencia">
            <MoreHorizontal className="w-4 h-4" aria-hidden="true" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          <DropdownMenuItem asChild>
            <a href={`/contingencies/${contingencyId}`}>
              <ExternalLink className="w-3.5 h-3.5 mr-2" />
              Ver detalle
            </a>
          </DropdownMenuItem>
          {canWrite && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setDeleteOpen(true)}
                className="text-[var(--color-destructive)] focus:text-[var(--color-destructive)]"
              >
                <Trash2 className="w-3.5 h-3.5 mr-2" />
                Eliminar
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <ConfirmDeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Eliminar contingencia"
        description={`¿Eliminar esta contingencia? Esta acción no se puede deshacer.`}
        onConfirm={handleDelete}
      />
    </>
  );
}
