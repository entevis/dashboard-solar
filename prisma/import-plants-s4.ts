import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function parseCLNumber(s: string): number | null {
  if (!s || s.trim() === "" || s.trim() === "N/A") return null;
  return parseFloat(s.replace(/\./g, "").replace(",", "."));
}

// Handles DD/M/YYYY, DD/MM/YYYY, DD-MM-YYYY
function parseDate(s: string): Date | null {
  if (!s || s.trim() === "") return null;
  const sep = s.includes("/") ? "/" : "-";
  const [d, m, y] = s.split(sep);
  return new Date(`${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}T12:00:00Z`);
}

const PORTFOLIO_ID = 3; // S-Invest 4
const DEFAULT_CUSTOMER_ID = 1;

// cols: # | ID Solcor | Nombre | Ciudad | Distribuidora | ID Tarifa | Fecha | Duración | kWp | RendEspec_2-3% | RendEspec_3-4% | (ignore rest)
const RAW = `1	299	Verfrut Manzanares I	Longaví	Luz Parral	Longaví Luz Parral STX E	6/12/2024	15	414,00	1.601,72	1.574,47
2	300	Verfrut Manzanares II	Longaví	Luz Parral	Longaví Luz Parral STX E	12/7/2024	15	414,00	1.605,29	1.578,29
3	336	Viña Siegel	San Fernando	CGED	San Fernando CGED STX E	14/5/2024	15	396,75	1.646,95	1.618,24
4	383	Masterplant Sur	Molina	CGED	Molina CGED STX E	14/8/2024	25	208,69	1.593,98	1.567,44
5	409	Agricola Citripal II	Melipilla	CGED	Melipilla CGED STX E	27/1/2025	10	318,92	1.721,20	1.690,43
6	425	Lomas de Leyda	San Antonio	CGED	San Antonio CGED STX E	27/2/2025	15	414,96	1.676,76	1.654,25
7	448	Montgras Buin	Buin	CGED	Buin CGED STX E	23/4/2025	15	378,00	1.786,25	1.757,41
8	457	CWC Wines	Maule	CGED	Maule CGED STX E	20/1/2025	10	205,92	1.730,92	1.700,75
9	461	Las Aguilas	Melipilla	CGED	Melipilla CGED STX E	27/6/2025	15	415,80	1.752,06	1.723,13
10	466	Hodar y Ossandón	San Felipe	Chilquinta	San Felipe Chilquinta STX C	1/2/2025	8	343,14	1.886,19	1.856,44
11	478	Triofrut	Graneros	CGED	Graneros CGED STX E	30/4/2025	10	415,80	1.783,59	1.754,61
12	483	Agrícola Pachacama	Retiro	Luz Parral	Retiro Luz Parral STX E	30/01/2025	20	415,80	1.685,39	1.657,30
13	3	Huerto Santa Magdalena	Curicó	CEC	Curicó CEC STX E	15/9/2025	20	460,46	N/A	1.626,80
14	6	Agrícola El Milagro	Curicó	CEC	Curicó CEC STX E	11/9/2025	20	460,46	N/A	1.651,70
15	4	Santa Victoria	Curicó	CEC	Curicó CEC STX E	13/10/2025	20	460,46	N/A	1.623,30
16	1	Huerto El Molino	Curicó	CEC	Curicó CEC STX E	2/12/2025	20	440,44	N/A	1.463,51
17	5	San Rafael de Teno	Teno	CGED	Teno CGED STX E	1/12/2025	20	374,66	N/A	1.684,75
18	521	Montgras Pumanque	Pumanque	CGED	Pumanque CGED STX E	17/12/2025	15	414,00	N/A	1.741,26
19	502	Huaquen Export	Romeral	CGED	Romeral CGED STX E	6/8/2025	10	422,40	N/A	1.464,96
20	459	Agrícola El Canelillo	La Cruz	Chilquinta	La Cruz Chilquinta STX C	21/4/2025	10	415,80	N/A	1.716,77
21	8	Agrícola Ana María	Romeral	CGED	Romeral CGED STX E	23/2/2026	20	411,84	N/A	1.652,40
22	522	Montgras Leyda	San Antonio	CGED	San Antonio CGED STX E	11/3/2026	15	417,48	N/A	1.665,40
23	279	Dadinco	San Nicolás	COPELEC	San Nicolás COPELEC STX E	31/5/2023	20,5	396,76	N/A	1.477,26
24	331	Vista Hermosa Campo	Melipilla	CGED	Melipilla CGED STX E	6/9/2023	10	414,00	N/A	1.685,27
25	333	Vista Hermosa Mandarinas II	Melipilla	CGED	Melipilla CGED STX E	26/9/2023	10	414,00	N/A	1.692,87`;

async function main() {
  const lines = RAW.trim().split("\n");
  let created = 0;

  for (const line of lines) {
    const cols = line.split("\t");
    const [, solcorIdRaw, name, city, distributorCompany, tariffId, dateStr, durationRaw, capacityRaw, rend1, rend2] = cols;

    const capacityKw = parseCLNumber((capacityRaw ?? "").trim());
    if (!capacityKw) {
      console.warn(`Skipping (no capacity): ${name}`);
      continue;
    }

    // Use first yield col when available, else second
    const specificYield = parseCLNumber((rend1 ?? "").trim()) ?? parseCLNumber((rend2 ?? "").trim());
    const durationStr = (durationRaw ?? "").trim().replace(",", ".");
    const durationYears = durationStr ? parseFloat(durationStr) : null;

    await prisma.powerPlant.create({
      data: {
        name: name.trim(),
        city: city?.trim() || null,
        distributorCompany: distributorCompany?.trim() || null,
        tariffId: tariffId?.trim() || null,
        solcorId: solcorIdRaw?.trim() || null,
        capacityKw,
        specificYield,
        startDate: parseDate(dateStr?.trim()),
        durationYears,
        portfolioId: PORTFOLIO_ID,
        customerId: DEFAULT_CUSTOMER_ID,
        status: "active",
      },
    });
    created++;
    console.log(`  ✓ ${created}/${lines.length}: ${name.trim()}`);
  }

  console.log(`\nDone — ${created} plants imported to S-Invest 4`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  prisma.$disconnect();
  process.exit(1);
});
