/**
 * Backfill rawJson for existing GenerationReport entries.
 * Only updates reports that have a duemintId (dplus URL) but rawJson is null.
 *
 * Run: set -a && source .env.local && set +a && npx tsx scripts/backfill-raw-json.ts
 */

import { PrismaClient, Prisma } from "@prisma/client";

let prisma = new PrismaClient();

const REPORT_API = "https://django.deltactivos.cl/api/reportes";

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
      console.log(`\n  ⚠️  ${label}: retry ${attempt}/${retries}`);
      await prisma.$disconnect();
      await sleep(3000 * attempt);
      prisma = new PrismaClient();
    }
  }
  throw new Error("unreachable");
}

function extractCode(fileUrl: string): string | null {
  const match = fileUrl.match(/\/public\/reporte\/([a-zA-Z0-9]+)/);
  return match?.[1] ?? null;
}

async function fetchJson(code: string): Promise<object | null> {
  try {
    const res = await fetch(`${REPORT_API}/${code}`, { headers: { Accept: "application/json" } });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function main() {
  console.log("\n🔄 Backfill rawJson para reportes existentes\n");

  const reports = await prisma.generationReport.findMany({
    where: { active: 1, rawJson: { equals: Prisma.DbNull }, source: "duemint", fileUrl: { contains: "dplus.deltactivos.cl" } },
    select: { id: true, duemintId: true, fileUrl: true },
    orderBy: { id: "asc" },
  });

  console.log(`📋 ${reports.length} reportes sin rawJson\n`);

  let updated = 0;
  let skipped = 0;
  let errors = 0;

  const BATCH = 5;

  for (let i = 0; i < reports.length; i += BATCH) {
    const batch = reports.slice(i, i + BATCH);

    await Promise.all(batch.map(async (r) => {
      const code = extractCode(r.fileUrl);
      if (!code) { skipped++; return; }

      const json = await fetchJson(code);
      if (!json) { skipped++; return; }

      try {
        await withRetry(
          () => prisma.generationReport.update({
            where: { id: r.id },
            data: { rawJson: json },
          }),
          `report ${r.id}`,
        );
        updated++;
      } catch {
        errors++;
      }
    }));

    const total = updated + skipped + errors;
    if (total % 20 === 0 || i + BATCH >= reports.length) {
      process.stdout.write(`\r  📊 ${total}/${reports.length} (${updated} actualizados, ${skipped} sin datos, ${errors} errores)`);
    }

    await sleep(500);
  }

  console.log(`\n\n${"═".repeat(50)}`);
  console.log(`📋 Resumen:`);
  console.log(`   Actualizados: ${updated}`);
  console.log(`   Sin datos:    ${skipped}`);
  console.log(`   Errores:      ${errors}`);
  console.log(`${"═".repeat(50)}\n`);

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
