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
import { Badge } from "@/components/ui/badge";
import { FileText, Download, FileUp } from "lucide-react";

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
            Reportes
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
            <div className="flex flex-col items-center justify-center min-h-[200px] gap-2 text-[var(--color-muted-foreground)]">
              <FileUp className="w-8 h-8" />
              <p className="text-[13px]">No hay reportes de generación disponibles</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-[12px]">Planta</TableHead>
                  <TableHead className="text-[12px]">Portafolio</TableHead>
                  <TableHead className="text-[12px]">Periodo</TableHead>
                  <TableHead className="text-[12px] text-right">Generación</TableHead>
                  <TableHead className="text-[12px] text-right">CO2 evitado</TableHead>
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
                    <TableCell>
                      <Badge variant="secondary" className="text-[11px] font-medium capitalize rounded-md">
                        {formatPeriod(r.periodMonth, r.periodYear)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-[13px] text-right">
                      <span className="font-medium">{formatKwh(r.kwhGenerated)}</span>
                    </TableCell>
                    <TableCell className="text-[13px] text-right">
                      <span className="font-medium">{r.co2Avoided.toFixed(2)}</span>
                      <span className="text-[11px] text-[var(--color-muted-foreground)] ml-1">ton</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <a
                          href={r.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 px-2 py-1 rounded-md text-[12px] text-[var(--color-primary)] hover:bg-[var(--color-primary)]/8 transition-colors"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          Ver reporte
                        </a>
                        <span className="text-[var(--color-border)]">|</span>
                        <a
                          href={r.fileUrl}
                          download={r.fileName}
                          className="p-1 rounded-md text-[var(--color-muted-foreground)] hover:text-[var(--color-primary)] hover:bg-[var(--color-primary)]/8 transition-colors"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </a>
                      </div>
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
