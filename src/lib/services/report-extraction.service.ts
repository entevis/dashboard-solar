/**
 * Report Extraction Service
 *
 * Extracts generation report data from Duemint invoice gloss fields:
 * 1. Parses the report URL from the gloss text
 * 2. Fetches the HTML report page from dplus
 * 3. Extracts "Producción Total" (kWh) and "Cantidad evitada de CO2" from HTML
 * 4. Determines the report period (month before invoice createdAt)
 *
 * The dplus report pages are Vue.js rendered HTML with data-v-* attributes
 * on all elements. The key data lives in two tables:
 *
 * Tabla 1.1 - Resumen del Mes:
 *   <td data-v-xxx=""> Cantidad evitada de CO2<!----></td>
 *   <td data-v-xxx=""> 15,17 </td>
 *   <td data-v-xxx="">[ton]</td>
 *
 * Tabla 1.2 - Resumen de días relevantes:
 *   <td data-v-xxx=""> Producción Total </td>
 *   <td data-v-xxx=""></td>
 *   <td data-v-xxx=""> 60.686 </td>
 */

import { SIC_EMISSION_FACTOR_TCO2_PER_MWH } from "@/lib/constants";

/**
 * Extract the dplus report URL from an invoice gloss field.
 */
export function extractReportUrl(gloss: string | null): string | null {
  if (!gloss) return null;
  const match = gloss.match(/https?:\/\/dplus\.deltactivos\.cl\/public\/reporte\/[a-zA-Z0-9]+/);
  return match?.[0] ?? null;
}

/**
 * Determine the report period from an invoice's createdAt date.
 * The report corresponds to the month BEFORE the invoice creation.
 */
export function getReportPeriod(createdAt: string | Date): { month: number; year: number } {
  const date = typeof createdAt === "string" ? new Date(createdAt) : createdAt;
  const prevMonth = new Date(date.getFullYear(), date.getMonth() - 1, 1);
  return {
    month: prevMonth.getMonth() + 1,
    year: prevMonth.getFullYear(),
  };
}

interface ReportData {
  kwhGenerated: number | null;
  co2Avoided: number | null;
}

/**
 * Fetch the dplus report HTML page and extract kWh and CO2.
 */
export async function extractDataFromReportPage(url: string): Promise<ReportData> {
  try {
    const res = await fetch(url, {
      redirect: "follow",
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; DashboardSolar/1.0)",
        "Accept": "text/html",
      },
    });

    if (!res.ok) return { kwhGenerated: null, co2Avoided: null };

    const html = await res.text();

    const kwhGenerated = extractKwh(html);
    const co2Avoided = extractCo2(html);

    return { kwhGenerated, co2Avoided };
  } catch {
    return { kwhGenerated: null, co2Avoided: null };
  }
}

/**
 * Extract "Producción Total" kWh from HTML.
 *
 * Structure:
 *   <td data-v-xxx=""> Producción Total </td>
 *   <td data-v-xxx=""></td>
 *   <td data-v-xxx=""> 60.686 </td>
 *
 * The number is in the third <td> after "Producción Total".
 * The <td> tags have Vue scoped attributes like data-v-b9adabf9="".
 */
function extractKwh(html: string): number | null {
  // Match: "Producción Total" in a <td>, then skip 1-2 <td> tags, find the one with a number
  const pattern = /Producci[oó]n\s+Total\s*<\/td>\s*(?:<td[^>]*>\s*<\/td>\s*)?<td[^>]*>\s*([\d.,]+)\s*<\/td>/i;
  const match = html.match(pattern);
  if (match?.[1]) {
    return parseChileanNumber(match[1].trim());
  }
  return null;
}

/**
 * Extract "Cantidad evitada de CO2" from HTML.
 *
 * Structure:
 *   <td data-v-xxx=""> Cantidad evitada de CO2<!----></td>
 *   <td data-v-xxx=""> 15,17 </td>
 *   <td data-v-xxx="">[ton]</td>
 *
 * The number is in the second <td> right after the label.
 */
function extractCo2(html: string): number | null {
  // Match: "Cantidad evitada de CO2" (possibly with <!-- --> comment), then next <td> with number
  const pattern = /Cantidad\s+evitada\s+de\s+CO2[\s\S]{0,30}?<\/td>\s*<td[^>]*>\s*([\d.,]+)\s*<\/td>/i;
  const match = html.match(pattern);
  if (match?.[1]) {
    return parseChileanNumber(match[1].trim());
  }
  return null;
}

/**
 * Parse a Chilean-format number.
 * Chilean format uses dots as thousands separator and comma as decimal.
 * Examples: "60.686" → 60686, "15,17" → 15.17, "1.234,56" → 1234.56
 */
function parseChileanNumber(raw: string): number | null {
  // Remove dots (thousands separators), replace comma with dot (decimal)
  const normalized = raw.replace(/\./g, "").replace(",", ".");
  const n = parseFloat(normalized);
  return isNaN(n) ? null : n;
}

/**
 * Calculate CO2 avoided from kWh generated (fallback if not extracted from HTML).
 */
export function calculateCo2Avoided(kwhGenerated: number): number {
  return (kwhGenerated / 1000) * SIC_EMISSION_FACTOR_TCO2_PER_MWH;
}
