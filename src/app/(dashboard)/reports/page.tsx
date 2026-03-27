import { requireAuth, buildPlantAccessFilter } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatKwh, formatPeriod } from "@/lib/utils/formatters";
import Link from "next/link";
import { ReportFilterBar } from "@/components/reports/report-filter-bar";

interface Props {
  searchParams: Promise<{ year?: string; powerPlantId?: string }>;
}

export default async function ReportsPage({ searchParams }: Props) {
  const user = await requireAuth();
  const params = await searchParams;

  const plantFilter = await buildPlantAccessFilter(user);

  const where: Record<string, unknown> = {
    active: 1,
    powerPlant: plantFilter,
  };

  if (params.year) {
    where.periodYear = parseInt(params.year);
  }
  if (params.powerPlantId) {
    where.powerPlantId = parseInt(params.powerPlantId);
  }

  const [reports, totalKwh, totalCo2, accessiblePlants] = await Promise.all([
    prisma.generationReport.findMany({
      where,
      include: {
        powerPlant: {
          select: {
            id: true,
            name: true,
            portfolio: { select: { name: true } },
          },
        },
      },
      orderBy: [{ periodYear: "desc" }, { periodMonth: "desc" }],
    }),
    prisma.generationReport
      .aggregate({ where: { active: 1, powerPlant: plantFilter }, _sum: { kwhGenerated: true } })
      .then((r) => r._sum.kwhGenerated ?? 0),
    prisma.generationReport
      .aggregate({ where: { active: 1, powerPlant: plantFilter }, _sum: { co2Avoided: true } })
      .then((r) => r._sum.co2Avoided ?? 0),
    prisma.powerPlant.findMany({
      where: plantFilter,
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-[var(--color-foreground)]">
            Reportes de Generación
          </h1>
          <p className="text-[13px] text-[var(--color-muted-foreground)]">
            Historial de producción energética del portafolio
          </p>
        </div>
      </div>

      <ReportFilterBar plants={accessiblePlants} />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-[var(--color-border)] shadow-sm">
          <CardContent className="pt-4">
            <p className="text-[12px] text-[var(--color-muted-foreground)]">Total generado</p>
            <p className="text-[20px] font-bold text-[var(--color-foreground)]">
              {formatKwh(totalKwh)}
            </p>
          </CardContent>
        </Card>
        <Card className="border-[var(--color-border)] shadow-sm">
          <CardContent className="pt-4">
            <p className="text-[12px] text-[var(--color-muted-foreground)]">CO2 evitado</p>
            <p className="text-[20px] font-bold text-[var(--color-success)]">
              {totalCo2.toFixed(2)} ton
            </p>
          </CardContent>
        </Card>
        <Card className="border-[var(--color-border)] shadow-sm">
          <CardContent className="pt-4">
            <p className="text-[12px] text-[var(--color-muted-foreground)]">Reportes</p>
            <p className="text-[20px] font-bold text-[var(--color-foreground)]">
              {reports.length}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-[var(--color-border)] shadow-sm">
        <CardHeader className="pb-3">
          <h3 className="text-[14px] font-medium">Historial</h3>
        </CardHeader>
        <CardContent className="p-0">
          {reports.length === 0 ? (
            <div className="text-center py-12 text-[13px] text-[var(--color-muted-foreground)]">
              No hay reportes de generación disponibles
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-[12px]">Planta</TableHead>
                  <TableHead className="text-[12px]">Portafolio</TableHead>
                  <TableHead className="text-[12px]">Periodo</TableHead>
                  <TableHead className="text-[12px]">Generación</TableHead>
                  <TableHead className="text-[12px]">CO2 evitado</TableHead>
                  <TableHead className="text-[12px]">Archivo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="text-[13px]">
                      <Link
                        href={`/power-plants/${r.powerPlant.id}/generation`}
                        className="font-medium text-[var(--color-primary)] hover:underline"
                      >
                        {r.powerPlant.name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-[13px] text-[var(--color-muted-foreground)]">
                      {r.powerPlant.portfolio.name}
                    </TableCell>
                    <TableCell className="text-[13px] font-medium capitalize">
                      {formatPeriod(r.periodMonth, r.periodYear)}
                    </TableCell>
                    <TableCell className="text-[13px]">
                      {formatKwh(r.kwhGenerated)}
                    </TableCell>
                    <TableCell className="text-[13px]">
                      {r.co2Avoided.toFixed(2)} ton
                    </TableCell>
                    <TableCell>
                      <a
                        href={r.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[12px] text-[var(--color-primary)] hover:underline"
                      >
                        {r.fileName}
                      </a>
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
