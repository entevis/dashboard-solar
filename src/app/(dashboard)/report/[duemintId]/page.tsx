import { requireAuth } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { ReportView } from "@/components/report/report-view";

interface Props {
  params: Promise<{ duemintId: string }>;
}

export default async function ReportPage({ params }: Props) {
  await requireAuth();
  const { duemintId } = await params;

  const report = await prisma.generationReport.findUnique({
    where: { duemintId },
    select: {
      id: true,
      periodMonth: true,
      periodYear: true,
      kwhGenerated: true,
      co2Avoided: true,
      plantName: true,
      rawJson: true,
      customer: { select: { name: true } },
    },
  });

  if (!report || !report.rawJson) notFound();

  return (
    <ReportView
      rawJson={report.rawJson as Record<string, unknown>}
      plantName={report.plantName}
      customerName={report.customer?.name ?? null}
      periodMonth={report.periodMonth}
      periodYear={report.periodYear}
    />
  );
}
