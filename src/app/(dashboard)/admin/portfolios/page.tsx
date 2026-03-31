import { requireRole } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CreatePortfolioDialog } from "@/components/admin/create-portfolio-dialog";
import { PortfolioRowActions } from "@/components/admin/portfolio-row-actions";
import { EmptyState } from "@/components/ui/empty-state";
import Link from "next/link";
import { Building2 } from "lucide-react";

export default async function PortfoliosPage() {
  await requireRole(["MAESTRO"]);

  const portfolios = await prisma.portfolio.findMany({
    where: { active: 1 },
    include: {
      _count: {
        select: {
          powerPlants: { where: { active: 1 } },
          users: { where: { active: 1 } },
        },
      },
    },
    orderBy: { name: "asc" },
  });

  return (
    <div className="flex flex-col flex-1 min-h-0 gap-4">
      <div className="shrink-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-[var(--color-foreground)]">Portafolios</h1>
          <p className="text-[13px] text-[var(--color-muted-foreground)]">
            {portfolios.length} {portfolios.length === 1 ? "portafolio registrado" : "portafolios registrados"}
          </p>
        </div>
        <CreatePortfolioDialog />
      </div>

      <div className="flex-1 min-h-0 overflow-hidden border border-[var(--color-border)] rounded-xl bg-white shadow-sm flex flex-col">
        {portfolios.length === 0 ? (
          <EmptyState
            icon={Building2}
            title="Sin portafolios registrados"
            description="Crea un portafolio para agrupar plantas solares por cliente o proyecto de inversión."
            action={<CreatePortfolioDialog />}
          />
        ) : (
          <div className="flex-1 min-h-0 overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-[12px]">Nombre</TableHead>
                  <TableHead className="text-[12px]">Descripción</TableHead>
                  <TableHead className="text-[12px]">Plantas</TableHead>
                  <TableHead className="text-[12px]">Usuarios asignados</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {portfolios.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="text-[13px] font-medium">
                      <Link
                        href={`/power-plants?portfolioId=${p.id}`}
                        className="text-[var(--color-primary)] hover:underline"
                      >
                        {p.name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-[13px] text-[var(--color-muted-foreground)]">
                      {p.description ?? "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-[12px]">{p._count.powerPlants}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-[12px]">{p._count.users}</Badge>
                    </TableCell>
                    <TableCell>
                      <PortfolioRowActions portfolio={p} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}
