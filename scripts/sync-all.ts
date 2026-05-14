/**
 * Offline full sync script
 *
 * Syncs ALL invoices from Duemint + extracts reports from Django API.
 * Run with: source .env.local && npx tsx scripts/sync-all.ts
 *
 * Accepts optional --since YYYY-MM-DD flag (defaults to 2020-01-01).
 * Accepts optional --skip-reports flag to only sync invoices.
 */

import { PrismaClient } from "@prisma/client";

let prisma = new PrismaClient();

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function withRetry<T>(fn: () => Promise<T>, label: string, retries = 3): Promise<T> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err: unknown) {
      const code = (err as { code?: string }).code;
      if (attempt === retries || (code !== "P1001" && code !== "P2024")) throw err;
      console.log(`\n  ⚠️  ${label}: retry ${attempt}/${retries} (${code})`);
      await prisma.$disconnect();
      await sleep(3000 * attempt);
      prisma = new PrismaClient();
    }
  }
  throw new Error("unreachable");
}

// ── Duemint API ──────────────────────────────────────────────────────────────

const DUEMINT_BASE = "https://api.duemint.com/api/v1";
function getToken(portfolioId: number): string {
  const specific = process.env[`DUEMINT_API_TOKEN_${portfolioId}`];
  if (specific) return specific;
  const fallback = process.env.DUEMINT_API_TOKEN;
  if (!fallback) throw new Error("Missing DUEMINT_API_TOKEN");
  return fallback;
}

interface DuemintInvoice {
  id: string;
  number: string | null;
  clientTaxId: string | null;
  issueDate: string | null;
  dueDate: string | null;
  createdAt: string | null;
  status: number | null;
  statusName: string | null;
  currency: string | null;
  net: string | number | null;
  taxes: string | number | null;
  total: string | number | null;
  paidAmount: string | number | null;
  amountDue: string | number | null;
  amountCredit: string | number | null;
  amountDebit: string | number | null;
  isCeded: boolean | null;
  onJudicial: boolean | null;
  url: string | null;
  pdf: string | null;
  xml: string | null;
  client: { id: string | null; name: string | null; taxId: string | null } | null;
  creditNote: Array<{ id: string; number: string | null }> | null;
  gloss: string | null;
}

function toFloat(val: string | number | null | undefined): number | null {
  if (val == null) return null;
  const n = typeof val === "number" ? val : parseFloat(val);
  return isNaN(n) ? null : n;
}

function normalizeRut(rut: string) {
  return rut.replace(/[.\-]/g, "").toLowerCase().trim();
}

async function fetchAllInvoices(companyId: string, since: string, portfolioId: number): Promise<DuemintInvoice[]> {
  const all: DuemintInvoice[] = [];
  let page = 1;
  const headers = {
    accept: "application/json",
    Authorization: `Bearer ${getToken(portfolioId)}`,
    "X-Duemint-Company-Id": companyId,
  };

  while (true) {
    const url = `${DUEMINT_BASE}/collection-documents?since=${since}&dateBy=2&resultsPerPage=100&page=${page}`;
    const res = await fetch(url, { headers });
    if (!res.ok) throw new Error(`Duemint ${res.status} page ${page}`);
    const data = await res.json();
    const items = data.items ?? [];
    all.push(...items);
    const totalPages = data.records?.pages ?? 1;
    process.stdout.write(`\r  Página ${page}/${totalPages} (${all.length} facturas)`);
    if (page >= totalPages) break;
    page++;
  }
  console.log();
  return all;
}

// ── Report extraction ────────────────────────────────────────────────────────

const REPORT_API = "https://django.deltactivos.cl/api/reportes";

function extractAllReportUrls(gloss: string | null): string[] {
  if (!gloss) return [];
  const matches = gloss.match(/https?:\/\/dplus\.deltactivos\.cl\/public\/reporte\/[a-zA-Z0-9]+/g) ?? [];
  return [...new Set(matches)];
}

function extractReportCode(url: string): string | null {
  const match = url.match(/\/public\/reporte\/([a-zA-Z0-9]+)/);
  return match?.[1] ?? null;
}

