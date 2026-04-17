/**
 * Backfill powerPlantId on GenerationReport from PlantName lookup.
 *
 * Finds all reports where powerPlantId is null but plantNameId is set,
 * resolves powerPlantId through PlantName, and updates in batch.
 *
 * Usage: npx tsx scripts/backfill-power-plant-id.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const reports = await prisma.generationReport.findMany({
    where: {
      active: 1,
      powerPlantId: null,
      plantNameId: { not: null },
    },
    select: {
      id: true,
      plantNameId: true,
      plantNameRef: { select: { powerPlantId: true } },
    },
  });

  console.log(`Found ${reports.length} reports with null powerPlantId and a plantNameId`);

  let updated = 0;
  let skipped = 0;
  let conflicts = 0;

  for (const r of reports) {
    const ppId = r.plantNameRef?.powerPlantId;
    if (!ppId) {
      skipped++;
      continue;
    }

    try {
      await prisma.generationReport.update({
        where: { id: r.id },
        data: { powerPlantId: ppId },
      });
      updated++;
    } catch (e: unknown) {
      if (e && typeof e === "object" && "code" in e && e.code === "P2002") {
        conflicts++;
      } else {
        throw e;
      }
    }
  }

  console.log(`Done: ${updated} updated, ${skipped} skipped (no powerPlantId), ${conflicts} skipped (unique conflict)`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
