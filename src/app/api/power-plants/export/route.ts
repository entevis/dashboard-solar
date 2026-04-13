import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { UserRole } from "@prisma/client";
import * as XLSX from "xlsx";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== UserRole.MAESTRO) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const portfolioId = searchParams.get("portfolioId");
  const customerId = searchParams.get("customerId");
  const q = searchParams.get("q");

  const where: Record<string, unknown> = { active: 1 };
  if (portfolioId) where.portfolioId = parseInt(portfolioId);
  if (customerId) where.customerId = parseInt(customerId);
  if (q) where.name = { contains: q, mode: "insensitive" };

  const plants = await prisma.powerPlant.findMany({
    where,
    include: {
      portfolio: { select: { name: true } },
      customer: { select: { name: true } },
      address: true,
    },
    orderBy: { name: "asc" },
  });

  const rows = plants.map((p) => ({
    "Nombre": p.name,
    "Portafolio": p.portfolio.name,
    "Cliente": p.customer.name,
    "Estado": p.status === "active" ? "Activa" : p.status === "maintenance" ? "En mantenimiento" : p.status,
    "Comuna": p.city ?? "",
    "Ubicación": p.location ?? "",
    "Potencia (kWp)": p.capacityKw,
    "ID Solcor": p.solcorId ?? "",
    "Distribuidora": p.distributorCompany ?? "",
    "ID Tarifa": p.tariffId ?? "",
    "Fecha Inicio": p.startDate ? p.startDate.toISOString().split("T")[0] : "",
    "Duración (Años)": p.durationYears ?? "",
    "Rendimiento (kWh/kWp)": p.specificYield ?? "",
    "N° Paneles": p.panelCount ?? "",
    "Tipo Instalación": p.installationType ?? "",
    "Superficie (m²)": p.surfaceM2 ?? "",
    "Sector Económico": p.economicSector ?? "",
    "Sector Económico 2": p.economicSector2 ?? "",
    "Dirección": p.address?.address ?? "",
    "Referencia": p.address?.reference ?? "",
    "Ciudad (Dirección)": p.address?.city ?? "",
    "Provincia": p.address?.county ?? "",
    "País": p.address?.country ?? "",
  }));

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows);

  // Auto-size columns based on header length
  const colWidths = Object.keys(rows[0] ?? {}).map((key) => ({
    wch: Math.max(key.length + 2, 14),
  }));
  ws["!cols"] = colWidths;

  XLSX.utils.book_append_sheet(wb, ws, "Plantas");

  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  return new NextResponse(buf, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="plantas_${new Date().toISOString().split("T")[0]}.xlsx"`,
    },
  });
}
