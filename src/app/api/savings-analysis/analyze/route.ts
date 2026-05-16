import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { getAccessiblePowerPlantIds } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { parseBoleta } from "@/lib/savings/boleta-parser";
import { calculateSavings } from "@/lib/savings/calculator";

export const maxDuration = 60;

// pdfjs-dist executes `new DOMMatrix` at module-init level.
// DOMMatrix is not available in Node.js < 22; polyfill it so the module loads.
if (typeof globalThis.DOMMatrix === "undefined") {
  class NodeDOMMatrix {
    a = 1; b = 0; c = 0; d = 1; e = 0; f = 0;
    constructor(init?: number[] | string) {
      if (Array.isArray(init) && init.length === 6) {
        [this.a, this.b, this.c, this.d, this.e, this.f] = init as [number,number,number,number,number,number];
      }
    }
    invertSelf() { return this; }
    multiplySelf() { return this; }
    preMultiplySelf() { return this; }
    translate(tx = 0, ty = 0) { return new NodeDOMMatrix([this.a, this.b, this.c, this.d, this.e + tx, this.f + ty]); }
    scale(sx = 1, sy = 1) { return new NodeDOMMatrix([this.a * sx, this.b * sy, this.c * sx, this.d * sy, this.e, this.f]); }
    rotate() { return new NodeDOMMatrix(); }
    getTransform() { return { a: this.a, b: this.b, c: this.c, d: this.d, e: this.e, f: this.f }; }
  }
  (globalThis as Record<string, unknown>).DOMMatrix = NodeDOMMatrix;
}

function normalizeDiscount(raw: number | null | undefined): number | null {
  if (raw === null || raw === undefined) return null;
  return raw > 1 ? raw : raw * 100;
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      return NextResponse.json({ error: "Solicitud inválida" }, { status: 400 });
    }

    const plantIdRaw = formData.get("plantId");
    const plantId = plantIdRaw ? parseInt(String(plantIdRaw), 10) : NaN;
    if (isNaN(plantId)) return NextResponse.json({ error: "plantId inválido" }, { status: 400 });

    const accessible = await getAccessiblePowerPlantIds(user);
    if (accessible !== "all" && !accessible.includes(plantId)) {
      return NextResponse.json({ error: "Sin acceso a esta planta" }, { status: 403 });
    }

    const files = formData.getAll("files") as File[];
    if (files.length === 0) return NextResponse.json({ error: "No se recibieron archivos" }, { status: 400 });

    const { PDFParse } = await import("pdf-parse");
    const parsedBoletas = await Promise.all(
      files.map(async (file) => {
        const buffer = Buffer.from(await file.arrayBuffer());
        try {
          const parser = new PDFParse({ data: buffer });
          const { text } = await parser.getText({ first: 10 });
          if (!text || text.trim().length < 50) {
            return {
              fileName: file.name,
              error: "PDF escaneado o sin texto extraíble — solo se aceptan PDFs digitales.",
              p1NetElectricidad: 0, p1NetTransporte: 0, p1NetServicioPub: 0,
              p1NetFondoEstab: 0, p1Admin: 0, p1Potencia: 0, p1FactorPot: 0,
              descuentoMes: 0, consumoKwh: 0, inyeccionKwh: 0,
            };
          }
          const boleta = parseBoleta(text, file.name);
          console.log("[boleta-debug]", file.name, {
            clienteNum: boleta.clienteNum,
            matchedYear: boleta.matchedYear,
            matchedMonth: boleta.matchedMonth,
            consumoKwh: boleta.consumoKwh,
            inyeccionKwh: boleta.inyeccionKwh,
            montoConsumosAnexo5: boleta.montoConsumosAnexo5,
            p1NetElectricidad: boleta.p1NetElectricidad,
            p1NetTransporte: boleta.p1NetTransporte,
            p1NetServicioPub: boleta.p1NetServicioPub,
            p1NetFondoEstab: boleta.p1NetFondoEstab,
            p1Admin: boleta.p1Admin,
            p1Potencia: boleta.p1Potencia,
            p1FactorPot: boleta.p1FactorPot,
            descuentoMes: boleta.descuentoMes,
            distribution: boleta.distribution,
          });
          return boleta;
        } catch (fileErr) {
          console.error("[savings-analysis] PDF parse error:", file.name, fileErr);
          const errDetail = fileErr instanceof Error ? `${fileErr.name}: ${fileErr.message}` : String(fileErr);
          return {
            fileName: file.name,
            error: `Error al leer el archivo: ${errDetail}`,
            p1NetElectricidad: 0, p1NetTransporte: 0, p1NetServicioPub: 0,
            p1NetFondoEstab: 0, p1Admin: 0, p1Potencia: 0, p1FactorPot: 0,
            descuentoMes: 0, consumoKwh: 0, inyeccionKwh: 0,
          };
        }
      })
    );

    const plant = await prisma.powerPlant.findUnique({
      where: { id: plantId },
      select: { name: true, selfConsumptionDiscount: true, injectionDiscount: true },
    });
    if (!plant) return NextResponse.json({ error: "Planta no encontrada" }, { status: 404 });

    const reports = await prisma.generationReport.findMany({
      where: { powerPlantId: plantId, active: 1 },
      select: { periodMonth: true, periodYear: true, kwhGenerated: true, duemintId: true },
    });

    const duemintIds = reports.map((r) => r.duemintId).filter(Boolean) as string[];
    const invoices = duemintIds.length > 0
      ? await prisma.invoice.findMany({
          where: { duemintId: { in: duemintIds }, active: 1 },
          select: { duemintId: true, net: true, number: true, amountCredit: true, creditNoteNumber: true },
        })
      : [];

    const invoiceByDuemint = new Map(invoices.map((i) => [i.duemintId, i]));

    const facturas = reports
      .filter((r) => r.periodMonth && r.periodYear && r.kwhGenerated)
      .map((r) => {
        const invoice = r.duemintId ? (invoiceByDuemint.get(r.duemintId) ?? null) : null;
        return {
          periodMonth: r.periodMonth!,
          periodYear: r.periodYear!,
          kwhGenerated: r.kwhGenerated!,
          montoNeto: (invoice?.net ?? 0) - Math.round((invoice?.amountCredit ?? 0) / 1.19),
          invoiceNumber: invoice?.number ?? undefined,
          creditNoteNumber: (invoice?.amountCredit ?? 0) > 0 ? (invoice?.creditNoteNumber ?? undefined) : undefined,
          creditNoteTotal: (invoice?.amountCredit ?? 0) > 0 ? (invoice?.amountCredit ?? undefined) : undefined,
          hasInvoice: invoice !== null,
        };
      });

    const selfConsumptionDiscountPct = normalizeDiscount(plant.selfConsumptionDiscount);
    const injectionDiscountPct = normalizeDiscount(plant.injectionDiscount);

    const result = calculateSavings(parsedBoletas, facturas, plant.name, selfConsumptionDiscountPct, injectionDiscountPct);
    return NextResponse.json(result);
  } catch (err) {
    console.error("[savings-analysis] unhandled error:", err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `Error interno: ${message}` }, { status: 500 });
  }
}
