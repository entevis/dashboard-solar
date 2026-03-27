import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// solcorId | rut  (name = rut as placeholder, to be updated later)
const RAW = `224	78974860-8
264	76061728-8
173	96618010-2
131	69255600-3
362	79732510-4
420	77568780-0
432	79979870-0
387	78772930-4`;

async function main() {
  const lines = RAW.trim().split("\n");
  let linked = 0;
  let notFound = 0;

  for (const line of lines) {
    const [solcorId, rut] = line.split("\t").map(s => s.trim());

    // Upsert customer with RUT as placeholder name
    const customer = await prisma.customer.upsert({
      where: { rut },
      update: {},
      create: { rut, name: rut },
    });

    const result = await prisma.powerPlant.updateMany({
      where: { solcorId, portfolioId: 2 },
      data: { customerId: customer.id },
    });

    if (result.count > 0) {
      linked += result.count;
      console.log(`  ✓ solcorId=${solcorId} → ${rut}`);
    } else {
      console.warn(`  ⚠ Not found: solcorId="${solcorId}"`);
      notFound++;
    }
  }

  console.log(`\nDone — ${linked} plants linked (${notFound} not found)`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  prisma.$disconnect();
  process.exit(1);
});
