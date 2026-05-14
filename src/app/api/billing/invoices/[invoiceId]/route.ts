import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { UserRole } from "@prisma/client";
import { fetchInvoiceById, toFloat } from "@/lib/services/duemint.service";
import {
  extractAllReportUrls,
  extractDataFromReportPage,
} from "@/lib/services/report-extraction.service";

export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ invoiceId: string }> }
) {
  const user = await getCurrentUser();
  if (!user || user.role !== UserRole.MAESTRO) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { invoiceId } = await params;
  const id = parseInt(invoiceId);
  if (isNaN(id)) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  const invoice = await prisma.invoice.findUnique({
    where: { id },
    select: { id: true, duemintId: true, portfolioId: true, customerId: true },
  });

  if (!invoice || !invoice.duemintId) {
    return NextResponse.json({ error: "Factura no encontrada" }, { status: 404 });
  }

  if (!invoice.portfolioId) {
    return NextResponse.json({ error: "La factura no tiene portafolio asociado" }, { status: 400 });
  }

  const portfolio = await prisma.portfolio.findUnique({
    where: { id: invoice.portfolioId },
    select: { duemintCompanyId: true },
  });

  if (!portfolio?.duemintCompanyId) {
    return NextResponse.json({ error: "El portafolio no tiene ID de Duemint configurado" }, { status: 400 });
  }

  let inv;
  try {
    inv = await fetchInvoiceById(portfolio.duemintCompanyId, invoice.duemintId, invoice.portfolioId ?? undefined);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error al conectar con Duemint";
    return NextResponse.json({ error: msg }, { status: 502 });
  }

  const creditNote = inv.creditNote?.[0] ?? null;

  const updated = await prisma.invoice.update({
    where: { id },
    data: {
      number: inv.number ?? null,
      clientTaxId: inv.clientTaxId ?? inv.client?.taxId ?? null,
      issueDate: inv.issueDate ? new Date(inv.issueDate) : null,
      dueDate: inv.dueDate ? new Date(inv.dueDate) : null,
      statusCode: inv.status ?? null,
      statusName: inv.statusName ?? null,
      currency: inv.currency ?? null,
      net: toFloat(inv.net),
      taxes: toFloat(inv.taxes),
      total: toFloat(inv.total),
      paidAmount: toFloat(inv.paidAmount),
      amountDue: toFloat(inv.amountDue),
      amountCredit: toFloat(inv.amountCredit),
      amountDebit: toFloat(inv.amountDebit),
      isCeded: inv.isCeded ?? null,
      onJudicial: inv.onJudicial ?? null,
      url: inv.url ?? null,
      pdfUrl: inv.pdf ?? null,
      xmlUrl: inv.xml ?? null,
      duemintClientId: inv.client?.id ?? null,
      duemintClientName: inv.client?.name ?? null,
      creditNoteId: creditNote?.id ?? null,
      creditNoteNumber: creditNote?.number ?? null,
      gloss: inv.gloss ?? null,
    },
    select: {
      id: true,
      statusName: true,
      statusCode: true,
      total: true,
      amountDue: true,
      paidAmount: true,
      dueDate: true,
    },
  });

  // --- Sync linked generation reports (one per plant) ---
  const storedInvoice = await prisma.invoice.findUnique({
    where: { id },
    select: { gloss: true },
  });
  const gloss = inv.gloss ?? storedInvoice?.gloss ?? null;
  const reportUrls = extractAllReportUrls(gloss);
  let reportSynced = false;
  const reportDebug: Record<string, unknown> = { gloss: !!gloss, reportUrls };

  if (reportUrls.length > 0) {
    const customer = await prisma.customer.findUnique({
      where: { id: invoice.customerId },
      select: { name: true },
    });

    for (const reportUrl of reportUrls) {
      const extractionResult = await extractDataFromReportPage(reportUrl);
      const { kwhGenerated, co2Avoided, periodMonth, periodYear, rawJson } = extractionResult;

      if (!periodMonth || !periodYear) continue;

      const nombreVisible = rawJson
        ? String(((rawJson as Record<string, unknown>).planta as Record<string, unknown>)?.nombre_visible ?? "")
        : "";
      const plantNameEntry = nombreVisible
        ? await prisma.plantName.findFirst({ where: { name: nombreVisible } })
        : null;
      const resolvedPowerPlantId = plantNameEntry?.powerPlantId ?? null;

      const existingReport = await prisma.generationReport.findFirst({
        where: { duemintId: invoice.duemintId, powerPlantId: resolvedPowerPlantId },
      });

      if (existingReport) {
        await prisma.generationReport.update({
          where: { id: existingReport.id },
          data: {
            fileUrl: reportUrl,
            kwhGenerated: kwhGenerated ?? null,
            co2Avoided: co2Avoided ?? null,
            rawJson: rawJson ? (rawJson as object) : undefined,
            periodMonth,
            periodYear,
            ...(!existingReport.powerPlantId && resolvedPowerPlantId ? { powerPlantId: resolvedPowerPlantId } : {}),
            ...(!existingReport.plantNameId && plantNameEntry ? { plantNameId: plantNameEntry.id } : {}),
            ...(!existingReport.plantName && nombreVisible ? { plantName: nombreVisible } : {}),
          },
        });
      } else {
        await prisma.generationReport.create({
          data: {
            customerId: invoice.customerId,
            powerPlantId: resolvedPowerPlantId,
            plantNameId: plantNameEntry?.id ?? null,
            plantName: nombreVisible || null,
            periodMonth,
            periodYear,
            fileUrl: reportUrl,
            fileName: `Reporte ${customer?.name ?? "Cliente"} - ${String(periodMonth).padStart(2, "0")}/${periodYear}`,
            kwhGenerated: kwhGenerated ?? null,
            co2Avoided: co2Avoided ?? null,
            rawJson: rawJson ? (rawJson as object) : undefined,
            source: "duemint",
            duemintId: invoice.duemintId,
          },
        });
      }
      reportSynced = true;
    }
  }

  return NextResponse.json({ success: true, invoice: updated, reportSynced, reportDebug });
}
