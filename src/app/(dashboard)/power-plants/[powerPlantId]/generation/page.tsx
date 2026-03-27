import { requireAuth, getAccessiblePowerPlantIds } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { UserRole } from "@prisma/client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { UploadGenerationDialog } from "@/components/generation/upload-generation-dialog";

interface Props {
  params: Promise<{ powerPlantId: string }>;
}

export default async function PlantGenerationPage({ params }: Props) {
  const { powerPlantId } = await params;
  const id = parseInt(powerPlantId);
  const user = await requireAuth();

  const accessibleIds = await getAccessiblePowerPlantIds(user);
  if (accessibleIds !== "all" && !accessibleIds.includes(id)) {
    notFound();
  }

  const [plant, reports] = await Promise.all([
    prisma.powerPlant.findUnique({
      where: { id, active: 1 },
      select: { id: true, name: true },
    }),
    prisma.generationReport.findMany({
      where: { powerPlantId: id, active: 1 },
      orderBy: [{ periodYear: "desc" }, { periodMonth: "desc" }],
    }),
  ]);

  if (!plant) notFound();

  const totalKwh = reports.reduce((sum, r) => sum + r.kwhGenerated, 0);
  const totalCo2 = reports.reduce((sum, r) => sum + r.co2Avoided, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-lg font-bold text-[var(--color-foreground)]">
            {plant.name}
          </h1>
          <p className="text-[13px] text-[var(--color-muted-foreground)]">
            Reportes de generación energética
          </p>
        </div>
        {user.role === UserRole.MAESTRO && (
          <UploadGenerationDialog powerPlantId={plant.id} powerPlantName={plant.name} />
        )}
      </div>

      <Tabs defaultValue="generation">
        <TabsList>
          <TabsTrigger value="overview" asChild>
            <Link href={`/power-plants/${plant.id}`}>General</Link>
          </TabsTrigger>
          <TabsTrigger value="generation" asChild>
            <Link href={`/power-plants/${plant.id}/generation`}>Generación</Link>
          </TabsTrigger>
          <TabsTrigger value="billing" asChild>
            <Link href={`/power-plants/${plant.id}/billing`}>Facturación</Link>
          </TabsTrigger>
          <TabsTrigger value="contingencies" asChild>
            <Link href={`/power-plants/${plant.id}/contingencies`}>Contingencias</Link>
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-[var(--color-border)] shadow-sm">
          <CardContent className="pt-4">
            <p className="text-[12px] text-[var(--color-muted-foreground)]">Total generado</p>
            <p className="text-[18px] font-bold text-[var(--color-foreground)]">
              {formatKwh(totalKwh)}
            </p>
          </CardContent>
        </Card>
        <Card className="border-[var(--color-border)] shadow-sm">
          <CardContent className="pt-4">
            <p className="text-[12px] text-[var(--color-muted-foreground)]">CO2 evitado</p>
            <p className="text-[18px] font-bold text-[var(--color-success)]">
              {totalCo2.toFixed(2)} ton
            </p>
          </CardContent>
        </Card>
        <Card className="border-[var(--color-border)] shadow-sm">
          <CardContent className="pt-4">
            <p className="text-[12px] text-[var(--color-muted-foreground)]">Reportes</p>
            <p className="text-[18px] font-bold text-[var(--color-foreground)]">
              {reports.length}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-[var(--color-border)] shadow-sm">
        <CardHeader className="pb-3">
          <h3 className="text-[14px] font-medium">Historial de generación</h3>
        </CardHeader>
        <CardContent className="p-0">
          {reports.length === 0 ? (
            <div className="text-center py-12 text-[13px] text-[var(--color-muted-foreground)]">
              No hay reportes de generación
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-[12px]">Periodo</TableHead>
                  <TableHead className="text-[12px]">Generación</TableHead>
                  <TableHead className="text-[12px]">CO2 evitado</TableHead>
                  <TableHead className="text-[12px]">Archivo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.map((r) => (
                  <TableRow key={r.id}>
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