async function fetchReportData(dplusUrl: string) {
  const code = extractReportCode(dplusUrl);
  if (!code) return null;
  try {
    const res = await fetch(`${REPORT_API}/${code}`, { headers: { Accept: "application/json" } });
    if (!res.ok) return null;
    const data = await res.json();
    const tecnico = data?.reporte?.datos_reporte?.tecnico;
    if (!tecnico) return null;
    const fechaReporte = data?.reporte?.datos_reporte?.fecha_reporte;
    let periodMonth: number | null = null;
    let periodYear: number | null = null;
    if (fechaReporte) {
      const d = new Date(fechaReporte);
      if (!isNaN(d.getTime())) {
        periodMonth = d.getMonth() + 1;
        periodYear = d.getFullYear();
      }
    }
    const nombreVisible: string | null = data?.planta?.nombre_visible ?? null;
    return {
      kwhGenerated: typeof tecnico.produccion_total === "number" ? tecnico.produccion_total : null,
      co2Avoided: typeof tecnico.co2 === "number" ? tecnico.co2 : null,
      periodMonth,
      periodYear,
      nombreVisible,
    };
  } catch {
    return null;
  }
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const sinceIdx = args.indexOf("--since");
  const since = sinceIdx >= 0 && args[sinceIdx + 1] ? args[sinceIdx + 1] : "2020-01-01";
  const skipReports = args.includes("--skip-reports");

  console.log(`\n🔄 Sync completo desde ${since}`);
  if (skipReports) console.log("⏭️  Reportes desactivados (--skip-reports)");

  // Load portfolios with duemint IDs
  const portfolios = await prisma.portfolio.findMany({
    where: { active: 1, duemintCompanyId: { not: null } },
    select: { id: true, name: true, duemintCompanyId: true },
  });
  console.log(`📁 ${portfolios.length} portafolios con Duemint ID`);

  // Load customers
  const allCustomers = await prisma.customer.findMany({
    where: { active: 1 },
    select: { id: true, rut: true, name: true },
  });
  const customerByRut = new Map<string, { id: number; name: string }>();
  for (const c of allCustomers) {
    customerByRut.set(normalizeRut(c.rut), { id: c.id, name: c.name });
  }
  console.log(`👥 ${allCustomers.length} clientes cargados\n`);

  let totalInvoices = 0;
  let totalUpserted = 0;
  let totalSkipped = 0;
  let totalReportsCreated = 0;
  let totalReportsUpdated = 0;
  let totalReportsSkipped = 0;
  const errors: string[] = [];

  for (const portfolio of portfolios) {
    console.log(`\n📦 Portafolio: ${portfolio.name}`);

    // Step 1: Fetch all invoices
    let invoices: DuemintInvoice[];
    try {
      invoices = await fetchAllInvoices(portfolio.duemintCompanyId!, since, portfolio.id);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "unknown";
      errors.push(`${portfolio.name}: ${msg}`);
      console.error(`  ❌ Error: ${msg}`);
      continue;
    }
    totalInvoices += invoices.length;

    // Step 2: Upsert invoices
    console.log(`  💾 Upserting ${invoices.length} facturas...`);
    let upserted = 0;
    let skipped = 0;

    for (const inv of invoices) {
      if (!inv.id) { skipped++; continue; }

      const duemintId = String(inv.id);
      const rawTaxId = inv.clientTaxId ?? inv.client?.taxId ?? null;
      const customer = rawTaxId ? customerByRut.get(normalizeRut(rawTaxId)) ?? null : null;
      if (!customer) { skipped++; continue; }

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

      await withRetry(
        () => prisma.invoice.upsert({ where: { duemintId }, update: data, create: { ...data, duemintId } }),
        `invoice ${duemintId}`,
      );
      upserted++;

      if (upserted % 50 === 0) {
        process.stdout.write(`\r  💾 ${upserted}/${invoices.length}`);
        await sleep(100); // prevent connection pool exhaustion
      }
    }
    console.log(`\r  ✅ ${upserted} upserted, ${skipped} skipped`);
    totalUpserted += upserted;
    totalSkipped += skipped;

    // Step 3: Extract reports
    if (skipReports) continue;

    const invoicesWithGloss = invoices.filter((inv) => {
      if (!inv.id || !inv.gloss) return false;
      const sn = (inv.statusName ?? "").toLowerCase();
      if (sn.includes("nul") || sn.includes("cancel")) return false;
      return extractAllReportUrls(inv.gloss).length > 0;
    });

    console.log(`  📊 Extrayendo ${invoicesWithGloss.length} reportes...`);
    let rCreated = 0;
    let rUpdated = 0;
    let rSkipped = 0;

    for (const inv of invoicesWithGloss) {
      const duemintId = String(inv.id);
      const reportUrls = extractAllReportUrls(inv.gloss);
      const rawTaxId = inv.clientTaxId ?? inv.client?.taxId ?? null;
      const customer = rawTaxId ? customerByRut.get(normalizeRut(rawTaxId)) : null;
      if (!customer) { rSkipped++; continue; }

      for (const reportUrl of reportUrls) {
        const reportData = await fetchReportData(reportUrl);
        if (!reportData || !reportData.periodMonth || !reportData.periodYear) {
          rSkipped++;
          continue;
        }

        const plantNameEntry = reportData.nombreVisible
          ? await withRetry(
              () => prisma.plantName.findFirst({ where: { name: reportData.nombreVisible! } }),
              `pname ${duemintId}`,
            )
          : null;
        const resolvedPowerPlantId = plantNameEntry?.powerPlantId ?? null;

        // Skip if another invoice already created a report for this same URL,
        // but still associate the invoice with the plant.
        const existingByUrl = await withRetry(
          () => prisma.generationReport.findFirst({ where: { fileUrl: reportUrl, active: 1 } }),
          `report-findurl ${duemintId}`,
        );
        if (existingByUrl) {
          const plantIdToSet = existingByUrl.powerPlantId ?? resolvedPowerPlantId;
          if (plantIdToSet) {
            await withRetry(
              () => prisma.invoice.update({ where: { duemintId }, data: { powerPlantId: plantIdToSet } }),
              `inv-plant ${duemintId}`,
            );
          }
          rSkipped++;
          continue;
        }

        const existing = await withRetry(
          () => prisma.generationReport.findFirst({ where: { duemintId, powerPlantId: resolvedPowerPlantId } }),
          `report-find ${duemintId}`,
        );
        if (existing && existing.kwhGenerated != null && existing.co2Avoided != null) {
          rSkipped++;
          continue;
        }

        if (existing) {
          const updateData: Record<string, unknown> = {};
          if (reportData.kwhGenerated != null && existing.kwhGenerated == null) updateData.kwhGenerated = reportData.kwhGenerated;
          if (reportData.co2Avoided != null && existing.co2Avoided == null) updateData.co2Avoided = reportData.co2Avoided;
          if (reportData.nombreVisible && existing.plantName !== reportData.nombreVisible) updateData.plantName = reportData.nombreVisible;
          if (existing.periodMonth !== reportData.periodMonth || existing.periodYear !== reportData.periodYear) {
            updateData.periodMonth = reportData.periodMonth;
            updateData.periodYear = reportData.periodYear;
          }
          if (!existing.powerPlantId && resolvedPowerPlantId) updateData.powerPlantId = resolvedPowerPlantId;
          if (!existing.plantNameId && plantNameEntry) updateData.plantNameId = plantNameEntry.id;
          if (Object.keys(updateData).length > 0) {
            await withRetry(
              () => prisma.generationReport.update({ where: { id: existing.id }, data: updateData }),
              `report-update ${duemintId}`,
            );
            rUpdated++;
          } else {
            rSkipped++;
          }
        } else {
          await withRetry(
            () => prisma.generationReport.create({
              data: {
                customerId: customer.id,
                powerPlantId: resolvedPowerPlantId,
                plantNameId: plantNameEntry?.id ?? null,
                periodMonth: reportData.periodMonth,
                periodYear: reportData.periodYear,
                fileUrl: reportUrl,
                fileName: `Reporte ${customer.name} - ${String(reportData.periodMonth).padStart(2, "0")}/${reportData.periodYear}`,
                plantName: reportData.nombreVisible ?? null,
                kwhGenerated: reportData.kwhGenerated ?? null,
                co2Avoided: reportData.co2Avoided ?? null,
                source: "duemint",
                duemintId,
              },
            }),
            `report-create ${duemintId}`,
          );
          rCreated++;
        }
      }

      const total = rCreated + rUpdated + rSkipped;
      if (total % 20 === 0) {
        process.stdout.write(`\r  📊 ${total}/${invoicesWithGloss.length}`);
        await sleep(100);
      }
    }
    console.log(`\r  ✅ Reportes: ${rCreated} creados, ${rUpdated} actualizados, ${rSkipped} skipped`);
    totalReportsCreated += rCreated;
    totalReportsUpdated += rUpdated;
    totalReportsSkipped += rSkipped;
  }

  console.log("\n" + "═".repeat(50));
  console.log("📋 Resumen:");
  console.log(`   Facturas: ${totalInvoices} total, ${totalUpserted} upserted, ${totalSkipped} skipped`);
  if (!skipReports) {
    console.log(`   Reportes: ${totalReportsCreated} creados, ${totalReportsUpdated} actualizados, ${totalReportsSkipped} skipped`);
  }
  if (errors.length > 0) {
    console.log(`   ⚠️  ${errors.length} errores:`);
    for (const e of errors) console.log(`      - ${e}`);
  }
  console.log("═".repeat(50) + "\n");

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
