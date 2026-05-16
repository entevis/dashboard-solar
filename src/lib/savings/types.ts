export interface ParsedBoleta {
  fileName: string;
  error?: string;
  periodoInicio?: string;
  periodoFin?: string;
  matchedYear?: number;
  matchedMonth?: number;
  clienteNum?: string;
  distribuidora?: string;
  p1NetElectricidad: number;
  p1NetTransporte: number;
  p1NetServicioPub: number;
  p1NetFondoEstab: number;
  p1Admin: number;
  p1Potencia: number;
  p1FactorPot: number;
  descuentoMes: number;
  consumoKwh: number;
  inyeccionKwh: number;
  remanenteAcum?: number;
  distribution?: { clienteNum: string; percent: number; monto: number }[];
  montoConsumosAnexo5?: number;
}

export interface MonthlyClientData {
  clienteNum: string;
  distribuidora: string;
  consumoKwh: number;
  inyeccionKwh: number;
  montoConsumos: number;
  descuentoMes: number;
  montoTotal: number;
  otrosCargos: number;
  distributionPct: number | null;
  isMain: boolean;
}

export interface MonthlyResult {
  year: number;
  month: number;
  invoiceNumber?: string;
  creditNoteNumber?: string;
  creditNoteTotal?: number;
  montoNetoSinvest: number;
  kwhGenerados: number;
  precioKwhSinvest: number;
  tresCargosDistro: number;
  clients: MonthlyClientData[];
  totalConsumoMensual: number;
  totalConsumoHipotetico: number;
  totalSinPlanta: number;
  totalPagado: number;
  ahorro: number;
}

export interface SavingsResult {
  plantName: string;
  selfConsumptionDiscountPct: number | null;
  injectionDiscountPct: number | null;
  months: MonthlyResult[];
  remanente: number;
  totalAhorro: number;
  totalSinPlanta: number;
  totalPagado: number;
  incompleteMths: { year: number; month: number; reason: string }[];
  fileErrors: { fileName: string; error: string }[];
}
