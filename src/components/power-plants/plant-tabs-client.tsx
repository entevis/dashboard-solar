"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import EditNoteOutlinedIcon from "@mui/icons-material/EditNoteOutlined";
import { PlantDetailPanel } from "@/components/power-plants/plant-detail-panel";
import type { SerializedPlant, FormState } from "@/components/power-plants/plant-detail-panel";
import { toast } from "@/lib/utils/toast";

function buildInitialForm(plant: SerializedPlant): FormState {
  return {
    name: plant.name,
    solcorId: plant.solcorId ?? "",
    status: plant.status,
    capacityKw: String(plant.capacityKw),
    specificYield: plant.specificYield != null ? String(plant.specificYield) : "",
    distributorCompany: plant.distributorCompany ?? "",
    tariffId: plant.tariffId ?? "",
    startDate: plant.startDate ? String(plant.startDate).slice(0, 10) : "",
    durationYears: plant.durationYears != null ? String(plant.durationYears) : "",
    panelCount: plant.panelCount != null ? String(plant.panelCount) : "",
    installationType: plant.installationType ?? "",
    surfaceM2: plant.surfaceM2 != null ? String(plant.surfaceM2) : "",
    economicSector: plant.economicSector ?? "",
    economicSector2: plant.economicSector2 ?? "",
    addrAddress: plant.address?.address ?? "",
    addrReference: plant.address?.reference ?? "",
    addrCity: plant.address?.city ?? plant.city ?? "",
    addrCounty: plant.address?.county ?? plant.location ?? "",
    addrCountry: plant.address?.country ?? "Chile",
  };
}

interface Props {
  plant: SerializedPlant;
  canEdit: boolean;
  base: string;
}

export function PlantTabsClient({ plant, canEdit, base }: Props) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<FormState>(() => buildInitialForm(plant));

  // Guard browser unload while editing
  useEffect(() => {
    if (!isEditing) return;
    const handler = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ""; };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isEditing]);

  const guardedNavigate = useCallback((href: string) => {
    if (isEditing) {
      if (!window.confirm("Tienes cambios sin guardar. ¿Salir de todas formas?")) return;
      setIsEditing(false);
      setForm(buildInitialForm(plant));
    }
    router.push(href);
  }, [isEditing, plant, router]);

  function handleCancel() {
    setForm(buildInitialForm(plant));
    setIsEditing(false);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch(`/api/power-plants/${plant.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          solcorId: form.solcorId || null,
          status: form.status,
          capacityKw: parseFloat(form.capacityKw),
          specificYield: form.specificYield ? parseFloat(form.specificYield) : null,
          distributorCompany: form.distributorCompany || null,
          tariffId: form.tariffId || null,
          startDate: form.startDate || null,
          durationYears: form.durationYears ? parseFloat(form.durationYears) : null,
          panelCount: form.panelCount ? parseInt(form.panelCount) : null,
          installationType: form.installationType || null,
          surfaceM2: form.surfaceM2 ? parseFloat(form.surfaceM2) : null,
          economicSector: form.economicSector || null,
          economicSector2: form.economicSector2 || null,
          address: {
            address: form.addrAddress || null,
            reference: form.addrReference || null,
            city: form.addrCity || null,
            county: form.addrCounty || null,
            country: form.addrCountry || "Chile",
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al guardar");
      toast.success("Planta actualizada");
      setIsEditing(false);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al guardar los cambios");
    } finally {
      setSaving(false);
    }
  }

  function onField(field: keyof FormState, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  return (
    <>
      <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <Tabs value="overview" variant="scrollable" scrollButtons={false} sx={{ flex: 1, minWidth: 0 }}>
            <Tab label="General" value="overview" onClick={() => guardedNavigate(base)} />
            <Tab label="Reportes" value="generation" onClick={() => guardedNavigate(`${base}/generation`)} />
            <Tab label="Contingencias" value="contingencies" onClick={() => guardedNavigate(`${base}/contingencies`)} />
          </Tabs>
          {canEdit && (
            <Box sx={{ display: { xs: "none", sm: "flex" }, gap: 1, alignItems: "center", pl: 2, flexShrink: 0 }}>
              {isEditing ? (
                <>
                  <Button variant="text" size="small" onClick={handleCancel} disabled={saving}>
                    Cancelar
                  </Button>
                  <Button
                    variant="contained"
                    size="small"
                    onClick={handleSave}
                    disabled={saving}
                    startIcon={saving ? <CircularProgress size={14} color="inherit" /> : undefined}
                  >
                    {saving ? "Guardando..." : "Guardar cambios"}
                  </Button>
                </>
              ) : (
                <Button variant="outlined" size="small" startIcon={<EditOutlinedIcon />} onClick={() => setIsEditing(true)}>
                  Editar
                </Button>
              )}
            </Box>
          )}
        </Box>
        {canEdit && (
          <Box sx={{ display: { xs: "flex", sm: "none" }, gap: 1, pb: 1, pt: 0.5 }}>
            {isEditing ? (
              <>
                <Button variant="text" size="medium" onClick={handleCancel} disabled={saving} sx={{ minHeight: 44 }}>
                  Cancelar
                </Button>
                <Button
                  variant="contained"
                  size="medium"
                  onClick={handleSave}
                  disabled={saving}
                  startIcon={saving ? <CircularProgress size={14} color="inherit" /> : undefined}
                  sx={{ minHeight: 44 }}
                >
                  {saving ? "Guardando..." : "Guardar cambios"}
                </Button>
              </>
            ) : (
              <Button variant="outlined" size="medium" startIcon={<EditOutlinedIcon />} onClick={() => setIsEditing(true)} sx={{ minHeight: 44 }}>
                Editar
              </Button>
            )}
          </Box>
        )}
      </Box>

      {isEditing && (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, px: 2, py: 1, backgroundColor: "#eff4ff", borderBottom: "2px solid #004ac6", borderRadius: "0 0 4px 4px" }}>
          <EditNoteOutlinedIcon sx={{ fontSize: 16, color: "primary.main" }} />
          <Typography variant="caption" fontWeight={600} color="primary.main">
            Modo edición — los cambios no se guardan hasta que presiones &quot;Guardar cambios&quot;
          </Typography>
        </Box>
      )}
      <PlantDetailPanel plant={plant} isEditing={isEditing} saving={saving} form={form} onField={onField} />
    </>
  );
}
