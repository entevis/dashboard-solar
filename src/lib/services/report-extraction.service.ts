/**
 * Report Extraction Service
 *
 * Extracts generation report data from Duemint invoice gloss fields:
 * 1. Parses the report code from the dplus URL in the gloss text
 * 2. Fetches the report JSON from django.deltactivos.cl/api/reportes/{code}
 * 3. Extracts produccion_total (kWh) and co2 from reporte.datos_reporte.tecnico
 * 4. Determines the report period (month before invoice createdAt)
 */

const REPORT_API_BASE = "https://django.deltactivos.cl/api/reportes";

/**
 * Extract the report code from a dplus URL in the invoice gloss field.
 * URL format: https://dplus.deltactivos.cl/public/reporte/{code}
 * Returns the full dplus URL (for storage) and the code (for API call).
 */
export function extractReportUrl(gloss: string | null): string | null {
  if (!gloss) return null;
  const match = gloss.match(/https?:\/\/dplus\.deltactivos\.cl\/public\/reporte\/[a-zA-Z0-9]+/);
  return match?.[0] ?? null;
}

function extractReportCode(url: string): string | null {
  const match = url.match(/\/public\/reporte\/([a-zA-Z0-9]+)/);
  return match?.[1] ?? null;
}

export interface ReportData {
  kwhGenerated: number | null;
  co2Avoided: number | null;
  periodMonth: number | null;
  periodYear: number | null;
  fetchStatus?: number;
  error?: string;
}

/**
 * Fetch report data from the Django API and extract kWh and CO2.
 *
 * The JSON structure is:
 *   reporte.datos_reporte.tecnico.produccion_total → kWh
 *   reporte.datos_reporte.tecnico.co2 → CO2 (ton)
 */
export async function extractDataFromReportPage(dplusUrl: string): Promise<ReportData> {
  try {
    const code = extractReportCode(dplusUrl);
    if (!code) return { kwhGenerated: null, co2Avoided: null, periodMonth: null, periodYear: null, error: "no code found in URL" };

    const apiUrl = `${REPORT_API_BASE}/${code}`;
    const res = await fetch(apiUrl, {
      headers: {
        "Accept": "application/json",
      },
    });

    if (!res.ok) {
      return { kwhGenerated: null, co2Avoided: null, periodMonth: null, periodYear: null, fetchStatus: res.status, error: `API returned ${res.status}` };
    }

    const data = await res.json();

    const tecnico = data?.reporte?.datos_reporte?.tecnico;
    if (!tecnico) {
      return { kwhGenerated: null, co2Avoided: null, periodMonth: null, periodYear: null, fetchStatus: res.status, error: "no tecnico data in response" };
    }

    const kwhGenerated = typeof tecnico.produccion_total === "number" ? tecnico.produccion_total : null;
    const co2Avoided = typeof tecnico.co2 === "number" ? tecnico.co2 : null;

    // Extract period from fecha_reporte (e.g. "2026-02-01T03:00:00.000Z")
    let periodMonth: number | null = null;
    let periodYear: number | null = null;
    const fechaReporte = data?.reporte?.datos_reporte?.fecha_reporte;
    if (fechaReporte) {
      const d = new Date(fechaReporte);
      if (!isNaN(d.getTime())) {
        periodMonth = d.getMonth() + 1;
        periodYear = d.getFullYear();
      }
    }

    return { kwhGenerated, co2Avoided, periodMonth, periodYear, fetchStatus: res.status };
  } catch (err) {
    return { kwhGenerated: null, co2Avoided: null, periodMonth: null, periodYear: null, error: err instanceof Error ? err.message : "unknown" };
  }
}
