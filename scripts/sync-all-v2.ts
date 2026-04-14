/**
 * Offline full sync script — v2 (parallel)
 *
 * Fetches invoices in parallel batches of 10 pages, with 1s delay between batches.
 * Upserts invoices in parallel batches of 10, with 100ms delay between batches.
 * Extracts reports in parallel batches of 5, with 500ms delay between batches.
 *
 * Run with: source .env.local && npx tsx scripts/sync-all-v2.ts
 *
 * Flags:
 *   --since YYYY-MM-DD   (default: 2020-01-01)
 *   --skip-reports        only sync invoices
 *   --batch-pages N       pages per fetch batch (default: 10)
 *   --batch-upsert N      upserts per DB batch (default: 10)
 *   --batch-reports N     reports per extraction batch (default: 5)
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

function getArg(name: string, defaultVal: string): string {
  const args = process.argv.slice(2);
  const idx = args.indexOf(name);
  return idx >= 0 && args[idx + 1] ? args[idx + 1] : defaultVal;
}

// ── Duemint API ──────────────────────────────────────────────────────────────

const DUEMINT_BASE = "https://api.duemint.com/api/v1";
const DUEMINT_TOKEN = process.env.DUEMINT_API_TOKEN!;

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

interface DuemintResponse {
  records: { totalRecords: number; items: number; page: number; pages: number };
  items: DuemintInvoice[];
}

function toFloat(val: string | number | null | undefined): number | null {
  if (val == null) return null;
  const n = typeof val === "number" ? val : parseFloat(val);
  return isNaN(n) ? null : n;
}

function normalizeRut(rut: string) {
  return rut.replace(/[.\-]/g, "").toLowerCase().trim();
}

function getHeaders(companyId: string) {
  return {
    accept: "application/json",
    Authorization: `Bearer ${DUEMINT_TOKEN}`,
    "X-Duemint-Company-Id": companyId,
  };
}

async function fetchPage(companyId: string, since: string, page: number): Promise<DuemintResponse> {
  const url = `${DUEMINT_BASE}/collection-documents?since=${since}&dateBy=2&resultsPerPage=100&page=${page}`;
  const res = await fetch(url, { headers: getHeaders(companyId) });
  if (!res.ok) throw new Error(`Duemint ${res.status} page ${page}`);
  return res.json();
}

async function fetchAllInvoicesParallel(companyId: string, since: string, batchSize: number): Promise<DuemintInvoice[]> {
  // Step 1: fetch first page to know total pages
  const first = await fetchPage(companyId, since, 1);
  const totalPages = first.records?.pages ?? 1;
  const all: DuemintInvoice[] = [...(first.items ?? [])];
  console.log(`  📄 ${totalPages} páginas (${first.records?.totalRecords ?? "?"} registros)`);

  if (totalPages <= 1) return all;

  // Step 2: fetch remaining pages in parallel batches
  const remaining = Array.from({ length: totalPages - 1 }, (_, i) => i + 2);

  for (let i = 0; i < remaining.length; i += batchSize) {
    const batch = remaining.slice(i, i + batchSize);
    const results = await Promise.all(batch.map((p) => fetchPage(companyId, since, p)));
    for (const r of results) {
      all.push(...(r.items ?? []));
    }
    process.stdout.write(`\r  📥 ${all.length} facturas descargadas (pág ${batch[batch.length - 1]}/${totalPages})`);

    // 1 second delay between batches to not overload the API
    if (i + batchSize < remaining.length) {
      await sleep(1000);
    }
  }
  console.log();
  return all;
}

// ── Report extraction ────────────────────────────────────────────────────────

const REPORT_API = "https://django.deltactivos.cl/api/reportes";

function extractReportUrl(gloss: string | null): string | null {
  if (!gloss) return null;
  const match = gloss.match(/https?:\/\/dplus\.deltactivos\.cl\/public\/reporte\/[a-zA-Z0-9]+/);
  return match?.[0] ?? null;
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
    const plantName: string | null = data?.planta?.nombre_visible ?? null;
    return {
      kwhGenerated: typeof tecnico.produccion_total === "number" ? tecnico.produccion_total : null,
      co2Avoided: typeof tecnico.co2 === "number" ? tecnico.co2 : null,
      periodMonth,
      periodYear,
      plantName,
    };
  } catch {
    return null;
  }
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const since = getArg("--since", "2020-01-01");
  const skipReports = process.argv.includes("--skip-reports");
  const batchPages = parseInt(getArg("--batch-pages", "10"));
  const batchUpsert = parseInt(getArg("--batch-upsert", "10"));
  const batchReports = parseInt(getArg("--batch-reports", "5"));

  console.log(`\n🔄 Sync v2 (parallel) desde ${since}`);
  console.log(`   Batches: ${batchPages} páginas, ${batchUpsert} upserts, ${batchReports} reportes`);
  if (skipReports) console.log("   ⏭️  Reportes desactivados");

  const portfolios = await prisma.portfolio.findMany({
    where: { active: 1, duemintCompanyId: { not: null } },
    select: { id: true, name: true, duemintCompanyId: true },
  });
  console.log(`📁 ${portfolios.length} portafolios con Duemint ID`);

  const allCustomers = await prisma.customer.findMany({
    where: { active: 1 },
    select: { id: true, rut: true, name: true },
  });
  const customerByRut = new Map<string, { id: number; name: string }>();
  for (const c of allCustomers) {
    customerByRut.set(normalizeRut(c.rut), { id: c.id, name: c.name });
  }
  console.log(`👥 ${allCustomers.length} clientes\n`);

  let totalInvoices = 0;
  let totalUpserted = 0;
  let totalSkipped = 0;
  let totalReportsCreated = 0;
  let totalReportsUpdated = 0;
  let totalReportsSkipped = 0;
  const errors: string[] = [];

  for (const portfolio of portfolios) {
    console.log(`\n📦 ${portfolio.name}`);

    let invoices: DuemintInvoice[];
    try {
      invoices = await fetchAllInvoicesParallel(portfolio.duemintCompanyId!, since, batchPages);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "unknown";
      errors.push(`${portfolio.name}: ${msg}`);
      console.error(`  ❌ ${msg}`);
      continue;
    }
    totalInvoices += invoices.length;

    // ── Upsert invoices in parallel batches ──────────────────────────────
    console.log(`  💾 Upserting ${invoices.length} facturas (batches de ${batchUpsert})...`);
    let upserted = 0;
    let skipped = 0;

    // Prepare upsert tasks
    interface UpsertTask { duemintId: string; data: Record<string, unknown> }
    const tasks: UpsertTask[] = [];

    for (const inv of invoices) {
      if (!inv.id) { skipped++; continue; }
      const duemintId = String(inv.id);
      const rawTaxId = inv.clientTaxId ?? inv.client?.taxId ?? null;
      const customer = rawTaxId ? customerByRut.get(normalizeRut(rawTaxId)) ?? null : null;
      if (!customer) { skipped++; continue; }

      const creditNote = inv.creditNote?.[0] ?? null;
      tasks.push({
        duemintId,
        data: {
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
        },
      });
    }

    // Execute in parallel batches
    for (let i = 0; i < tasks.length; i += batchUpsert) {
      const batch = tasks.slice(i, i + batchUpsert);
      await Promise.all(
        batch.map((t) =>
          withRetry(
            () => prisma.invoice.upsert({
              where: { duemintId: t.duemintId },
              update: t.data,
              create: { ...t.data, duemintId: t.duemintId },
            }),
            `inv ${t.duemintId}`,
          )
        )
      );
      upserted += batch.length;
      if (upserted % 100 === 0 || i + batchUpsert >= tasks.length) {
        process.stdout.write(`\r  💾 ${upserted}/${tasks.length}`);
      }
      await sleep(100);
    }
    console.log(`\n  ✅ ${upserted} upserted, ${skipped} skipped`);
    totalUpserted += upserted;
    totalSkipped += skipped;

    // ── Extract reports in parallel batches ───────────────────────────────
    if (skipReports) continue;

    const reportTasks: { duemintId: string; reportUrl: string; customerId: number; customerName: string }[] = [];
    for (const inv of invoices) {
      if (!inv.id || !inv.gloss) continue;
      const sn = (inv.statusName ?? "").toLowerCase();
      if (sn.includes("nul") || sn.includes("cancel")) continue;
      const reportUrl = extractReportUrl(inv.gloss);
      if (!reportUrl) continue;
      const rawTaxId = inv.clientTaxId ?? inv.client?.taxId ?? null;
      const customer = rawTaxId ? customerByRut.get(normalizeRut(rawTaxId)) : null;
      if (!customer) continue;
      reportTasks.push({ duemintId: String(inv.id), reportUrl, customerId: customer.id, customerName: customer.name });
    }

    console.log(`  📊 Extrayendo ${reportTasks.length} reportes (batches de ${batchReports})...`);
    let rCreated = 0;
    let rUpdated = 0;
    let rSkipped = 0;

    for (let i = 0; i < reportTasks.length; i += batchReports) {
      const batch = reportTasks.slice(i, i + batchReports);

      await Promise.all(batch.map(async (task) => {
        const { duemintId, reportUrl, customerId, customerName } = task;

        const existing = await withRetry(
          () => prisma.generationReport.findUnique({ where: { duemintId } }),
          `rfind ${duemintId}`,
        );
        if (existing && existing.kwhGenerated != null && existing.co2Avoided != null && existing.plantName != null) {
          rSkipped++;
          return;
        }

        const reportData = await fetchReportData(reportUrl);
        if (!reportData || !reportData.periodMonth || !reportData.periodYear) {
          rSkipped++;
          return;
        }

        if (existing) {
          const updateData: Record<string, unknown> = {};
          if (reportData.kwhGenerated != null && existing.kwhGenerated == null) updateData.kwhGenerated = reportData.kwhGenerated;
          if (reportData.co2Avoided != null && existing.co2Avoided == null) updateData.co2Avoided = reportData.co2Avoided;
          if (reportData.plantName && existing.plantName !== reportData.plantName) updateData.plantName = reportData.plantName;
          if (existing.periodMonth !== reportData.periodMonth || existing.periodYear !== reportData.periodYear) {
            updateData.periodMonth = reportData.periodMonth;
            updateData.periodYear = reportData.periodYear;
          }
          if (Object.keys(updateData).length > 0) {
            await withRetry(
              () => prisma.generationReport.update({ where: { duemintId }, data: updateData }),
              `rupd ${duemintId}`,
            );
            rUpdated++;
          } else {
            rSkipped++;
          }
        } else {
          await withRetry(
            () => prisma.generationReport.create({
              data: {
                customerId,
                periodMonth: reportData.periodMonth,
                periodYear: reportData.periodYear,
                fileUrl: reportUrl,
                fileName: `Reporte ${customerName} - ${String(reportData.periodMonth).padStart(2, "0")}/${reportData.periodYear}`,
                plantName: reportData.plantName ?? null,
                kwhGenerated: reportData.kwhGenerated ?? null,
                co2Avoided: reportData.co2Avoided ?? null,
                source: "duemint",
                duemintId,
              },
            }),
            `rcreate ${duemintId}`,
          );
          rCreated++;
        }
      }));

      const total = rCreated + rUpdated + rSkipped;
      if (total % 20 === 0 || i + batchReports >= reportTasks.length) {
        process.stdout.write(`\r  📊 ${total}/${reportTasks.length} (${rCreated} nuevos, ${rUpdated} actualizados)`);
      }
      await sleep(500);
    }
    console.log(`\n  ✅ Reportes: ${rCreated} creados, ${rUpdated} actualizados, ${rSkipped} sin cambios`);
    totalReportsCreated += rCreated;
    totalReportsUpdated += rUpdated;
    totalReportsSkipped += rSkipped;
  }

  console.log("\n" + "═".repeat(50));
  console.log("📋 Resumen:");
  console.log(`   Facturas: ${totalInvoices} descargadas, ${totalUpserted} upserted, ${totalSkipped} skipped`);
  if (!skipReports) {
    console.log(`   Reportes: ${totalReportsCreated} creados, ${totalReportsUpdated} actualizados, ${totalReportsSkipped} sin cambios`);
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
