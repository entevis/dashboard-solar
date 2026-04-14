/**
 * Report Extraction Service
 *
 * Extracts generation report data from Duemint invoice gloss fields:
 * 1. Parses the report URL from the gloss text
 * 2. Downloads the PDF from that URL
 * 3. Extracts "Producción Total" (kWh) from page 3 of the PDF
 * 4. Determines the report period (month before invoice createdAt)
 */

import { SIC_EMISSION_FACTOR_TCO2_PER_MWH } from "@/lib/constants";

/**
 * Extract the dplus report URL from an invoice gloss field.
 * Returns null if no URL is found.
 */
export function extractReportUrl(gloss: string | null): string | null {
  if (!gloss) return null;

  // Match URLs like https://dplus.deltactivos.cl/public/reporte/XXXXX
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
  // Go to previous month
  const prevMonth = new Date(date.getFullYear(), date.getMonth() - 1, 1);
  return {
    month: prevMonth.getMonth() + 1, // 1-indexed
    year: prevMonth.getFullYear(),
  };
}

/**
 * Download a PDF from a URL and return its buffer.
 * The dplus URLs serve PDFs directly.
 */
export async function downloadReportPdf(url: string): Promise<Buffer> {
  const res = await fetch(url, { redirect: "follow" });
  if (!res.ok) {
    throw new Error(`Failed to download report PDF from ${url}: ${res.status}`);
  }

  const arrayBuffer = await res.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/**
 * Extract kWh "Producción Total" from a report PDF buffer.
 * Looks for patterns like "Producción Total" followed by a number with kWh.
 * Returns null if the value cannot be found.
 */
export async function extractKwhFromPdf(pdfBuffer: Buffer): Promise<number | null> {
  try {
    // Dynamic import to avoid issues with pdf-parse in edge environments
    const pdfParse = (await import("pdf-parse")).default;
    const data = await pdfParse(pdfBuffer);

    const text = data.text;

    // Try several patterns to find "Producción Total" and its associated kWh value
    // Pattern 1: "Producción Total" followed by a number (possibly on next line)
    const patterns = [
      /[Pp]roducci[oó]n\s+[Tt]otal[:\s]*([0-9][0-9.,]*)\s*(?:kWh)?/,
      /[Pp]roducci[oó]n\s+[Tt]otal\s*\n\s*([0-9][0-9.,]*)/,
      /Total\s+(?:de\s+)?[Pp]roducci[oó]n[:\s]*([0-9][0-9.,]*)/,
      // Broader: any "Producción" near "Total" with a number ([\s\S] instead of /s flag)
      /[Pp]roducci[oó]n[\s\S]*?[Tt]otal[\s\S]*?([0-9][0-9.,]+)\s*kWh/,
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match?.[1]) {
        // Parse the number: handle both "1.234,56" (Chilean) and "1,234.56" formats
        const raw = match[1].trim();
        const parsed = parseLocalizedNumber(raw);
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
  // Remove spaces
  let s = raw.replace(/\s/g, "");

  // Detect format: if last separator is comma → Chilean format (1.234,56)
  const lastComma = s.lastIndexOf(",");
  const lastDot = s.lastIndexOf(".");

  if (lastComma > lastDot) {
    // Chilean: dots are thousands, comma is decimal
    s = s.replace(/\./g, "").replace(",", ".");
  } else if (lastDot > lastComma) {
    // English: commas are thousands, dot is decimal
    s = s.replace(/,/g, "");
  } else {
    // No separator or same position — just try parsing
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

/**
 * Build a filename for the report.
 */
export function buildReportFileName(
  customerName: string,
  month: number,
  year: number
): string {
  const monthStr = String(month).padStart(2, "0");
  const safeName = customerName.replace(/[^a-zA-Z0-9áéíóúñÁÉÍÓÚÑ ]/g, "").trim().replace(/\s+/g, "_");
  return `reporte_${safeName}_${year}-${monthStr}.pdf`;
}
