/**
 * Report Extraction Service
 *
 * Extracts generation report data from Duemint invoice gloss fields:
 * 1. Parses the report URL from the gloss text
 * 2. Fetches the HTML report page from dplus
 * 3. Extracts "Producción Total" (kWh) from the HTML content
 * 4. Determines the report period (month before invoice createdAt)
 *
 * The dplus URLs serve HTML pages (not PDFs). Users can export to PDF
 * from the page itself via the "Exportar a PDF" button.
 */

import { SIC_EMISSION_FACTOR_TCO2_PER_MWH } from "@/lib/constants";

/**
 * Extract the dplus report URL from an invoice gloss field.
 * Returns null if no URL is found.
 */
export function extractReportUrl(gloss: string | null): string | null {
  if (!gloss) return null;

  const match = gloss.match(/https?:\/\/dplus\.deltactivos\.cl\/public\/reporte\/[a-zA-Z0-9]+/);
  return match?.[0] ?? null;
}

/**
 * Determine the report period from an invoice's createdAt date.
 * The report corresponds to the month BEFORE the invoice creation.
 * Example: createdAt 2026-03-30 → February 2026 (month=2, year=2026)
 */
export function getReportPeriod(createdAt: string | Date): { month: number; year: number } {
  const date = typeof createdAt === "string" ? new Date(createdAt) : createdAt;
  const prevMonth = new Date(date.getFullYear(), date.getMonth() - 1, 1);
  return {
    month: prevMonth.getMonth() + 1,
    year: prevMonth.getFullYear(),
  };
}

/**
 * Fetch the dplus report HTML page and extract kWh "Producción Total".
 * The page is an HTML report (not a PDF). We parse the text content
 * to find the generation value.
 *
 * Returns null if the page can't be fetched or the value can't be found.
 */
export async function extractKwhFromReportPage(url: string): Promise<number | null> {
  try {
    const res = await fetch(url, {
      redirect: "follow",
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; DashboardSolar/1.0)",
        "Accept": "text/html",
      },
    });

    if (!res.ok) return null;

    const html = await res.text();

    // Try patterns to find "Producción Total" and its associated kWh value in the HTML
    // The HTML structure is: <td> Producción Total </td><td></td><td> 36.899 </td>
    const patterns = [
      // Exact table structure: "Producción Total" in a <td>, then other <td>s with the number
      /[Pp]roducci[oó]n\s+[Tt]otal\s*<\/td>[\s\S]{0,200}?<td[^>]*>\s*(\d[\d.,]+)\s*<\/td>/i,
      // "Producción Total" followed by a number (possibly with HTML tags in between)
      /[Pp]roducci[oó]n\s+[Tt]otal[\s\S]{0,200}?(\d[\d.,]*)\s*(?:kWh|kwh)/i,
      // Table cell or span with "Producción Total" near a number
      /[Pp]roducci[oó]n\s+[Tt]otal[\s\S]{0,200}?(\d[\d.,]+)/i,
      // "Total Producción" variant
      /[Tt]otal\s+(?:de\s+)?[Pp]roducci[oó]n[\s\S]{0,200}?(\d[\d.,]+)/i,
    ];

    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match?.[1]) {
        const parsed = parseLocalizedNumber(match[1].trim());
        if (parsed !== null && parsed > 0) {
          return parsed;
        }
      }
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Parse a localized number string.
 * Handles: "10281", "10.281", "10,281", "10.281,5", "10,281.5"
 */
function parseLocalizedNumber(raw: string): number | null {
  let s = raw.replace(/\s/g, "");

  const lastComma = s.lastIndexOf(",");
  const lastDot = s.lastIndexOf(".");

  if (lastComma > lastDot) {
    // Chilean: dots are thousands, comma is decimal
    s = s.replace(/\./g, "").replace(",", ".");
  } else if (lastDot > lastComma) {
    // English: commas are thousands, dot is decimal
    s = s.replace(/,/g, "");
  } else {
    s = s.replace(/,/g, "");
  }

  const n = parseFloat(s);
  return isNaN(n) ? null : n;
}

/**
 * Calculate CO2 avoided from kWh generated.
 */
export function calculateCo2Avoided(kwhGenerated: number): number {
  return (kwhGenerated / 1000) * SIC_EMISSION_FACTOR_TCO2_PER_MWH;
}
