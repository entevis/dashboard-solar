import type { ParsedBoleta } from "./types";

function parseChileanNum(s: string): number {
  s = s.replace(/\s/g, "");
  if (s.includes(",")) {
    const [whole, dec] = s.split(",");
    return parseFloat(whole.replace(/\./g, "") + "." + dec);
  }
  return parseFloat(s.replace(/\./g, "")) || 0;
}

function findInt(text: string, pattern: RegExp): number {
  const m = text.match(pattern);
  if (!m) return 0;
  return parseInt(m[1].replace(/\./g, ""), 10) || 0;
}

function sumMatches(text: string, pattern: RegExp): number {
  let total = 0;
  for (const m of text.matchAll(pattern)) {
    total += parseInt(m[1].replace(/\./g, ""), 10) || 0;
  }
  return total;
}

function majorityMonth(startStr: string, endStr: string): { year: number; month: number } {
  const parseDate = (s: string) => {
    const [d, m, y] = s.split("-").map(Number);
    return new Date(y, m - 1, d);
  };
  const start = parseDate(startStr);
  const end = parseDate(endStr);
  const days: Record<string, number> = {};
  const cur = new Date(start);
  while (cur <= end) {
    const key = `${cur.getFullYear()}-${cur.getMonth() + 1}`;
    days[key] = (days[key] ?? 0) + 1;
    cur.setDate(cur.getDate() + 1);
  }
  const [best] = Object.entries(days).sort((a, b) => b[1] - a[1]);
  const [y, m] = best[0].split("-").map(Number);
  return { year: y, month: m };
}

