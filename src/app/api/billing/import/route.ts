import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { UserRole } from "@prisma/client";
import { fetchInvoiceById, toFloat } from "@/lib/services/duemint.service";

function normalizeRut(rut: string) {
  return rut.replace(/[.\-]/g, "").toLowerCase().trim();
}

// GET /api/billing/import?duemintId=X&portfolioId=Y
// Fetches invoice from Duemint and returns a preview (no DB write)
export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== UserRole.MAESTRO) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const duemintId = searchParams.get("duemintId")?.trim();
  const portfolioId = searchParams.get("portfolioId");

  if (!duemintId || !portfolioId) {
    return NextResponse.json({ error: "duemintId y portfolioId son requeridos" }, { status: 400 });
  }

  const portfolio = await prisma.portfolio.findFirst({
    where: { id: Number(portfolioId), active: 1, duemintCompanyId: { not: null } },
    select: { id: true, name: true, duemintCompanyId: true },
  });

  if (!portfolio) {
    return NextResponse.json({ error: "Portafolio no encontrado o sin ID de Duemint configurado" }, { status: 404 });
  }

  // Check if already imported
  const existing = await prisma.invoice.findUnique({ where: { duemintId } });
  if (existing) {
    return NextResponse.json({ error: "Esta factura ya existe en el sistema" }, { status: 409 });
  }

  let inv;
  try {
    inv = await fetchInvoiceById(portfolio.duemintCompanyId!, duemintId);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error al conectar con Duemint";
    return NextResponse.json({ error: msg }, { status: 502 });
  }

  const rawTaxId = inv.clientTaxId ?? inv.client?.taxId ?? null;
  let customer: { id: number; name: string } | null = null;

  if (rawTaxId) {
    const allCustomers = await prisma.customer.findMany({
      where: { active: 1 },
      select: { id: true, name: true, rut: true },
    });
    const match = allCustomers.find((c) => normalizeRut(c.rut) === normalizeRut(rawTaxId));
    if (match) customer = { id: match.id, name: match.name };
  }

  return NextResponse.json({
    preview: {
      duemintId: String(inv.id),
      number: inv.number ?? null,
      clientTaxId: rawTaxId,
      clientName: inv.client?.name ?? null,
      issueDate: inv.issueDate ?? null,
      dueDate: inv.dueDate ?? null,
      statusName: inv.statusName ?? null,
      currency: inv.currency ?? null,
      total: toFloat(inv.total),
      amountDue: toFloat(inv.amountDue),
      net: toFloat(inv.net),
      taxes: toFloat(inv.taxes),
      url: inv.url ?? null,
    },
    customer,
    portfolioId: portfolio.id,
    portfolioName: portfolio.name,
  });
}

// POST /api/billing/import
// Confirms and saves the invoice to DB
export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== UserRole.MAESTRO) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  if (!body?.duemintId || !body?.portfolioId || !body?.customerId) {
    return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
  }

  const { duemintId, portfolioId, customerId } = body;

  // Guard: re-check not already imported
  const existing = await prisma.invoice.findUnique({ where: { duemintId: String(duemintId) } });
  if (existing) {
    return NextResponse.json({ error: "Esta factura ya existe en el sistema" }, { status: 409 });
  }

  const portfolio = await prisma.portfolio.findFirst({
    where: { id: Number(portfolioId), active: 1, duemintCompanyId: { not: null } },
    select: { duemintCompanyId: true },
  });

  if (!portfolio) {
    return NextResponse.json({ error: "Portafolio no válido" }, { status: 404 });
  }

  let inv;
  try {
    inv = await fetchInvoiceById(portfolio.duemintCompanyId!, String(duemintId));
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error al conectar con Duemint";
    return NextResponse.json({ error: msg }, { status: 502 });
  }

  const rawTaxId = inv.clientTaxId ?? inv.client?.taxId ?? null;
  const creditNote = inv.creditNote?.[0] ?? null;

  const invoice = await prisma.invoice.create({
    data: {
      duemintId: String(inv.id),
      customerId: Number(customerId),
      portfolioId: Number(portfolioId),
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
    },
  });

  return NextResponse.json({ success: true, invoiceId: invoice.id });
}
