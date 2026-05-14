import { requireAuth } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { ReportView } from "@/components/report/report-view";

interface Props {
  params: Promise<{ duemintId: string }>;
  searchParams?: Promise<{ back?: string }>;
}

const BACK_LABELS: Record<string, string> = {
  "/dashboard": "Resumen general",
  "/billing": "Facturas y reportes",
};

function getBackLabel(back?: string): string {
  if (!back) return "Volver";
  const path = back.split("?")[0];
  if (path in BACK_LABELS) return BACK_LABELS[path];
  if (path.endsWith("/billing")) return "Facturas y reportes";
  if (path.endsWith("/overview")) return "Resumen del portafolio";
  return "Volver";
}

export default async function ReportPage({ params, searchParams }: Props) {
  await requireAuth();
  const { duemintId } = await params;
  const { back } = (await searchParams) ?? {};
  const backHref = back ?? null;
  const backLabel = getBackLabel(back);

  const report = await prisma.generationReport.findFirst({
    where: { duemintId },
    select: {
      id: true,
      periodMonth: true,
      periodYear: true,
      kwhGenerated: true,
      co2Avoided: true,
      plantName: true,
      rawJson: true,
      plantNameId: true,
      powerPlantId: true,
      customer: { select: { name: true } },
    },
  });

  if (!report || !report.rawJson) notFound();

  // Resolve EPC logo via PlantName → PowerPlant → Epc
  let epcLogoUrl: string | null = null;
  let epcName: string | null = null;
  if (report.plantNameId) {
    const plantNameEntry = await prisma.plantName.findUnique({
      where: { id: report.plantNameId },
      select: { powerPlant: { select: { epc: { select: { name: true, logoUrl: true } } } } },
    });
    epcLogoUrl = plantNameEntry?.powerPlant?.epc?.logoUrl ?? null;
    epcName = plantNameEntry?.powerPlant?.epc?.name ?? null;
  }

  // Find previous and next reports for the same plant.
  // Prefer powerPlantId (canonical FK to PowerPlant); fall back to plantNameId
  // for legacy/manual reports where the PowerPlant link isn't backfilled yet.
  const plantScope = report.powerPlantId
    ? { powerPlantId: report.powerPlantId }
    : report.plantNameId
      ? { plantNameId: report.plantNameId }
      : null;
  let prev: { duemintId: string; periodMonth: number; periodYear: number } | null = null;
  let next: { duemintId: string; periodMonth: number; periodYear: number } | null = null;
  if (plantScope) {
    const baseFilter = {
      ...plantScope,
      active: 1,
      duemintId: { not: null },
      id: { not: report.id },
    } as const;
    const [prevRow, nextRow] = await Promise.all([
      prisma.generationReport.findFirst({
        where: {
          ...baseFilter,
          OR: [
            { periodYear: { lt: report.periodYear } },
            { periodYear: report.periodYear, periodMonth: { lt: report.periodMonth } },
          ],
        },
        orderBy: [{ periodYear: "desc" }, { periodMonth: "desc" }],
        select: { duemintId: true, periodMonth: true, periodYear: true },
      }),
      prisma.generationReport.findFirst({
        where: {
          ...baseFilter,
          OR: [
            { periodYear: { gt: report.periodYear } },
            { periodYear: report.periodYear, periodMonth: { gt: report.periodMonth } },
          ],
        },
        orderBy: [{ periodYear: "asc" }, { periodMonth: "asc" }],
        select: { duemintId: true, periodMonth: true, periodYear: true },
      }),
    ]);
    if (prevRow?.duemintId) prev = { duemintId: prevRow.duemintId, periodMonth: prevRow.periodMonth, periodYear: prevRow.periodYear };
    if (nextRow?.duemintId) next = { duemintId: nextRow.duemintId, periodMonth: nextRow.periodMonth, periodYear: nextRow.periodYear };
  }

  return (
    <ReportView
      rawJson={report.rawJson as Record<string, unknown>}
      plantName={report.plantName}
      customerName={report.customer?.name ?? null}
      periodMonth={report.periodMonth}
      periodYear={report.periodYear}
      epcLogoUrl={epcLogoUrl}
      epcName={epcName}
      prev={prev}
      next={next}
      backHref={backHref}
      backLabel={backLabel}
    />
  );
}
