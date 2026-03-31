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

function getHeaders(companyId: string) {
  const token = process.env.DUEMINT_API_TOKEN;
  if (!token) throw new Error("Missing DUEMINT_API_TOKEN environment variable");

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

async function fetchPage(companyId: string, page: number): Promise<DuemintResponse> {
  const url = `${BASE_URL}/collection-documents?page=${page}&per_page=100`;
  const res = await fetch(url, { headers: getHeaders(companyId) });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Duemint API error ${res.status} (company ${companyId}): ${text}`);
  }

  return res.json();
}

export async function fetchAllInvoices(companyId: string): Promise<DuemintInvoice[]> {
  const all: DuemintInvoice[] = [];

  const first = await fetchPage(companyId, 1);
  all.push(...(first.items ?? []));

  const totalPages = first.records?.pages ?? 1;

  for (let page = 2; page <= totalPages; page++) {
    const data = await fetchPage(companyId, page);
    all.push(...(data.items ?? []));
  }

  return all;
}
