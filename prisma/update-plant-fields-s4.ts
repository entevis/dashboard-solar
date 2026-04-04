/**
 * Populates panel_count, installation_type, surface_m2, economic_sector
 * for Portfolio S-Invest 4 (portfolioId=3), matched by solcorId + portfolioId.
 * economic_sector_2 not present in this CSV — left unchanged (null).
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const PORTFOLIO_ID = 3;

const rows = [
  { solcorId: "299", panelCount: 720,  installationType: "Suelo",        surfaceM2: 5500,  economicSector: "Vitinícolas" },
  { solcorId: "300", panelCount: 720,  installationType: "Suelo",        surfaceM2: 5100,  economicSector: "Vitinícolas" },
  { solcorId: "336", panelCount: 690,  installationType: "Suelo",        surfaceM2: 5538,  economicSector: "Vitinícolas" },
  { solcorId: "383", panelCount: 334,  installationType: "Suelo / Techo",surfaceM2: 2267,  economicSector: "Agricultura, Ganadería, Silvicultura y Pesca" },
  { solcorId: "409", panelCount: 476,  installationType: "Suelo",        surfaceM2: 4500,  economicSector: "Agricultura, Ganadería, Silvicultura y Pesca" },
  { solcorId: "425", panelCount: 624,  installationType: "Suelo",        surfaceM2: 4500,  economicSector: "Agricultura, Ganadería, Silvicultura y Pesca" },
  { solcorId: "448", panelCount: 560,  installationType: "Suelo",        surfaceM2: 4500,  economicSector: "Vitinícolas" },
  { solcorId: "457", panelCount: 312,  installationType: "Suelo",        surfaceM2: 2725,  economicSector: "Industria Manufacturera" },
  { solcorId: "461", panelCount: 630,  installationType: "Suelo",        surfaceM2: 800,   economicSector: "Agricultura, Ganadería, Silvicultura y Pesca" },
  { solcorId: "466", panelCount: 518,  installationType: "Suelo",        surfaceM2: 3800,  economicSector: "Sector de Servicios" },
  { solcorId: "478", panelCount: 630,  installationType: "Suelo",        surfaceM2: 5140,  economicSector: "Agricultura, Ganadería, Silvicultura y Pesca" },
  { solcorId: "483", panelCount: 630,  installationType: "Suelo",        surfaceM2: null,  economicSector: "Agricultura, Ganadería, Silvicultura y Pesca" },
  { solcorId: "3",   panelCount: 644,  installationType: "Suelo",        surfaceM2: 5700,  economicSector: "Agricultura, Ganadería, Silvicultura y Pesca" },
  { solcorId: "6",   panelCount: 644,  installationType: "Suelo",        surfaceM2: 6100,  economicSector: "Agricultura, Ganadería, Silvicultura y Pesca" },
  { solcorId: "4",   panelCount: 644,  installationType: "Suelo",        surfaceM2: 5830,  economicSector: "Agricultura, Ganadería, Silvicultura y Pesca" },
  { solcorId: "1",   panelCount: 616,  installationType: "Suelo",        surfaceM2: 3520,  economicSector: "Agricultura, Ganadería, Silvicultura y Pesca" },
  { solcorId: "5",   panelCount: 524,  installationType: "Suelo",        surfaceM2: 4300,  economicSector: "Agricultura, Ganadería, Silvicultura y Pesca" },
  { solcorId: "521", panelCount: 600,  installationType: "Suelo",        surfaceM2: 6400,  economicSector: "Vitinícolas" },
  { solcorId: "502", panelCount: 642,  installationType: "Techo",        surfaceM2: 3200,  economicSector: "Actividades De Apoyo a la Agricultura" },
  { solcorId: "459", panelCount: 630,  installationType: "Suelo",        surfaceM2: 5000,  economicSector: "Agrícola" },
  { solcorId: "8",   panelCount: 576,  installationType: "Suelo",        surfaceM2: 5000,  economicSector: "Agricultura, Ganadería, Silvicultura y Pesca" },
  { solcorId: "522", panelCount: 588,  installationType: "Suelo",        surfaceM2: 5300,  economicSector: "Vitinícolas" },
  { solcorId: "279", panelCount: 728,  installationType: "Suelo",        surfaceM2: 5822,  economicSector: "Agricultura, Ganadería, Silvicultura y Pesca" },
  { solcorId: "331", panelCount: 720,  installationType: "Suelo",        surfaceM2: 5500,  economicSector: "Agricultura, Ganadería, Silvicultura y Pesca" },
  { solcorId: "333", panelCount: 720,  installationType: "Suelo",        surfaceM2: 2583,  economicSector: "Agricultura, Ganadería, Silvicultura y Pesca" },
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
