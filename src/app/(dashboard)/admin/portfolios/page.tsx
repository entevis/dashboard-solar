import { requireRole } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
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
import Link from "next/link";

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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-[var(--color-foreground)]">
            Portafolios
          </h1>
          <p className="text-[13px] text-[var(--color-muted-foreground)]">
            Gestión de portafolios de inversión solar
          </p>
        </div>
        <CreatePortfolioDialog />
      </div>

      <Card className="border-[var(--color-border)] shadow-sm">
        <CardContent className="p-0">
          {portfolios.length === 0 ? (
            <div className="text-center py-12 text-[13px] text-[var(--color-muted-foreground)]">
              No hay portafolios registrados
            </div>
          ) : (
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
                      <Badge variant="secondary" className="text-[11px]">
                        {p._count.powerPlants}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-[11px]">
                        {p._count.users}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <PortfolioRowActions portfolio={p} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
