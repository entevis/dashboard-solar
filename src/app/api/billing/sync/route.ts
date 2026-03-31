import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { UserRole } from "@prisma/client";
import { fetchAllInvoices, toFloat } from "@/lib/services/duemint.service";
import { logAction } from "@/lib/services/audit.service";

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== UserRole.MAESTRO) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const incremental: boolean = body.mode !== "full";

  const portfolios = await prisma.portfolio.findMany({
    where: { active: 1, duemintCompanyId: { not: null } },
    select: { id: true, name: true, duemintCompanyId: true },
  });

  if (portfolios.length === 0) {
    return NextResponse.json({ error: "No portfolios configured with a Duemint company ID" }, { status: 400 });
  }

  const customers = await prisma.customer.findMany({
    where: { active: 1 },
    select: { id: true, rut: true },
  });

  function normalizeRut(rut: string) {
    return rut.replace(/[.\-]/g, "").toLowerCase().trim();
  }

  const customerByRut = new Map<string, number>();
  for (const c of customers) {
    customerByRut.set(normalizeRut(c.rut), c.id);
  }

  // In incremental mode, pre-load all existing duemintIds to skip them
  const existingIds = new Set<string>();
  if (incremental) {
    const existing = await prisma.invoice.findMany({ select: { duemintId: true } });
    for (const e of existing) existingIds.add(e.duemintId);
  }

  let totalCreated = 0;
  let totalUpdated = 0;
  let totalSkipped = 0;
  const errors: string[] = [];

  for (const portfolio of portfolios) {
    let invoices;
    try {
      invoices = await fetchAllInvoices(portfolio.duemintCompanyId!);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      errors.push(`Portfolio "${portfolio.name}": ${msg}`);
      continue;
    }

    for (const inv of invoices) {
      if (!inv.id) { totalSkipped++; continue; }

      const duemintId = String(inv.id);

      // Incremental: skip invoices already in DB
      if (incremental && existingIds.has(duemintId)) {
        totalSkipped++;
        continue;
      }

      const rawTaxId = inv.clientTaxId ?? inv.client?.taxId ?? null;
      const customerId = rawTaxId
        ? customerByRut.get(normalizeRut(rawTaxId)) ?? null
        : null;

      if (!customerId) { totalSkipped++; continue; }

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

      if (incremental) {
        await prisma.invoice.create({ data: { ...data, duemintId } });
        totalCreated++;
      } else {
        const existing = await prisma.invoice.findUnique({ where: { duemintId } });
        if (existing) {
          await prisma.invoice.update({ where: { duemintId }, data });
          totalUpdated++;
        } else {
          await prisma.invoice.create({ data: { ...data, duemintId } });
          totalCreated++;
        }
      }
    }
  }

  logAction(user.id, "SYNC", "invoices", undefined, {
    mode: incremental ? "incremental" : "full",
    portfolios: portfolios.length,
    created: totalCreated,
    updated: totalUpdated,
    skipped: totalSkipped,
    errors,
  });

  return NextResponse.json({
    success: true,
    mode: incremental ? "incremental" : "full",
    created: totalCreated,
    updated: totalUpdated,
    skipped: totalSkipped,
    ...(errors.length > 0 && { errors }),
  });
}
