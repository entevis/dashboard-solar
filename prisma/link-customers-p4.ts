import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// solcorId | rut | razonSocial
const RAW = `299	78134990-9	Sociedad Agrícola El Porvenir S.A.
300	78134990-9	Sociedad Agrícola El Porvenir S.A.
336	99510450-4	Vina Siegel SA
383	76107850-K	Masterplant Sur SpA
409	77049680-2	Agrícola Citripal SpA
425	76142455-6	Agrícola Lomas de Leyda Limitada
448	96655110-0	Agrícola San José de Peralillo SA
457	96903970-2	Agrícola Inmobiliaria e Inversiones R G D SA
461	78924400-6	Agrícola Las Aguilas Limitada
466	78068940-4	Hodar y Ossandon Limitada
478	88849500-2	Sociedad Agrícola El Bosque Limitada
483	77389790-5	Agrícola Pachacama Limitada
3	88628300-8	Frutícola José Soler S.A.
6	76145033-6	Agrícola El Milagro Ltda
4	99540940-2	Agrizano/Frutizano
1	99540940-2	Agrizano/Frutizano
5	99540940-2	Agrizano/Frutizano
521	96655110-0	Agrícola San José de Peralillo SA
502	76717671-6	Huaquen Exports Servicios SpA
459	96813740-9	Agrícola El Canelillo S.A
8	78184900-6	Agrícola Ana María SpA
522	96655110-0	Agrícola San José de Peralillo SA
279	84252700-7	Agrícola Cruz del Sur Limitada
331	76083311-8	Agrícola Vista Hermosa Limitada
333	76083311-8	Agrícola Vista Hermosa Limitada`;

async function main() {
  const lines = RAW.trim().split("\n");
  let linked = 0;
  let notFound = 0;

  for (const line of lines) {
    const [solcorId, rut, name] = line.split("\t").map(s => s.trim());

    const customer = await prisma.customer.upsert({
      where: { rut },
      update: { name },
      create: { rut, name },
    });

    const result = await prisma.powerPlant.updateMany({
      where: { solcorId, portfolioId: 3 },
      data: { customerId: customer.id },
    });

    if (result.count > 0) {
      linked += result.count;
      console.log(`  ✓ solcorId=${solcorId} → ${name}`);
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
