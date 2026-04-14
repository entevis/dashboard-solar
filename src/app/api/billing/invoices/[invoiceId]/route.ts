import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { fetchInvoiceById, toFloat } from "@/lib/services/duemint.service";
import {
  extractReportUrl,
  getReportPeriod,
  extractDataFromReportPage,
} from "@/lib/services/report-extraction.service";

export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ invoiceId: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
    inv = await fetchInvoiceById(portfolio.duemintCompanyId, invoice.duemintId);
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

  // --- Sync linked generation report ---
  // Try gloss from Duemint API response first, fallback to stored gloss in DB
  const storedInvoice = await prisma.invoice.findUnique({
    where: { id },
    select: { gloss: true, createdAt: true },
  });
  const gloss = inv.gloss ?? storedInvoice?.gloss ?? null;
  const createdAt = inv.createdAt ?? storedInvoice?.createdAt?.toISOString() ?? null;
  const reportUrl = extractReportUrl(gloss);
  let reportSynced = false;
  let reportDebug: Record<string, unknown> = { gloss: !!gloss, createdAt: !!createdAt, reportUrl };

  if (reportUrl && createdAt) {
    const extractionResult = await extractDataFromReportPage(reportUrl);
    const { kwhGenerated, co2Avoided, ...debug } = extractionResult;
    reportDebug = { ...reportDebug, ...debug, kwhGenerated, co2Avoided };
    const { month, year } = getReportPeriod(createdAt);

    const customer = await prisma.customer.findUnique({
      where: { id: invoice.customerId },
      select: { name: true },
    });

    const existingReport = await prisma.generationReport.findUnique({
      where: { duemintId: invoice.duemintId },
    });

    if (existingReport) {
      await prisma.generationReport.update({
        where: { duemintId: invoice.duemintId },
        data: {
          fileUrl: reportUrl,
          kwhGenerated: kwhGenerated ?? null,
          co2Avoided: co2Avoided ?? null,
        },
      });
      reportSynced = true;
    } else {
      await prisma.generationReport.create({
        data: {
          customerId: invoice.customerId,
          periodMonth: month,
          periodYear: year,
          fileUrl: reportUrl,
          fileName: `Reporte ${customer?.name ?? "Cliente"} - ${String(month).padStart(2, "0")}/${year}`,
          kwhGenerated: kwhGenerated ?? null,
          co2Avoided: co2Avoided ?? null,
          source: "duemint",
          duemintId: invoice.duemintId,
        },
      });
      reportSynced = true;
    }
  }

  return NextResponse.json({ success: true, invoice: updated, reportSynced, reportDebug });
}
