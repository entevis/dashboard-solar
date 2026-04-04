"use client";

import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import Chip from "@mui/material/Chip";
import Grid from "@mui/material/Grid";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import LocalOfferOutlinedIcon from "@mui/icons-material/LocalOfferOutlined";
import BoltOutlinedIcon from "@mui/icons-material/BoltOutlined";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import GroupOutlinedIcon from "@mui/icons-material/GroupOutlined";
import PlaceOutlinedIcon from "@mui/icons-material/PlaceOutlined";
import BusinessOutlinedIcon from "@mui/icons-material/BusinessOutlined";

export interface PlantAddress {
  address: string | null;
  reference: string | null;
  city: string | null;
  county: string | null;
  country: string | null;
}

export interface SerializedPlant {
  id: number;
  name: string;
  status: string;
  solcorId: string | null;
  capacityKw: number;
  specificYield: number | null;
  distributorCompany: string | null;
  tariffId: string | null;
  startDate: Date | string | null;
  durationYears: number | null;
  city: string | null;
  location: string | null;
  panelCount: number | null;
  installationType: string | null;
  surfaceM2: number | null;
  economicSector: string | null;
  economicSector2: string | null;
  portfolio: { id: number; name: string };
  customer: { name: string; rut: string };
  address: PlantAddress | null;
}

export type FormState = {
  name: string;
  solcorId: string;
  status: string;
  capacityKw: string;
  specificYield: string;
  distributorCompany: string;
  tariffId: string;
  startDate: string;
  durationYears: string;
  panelCount: string;
  installationType: string;
  surfaceM2: string;
  economicSector: string;
  economicSector2: string;
  addrAddress: string;
  addrReference: string;
  addrCity: string;
  addrCounty: string;
  addrCountry: string;
};

interface Props {
  plant: SerializedPlant;
  isEditing: boolean;
  saving: boolean;
  form: FormState;
  onField: (field: keyof FormState, value: string) => void;
}

function formatDate(date: Date | string | null): string {
  if (!date) return "—";
  return new Intl.DateTimeFormat("es-CL").format(new Date(date as string));
}

function calcEndDate(startDate: Date | string | null, durationYears: number | null): string {
  if (!startDate || !durationYears) return "—";
  const end = new Date(startDate as string);
  end.setFullYear(end.getFullYear() + durationYears);
  return new Intl.DateTimeFormat("es-CL").format(end);
}

function Field({ label, value }: { label: string; value: string | number | null | undefined }) {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ display: "block", mb: 0.5, letterSpacing: "0.04em" }}>
        {label}
      </Typography>
      <Typography variant="body1" fontWeight={500} color="text.primary">
        {value ?? "—"}
      </Typography>
    </Box>
  );
}

function ReadonlyField({ label, value }: { label: string; value: string }) {
  return (
    <Box>
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 0.5 }}>
        <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ letterSpacing: "0.04em" }}>{label}</Typography>
        <LockOutlinedIcon sx={{ fontSize: 11, color: "text.secondary" }} />
      </Box>
      <Typography variant="body1" fontWeight={500} color="text.primary">
        {value || "—"}
      </Typography>
    </Box>
  );
}

function SectionCard({ icon: Icon, title, children }: { icon: React.ComponentType<{ sx?: object }>; title: string; children: React.ReactNode }) {
  return (
    <Card>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, px: 2, py: 1.25, backgroundColor: "#eff4ff", borderRadius: "12px 12px 0 0" }}>
        <Icon sx={{ fontSize: 16, color: "primary.dark" }} />
        <Typography variant="body1" fontWeight={600} color="text.primary">{title}</Typography>
      </Box>
      <CardContent sx={{ pt: 2 }}>{children}</CardContent>
    </Card>
  );
}

