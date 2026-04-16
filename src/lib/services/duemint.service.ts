/**
 * Duemint API service
 * Fetches all collection documents (invoices) with pagination.
 * Each call requires a companyId (one per portfolio).
 */

const BASE_URL = "https://api.duemint.com/api/v1";

export interface DuemintInvoice {
  id: string;
  number: string | null;
  clientTaxId: string | null;
  issueDate: string | null;
  dueDate: string | null;
  createdAt: string | null;
  status: number | null;
  statusName: string | null;
  currency: string | null;
  net: string | number | null;
  taxes: string | number | null;
  total: string | number | null;
  paidAmount: string | number | null;
  amountDue: string | number | null;
  amountCredit: string | number | null;
  amountDebit: string | number | null;
  isCeded: boolean | null;
  onJudicial: boolean | null;
  url: string | null;
  pdf: string | null;
  xml: string | null;
  client: {
    id: string | null;
    name: string | null;
    taxId: string | null;
  } | null;
  creditNote: Array<{
    id: string;
    number: string | null;
    amount?: string | null;
  }> | null;
  gloss: string | null;
}

interface DuemintResponse {
  records: {
    totalRecords: number;
    items: number;
    page: number;
    pages: number;
  };
  items: DuemintInvoice[];
}

/**
 * Resolve the Duemint API token for a given portfolio.
 * Looks for DUEMINT_API_TOKEN_{portfolioId} first, falls back to DUEMINT_API_TOKEN.
 */
function getTokenForPortfolio(portfolioId?: number): string {
  if (portfolioId) {
    const specific = process.env[`DUEMINT_API_TOKEN_${portfolioId}`];
    if (specific) return specific;
  }
  const fallback = process.env.DUEMINT_API_TOKEN;
  if (!fallback) throw new Error("Missing DUEMINT_API_TOKEN environment variable");
  return fallback;
}

function getHeaders(companyId: string, portfolioId?: number) {
  const token = getTokenForPortfolio(portfolioId);

  return {
    "accept": "application/json",
    "Authorization": `Bearer ${token}`,
    "X-Duemint-Company-Id": companyId,
  };
}

export function toFloat(val: string | number | null | undefined): number | null {
  if (val == null) return null;
  const n = typeof val === "number" ? val : parseFloat(val);
  return isNaN(n) ? null : n;
}

async function fetchPage(companyId: string, page: number, portfolioId?: number): Promise<DuemintResponse> {
  const url = `${BASE_URL}/collection-documents?page=${page}&per_page=100`;
  const res = await fetch(url, { headers: getHeaders(companyId, portfolioId) });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Duemint API error ${res.status} (company ${companyId}): ${text}`);
  }

  return res.json();
}

export async function fetchInvoiceById(companyId: string, invoiceId: string, portfolioId?: number): Promise<DuemintInvoice> {
  const url = `${BASE_URL}/collection-documents/${invoiceId}`;
  const res = await fetch(url, { headers: getHeaders(companyId, portfolioId) });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Duemint API error ${res.status}: ${text}`);
  }

  return res.json();
}

export async function fetchInvoicesSince(companyId: string, since: string, portfolioId?: number, dateBy = 2): Promise<DuemintInvoice[]> {
  const all: DuemintInvoice[] = [];
  let page = 1;

  while (true) {
    const url = `${BASE_URL}/collection-documents?since=${since}&dateBy=${dateBy}&resultsPerPage=100&page=${page}`;
    const res = await fetch(url, { headers: getHeaders(companyId, portfolioId) });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Duemint API error ${res.status} (company ${companyId}): ${text}`);
    }

    const data: DuemintResponse = await res.json();
    all.push(...(data.items ?? []));

    const totalPages = data.records?.pages ?? 1;
    if (page >= totalPages) break;
    page++;
  }

  return all;
}

export async function fetchAllInvoices(companyId: string, portfolioId?: number): Promise<DuemintInvoice[]> {
  const all: DuemintInvoice[] = [];

  const first = await fetchPage(companyId, 1, portfolioId);
  all.push(...(first.items ?? []));

  const totalPages = first.records?.pages ?? 1;

  for (let page = 2; page <= totalPages; page++) {
    const data = await fetchPage(companyId, page, portfolioId);
    all.push(...(data.items ?? []));
  }

  return all;
}
