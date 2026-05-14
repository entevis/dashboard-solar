import type { ParsedBoleta, MonthlyResult, MonthlyClientData, SavingsResult } from "./types";

interface FacturaData {
  periodMonth: number;
  periodYear: number;
  kwhGenerated: number;
  montoNeto: number;
  invoiceNumber?: string;
  hasInvoice: boolean;
}

export function calculateSavings(
  boletas: ParsedBoleta[],
  facturas: FacturaData[],
  plantName: string,
  selfConsumptionDiscountPct: number | null,
  injectionDiscountPct: number | null,
): SavingsResult {
  const fileErrors = boletas
    .filter((b) => b.error)
    .map((b) => ({ fileName: b.fileName, error: b.error! }));

  // Boletas parsed OK but period not detected — report them so the user knows
  for (const b of boletas) {
    if (!b.error && (!b.matchedYear || !b.matchedMonth)) {
      fileErrors.push({ fileName: b.fileName, error: "No se pudo detectar el período de consumo. Verifica que el PDF sea digital y de un formato compatible." });
    }
  }

  const validBoletas = boletas.filter((b) => !b.error && b.matchedYear && b.matchedMonth);

  // Detect multi-client distribution from any boleta that has Anexo III
  const distributionBoleta = validBoletas.find((b) => (b.distribution?.length ?? 0) > 0);
  const expectedClients = distributionBoleta?.distribution?.map((d) => d.clienteNum);

  const distributionPctMap = new Map<string, number>();
  if (distributionBoleta?.distribution) {
    for (const d of distributionBoleta.distribution) {
      distributionPctMap.set(d.clienteNum, d.percent);
    }
  }

  // Group boletas by month key
  const boletasByMonth = new Map<string, ParsedBoleta[]>();
  for (const b of validBoletas) {
    const key = `${b.matchedYear}-${b.matchedMonth}`;
    const arr = boletasByMonth.get(key) ?? [];
    arr.push(b);
    boletasByMonth.set(key, arr);
  }

  // Build factura lookup
  const facturaByMonth = new Map<string, FacturaData>();
  for (const f of facturas) {
    facturaByMonth.set(`${f.periodYear}-${f.periodMonth}`, f);
  }

  const months: MonthlyResult[] = [];
  const incompleteMths: SavingsResult["incompleteMths"] = [];

  for (const [key, monthBoletas] of boletasByMonth.entries()) {
    const [yearStr, monthStr] = key.split("-");
    const year = parseInt(yearStr);
    const month = parseInt(monthStr);

    const factura = facturaByMonth.get(key);
    if (!factura) {
      incompleteMths.push({ year, month, reason: "Sin reporte de generación S-Invest para este período — no se puede calcular el ahorro." });
      continue;
    }
    if (!factura.hasInvoice) {
      incompleteMths.push({ year, month, reason: "La generación está registrada pero S-Invest aún no ha emitido la factura para este período — se analizará cuando esté disponible." });
      continue;
    }

    // Validate all expected clients are present
    if (expectedClients && expectedClients.length > 0) {
      const presentClients = new Set(monthBoletas.map((b) => b.clienteNum).filter(Boolean));
      const missing = expectedClients.filter((cn) => !presentClients.has(cn));
      if (missing.length > 0) {
        incompleteMths.push({ year, month, reason: `Faltan boletas de cliente(s): ${missing.join(", ")}` });
        continue;
      }
    }

    // Identify main client (the one with inyección or distribution)
    const mainClientNum =
      distributionBoleta?.clienteNum ??
      monthBoletas.find((b) => b.inyeccionKwh > 0)?.clienteNum ??
      monthBoletas[0].clienteNum;

    const clients: MonthlyClientData[] = [];
    let sumOtrosCargos = 0;
    let sumMontoTotal = 0;
    let inyeccionesMain = 0;
    let sumConsumoKwh = 0;
    let tresCargosDistroRate = 0;
    let mainHasZeroConsumption = false;

    for (const b of monthBoletas) {
      const isMain = b.clienteNum === mainClientNum;

      // monto_consumos = all charges billed to the client (energy + transport + service +
      // estab + admin + potencia + factorPot). descuentoMes is the injection credit parsed
      // per-boleta — already correct from Anexo III distribution or the bill's discount lines.
      const monto_consumos =
        b.p1NetElectricidad + b.p1NetTransporte + b.p1NetServicioPub + b.p1NetFondoEstab +
        b.p1Admin + b.p1Potencia + b.p1FactorPot;
      const descuentoMes = b.descuentoMes;
      const monto_total = Math.max(0, monto_consumos + descuentoMes);
      const otros = b.p1Potencia + b.p1Admin + b.p1FactorPot;

      if (isMain) {
        if (b.consumoKwh > 0) {
          // Rate uses only variable charges (proportional to kWh) — potencia/admin are fixed
          // and handled separately in sumOtrosCargos for the counterfactual.
          tresCargosDistroRate =
            (b.p1NetElectricidad + b.p1NetTransporte + b.p1NetServicioPub + b.p1NetFondoEstab) /
            b.consumoKwh;
        } else {
          mainHasZeroConsumption = true;
        }
        inyeccionesMain = b.inyeccionKwh;
      }
      sumConsumoKwh += b.consumoKwh;
      sumOtrosCargos += otros;
      sumMontoTotal += monto_total;

      clients.push({
        clienteNum: b.clienteNum ?? "N/A",
        distribuidora: b.distribuidora ?? "Distribuidora",
        consumoKwh: b.consumoKwh,
        inyeccionKwh: isMain ? b.inyeccionKwh : 0,
        montoConsumos: monto_consumos,
        descuentoMes,
        montoTotal: monto_total,
        otrosCargos: otros,
        distributionPct: distributionPctMap.get(b.clienteNum ?? "") ?? null,
        isMain,
      });
    }

    if (mainHasZeroConsumption) {
      incompleteMths.push({ year, month, reason: "La boleta principal registra 0 kWh de consumo — no se puede calcular la tarifa variable para este período." });
      continue;
    }

    const totalConsumoMensual = factura.kwhGenerated + sumConsumoKwh - inyeccionesMain;
    const precioKwhSinvest = factura.kwhGenerated > 0 ? factura.montoNeto / factura.kwhGenerated : 0;
    const totalConsumoHipotetico = totalConsumoMensual * tresCargosDistroRate;
    const totalSinPlanta = totalConsumoHipotetico + sumOtrosCargos;
    const totalPagado = factura.montoNeto + sumMontoTotal;
    const ahorro = totalSinPlanta - totalPagado;

    months.push({
      year,
      month,
      invoiceNumber: factura.invoiceNumber,
      montoNetoSinvest: factura.montoNeto,
      kwhGenerados: factura.kwhGenerated,
      precioKwhSinvest,
      tresCargosDistro: tresCargosDistroRate,
      clients,
      totalConsumoMensual,
      totalConsumoHipotetico,
      totalSinPlanta,
      totalPagado,
      ahorro,
    });
  }

  months.sort((a, b) => a.year !== b.year ? a.year - b.year : a.month - b.month);

  // Last remanente from chronologically last valid boleta
  const sortedBoletas = [...validBoletas].sort((a, b) => {
    const aKey = (a.matchedYear ?? 0) * 100 + (a.matchedMonth ?? 0);
    const bKey = (b.matchedYear ?? 0) * 100 + (b.matchedMonth ?? 0);
    return bKey - aKey;
  });
  const remanente = sortedBoletas.find((b) => b.remanenteAcum !== undefined)?.remanenteAcum ?? 0;

  const totalAhorro = months.reduce((s, m) => s + m.ahorro, 0) + remanente;
  const totalSinPlanta = months.reduce((s, m) => s + m.totalSinPlanta, 0);
  const totalPagado = months.reduce((s, m) => s + m.totalPagado, 0);

  return {
    plantName,
    selfConsumptionDiscountPct,
    injectionDiscountPct,
    months,
    remanente,
    totalAhorro,
    totalSinPlanta,
    totalPagado,
    incompleteMths,
    fileErrors,
  };
}
