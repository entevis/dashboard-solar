/**
 * Populates panel_count, installation_type, surface_m2, economic_sector, economic_sector_2
 * for Portfolio S1 plants, matched by solcorId.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Parse European number format: "1.852,57" → 1852.57, "51,00" → 51
function parseNum(val: string): number | null {
  if (!val || val.trim() === "" || val.trim() === "#REF!") return null;
  const clean = val.trim().replace(/\./g, "").replace(",", ".");
  const n = parseFloat(clean);
  return isNaN(n) ? null : n;
}

const rows: Array<{
  solcorId: string;
  panelCount: number | null;
  installationType: string | null;
  surfaceM2: number | null;
  economicSector: string | null;
  economicSector2: string | null;
}> = [
  { solcorId: "1", panelCount: 204, installationType: "Techo", surfaceM2: 357, economicSector: "Mayorista De Frutas Y Verduras", economicSector2: "Comercio al por Mayor y al por Menor" },
  { solcorId: "2", panelCount: 238, installationType: "Techo", surfaceM2: 417, economicSector: "Otros Cultivos N.C.P.", economicSector2: "Agricultura, Ganadería, Silvicultura y Pesca" },
  { solcorId: "4", panelCount: 408, installationType: "Techo", surfaceM2: 1200, economicSector: "Industrial", economicSector2: "Industria Manufacturera" },
  { solcorId: "7", panelCount: 353, installationType: "Techo", surfaceM2: 670, economicSector: "Venta Al Por Mayor De Otros Productos N.", economicSector2: "Comercio al por Mayor y al por Menor" },
  { solcorId: "5", panelCount: 336, installationType: "Techo", surfaceM2: 635, economicSector: "Cultivo De Uva Destinada A Producción De Vino", economicSector2: "Vitivinicolas" },
  { solcorId: "6", panelCount: 400, installationType: "Suelo", surfaceM2: 1360, economicSector: "Cultivo De Uva Destinada A Producción De Vino", economicSector2: "Vitivinicolas" },
  { solcorId: "12", panelCount: 345, installationType: "Suelo", surfaceM2: 1175, economicSector: "Producción En Viveros; Excepto Especies", economicSector2: "Agricultura, Ganadería, Silvicultura y Pesca" },
  { solcorId: "14", panelCount: 230, installationType: "Suelo", surfaceM2: 782, economicSector: "Producción En Viveros; Excepto Especies", economicSector2: "Agricultura, Ganadería, Silvicultura y Pesca" },
  { solcorId: "15", panelCount: 230, installationType: "Suelo", surfaceM2: 782, economicSector: "Producción En Viveros; Excepto Especies", economicSector2: "Agricultura, Ganadería, Silvicultura y Pesca" },
  { solcorId: "16", panelCount: 460, installationType: "Suelo", surfaceM2: 1565, economicSector: "Cultivo De Frutales En Árboles O Arbusto", economicSector2: "Agricultura, Ganadería, Silvicultura y Pesca" },
  { solcorId: "11", panelCount: 360, installationType: "Techo", surfaceM2: 680, economicSector: "Cultivo De Frutales En Árboles O Arbusto", economicSector2: "Agricultura, Ganadería, Silvicultura y Pesca" },
  { solcorId: "9", panelCount: 240, installationType: "Techo", surfaceM2: 778, economicSector: "Corretaje De Productos Agrícolas", economicSector2: "Comercio al por Mayor y al por Menor" },
  { solcorId: "8", panelCount: 432, installationType: "Techo", surfaceM2: 1400, economicSector: "Productos Químicos", economicSector2: "Industria Manufacturera" },
  { solcorId: "22", panelCount: 337, installationType: "Techo", surfaceM2: 1103, economicSector: "Servicio De Recolección, Empacado, Trilla, Descascaramiento Y Desgrane; Y Similares", economicSector2: "Agricultura, Ganadería, Silvicultura y Pesca" },
  { solcorId: "34", panelCount: 120, installationType: "Techo", surfaceM2: 231, economicSector: "Fundación De Educación", economicSector2: "Educacional" },
  { solcorId: "27", panelCount: 440, installationType: "Techo", surfaceM2: 832, economicSector: "Elaboración De Vinos", economicSector2: "Industria Manufacturera" },
  { solcorId: "29", panelCount: 285, installationType: "Suelo", surfaceM2: 1167, economicSector: "Elaboración De Vinos", economicSector2: "Industria Manufacturera" },
  { solcorId: "36", panelCount: 380, installationType: "Suelo", surfaceM2: 1505, economicSector: "Cultivo De Uva Destinada A Producción De Vino", economicSector2: "Vitivinicolas" },
  { solcorId: "3", panelCount: 323, installationType: "Techo", surfaceM2: 1066, economicSector: "Exportaciones", economicSector2: "Comercio al por Mayor y al por Menor" },
  { solcorId: "28", panelCount: 380, installationType: "Suelo", surfaceM2: 1556, economicSector: "Elaboración De Vinos", economicSector2: "Industria Manufacturera" },
  { solcorId: "21", panelCount: 380, installationType: "Suelo", surfaceM2: 1505, economicSector: "Elaboración De Vinos", economicSector2: "Industria Manufacturera" },
  { solcorId: "20", panelCount: 380, installationType: "Suelo", surfaceM2: 1505, economicSector: "Elaboración De Vinos", economicSector2: "Industria Manufacturera" },
  { solcorId: "47", panelCount: 240, installationType: "Suelo", surfaceM2: 936, economicSector: "Cultivo De Frutales En Árboles O Arbusto", economicSector2: "Agricultura, Ganadería, Silvicultura y Pesca" },
  { solcorId: "45", panelCount: 180, installationType: "Suelo", surfaceM2: 702, economicSector: "Cultivo De Trigo", economicSector2: "Agricultura, Ganadería, Silvicultura y Pesca" },
  { solcorId: "43", panelCount: 400, installationType: "Techo", surfaceM2: 1040, economicSector: "Venta Al Por Mayor De Huevos, Leche, Abarrotes, Y Otros Alimentos N.C.", economicSector2: "Comercio al por Mayor y al por Menor" },
  { solcorId: "18", panelCount: 380, installationType: "Suelo", surfaceM2: 1505, economicSector: "Cultivo De Uva De Mesa", economicSector2: "Vitivinicolas" },
  { solcorId: "40 - 83", panelCount: 740, installationType: "Techo", surfaceM2: 2625, economicSector: "Cultivo De Uva De Mesa", economicSector2: "Vitivinicolas" },
  { solcorId: "39", panelCount: 320, installationType: "Techo", surfaceM2: 1768, economicSector: "Cultivo De Uva De Mesa", economicSector2: "Vitivinicolas" },
  { solcorId: "77", panelCount: 400, installationType: "Suelo", surfaceM2: 1600, economicSector: "Elaboración De Vinos", economicSector2: "Industria Manufacturera" },
  { solcorId: "48", panelCount: 400, installationType: "Techo", surfaceM2: 3045, economicSector: "Establecimientos De Enseñanza Primaria", economicSector2: "Educacional" },
  { solcorId: "76", panelCount: 400, installationType: "Suelo", surfaceM2: 1000, economicSector: "Cultivo De Frutales En Árboles O Arbusto", economicSector2: "Agricultura, Ganadería, Silvicultura y Pesca" },
  { solcorId: "68", panelCount: 300, installationType: "Suelo", surfaceM2: 1100, economicSector: "Cultivo De Otras Plantas Perennes", economicSector2: "Agricultura, Ganadería, Silvicultura y Pesca" },
  { solcorId: "54", panelCount: 400, installationType: "Techo", surfaceM2: 2120, economicSector: "Establecimientos De Enseñanza Primaria", economicSector2: "Educacional" },
  { solcorId: "55", panelCount: 400, installationType: "Techo", surfaceM2: 1790, economicSector: "Establecimientos De Enseñanza Primaria", economicSector2: "Educacional" },
  { solcorId: "52", panelCount: 464, installationType: "Techo", surfaceM2: 1960, economicSector: "Imprenta", economicSector2: "Industria Manufacturera" },
  { solcorId: "118", panelCount: 400, installationType: "Suelo", surfaceM2: 2400, economicSector: "Cultivo De Frutales En Árboles O Arbusto", economicSector2: "Agricultura, Ganadería, Silvicultura y Pesca" },
  { solcorId: "79", panelCount: 400, installationType: "Suelo", surfaceM2: 925, economicSector: "Cultivo De Uva Destinada A La Producción De Vino", economicSector2: "Vitivinicolas" },
  { solcorId: "111", panelCount: 300, installationType: "Suelo", surfaceM2: 1075, economicSector: "Elaboración De Vinos", economicSector2: "Industria Manufacturera" },
  { solcorId: "57", panelCount: 100, installationType: "Suelo", surfaceM2: 350, economicSector: "Elaboración De Vinos", economicSector2: "Industria Manufacturera" },
  { solcorId: "109", panelCount: 100, installationType: "Suelo", surfaceM2: 417, economicSector: "Elaboración De Aceites Y Grasas De Origen Vegetal Y Animal", economicSector2: "Industria Manufacturera" },
  { solcorId: "110", panelCount: 300, installationType: "Suelo", surfaceM2: 958, economicSector: "Elaboración De Aceites Y Grasas De Origen Vegetal Y Animal", economicSector2: "Industria Manufacturera" },
  { solcorId: "96", panelCount: 400, installationType: "Suelo", surfaceM2: 2200, economicSector: "Cultivo De Frutales En Árboles O Arbusto", economicSector2: "Agricultura, Ganadería, Silvicultura y Pesca" },
  { solcorId: "116", panelCount: 400, installationType: "Techo", surfaceM2: 1088, economicSector: "Fabricación De Recipientes De Madera", economicSector2: "Industria Manufacturera" },
  { solcorId: "44", panelCount: 1200, installationType: "Techo", surfaceM2: 5640, economicSector: "Otros Servicios Agrícolas", economicSector2: "Agricultura, Ganadería, Silvicultura y Pesca" },
  { solcorId: "98", panelCount: 400, installationType: "Suelo", surfaceM2: 1600, economicSector: "Cultivo De Trigo", economicSector2: "Agricultura, Ganadería, Silvicultura y Pesca" },
  { solcorId: "66", panelCount: 400, installationType: "Suelo", surfaceM2: 1450, economicSector: "Elaboración De Vinos", economicSector2: "Industria Manufacturera" },
  { solcorId: "56", panelCount: 240, installationType: "Techo", surfaceM2: 1065, economicSector: "Elaboración De Otros Productos Alimenticios N.C.P.", economicSector2: "Industria Manufacturera" },
  { solcorId: "91", panelCount: 400, installationType: "Suelo", surfaceM2: 1550, economicSector: "Cultivo De Trigo", economicSector2: "Agricultura, Ganadería, Silvicultura y Pesca" },
  { solcorId: "80", panelCount: 700, installationType: "Suelo", surfaceM2: 3630, economicSector: "Cultivo De Trigo", economicSector2: "Agricultura, Ganadería, Silvicultura y Pesca" },
  { solcorId: "115", panelCount: 300, installationType: "Suelo", surfaceM2: 1100, economicSector: "Otros Cultivos N.C.P.", economicSector2: "Vitivinicolas" },
  { solcorId: "62", panelCount: 600, installationType: "Suelo", surfaceM2: 2445, economicSector: "Elaboración De Vinos", economicSector2: "Industria Manufacturera" },
  { solcorId: "58", panelCount: 300, installationType: "Suelo", surfaceM2: 1581, economicSector: "Elaboración De Vinos", economicSector2: "Industria Manufacturera" },
  { solcorId: "90", panelCount: 600, installationType: "Suelo", surfaceM2: 2400, economicSector: "Cultivo De Trigo", economicSector2: "Vitivinicolas" },
  { solcorId: "95", panelCount: 880, installationType: "Suelo", surfaceM2: 3300, economicSector: "Cultivo De Trigo", economicSector2: "Vitivinicolas" },
  { solcorId: "99", panelCount: 100, installationType: "Suelo", surfaceM2: 175, economicSector: "Cultivo De Trigo", economicSector2: "Vitivinicolas" },
  { solcorId: "88", panelCount: 400, installationType: "Suelo", surfaceM2: 1600, economicSector: "Venta Al Por Mayor De Materias Primas Ag", economicSector2: "Comercio al por Mayor y al por Menor" },
  { solcorId: "94", panelCount: 400, installationType: "Suelo", surfaceM2: 1550, economicSector: "Cultivo De Trigo", economicSector2: "Vitivinicolas" },
  { solcorId: "71", panelCount: 800, installationType: "Suelo", surfaceM2: 5050, economicSector: "Cultivo De Otros Frutos Y Nueces De Árboles Y Arbustos", economicSector2: "Agricultura, Ganadería, Silvicultura y Pesca" },
  { solcorId: "97", panelCount: 400, installationType: "Suelo", surfaceM2: 1600, economicSector: "Cultivo De Trigo", economicSector2: "Vitivinicolas" },
  { solcorId: "117", panelCount: 316, installationType: "Suelo, Techo", surfaceM2: 930, economicSector: "Cultivo De Hortalizas Y Melones", economicSector2: "Agricultura, Ganadería, Silvicultura y Pesca" },
  { solcorId: "132", panelCount: 600, installationType: "Suelo", surfaceM2: 2900, economicSector: "Cultivo De Frutas De Pepita Y De Hueso", economicSector2: "Agricultura, Ganadería, Silvicultura y Pesca" },
  { solcorId: "112", panelCount: 1200, installationType: "Techo", surfaceM2: 4630, economicSector: "Venta Al Por Mayor De Materias Primas Agrícolas", economicSector2: "Comercio al por Mayor y al por Menor" },
  { solcorId: "60", panelCount: 140, installationType: "Suelo", surfaceM2: 550, economicSector: "Elaboración De Vinos", economicSector2: "Industria Manufacturera" },
  { solcorId: "114", panelCount: 320, installationType: "Suelo", surfaceM2: 2230, economicSector: "Otros Cultivos N.C.P.", economicSector2: "Vitivinicolas" },
  { solcorId: "113", panelCount: 880, installationType: "Suelo", surfaceM2: 4510, economicSector: "Cultivo De Uva Destinada A Producción De Vino", economicSector2: "Vitivinicolas" },
  { solcorId: "121", panelCount: 1200, installationType: "Suelo", surfaceM2: 5047, economicSector: "Otros Cultivos N.C.P.", economicSector2: "Agricultura, Ganadería, Silvicultura y Pesca" },
  { solcorId: "133", panelCount: 400, installationType: "Suelo", surfaceM2: 1401, economicSector: "Cultivo De Frutas De Pepita Y De Hueso", economicSector2: "Agricultura, Ganadería, Silvicultura y Pesca" },
  { solcorId: "128", panelCount: 280, installationType: "Suelo", surfaceM2: 9880, economicSector: "Cultivo De Frutas De Pepita Y De Hueso", economicSector2: "Agricultura, Ganadería, Silvicultura y Pesca" },
  { solcorId: "129", panelCount: 400, installationType: "Techo", surfaceM2: 1850, economicSector: "Cultivo De Plantas Vivas Incluida La Producción En Viveros (Excepto Viveros Forestales)", economicSector2: "Agricultura, Ganadería, Silvicultura y Pesca" },
  { solcorId: "144", panelCount: 800, installationType: "Suelo", surfaceM2: 3320, economicSector: "Otros Servicios Agrícolas N.C.P.", economicSector2: "Agricultura, Ganadería, Silvicultura y Pesca" },
  { solcorId: "67", panelCount: 352, installationType: "Suelo", surfaceM2: 2208, economicSector: "Elaboración De Vinos", economicSector2: "Industria Manufacturera" },
  { solcorId: "65", panelCount: 180, installationType: "Suelo", surfaceM2: 1027, economicSector: "Otros Servicios Agrícolas", economicSector2: "Vitivinicolas" },
  { solcorId: "63", panelCount: 285, installationType: "Suelo", surfaceM2: 1207, economicSector: "Cultivo De Uva Destinada A Producción De Vino", economicSector2: "Vitivinicolas" },
  { solcorId: "30", panelCount: 400, installationType: "Suelo", surfaceM2: 1640, economicSector: "Elaboración De Vinos", economicSector2: "Industria Manufacturera" },
  { solcorId: "135", panelCount: 1200, installationType: "Suelo", surfaceM2: 8500, economicSector: "Actividades No Clasificadas", economicSector2: "Agricultura, Ganadería, Silvicultura y Pesca" },
  { solcorId: "64", panelCount: 720, installationType: "Suelo", surfaceM2: 5785, economicSector: "Elaboración De Vinos", economicSector2: "Industria Manufacturera" },
  { solcorId: "10 - 143", panelCount: 808, installationType: "Techo", surfaceM2: 2430, economicSector: "Otros Servicios Agrícolas", economicSector2: "Agricultura, Ganadería, Silvicultura y Pesca" },
  { solcorId: "136", panelCount: 1160, installationType: "Suelo, Techo", surfaceM2: 7736, economicSector: "Agrícola En Frutales", economicSector2: "Agricultura, Ganadería, Silvicultura y Pesca" },
  { solcorId: "155", panelCount: 396, installationType: "Techo", surfaceM2: 2424, economicSector: "Cultivo De Uva Destinada A La Producción De Vino", economicSector2: "Vitivinicolas" },
  { solcorId: "87", panelCount: 160, installationType: "Suelo", surfaceM2: 924, economicSector: "Compra, Venta Y Alquiler (Excepto Amoblados) De Inmuebles", economicSector2: "Actividades Inmobiliarias" },
  { solcorId: "186", panelCount: 270, installationType: "Suelo", surfaceM2: 2112, economicSector: "Compra, Venta Y Alquiler (Excepto Amoblados) De Inmuebles/ Venta Al Por Mayor De Frutas Y Verduras", economicSector2: "Actividades Inmobiliarias" },
  { solcorId: "156", panelCount: 810, installationType: "Suelo", surfaceM2: 6150, economicSector: "Cultivo De Uva Destinada A La Producción De Vino", economicSector2: "Vitivinicolas" },
  { solcorId: "154", panelCount: 360, installationType: "Suelo", surfaceM2: 2337, economicSector: "Cultivo De Uva Destinada A Producción De Vino", economicSector2: "Vitivinicolas" },
  { solcorId: "180", panelCount: 540, installationType: "Suelo", surfaceM2: 6776, economicSector: "Cría De Aves De Corral Para La Producción De Carne", economicSector2: "Agricultura, Ganadería, Silvicultura y Pesca" },
  { solcorId: "170", panelCount: 1080, installationType: "Techo", surfaceM2: 5960, economicSector: "Elaboración Y Conservación De Salmónidos", economicSector2: "Industria Manufacturera" },
  { solcorId: "72", panelCount: 800, installationType: "Suelo", surfaceM2: 4950, economicSector: "Fabricación De Otros Artículos De Plástico", economicSector2: "Industria Manufacturera" },
  { solcorId: "201", panelCount: 288, installationType: "Suelo", surfaceM2: 2624, economicSector: "Cultivo De Frutas De Pepita Y De Hueso", economicSector2: "Agricultura, Ganadería, Silvicultura y Pesca" },
  { solcorId: "203", panelCount: 180, installationType: "Techo", surfaceM2: 783, economicSector: "Fabricación De Productos De Plástico", economicSector2: "Industria Manufacturera" },
  { solcorId: "193", panelCount: 576, installationType: "Techo", surfaceM2: 2525, economicSector: "Otros Servicios Agrícolas", economicSector2: "Agricultura, Ganadería, Silvicultura y Pesca" },
  { solcorId: "205", panelCount: 360, installationType: "Suelo", surfaceM2: 2147, economicSector: "Agrícola", economicSector2: "Agricultura, Ganadería, Silvicultura y Pesca" },
  { solcorId: "26 - 231", panelCount: 384, installationType: "Suelo", surfaceM2: 1370, economicSector: "Elaboración De Vinos", economicSector2: "Industria Manufacturera" },
  { solcorId: "223", panelCount: 768, installationType: "Suelo", surfaceM2: 4760, economicSector: "Agricola En Frutales", economicSector2: "Agricultura, Ganadería, Silvicultura y Pesca" },
  { solcorId: "75 - 149", panelCount: 600, installationType: "Suelo", surfaceM2: 5165, economicSector: "Cultivo De Maíz", economicSector2: "Agricultura, Ganadería, Silvicultura y Pesca" },
  { solcorId: "162", panelCount: 636, installationType: "Suelo", surfaceM2: 3960, economicSector: "Elaboración De Vinos", economicSector2: "Industria Manufacturera" },
  { solcorId: "163", panelCount: 540, installationType: "Suelo", surfaceM2: 4400, economicSector: "Elaboración De Vinos", economicSector2: "Industria Manufacturera" },
  { solcorId: "164", panelCount: 576, installationType: "Suelo", surfaceM2: 5100, economicSector: "Elaboración De Vinos", economicSector2: "Industria Manufacturera" },
  { solcorId: "165", panelCount: 270, installationType: "Suelo", surfaceM2: 2500, economicSector: "Elaboración De Vinos", economicSector2: "Industria Manufacturera" },
  { solcorId: "166", panelCount: 288, installationType: "Suelo", surfaceM2: 2150, economicSector: "Elaboración De Vinos", economicSector2: "Industria Manufacturera" },
  { solcorId: "167", panelCount: 360, installationType: "Suelo", surfaceM2: 2525, economicSector: "Elaboración De Vinos", economicSector2: "Industria Manufacturera" },
  { solcorId: "168", panelCount: 360, installationType: "Suelo", surfaceM2: 2715, economicSector: "Elaboración De Vinos", economicSector2: "Industria Manufacturera" },
  { solcorId: "169", panelCount: 306, installationType: "Suelo", surfaceM2: 1820, economicSector: "Elaboración De Vinos", economicSector2: "Industria Manufacturera" },
  { solcorId: "183", panelCount: 288, installationType: "Suelo", surfaceM2: 1900, economicSector: "Elaboración De Vinos", economicSector2: "Industria Manufacturera" },
  { solcorId: "184", panelCount: 504, installationType: "Suelo", surfaceM2: 4115, economicSector: "Elaboración De Vinos", economicSector2: "Industria Manufacturera" },
  { solcorId: "185", panelCount: 504, installationType: "Suelo", surfaceM2: 4700, economicSector: "Elaboración De Vinos", economicSector2: "Industria Manufacturera" },
  { solcorId: "249", panelCount: 508, installationType: "Suelo, Techo", surfaceM2: 3450, economicSector: "Cultivo De Frutas De Pepita Y Hueso", economicSector2: "Agricultura, Ganadería, Silvicultura y Pesca" },
  { solcorId: "252", panelCount: null, installationType: "Suelo", surfaceM2: null, economicSector: "Cultivo De Maíz", economicSector2: "Agricultura, Ganadería, Silvicultura y Pesca" },
  { solcorId: "281", panelCount: 288, installationType: "Suelo", surfaceM2: 620, economicSector: "Agricultura", economicSector2: "Agricultura, Ganadería, Silvicultura y Pesca" },
  { solcorId: "308", panelCount: 198, installationType: "Suelo", surfaceM2: 2800, economicSector: "Actividades De Envase Y Empaquetado", economicSector2: "Actividades de Servicios Administrativos y de Apoyo" },
  { solcorId: "364", panelCount: 352, installationType: "Suelo", surfaceM2: 3350, economicSector: "Agrícola", economicSector2: "Agricultura, Ganadería, Silvicultura y Pesca" },
  { solcorId: "359", panelCount: 240, installationType: "Suelo", surfaceM2: 1562, economicSector: "Agrícola", economicSector2: "Agricultura, Ganadería, Silvicultura y Pesca" },
  { solcorId: "328", panelCount: 360, installationType: "Suelo", surfaceM2: 2250, economicSector: "Otros Cultivos N.C.P.", economicSector2: "Agricultura, Ganadería, Silvicultura y Pesca" },
  { solcorId: "282", panelCount: 740, installationType: "Suelo", surfaceM2: 5000, economicSector: "Agricultura", economicSector2: "Agricultura, Ganadería, Silvicultura y Pesca" },
  { solcorId: "327", panelCount: 600, installationType: "Suelo", surfaceM2: 4300, economicSector: "Agricultura", economicSector2: "Agricultura, Ganadería, Silvicultura y Pesca" },
  { solcorId: "355", panelCount: 730, installationType: "Suelo", surfaceM2: 5650, economicSector: "Agricultura", economicSector2: "Agricultura, Ganadería, Silvicultura y Pesca" },
  { solcorId: "428", panelCount: 280, installationType: "Suelo", surfaceM2: 2000, economicSector: "Agricultura", economicSector2: "Agricultura, Ganadería, Silvicultura y Pesca" },
  { solcorId: "356", panelCount: 720, installationType: "Suelo", surfaceM2: 5000, economicSector: "Agricultura", economicSector2: "Agricultura, Ganadería, Silvicultura y Pesca" },
  { solcorId: "366", panelCount: 288, installationType: "Suelo", surfaceM2: 2500, economicSector: "Agricultura", economicSector2: "Agricultura, Ganadería, Silvicultura y Pesca" },
  { solcorId: "443", panelCount: 308, installationType: "Suelo", surfaceM2: 2750, economicSector: "Agricultura", economicSector2: "Agricultura, Ganadería, Silvicultura y Pesca" },
  { solcorId: "399", panelCount: 612, installationType: "Suelo", surfaceM2: 4100, economicSector: "Agricultura", economicSector2: "Agricultura, Ganadería, Silvicultura y Pesca" },
  { solcorId: "322", panelCount: 612, installationType: "Suelo", surfaceM2: 3800, economicSector: "Venta Al Por Mayor No especializada", economicSector2: "Comercio al por Mayor y al por Menor" },
  { solcorId: "326", panelCount: 442, installationType: "Suelo", surfaceM2: 2607, economicSector: "Cultivo De Otras Plantas Perennes", economicSector2: "Agricultura, Ganadería, Silvicultura y Pesca" },
  { solcorId: "381", panelCount: 720, installationType: "Suelo", surfaceM2: 5000, economicSector: "Agricultura", economicSector2: "Agricultura, Ganadería, Silvicultura y Pesca" },
  { solcorId: "382", panelCount: 720, installationType: "Suelo", surfaceM2: 5000, economicSector: "Agricultura", economicSector2: "Agricultura, Ganadería, Silvicultura y Pesca" },
  { solcorId: "464", panelCount: 630, installationType: "Suelo", surfaceM2: 5000, economicSector: "Agropecuario", economicSector2: "Agricultura, Ganadería, Silvicultura y Pesca" },
  { solcorId: "395", panelCount: 624, installationType: "Suelo", surfaceM2: 5960, economicSector: "Elaboración De Vinos", economicSector2: "Vitivinicolas" },
  { solcorId: "130", panelCount: 3260, installationType: "Techo/Suelo", surfaceM2: 15862, economicSector: "Cultivo De Uva Para La Producción De Vino", economicSector2: "Vitivinicolas" },
  { solcorId: "274", panelCount: 744, installationType: "Suelo", surfaceM2: 5000, economicSector: "Agrícola", economicSector2: "Agricultura, Ganadería, Silvicultura y Pesca" },
  { solcorId: "452", panelCount: 500, installationType: "Suelo", surfaceM2: 4300, economicSector: "Agrícola", economicSector2: "Agricultura, Ganadería, Silvicultura y Pesca" },
  { solcorId: "456", panelCount: 210, installationType: "Techo", surfaceM2: 1250, economicSector: "Venta Al Por Mayor De Materia Primas Ag", economicSector2: "Agricultura, Ganadería, Silvicultura y Pesca" },
  { solcorId: "342", panelCount: 730, installationType: "Suelo", surfaceM2: 5000, economicSector: "Cultivo De Frutas De Pepita Y Hueso", economicSector2: "Agricultura, Ganadería, Silvicultura y Pesca" },
  { solcorId: "343", panelCount: 734, installationType: "Suelo", surfaceM2: 4900, economicSector: "Cultivo De Uva Para Mesa", economicSector2: "Agricultura, Ganadería, Silvicultura y Pesca" },
  { solcorId: "370", panelCount: 466, installationType: "Suelo", surfaceM2: 4000, economicSector: "Agricultura", economicSector2: "Agricultura, Ganadería, Silvicultura y Pesca" },
  { solcorId: "305", panelCount: 720, installationType: "Suelo", surfaceM2: 5000, economicSector: "Agricultura", economicSector2: "Agricultura, Ganadería, Silvicultura y Pesca" },
  { solcorId: "500", panelCount: 1763, installationType: "Techo", surfaceM2: 9800, economicSector: "Compra, Venta Y Alquiler (Excepto Amoblados) De Inmuebles", economicSector2: "Actividades Inmobiliarias" },
  { solcorId: "497", panelCount: 210, installationType: "Suelo", surfaceM2: 600, economicSector: "Cultivo de Uva Destinada a la Produccion de Vino", economicSector2: "Vitivinicolas" },
  { solcorId: "320", panelCount: 198, installationType: "Techo", surfaceM2: 700, economicSector: "Construccion De Edificios Para Uso Residencial", economicSector2: "Educacional" },
  { solcorId: "325", panelCount: 220, installationType: "Suelo", surfaceM2: 5500, economicSector: "Cultivo De Otras Plantas Perennes", economicSector2: "Agricultura, Ganadería, Silvicultura y Pesca" },
  { solcorId: "526", panelCount: 588, installationType: "Suelo", surfaceM2: 5500, economicSector: "Cultivo de Frutas de Pepita y de Hueso", economicSector2: "Agricultura, Ganadería, Silvicultura y Pesca" },
  { solcorId: "323", panelCount: 612, installationType: "Suelo", surfaceM2: 6000, economicSector: "Agrícola", economicSector2: "Agricultura, Ganadería, Silvicultura y Pesca" },
  { solcorId: "313", panelCount: 192, installationType: "Suelo", surfaceM2: 1650, economicSector: "Venta Al Por Mayor De Materia Primas Ag", economicSector2: "Comercio al por Mayor y al por Menor" },
  { solcorId: "313", panelCount: 192, installationType: "Suelo", surfaceM2: 1650, economicSector: "Venta Al Por Mayor De Materia Primas Ag", economicSector2: "Comercio al por Mayor y al por Menor" },
  { solcorId: "250", panelCount: 930, installationType: "Suelo", surfaceM2: 7327, economicSector: "Cultivo De Uva Destinada A La Producción", economicSector2: "Vitivinicolas" },
  { solcorId: "251", panelCount: 930, installationType: "Suelo", surfaceM2: 7300, economicSector: "Cultivo De Uva Para La Producción De Vino", economicSector2: "Vitivinicolas" },
  { solcorId: "264", panelCount: null, installationType: "Suelo", surfaceM2: null, economicSector: null, economicSector2: null },
  { solcorId: "265", panelCount: 800, installationType: "Suelo", surfaceM2: 1780, economicSector: "Agrícola", economicSector2: "Agricultura, Ganadería, Silvicultura y Pesca" },
  { solcorId: "332", panelCount: 372, installationType: "Suelo", surfaceM2: 2583, economicSector: "Agrícola", economicSector2: "Agricultura, Ganadería, Silvicultura y Pesca" },
  { solcorId: "321", panelCount: 384, installationType: "Suelo", surfaceM2: 2500, economicSector: "Agrícola", economicSector2: "Agricultura, Ganadería, Silvicultura y Pesca" },
  { solcorId: "317", panelCount: null, installationType: "Suelo", surfaceM2: null, economicSector: null, economicSector2: null },
  { solcorId: "318", panelCount: null, installationType: "Suelo", surfaceM2: null, economicSector: null, economicSector2: null },
  { solcorId: "312", panelCount: 192, installationType: "Suelo", surfaceM2: 1650, economicSector: "Venta Al Por Mayor De Materia Primas Ag", economicSector2: "Comercio al por Mayor y al por Menor" },
  { solcorId: "313", panelCount: 192, installationType: "Suelo", surfaceM2: 1650, economicSector: "Venta Al Por Mayor De Materia Primas Ag", economicSector2: "Comercio al por Mayor y al por Menor" },
  { solcorId: "224", panelCount: null, installationType: null, surfaceM2: null, economicSector: null, economicSector2: null },
  { solcorId: "313", panelCount: 192, installationType: "Suelo", surfaceM2: 1650, economicSector: "Venta Al Por Mayor De Materia Primas Ag", economicSector2: "Comercio al por Mayor y al por Menor" },
];

// Deduplicate by solcorId (keep last occurrence)
const deduped = new Map<string, typeof rows[0]>();
for (const row of rows) {
  deduped.set(row.solcorId, row);
}

async function main() {
  let updated = 0;
  let notFound = 0;

  for (const [solcorId, data] of deduped) {
    const plant = await prisma.powerPlant.findFirst({
      where: { solcorId, active: 1 },
      select: { id: true, name: true },
    });

    if (!plant) {
      // Try inactive too
      const inactive = await prisma.powerPlant.findFirst({
        where: { solcorId },
        select: { id: true, name: true },
      });
      if (!inactive) {
        console.log(`  NOT FOUND: solcorId=${solcorId}`);
        notFound++;
        continue;
      }
      // Update inactive plant too
      await prisma.powerPlant.update({
        where: { id: inactive.id },
        data: {
          panelCount: data.panelCount,
          installationType: data.installationType,
          surfaceM2: data.surfaceM2,
          economicSector: data.economicSector,
          economicSector2: data.economicSector2,
        },
      });
      console.log(`  ✓ (inactive) ${inactive.name} [${solcorId}]`);
      updated++;
      continue;
    }

    await prisma.powerPlant.update({
      where: { id: plant.id },
      data: {
        panelCount: data.panelCount,
        installationType: data.installationType,
        surfaceM2: data.surfaceM2,
        economicSector: data.economicSector,
        economicSector2: data.economicSector2,
      },
    });
    console.log(`  ✓ ${plant.name} [${solcorId}]`);
    updated++;
  }

  console.log(`\nDone: ${updated} updated, ${notFound} not found`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
