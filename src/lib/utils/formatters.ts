/**
 * Format Chilean RUT (e.g., 76.123.456-7)
 */
export function formatRut(rut: string): string {
  const clean = rut.replace(/[^0-9kK]/g, "");
  if (clean.length < 2) return clean;
  const body = clean.slice(0, -1);
  const dv = clean.slice(-1).toUpperCase();
  const formatted = body.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${formatted}-${dv}`;
}

/**
 * Format number as Chilean pesos (CLP)
 */
export function formatCLP(amount: number): string {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    minimumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format kWh with thousands separator
 */
export function formatKwh(kwh: number): string {
  return `${new Intl.NumberFormat("es-CL").format(Math.round(kwh))} kWh`;
}

/**
 * Format date to Chilean locale
 */
export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("es-CL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(date));
}

/**
 * Format month/year period (e.g., "Marzo 2026")
 */
export function formatPeriod(month: number, year: number): string {
  const date = new Date(year, month - 1);
  return new Intl.DateTimeFormat("es-CL", {
    month: "long",
    year: "numeric",
  }).format(date);
}