export function PlantDetailPanel({ plant, isEditing, form, onField }: Props) {
  const ef = (field: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) => onField(field, e.target.value);

  const addrCity = plant.address?.city ?? plant.city;
  const addrCounty = plant.address?.county ?? plant.location;
  const hasAddress = !!(plant.address?.address || plant.address?.city || addrCity);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <Grid container spacing={2}>
        {/* Left col (2/3) */}
        <Grid size={{ xs: 12, lg: 8 }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {/* Identificación */}
            <SectionCard icon={LocalOfferOutlinedIcon} title="Identificación">
              <Grid container spacing={3}>
                {isEditing ? (
                  <>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField fullWidth size="small" label="Nombre de planta" value={form.name} onChange={ef("name")} />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField fullWidth size="small" label="ID Solcor" value={form.solcorId} onChange={ef("solcorId")} placeholder="Ej: SOL-001" />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField select fullWidth size="small" label="Estado" value={form.status} onChange={ef("status")}>
                        <MenuItem value="active">Activa</MenuItem>
                        <MenuItem value="maintenance">En mantenimiento</MenuItem>
                      </TextField>
                    </Grid>
                  </>
                ) : (
                  <>
                    <Grid size={{ xs: 12, sm: 6 }}><Field label="Nombre de planta" value={plant.name} /></Grid>
                    <Grid size={{ xs: 12, sm: 6 }}><Field label="ID Solcor" value={plant.solcorId} /></Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Box>
                        <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ display: "block", mb: 0.5, letterSpacing: "0.04em" }}>Estado</Typography>
                        <Chip
                          label={plant.status === "active" ? "Activa" : "En mantenimiento"}
                          size="small"
                          sx={plant.status === "active"
                            ? { backgroundColor: "#dbe1ff", color: "#0d1c2e", fontWeight: 600 }
                            : { backgroundColor: "#e6eeff", color: "#434655", fontWeight: 500 }}
                        />
                      </Box>
                    </Grid>
                  </>
                )}
              </Grid>
            </SectionCard>

            {/* Contrato */}
            <SectionCard icon={DescriptionOutlinedIcon} title="Contrato">
              <Grid container spacing={3}>
                {isEditing ? (
                  <>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField fullWidth size="small" label="Fecha inicio (F6)" type="date" value={form.startDate} onChange={ef("startDate")} slotProps={{ inputLabel: { shrink: true } }} />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField fullWidth size="small" label="Duración (años)" type="number" value={form.durationYears} onChange={ef("durationYears")} placeholder="Ej: 20" />
                    </Grid>
                  </>
                ) : (
                  <>
                    <Grid size={{ xs: 12, sm: 6 }}><Field label="Fecha inicio (F6)" value={formatDate(plant.startDate)} /></Grid>
                    <Grid size={{ xs: 12, sm: 6 }}><Field label="Duración" value={plant.durationYears != null ? `${plant.durationYears} años` : null} /></Grid>
                    <Grid size={{ xs: 12, sm: 6 }}><Field label="Fecha término estimada" value={calcEndDate(plant.startDate, plant.durationYears)} /></Grid>
                  </>
                )}
              </Grid>
            </SectionCard>

            {/* Instalación */}
            <SectionCard icon={BusinessOutlinedIcon} title="Instalación">
              <Grid container spacing={3}>
                {isEditing ? (
                  <>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField fullWidth size="small" label="N° Paneles" type="number" value={form.panelCount} onChange={ef("panelCount")} placeholder="Ej: 400" />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField fullWidth size="small" label="Tipo instalación" value={form.installationType} onChange={ef("installationType")} placeholder="Techo / Suelo" />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField fullWidth size="small" label="Superficie (m²)" type="number" value={form.surfaceM2} onChange={ef("surfaceM2")} placeholder="Ej: 2500" />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField fullWidth size="small" label="Sector económico" value={form.economicSector} onChange={ef("economicSector")} />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField fullWidth size="small" label="Sector económico 2" value={form.economicSector2} onChange={ef("economicSector2")} />
                    </Grid>
                  </>
                ) : (
                  <Grid container spacing={3}>
                    <Grid size={{ xs: 12, sm: 6 }}><Field label="N° Paneles" value={plant.panelCount != null ? plant.panelCount.toLocaleString("es-CL") : null} /></Grid>
                    <Grid size={{ xs: 12, sm: 6 }}><Field label="Tipo instalación" value={plant.installationType} /></Grid>
                    <Grid size={{ xs: 12, sm: 6 }}><Field label="Superficie" value={plant.surfaceM2 != null ? `${plant.surfaceM2.toLocaleString("es-CL")} m²` : null} /></Grid>
                    <Grid size={{ xs: 12, sm: 6 }}><Field label="Sector económico" value={plant.economicSector} /></Grid>
                    <Grid size={{ xs: 12, sm: 6 }}><Field label="Sector económico 2" value={plant.economicSector2} /></Grid>
                  </Grid>
                )}
              </Grid>
            </SectionCard>
          </Box>
        </Grid>

        {/* Right col (1/3) */}
        <Grid size={{ xs: 12, lg: 4 }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {/* Técnico */}
            <SectionCard icon={BoltOutlinedIcon} title="Técnico">
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
                {isEditing ? (
                  <>
                    <TextField fullWidth size="small" label="Capacidad (kWp)" type="number" value={form.capacityKw} onChange={ef("capacityKw")} />
                    <TextField fullWidth size="small" label="Rendimiento (kWh/kWp)" type="number" value={form.specificYield} onChange={ef("specificYield")} placeholder="Ej: 1450" />
                    <TextField fullWidth size="small" label="Distribuidora" value={form.distributorCompany} onChange={ef("distributorCompany")} placeholder="Ej: Enel" />
                    <TextField fullWidth size="small" label="ID Tarifa" value={form.tariffId} onChange={ef("tariffId")} placeholder="Ej: BT1" />
                  </>
                ) : (
                  <>
                    <Field label="Capacidad" value={plant.capacityKw != null ? `${plant.capacityKw} kWp` : null} />
                    <Field label="Rendimiento anual" value={plant.specificYield != null ? `${plant.specificYield.toLocaleString("es-CL")} kWh/kWp` : null} />
                    <Field label="Distribuidora" value={plant.distributorCompany} />
                    <Field label="ID Tarifa" value={plant.tariffId} />
                  </>
                )}
              </Box>
            </SectionCard>

            {/* Cliente & Portafolio */}
            <SectionCard icon={GroupOutlinedIcon} title="Cliente & Portafolio">
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
                <ReadonlyField label="Cliente" value={plant.customer.name} />
                <ReadonlyField label="RUT" value={plant.customer.rut} />
                <ReadonlyField label="Portafolio" value={plant.portfolio.name} />
              </Box>
            </SectionCard>
          </Box>
        </Grid>

        {/* Dirección — full width */}
        <Grid size={12}>
          <SectionCard icon={PlaceOutlinedIcon} title="Dirección">
            {isEditing ? (
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, sm: 8 }}>
                  <TextField fullWidth size="small" label="Dirección" value={form.addrAddress} onChange={ef("addrAddress")} placeholder="Ej: Av. El Sol 1234" />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField fullWidth size="small" label="Referencia" value={form.addrReference} onChange={ef("addrReference")} placeholder="Ej: Frente al galpón" />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField fullWidth size="small" label="Comuna" value={form.addrCity} onChange={ef("addrCity")} placeholder="Ej: Rancagua" />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField fullWidth size="small" label="Región" value={form.addrCounty} onChange={ef("addrCounty")} placeholder="Ej: O'Higgins" />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField fullWidth size="small" label="País" value={form.addrCountry} onChange={ef("addrCountry")} />
                </Grid>
              </Grid>
            ) : !hasAddress ? (
              <Typography variant="body2" color="text.secondary" fontStyle="italic" textAlign="center" py={2}>
                Sin dirección registrada
              </Typography>
            ) : (
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, sm: 8 }}><Field label="Dirección" value={plant.address?.address} /></Grid>
                <Grid size={{ xs: 12, sm: 4 }}><Field label="Referencia" value={plant.address?.reference} /></Grid>
                <Grid size={{ xs: 12, sm: 4 }}><Field label="Comuna" value={addrCity} /></Grid>
                <Grid size={{ xs: 12, sm: 4 }}><Field label="Región" value={addrCounty} /></Grid>
                <Grid size={{ xs: 12, sm: 4 }}><Field label="País" value={plant.address?.country ?? "Chile"} /></Grid>
              </Grid>
            )}
          </SectionCard>
        </Grid>
      </Grid>
    </Box>
  );
}
