import { PrismaClient } from "@prisma/client";
import { readFileSync } from "fs";
import { resolve } from "path";

// Load .env.local manually
const envPath = resolve(process.cwd(), ".env.local");
const envContent = readFileSync(envPath, "utf-8");
for (const line of envContent.split("\n")) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const [key, ...rest] = trimmed.split("=");
  process.env[key.trim()] = rest.join("=").trim().replace(/^"|"$/g, "");
}

const prisma = new PrismaClient();
const BASE_URL = "https://api.duemint.com/api/v1";
const TOKEN = process.env.DUEMINT_API_TOKEN;

function normalizeRut(rut) {
  return rut.replace(/[.\-]/g, "").toLowerCase().trim();
}

function toFloat(val) {
  if (val == null) return null;
  const n = typeof val === "number" ? val : parseFloat(val);
  return isNaN(n) ? null : n;
}

async function fetchPage(companyId, page) {
  const res = await fetch(
    `${BASE_URL}/collection-documents?page=${page}&per_page=100`,
    {
      headers: {
        accept: "application/json",
        Authorization: `Bearer ${TOKEN}`,
        "X-Duemint-Company-Id": companyId,
      },
    }
  );
  if (!res.ok) throw new Error(`HTTP ${res.status} (company ${companyId}, page ${page})`);
  return res.json();
}

async function fetchAllForCompany(companyId) {
  const first = await fetchPage(companyId, 1);
  const totalPages = first.records?.pages ?? 1;
  const totalRecords = first.records?.totalRecords ?? 0;
  console.log(`  → ${totalRecords} facturas en ${totalPages} páginas`);

  const all = [...(first.items ?? [])];
  for (let page = 2; page <= totalPages; page++) {
    process.stdout.write(`  Página ${page}/${totalPages}...\r`);
    const data = await fetchPage(companyId, page);
    all.push(...(data.items ?? []));
  }
  process.stdout.write("\n");
  return all;
}

async function main() {
  // Load portfolios with duemintCompanyId
  const portfolios = await prisma.portfolio.findMany({
    where: { active: 1, duemintCompanyId: { not: null } },
    select: { id: true, name: true, duemintCompanyId: true },
  });

  console.log(`\nPortafolios configurados: ${portfolios.length}`);
  for (const p of portfolios) {
    console.log(`  - ${p.name} (company: ${p.duemintCompanyId})`);
  }

  // Build RUT → customerId map
  const customers = await prisma.customer.findMany({
    where: { active: 1 },
    select: { id: true, rut: true },
  });
  const customerByRut = new Map();
  for (const c of customers) {
    customerByRut.set(normalizeRut(c.rut), c.id);
  }
  console.log(`\nClientes en DB: ${customers.length}`);

  let totalCreated = 0;
  let totalUpdated = 0;
  let totalSkipped = 0;

  for (const portfolio of portfolios) {
    console.log(`\n📂 ${portfolio.name} (company ${portfolio.duemintCompanyId})`);
    const invoices = await fetchAllForCompany(portfolio.duemintCompanyId);

    let created = 0, updated = 0, skipped = 0;

    for (const inv of invoices) {
      if (!inv.id) { skipped++; continue; }

      const rawTaxId = inv.clientTaxId ?? inv.client?.taxId ?? null;
      const customerId = rawTaxId
        ? customerByRut.get(normalizeRut(rawTaxId)) ?? null
        : null;

      if (!customerId) { skipped++; continue; }

      const creditNote = inv.creditNote?.[0] ?? null;
      const data = {
        customerId,
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
      };

      const existing = await prisma.invoice.findUnique({
        where: { duemintId: String(inv.id) },
        select: { id: true },
      });

      if (existing) {
        await prisma.invoice.update({ where: { duemintId: String(inv.id) }, data });
        updated++;
      } else {
        await prisma.invoice.create({ data: { ...data, duemintId: String(inv.id) } });
        created++;
      }
    }

    console.log(`  ✓ ${created} creadas · ${updated} actualizadas · ${skipped} sin cliente`);
    totalCreated += created;
    totalUpdated += updated;
    totalSkipped += skipped;
  }

  console.log(`\n✅ SYNC COMPLETO`);
  console.log(`   Creadas:     ${totalCreated}`);
  console.log(`   Actualizadas: ${totalUpdated}`);
  console.log(`   Sin cliente:  ${totalSkipped}`);
}

main()
  .catch((e) => { console.error("❌ Error:", e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
