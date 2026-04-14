import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { UserRole } from "@prisma/client";
import { fetchInvoicesSince, toFloat } from "@/lib/services/duemint.service";
import {
  extractReportUrl,
  getReportPeriod,
  downloadReportPdf,
  extractKwhFromPdf,
  calculateCo2Avoided,
  buildReportFileName,
} from "@/lib/services/report-extraction.service";
import { createAdminClient } from "@/lib/supabase/admin";

function normalizeRut(rut: string) {
  return rut.replace(/[.\-]/g, "").toLowerCase().trim();
}

const REPORT_BUCKET = "generation-reports";

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== UserRole.MAESTRO) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const since: string = body.since ?? "";

  if (!/^\d{4}-\d{2}-\d{2}$/.test(since)) {
    return NextResponse.json({ error: "Fecha inválida. Formato esperado: YYYY-MM-DD" }, { status: 400 });
  }

  const portfolios = await prisma.portfolio.findMany({
    where: { active: 1, duemintCompanyId: { not: null } },
    select: { id: true, name: true, duemintCompanyId: true },
  });

  if (portfolios.length === 0) {
    return NextResponse.json({ error: "No hay portafolios con ID de Duemint configurado" }, { status: 400 });
  }

  const allCustomers = await prisma.customer.findMany({
    where: { active: 1 },
    select: { id: true, rut: true, name: true },
  });
  const customerByRut = new Map<string, { id: number; name: string }>();
  for (const c of allCustomers) {
    customerByRut.set(normalizeRut(c.rut), { id: c.id, name: c.name });
  }

  let totalCreated = 0;
  let totalUpdated = 0;
  let totalSkipped = 0;
  let reportsCreated = 0;
  let reportsSkipped = 0;
  const errors: string[] = [];

  const supabase = createAdminClient();

  for (const portfolio of portfolios) {
    let invoices;
    try {
      invoices = await fetchInvoicesSince(portfolio.duemintCompanyId!, since);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error desconocido";
      errors.push(`Portafolio "${portfolio.name}": ${msg}`);
      continue;
    }

    for (const inv of invoices) {
      if (!inv.id) { totalSkipped++; continue; }

      const duemintId = String(inv.id);
      const rawTaxId = inv.clientTaxId ?? inv.client?.taxId ?? null;
      const customer = rawTaxId ? customerByRut.get(normalizeRut(rawTaxId)) ?? null : null;

      if (!customer) { totalSkipped++; continue; }

      const creditNote = inv.creditNote?.[0] ?? null;
      const data = {
        customerId: customer.id,
        portfolioId: portfolio.id,
        number: inv.number ?? null,
        clientTaxId: rawTaxId,
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
      };

      const existing = await prisma.invoice.findUnique({ where: { duemintId } });
      if (existing) {
        await prisma.invoice.update({ where: { duemintId }, data });
        totalUpdated++;
      } else {
        await prisma.invoice.create({ data: { ...data, duemintId } });
        totalCreated++;
      }

      // --- Report extraction ---
      const reportUrl = extractReportUrl(inv.gloss);
      if (!reportUrl || !inv.createdAt) {
        reportsSkipped++;
        continue;
      }

      // Check if report already exists for this invoice
      const existingReport = await prisma.generationReport.findUnique({
        where: { duemintId },
      });
      if (existingReport) {
        reportsSkipped++;
        continue;
      }

      const { month, year } = getReportPeriod(inv.createdAt);

      try {
        // Download the PDF
        const pdfBuffer = await downloadReportPdf(reportUrl);

        // Try to extract kWh from the PDF
        const kwhGenerated = await extractKwhFromPdf(pdfBuffer);
        const co2Avoided = kwhGenerated ? calculateCo2Avoided(kwhGenerated) : null;

        // Upload PDF to Supabase storage
        const fileName = buildReportFileName(customer.name, month, year);
        const storagePath = `${customer.id}/${year}/${String(month).padStart(2, "0")}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from(REPORT_BUCKET)
          .upload(storagePath, pdfBuffer, {
            contentType: "application/pdf",
            upsert: true,
          });

        if (uploadError) {
          errors.push(`Report upload error (${duemintId}): ${uploadError.message}`);
          reportsSkipped++;
          continue;
        }

        const { data: urlData } = supabase.storage
          .from(REPORT_BUCKET)
          .getPublicUrl(storagePath);

        await prisma.generationReport.create({
          data: {
            customerId: customer.id,
            periodMonth: month,
            periodYear: year,
            fileUrl: urlData.publicUrl,
            fileName,
            kwhGenerated: kwhGenerated ?? null,
            co2Avoided: co2Avoided ?? null,
            source: "duemint",
            duemintId,
          },
        });

        reportsCreated++;
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Error desconocido";
        errors.push(`Report extraction error (${duemintId}): ${msg}`);
        reportsSkipped++;
      }
    }
  }

  return NextResponse.json({
    success: true,
    since,
    portfolios: portfolios.length,
    invoices: { created: totalCreated, updated: totalUpdated, skipped: totalSkipped },
    reports: { created: reportsCreated, skipped: reportsSkipped },
    ...(errors.length > 0 && { errors }),
  });
}
