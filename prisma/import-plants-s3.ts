import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function parseCLNumber(s: string): number | null {
  if (!s || s.trim() === "") return null;
  return parseFloat(s.replace(/\./g, "").replace(",", "."));
}

// Parse DD-MM-YYYY → Date
function parseDashDate(s: string): Date | null {
  if (!s || s.trim() === "") return null;
  const [d, m, y] = s.split("-");
  return new Date(`${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}T12:00:00Z`);
}

const PORTFOLIO_ID = 2; // S-Invest 3
const DEFAULT_CUSTOMER_ID = 1;

// cols: ID | ID Solcor | Nombre | Ciudad | Distribuidora | ID Tarifa | Fecha | Duración | kWp | Rend. Espec. | (ignore rest)
const RAW = `1	224	Agrícola Montt Montero	Hijuelas	CHILQUINTA	Hijuelas CHILQUINTA STX C	02-09-2021	10	432	1.646,51
2	264	Vivero Sur	Teno	CGED	Teno CGED STX E	04-10-2022	13	239,4	1.557,41
3	173	Agrichile - La Chispa	Río Claro	CGED	Río Claro CGED STX E	21-07-2021	15	426,6	1.573,48
4	131	Ilustre Municipalidad de Vitacura	Vitacura	ENEL DISTRIBUCIÓN	Vitacura ENEL DISTRIBUCIÓN STX D	28-05-2021	15	137,6	1.710,88
5	362	Frigorifico Guerra	Curicó	CGED	Curicó CGED STX E	21-06-2024	15	418,84	1.665,00
6	420	Sweet Dried Fruit	San Felipe	CHILQUINTA	San Felipe CHILQUINTA STX C	23-09-2024	15	418,08	1.843,00
7	432	Agícola La Torre	Rengo	CGED	Rengo CGED STX E	29-11-2024	7	389	1.698,66
8	387	Prodalmen	Paine			31-01-2025	5	414	`;

async function main() {
  const lines = RAW.trim().split("\n");
  let created = 0;

  for (const line of lines) {
    const cols = line.split("\t");
    const [, solcorIdRaw, name, city, distributorCompany, tariffId, dateStr, durationRaw, capacityRaw, yieldRaw] = cols;

    const capacityKw = parseCLNumber((capacityRaw ?? "").trim());
    if (!capacityKw) {
      console.warn(`Skipping (no capacity): ${name}`);
      continue;
    }

    await prisma.powerPlant.create({
      data: {
        name: name.trim(),
        city: city?.trim() || null,
        distributorCompany: distributorCompany?.trim() || null,
        tariffId: tariffId?.trim() || null,
        solcorId: solcorIdRaw?.trim() || null,
        capacityKw,
        specificYield: parseCLNumber((yieldRaw ?? "").trim()),
        startDate: parseDashDate(dateStr?.trim()),
        durationYears: durationRaw?.trim() ? parseFloat(durationRaw.trim()) : null,
        portfolioId: PORTFOLIO_ID,
        customerId: DEFAULT_CUSTOMER_ID,
        status: "active",
      },
    });
    created++;
    console.log(`  ✓ ${created}/${lines.length}: ${name.trim()}`);
  }

  console.log(`\nDone — ${created} plants imported to S-Invest 3`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  prisma.$disconnect();
  process.exit(1);
});
