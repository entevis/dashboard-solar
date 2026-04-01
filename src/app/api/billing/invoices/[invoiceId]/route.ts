import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { fetchInvoiceById, toFloat } from "@/lib/services/duemint.service";

export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ invoiceId: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { invoiceId } = await params;
  const id = parseInt(invoiceId);
  if (isNaN(id)) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  const invoice = await prisma.invoice.findUnique({
    where: { id },
    select: { id: true, duemintId: true, portfolioId: true },
  });

  if (!invoice || !invoice.duemintId) {
    return NextResponse.json({ error: "Factura no encontrada" }, { status: 404 });
  }

  if (!invoice.portfolioId) {
    return NextResponse.json({ error: "La factura no tiene portafolio asociado" }, { status: 400 });
  }

  const portfolio = await prisma.portfolio.findUnique({
    where: { id: invoice.portfolioId },
    select: { duemintCompanyId: true },
  });

  if (!portfolio?.duemintCompanyId) {
    return NextResponse.json({ error: "El portafolio no tiene ID de Duemint configurado" }, { status: 400 });
  }

  let inv;
  try {
    inv = await fetchInvoiceById(portfolio.duemintCompanyId, invoice.duemintId);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error al conectar con Duemint";
    return NextResponse.json({ error: msg }, { status: 502 });
  }

  const creditNote = inv.creditNote?.[0] ?? null;

  const updated = await prisma.invoice.update({
    where: { id },
    data: {
      number: inv.number ?? null,
      clientTaxId: inv.clientTaxId ?? inv.client?.taxId ?? null,
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
    select: {
      id: true,
      statusName: true,
      statusCode: true,
      total: true,
      amountDue: true,
      paidAmount: true,
      dueDate: true,
    },
  });

  return NextResponse.json({ success: true, invoice: updated });
}
