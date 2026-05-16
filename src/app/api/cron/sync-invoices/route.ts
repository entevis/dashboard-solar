import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { fetchInvoicesSince, toFloat } from "@/lib/services/duemint.service";
import {
  extractAllReportUrls,
  extractDataFromReportPage,
} from "@/lib/services/report-extraction.service";

/**
 * GET /api/cron/sync-invoices
 *
 * Vercel Cron Job that runs daily at 09:00 AM SCL (13:00 UTC).
 * Fetches invoices updated yesterday (dateBy=3) from all portfolios
 * and upserts them + their linked generation reports.
 *
 * Protected by CRON_SECRET (Vercel injects Authorization header).
 */
export const maxDuration = 300; // 5 minutes max for Vercel Pro

function normalizeRut(rut: string) {
  return rut.replace(/[.\-]/g, "").toLowerCase().trim();
}

export async function GET(request: NextRequest) {
  // Verify authorization — Vercel Cron sends Bearer token.
  // Fail closed: if CRON_SECRET is not configured, deny all requests.
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Yesterday's date in YYYY-MM-DD format
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const since = yesterday.toISOString().split("T")[0];

  console.log(`[cron/sync-invoices] Starting sync since=${since} (dateBy=3)`);

  const portfolios = await prisma.portfolio.findMany({
    where: { active: 1, duemintCompanyId: { not: null } },
    select: { id: true, name: true, duemintCompanyId: true },
  });

  if (portfolios.length === 0) {
    return NextResponse.json({ error: "No portfolios with Duemint ID" }, { status: 400 });
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
  let reportsUpdated = 0;
  let reportsSkipped = 0;
  const errors: string[] = [];

  // Per-portfolio stats for Google Sheet logging
  const portfolioStats: {
    name: string;
    invCreated: number;
    invUpdated: number;
    invSkipped: number;
    repCreated: number;
    repUpdated: number;
    repSkipped: number;
    errors: string[];
  }[] = [];

  for (const portfolio of portfolios) {
    const pStats = {
      name: portfolio.name,
      invCreated: 0, invUpdated: 0, invSkipped: 0,
      repCreated: 0, repUpdated: 0, repSkipped: 0,
      errors: [] as string[],
    };

    let invoices;
    try {
      // dateBy=3: filter by update date (not creation date)
      invoices = await fetchInvoicesSince(portfolio.duemintCompanyId!, since, portfolio.id, 3);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error desconocido";
      errors.push(`${portfolio.name}: ${msg}`);
      pStats.errors.push(msg);
      console.error(`[cron/sync-invoices] ${portfolio.name}: ${msg}`);
      portfolioStats.push(pStats);
      continue;
    }

    console.log(`[cron/sync-invoices] ${portfolio.name}: ${invoices.length} invoices updated since ${since}`);

    for (const inv of invoices) {
      if (!inv.id) { totalSkipped++; pStats.invSkipped++; continue; }

      const duemintId = String(inv.id);
      const rawTaxId = inv.clientTaxId ?? inv.client?.taxId ?? null;
      const customer = rawTaxId ? customerByRut.get(normalizeRut(rawTaxId)) ?? null : null;
      if (!customer) { totalSkipped++; pStats.invSkipped++; continue; }

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
        creditNoteAmount: toFloat(creditNote?.amount),
        gloss: inv.gloss ?? null,
      };

      const existing = await prisma.invoice.findUnique({ where: { duemintId } });
      if (existing) {
        await prisma.invoice.update({ where: { duemintId }, data });
        totalUpdated++; pStats.invUpdated++;
      } else {
        await prisma.invoice.create({ data: { ...data, duemintId } });
        totalCreated++; pStats.invCreated++;
      }

      // --- Report extraction ---
      if (inv.status === 4) { reportsSkipped++; pStats.repSkipped++; continue; } // Skip "Documento" status

      const reportUrls = extractAllReportUrls(inv.gloss);
      if (reportUrls.length === 0) { reportsSkipped++; pStats.repSkipped++; continue; }

      for (const reportUrl of reportUrls) {
        try {
          const { kwhGenerated, co2Avoided, periodMonth, periodYear, rawJson } = await extractDataFromReportPage(reportUrl);

          if (!periodMonth || !periodYear) { reportsSkipped++; pStats.repSkipped++; continue; }

          const nombreVisible = rawJson
            ? String(((rawJson as Record<string, unknown>).planta as Record<string, unknown>)?.nombre_visible ?? "")
            : "";
          const plantNameEntry = nombreVisible
            ? await prisma.plantName.findFirst({ where: { name: nombreVisible } })
            : null;
          const resolvedPowerPlantId = plantNameEntry?.powerPlantId ?? null;

          const existingByUrl = await prisma.generationReport.findFirst({ where: { fileUrl: reportUrl, active: 1 } });
          if (existingByUrl) {
            const plantIdToSet = existingByUrl.powerPlantId ?? resolvedPowerPlantId;
            if (plantIdToSet) await prisma.invoice.update({ where: { duemintId }, data: { powerPlantId: plantIdToSet } });
            reportsSkipped++; pStats.repSkipped++;
            continue;
          }

          const existingReport = await prisma.generationReport.findFirst({
            where: { duemintId, powerPlantId: resolvedPowerPlantId },
          });

          if (existingReport) {
            const updateData: Record<string, unknown> = {};
            if (kwhGenerated != null && existingReport.kwhGenerated == null) updateData.kwhGenerated = kwhGenerated;
            if (co2Avoided != null && existingReport.co2Avoided == null) updateData.co2Avoided = co2Avoided;
            if (rawJson && !existingReport.rawJson) updateData.rawJson = rawJson as object;
            if (existingReport.periodMonth !== periodMonth || existingReport.periodYear !== periodYear) {
              updateData.periodMonth = periodMonth;
              updateData.periodYear = periodYear;
            }
            if (!existingReport.powerPlantId && resolvedPowerPlantId) updateData.powerPlantId = resolvedPowerPlantId;
            if (!existingReport.plantNameId && plantNameEntry) updateData.plantNameId = plantNameEntry.id;
            if (!existingReport.plantName && nombreVisible) updateData.plantName = nombreVisible;
            if (Object.keys(updateData).length > 0) {
              await prisma.generationReport.update({ where: { id: existingReport.id }, data: updateData });
              reportsUpdated++; pStats.repUpdated++;
            } else {
              reportsSkipped++; pStats.repSkipped++;
            }
          } else {
            await prisma.generationReport.create({
              data: {
                customerId: customer.id,
                powerPlantId: resolvedPowerPlantId,
                periodMonth,
                periodYear,
                fileUrl: reportUrl,
                fileName: `Reporte ${customer.name} - ${String(periodMonth).padStart(2, "0")}/${periodYear}`,
                plantName: nombreVisible || null,
                plantNameId: plantNameEntry?.id ?? null,
                kwhGenerated: kwhGenerated ?? null,
                co2Avoided: co2Avoided ?? null,
                rawJson: rawJson ? (rawJson as object) : undefined,
                source: "duemint",
                duemintId,
              },
            });
            reportsCreated++; pStats.repCreated++;
          }
        } catch (err) {
          const msg = err instanceof Error ? err.message : "Error desconocido";
          errors.push(`Report ${duemintId}: ${msg}`);
          pStats.errors.push(`Report ${duemintId}: ${msg}`);
          reportsSkipped++; pStats.repSkipped++;
        }
      }
    }

    portfolioStats.push(pStats);
  }

  // --- Log to Google Sheet via Apps Script webhook ---
  const sheetWebhookUrl = process.env.GOOGLE_SHEET_WEBHOOK_URL;
  if (sheetWebhookUrl) {
    const now = new Date().toISOString().replace("T", " ").slice(0, 19);
    const rows = portfolioStats.map((p) => ({
      fecha: now,
      portafolio: p.name,
      facturasCreadas: p.invCreated,
      facturasActualizadas: p.invUpdated,
      facturasOmitidas: p.invSkipped,
      reportesCreados: p.repCreated,
      reportesActualizados: p.repUpdated,
      reportesOmitidos: p.repSkipped,
      errores: p.errors.join("; "),
    }));

    try {
      await fetch(sheetWebhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows }),
      });
      console.log(`[cron/sync-invoices] Logged ${rows.length} rows to Google Sheet`);
    } catch (err) {
      console.error(`[cron/sync-invoices] Failed to log to Google Sheet:`, err);
    }
  }

  const result = {
    success: true,
    since,
    dateBy: 3,
    portfolios: portfolios.length,
    invoices: { created: totalCreated, updated: totalUpdated, skipped: totalSkipped },
    reports: { created: reportsCreated, updated: reportsUpdated, skipped: reportsSkipped },
    ...(errors.length > 0 && { errors }),
  };

  console.log(`[cron/sync-invoices] Done:`, JSON.stringify(result));

  return NextResponse.json(result);
}