function normDate(s: string): string {
  s = s.replace(/\//g, "-");
  const parts = s.split("-");
  if (parts[2].length === 2) parts[2] = "20" + parts[2];
  return parts.join("-");
}

export function parseBoleta(text: string, fileName: string): ParsedBoleta {
  const base: ParsedBoleta = {
    fileName,
    p1NetElectricidad: 0,
    p1NetTransporte: 0,
    p1NetServicioPub: 0,
    p1NetFondoEstab: 0,
    p1Admin: 0,
    p1Potencia: 0,
    p1FactorPot: 0,
    descuentoMes: 0,
    consumoKwh: 0,
    inyeccionKwh: 0,
  };

  // Period — try several common CEC/CGE/Chilquinta formats.
  // CEC secondary-client bills place the dates in a table row separated from
  // the "Período de lectura:" label, formatted as "01/09/2025 - 30/09/2025".
  const periodPatterns = [
    // Label immediately followed by dates (main client format)
    /Per[íi]odo\s+de\s+(?:[Ll]ectura|[Ff]acturac[ió]n|[Cc]onsumo)\s*[:.]?\s*(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})\s*[-a]\s*(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})/i,
    /Per[íi]odo\s*[:.]?\s*(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})\s*[-a]\s*(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})/i,
    /[Dd]esde\s+(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})\s+[Hh]asta\s+(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})/i,
    /(\d{1,2}[-/]\d{1,2}[-/]\d{4})\s+al\s+(\d{1,2}[-/]\d{1,2}[-/]\d{4})/i,
    // Standalone date range "DD/MM/YYYY - DD/MM/YYYY" (CEC secondary client table row)
    /(\d{1,2}\/\d{1,2}\/\d{4})\s*-\s*(\d{1,2}\/\d{1,2}\/\d{4})/,
    // Hyphen-separated standalone range "DD-MM-YYYY - DD-MM-YYYY"
    /(\d{2}-\d{2}-\d{4})\s+-\s+(\d{2}-\d{2}-\d{4})/,
  ];
  for (const pat of periodPatterns) {
    const pm = text.match(pat);
    if (pm) {
      base.periodoInicio = normDate(pm[1]);
      base.periodoFin = normDate(pm[2]);
      const { year, month } = majorityMonth(base.periodoInicio, base.periodoFin);
      base.matchedYear = year;
      base.matchedMonth = month;
      break;
    }
  }

  // Client number
  const cm =
    text.match(/N[°º]\s*[Cc]liente\s*[:.]?\s*(\d+)/) ??
    text.match(/N[°º]\s*[Dd]e\s+[Cc]liente\s*[:.]?\s*(\d+)/) ??
    text.match(/[Cc]liente\s*[Nn][°º]?\s*[:.]?\s*(\d+)/) ??
    text.match(/[Cc]uenta\s*[Nn][°º]?\s*[:.]?\s*(\d+)/);
  if (cm) base.clienteNum = cm[1];
  // Fallback: extract from filename (e.g. "702879000-33-398648-10529.pdf" → "10529")
  if (!base.clienteNum) {
    const fnMatch = fileName.match(/[-_.](\d{4,7})\.pdf$/i);
    if (fnMatch) base.clienteNum = fnMatch[1];
  }

  // Distribuidora
  const upper = text.toUpperCase();
  if (upper.includes("CGE") || upper.includes("76.411.321")) base.distribuidora = "CGE";
  else if (upper.includes("CEC") || upper.includes("COOPERATIVA ELÉCTR") || upper.includes("COOPERATIVA ELECTR")) base.distribuidora = "CEC";
  else if (upper.includes("CHILQUINTA")) base.distribuidora = "Chilquinta";
  else if (upper.includes("ENEL")) base.distribuidora = "Enel";
  else if (upper.includes("SAESA")) base.distribuidora = "SAESA";
  else if (upper.includes("FRONTEL")) base.distribuidora = "Frontel";
  else base.distribuidora = "Distribuidora";

  // Electricity charge — sumMatches handles AT4.3 tariffs that split into HP + HFP lines.
  // Covers: "Electricidad Consumida", "Cargo por/de Energía [Activa] [HP/HFP/P1/P2]", "Energía Activa ..."
  const elec = sumMatches(
    text,
    /(?:Electricidad\s+Consumida|Cargo\s+(?:de|por)\s+Energ[íi]a(?:\s+[Aa]ctiva)?(?:\s+(?:HP|HFP|P[12]))?|Energ[íi]a\s+[Aa]ctiva(?:\s+(?:HP|HFP|P[12]))?)\b[^$:\n]*\$\s*([\d.]+)/gi,
  );
  const elecRev = sumMatches(
    text,
    /Rev\.\s+(?:Electricidad\s+Consumida|Cargo\s+(?:de|por)\s+Energ[íi]a)[^\n]*\$\s*-\s*([\d.]+)/gi,
  );
  base.p1NetElectricidad = Math.max(0, elec - elecRev);

  // Transport charge — covers "Uso del Sistema de Distribución/Transmisión" (CEC/CGE AT4.x)
  const transp = sumMatches(
    text,
    /(?:Transporte\s+de\s+Electricidad|Cargo\s+(?:de|por)\s+(?:[Uu]so\s+del\s+[Ss]istema(?:\s+de\s+(?:[Dd]istribuci[oó]n|[Tt]ransmisi[oó]n))?|[Tt]ransmisi[oó]n\s+de\s+Electricidad))\b[^$:\n]*\$\s*([\d.]+)/gi,
  );
  const transpRev = sumMatches(
    text,
    /Rev\.\s+(?:Transporte\s+de\s+Electricidad|Cargo\s+(?:de|por)\s+(?:[Uu]so\s+del\s+[Ss]istema|[Tt]ransmisi[oó]n))[^\n]*\$\s*-\s*([\d.]+)/gi,
  );
  base.p1NetTransporte = Math.max(0, transp - transpRev);

  // Public service charge
  const serv = findInt(text, /Cargo\s+(?:de|por)\s+[Ss]ervicio\s+[Pp][úu]blico\b[^$:\n]*\$\s*([\d.]+)/i);
  const servRev = findInt(text, /Rev\.\s+Cargo\s+(?:de|por)\s+[Ss]ervicio\s+[Pp][úu]blico[^\n]*\$\s*-\s*([\d.]+)/i);
  base.p1NetServicioPub = Math.max(0, serv - servRev);

  // Stabilization fund — also matches FEPE abbreviation used by some distributors
  const fondo = findInt(
    text,
    /(?:(?:Cargo\s+)?Fondo\s+(?:de\s+)?Estabilizaci[oó]n(?:\s+de\s+Precios(?:\s+de\s+la\s+Energ[íi]a)?)?|FEPE?)\b[^$:\n]*\$\s*([\d.]+)/i,
  );
  const fondoRev = findInt(
    text,
    /Rev\.\s+(?:Cargo\s+)?Fondo\s+(?:de\s+)?Estabilizaci[oó]n[^\n]*\$\s*-\s*([\d.]+)/i,
  );
  base.p1NetFondoEstab = Math.max(0, fondo - fondoRev);

  // Admin / fixed charge — "Cargo Básico" and "Cargo de Administración" used by CEC/SAESA
  base.p1Admin = findInt(
    text,
    /(?:Administraci[oó]n\s+del\s+Servicio|Cargo\s+(?:[Ff]ijo\s+[Mm]ensual|[Bb][áa]sico|de\s+[Aa]dministraci[oó]n))\b[^$:\n]*\$\s*([\d.]+)/i,
  );

  // Demand/power charges — sum all matches
  base.p1Potencia =
    sumMatches(text, /Cargo\s+(?:de|por)\s+Potencia\b[^$:\n]*\$\s*([\d.]+)/gi) +
    sumMatches(text, /Cargo\s+(?:de|por|)\s*Demanda\s+M[áa]xima\b[^$:\n]*\$\s*([\d.]+)/gi) +
    sumMatches(text, /Demanda\s+m[áa]x(?:ima)?\.?\s+(?:HP|suministrada)\b[^$:\n]*\$\s*([\d.]+)/gi);

  // Factor de potencia: CEC label includes "periodo MM-YYYY: X.XX" before the amount —
  // must allow colons, so use [^\n]* instead of [^$:\n]*.
  // Interés por mora y recuperación gastos is also included here as it forms part of
  // the total charges billed to the client.
  base.p1FactorPot =
    sumMatches(text, /Factor\s+de\s+[Pp]otencia\b[^\n]*\$\s*([\d.]+)/gi) +
    sumMatches(text, /[Ii]nter[eé]s\s+por\s+mora[^$\n]*\$\s*([\d.]+)/gi);

  // Injection discount (negative value in bill)
  const descPatterns = [
    /Descto\.\s+utilizado\s+en\s+el\s+mes[^\n]*?\$\s*-\s*([\d.]+)/i,
    /Descuentos?\s+del\s+[Mm]es\s+por\s+[Gg]eneraci[oó]n\s+[Dd]istribuida\s*\$\s*-\s*([\d.]+)/i,
    /Descuento\s+por\s+generaci[oó]n\s+distribuida\s*\$?\s*-?\s*([\d.]+)/i,
  ];
  for (const pat of descPatterns) {
    const dm = text.match(pat);
    if (dm) {
      base.descuentoMes = -parseInt(dm[1].replace(/\./g, ""), 10);
      break;
    }
  }

  // Consumption kWh
  // Primary: label immediately followed by value (most distributors)
  // Fallback: CEC table layout places the total just before "Consumo de referencia:"
  const consMatch =
    text.match(/Consumo\s+total\s+del\s+mes\s*=?\s*([\d.,]+)/i) ??
    text.match(/Electricidad\s+Consumida\s*\(([\d.,]+)\s*kWh\)/i) ??
    text.match(/([\d.,]+)\s+kWh\s+[Cc]onsumo\s+de\s+referencia/);
  if (consMatch) base.consumoKwh = parseChileanNum(consMatch[1]);

  // Injection kWh
  // Primary: Anexo II item 2.2 or explicit "Inyección" label
  // CGE: "Mi consumo" table marks injection rows as "N kWh (Inyecciones)"
  // CEC: table marks injection rows as "N kWh (iny.)"
  const inyecMatch =
    text.match(/([\d.,]+)\s+kWh\s*\([Ii]nyecciones?\)/i) ??
    text.match(/([\d.,]+)\s+kWh\s*\(iny\.\)/i) ??
    text.match(/Inyecci[oó]n\s+al\s+[Ss]istema[^\d\n]{0,30}([\d.,]+)\s*kWh/i) ??
    text.match(/(?<!\d)2\.2[^\d\n]{0,30}([\d.,]+)\s*kWh/i);
  if (inyecMatch) base.inyeccionKwh = parseChileanNum(inyecMatch[1]);

  // Accumulated remainder
  const remMatch =
    text.match(/[Rr]emanente\s+[Aa]cumulado[^\d\n]*([\d.]+)/i) ??
    text.match(/[Aa]cumulado\s+[Mm]es\s+[Ss]iguiente[^\d\n]*([\d.]+)/i);
  if (remMatch) base.remanenteAcum = parseInt(remMatch[1].replace(/\./g, ""), 10);

  // Anexo V — pre-computed per-client settlement totals (present in CEC and other distributors).
  // First amount = total consumption charges; second amount = injection credit applied.
  const anexoVStart = text.search(/ANEXO\s+(?:V|5)\b/i);
  if (anexoVStart >= 0) {
    const section = text.slice(anexoVStart, Math.min(text.length, anexoVStart + 800));
    // Prefer $ prefixed amounts; fall back to bare Chilean-format numbers (X.XXX or X.XXX.XXX)
    let amounts: number[] = [];
    for (const m of section.matchAll(/\$\s*(\d[\d.]*)/g)) {
      const n = parseInt(m[1].replace(/\./g, ""), 10);
      if (n > 1000) amounts.push(n);
    }
    if (amounts.length < 2) {
      amounts = [];
      for (const m of section.matchAll(/\b(\d{1,4}(?:\.\d{3})+)\b/g)) {
        const n = parseInt(m[1].replace(/\./g, ""), 10);
        if (n > 1000) amounts.push(n);
      }
    }
    if (amounts.length >= 1) base.montoConsumosAnexo5 = amounts[0];
    // Second amount (injection credit) is also captured by Anexo III in the calculator,
    // but set it here too as a fallback for single-client plants.
    if (amounts.length >= 2 && base.descuentoMes === 0) {
      base.descuentoMes = -amounts[1];
    }
  }

  // Anexo III multi-client distribution
  if (/Distribuci[oó]n\s+de\s+inyecciones|ANEXO\s+III/i.test(text)) {
    const distribution: { clienteNum: string; percent: number; monto: number }[] = [];
    for (const line of text.split("\n")) {
      const dm = line.match(/\s*(\d{4,7})\s+(\d{1,3})\s+([\d.]+)\s*$/);
      if (dm) {
        distribution.push({
          clienteNum: dm[1],
          percent: parseInt(dm[2], 10),
          monto: parseInt(dm[3].replace(/\./g, ""), 10),
        });
      }
    }
    if (distribution.length > 0) base.distribution = distribution;
  }

  return base;
}
