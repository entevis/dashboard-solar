/**
 * Populates panel_count, installation_type, surface_m2, economic_sector
 * for Portfolio S-Invest 3 (portfolioId=2), matched by solcorId + portfolioId.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const PORTFOLIO_ID = 2;

const rows = [
  { solcorId: "224", panelCount: 960,  installationType: "Suelo", surfaceM2: 6534, economicSector: null },
  { solcorId: "264", panelCount: 420,  installationType: "Suelo", surfaceM2: 3873, economicSector: null },
  { solcorId: "173", panelCount: 1080, installationType: "Suelo", surfaceM2: 6341, economicSector: null },
  { solcorId: "131", panelCount: 320,  installationType: "Techo", surfaceM2: 3475, economicSector: null },
  { solcorId: "362", panelCount: 924,  installationType: "Suelo", surfaceM2: 6000, economicSector: null },
  { solcorId: "420", panelCount: 624,  installationType: "Suelo", surfaceM2: 5000, economicSector: null },
  { solcorId: "432", panelCount: 580,  installationType: "Suelo", surfaceM2: 5000, economicSector: null },
  { solcorId: "387", panelCount: 630,  installationType: "Suelo", surfaceM2: 4500, economicSector: null },
];

async function main() {
  let updated = 0;
  let notFound = 0;

  for (const row of rows) {
    const plant = await prisma.powerPlant.findFirst({
      where: { solcorId: row.solcorId, portfolioId: PORTFOLIO_ID },
      select: { id: true, name: true },
    });

    if (!plant) {
      console.log(`  NOT FOUND: solcorId=${row.solcorId}`);
      notFound++;
      continue;
    }

    await prisma.powerPlant.update({
      where: { id: plant.id },
      data: {
        panelCount: row.panelCount,
        installationType: row.installationType,
        surfaceM2: row.surfaceM2,
        economicSector: row.economicSector,
      },
    });
    console.log(`  ✓ ${plant.name} [${row.solcorId}]`);
    updated++;
  }

  console.log(`\nDone: ${updated} updated, ${notFound} not found`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
