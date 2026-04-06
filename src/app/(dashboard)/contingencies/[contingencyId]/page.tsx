import { requireAuth, getAccessiblePowerPlantIds } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { UserRole } from "@prisma/client";
import { formatDate, formatCLP } from "@/lib/utils/formatters";
import Link from "next/link";
import { ContingencyActions } from "@/components/contingencies/contingency-actions";
import { ContingencyComments } from "@/components/contingencies/contingency-comments";
import { ContingencyAttachment } from "@/components/contingencies/contingency-attachment";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import BoltOutlinedIcon from "@mui/icons-material/BoltOutlined";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import PersonOutlinedIcon from "@mui/icons-material/PersonOutlined";
import CalendarTodayOutlinedIcon from "@mui/icons-material/CalendarTodayOutlined";
import AttachMoneyOutlinedIcon from "@mui/icons-material/AttachMoneyOutlined";
import BuildOutlinedIcon from "@mui/icons-material/BuildOutlined";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";

interface Props {
  params: Promise<{ contingencyId: string }>;
}

const statusConfig: Record<string, { label: string; sx: object }> = {
  OPEN:        { label: "Abierta",     sx: { backgroundColor: "#fee2e2", color: "#dc2626", fontWeight: 600 } },
  IN_PROGRESS: { label: "En progreso", sx: { backgroundColor: "#fef9c3", color: "#a16207", fontWeight: 600 } },
  CLOSED:      { label: "Cerrada",     sx: { backgroundColor: "#dcfce7", color: "#15803d", fontWeight: 600 } },
};

const typeLabels: Record<string, string> = { PREVENTIVE: "Preventiva", CORRECTIVE: "Correctiva" };

function InfoRow({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
      <Box sx={{ color: "text.secondary", mt: 0.25, flexShrink: 0 }}>{icon}</Box>
      <Box>
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", fontSize: "0.625rem" }}>
          {label}
        </Typography>
        {children}
      </Box>
    </Box>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider" }}>
      <Box sx={{ px: 2, py: 1.5, borderBottom: "1px solid", borderColor: "divider", backgroundColor: "#eff4ff", borderRadius: "12px 12px 0 0" }}>
        <Typography fontSize="0.875rem" fontWeight={600}>{title}</Typography>
      </Box>
      <CardContent sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {children}
      </CardContent>
    </Card>
  );
}

export default async function ContingencyDetailPage({ params }: Props) {
  const { contingencyId } = await params;
  const id = parseInt(contingencyId);
  const user = await requireAuth();

  const contingency = await prisma.contingency.findUnique({
    where: { id, active: 1 },
    include: {
      powerPlant: { select: { id: true, name: true, location: true, portfolio: { select: { name: true } } } },
      createdBy: { select: { name: true, email: true } },
      comments: {
        where: { active: 1 },
        include: { user: { select: { id: true, name: true, role: true } } },
        orderBy: { createdAt: "asc" },
      },
      attachment: true,
    },
  });

  if (!contingency) notFound();

  const accessibleIds = await getAccessiblePowerPlantIds(user);
  if (accessibleIds !== "all" && !accessibleIds.includes(contingency.powerPlantId)) notFound();

  const status = statusConfig[contingency.status] ?? statusConfig.OPEN;
  const isTecnico = user.role === UserRole.TECNICO;
  // TECNICO can only write on contingencies they created
  const canWrite = user.role === UserRole.MAESTRO || user.role === UserRole.OPERATIVO ||
    (isTecnico && contingency.createdById === user.id);
  const isOpen = contingency.status !== "CLOSED";

  const serializedComments = contingency.comments.map((c) => ({
    ...c,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  }));

  const serializedAttachment = contingency.attachment
    ? { id: contingency.attachment.id, fileName: contingency.attachment.fileName, fileUrl: contingency.attachment.fileUrl, fileSize: contingency.attachment.fileSize, fileType: contingency.attachment.fileType }
    : null;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>

      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mb: 0.5 }}>
            <Typography component={Link} href="/contingencies" variant="caption" color="text.secondary" sx={{ textDecoration: "none", "&:hover": { color: "primary.main" } }}>
              Contingencias
            </Typography>
            <Typography variant="caption" color="text.secondary">/</Typography>
            <Typography variant="caption" color="text.secondary">Detalle</Typography>
          </Box>
          <Typography variant="h5" fontWeight={700}>Contingencia — {contingency.powerPlant.name}</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {typeLabels[contingency.type]}{contingency.code ? ` · ${contingency.code}` : ""} · Creada por {contingency.createdBy.name}
          </Typography>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Chip label={status.label} size="small" sx={{ ...status.sx, fontSize: "0.6875rem" }} />
          {canWrite && contingency.status !== "CLOSED" && (
            <ContingencyActions contingencyId={contingency.id} currentStatus={contingency.status} />
          )}
        </Box>
      </Box>

      {/* Main cards */}
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" }, gap: 2 }}>
        <SectionCard title="Descripción">
          <Typography fontSize="0.8125rem" sx={{ lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
            {contingency.description}
          </Typography>
        </SectionCard>

        <SectionCard title="Información">
          <InfoRow icon={<BoltOutlinedIcon sx={{ fontSize: 16 }} />} label="Planta">
            <Typography component={Link} href={`/power-plants/${contingency.powerPlant.id}`} fontSize="0.8125rem" fontWeight={500} sx={{ color: "primary.main", textDecoration: "none", "&:hover": { textDecoration: "underline" } }}>
              {contingency.powerPlant.name}
            </Typography>
          </InfoRow>
          {contingency.powerPlant.location && (
            <InfoRow icon={<LocationOnOutlinedIcon sx={{ fontSize: 16 }} />} label="Ubicación">
              <Typography fontSize="0.8125rem" fontWeight={500}>{contingency.powerPlant.location}</Typography>
            </InfoRow>
          )}
          <InfoRow icon={<PersonOutlinedIcon sx={{ fontSize: 16 }} />} label="Creada por">
            <Typography fontSize="0.8125rem" fontWeight={500}>{contingency.createdBy.name}</Typography>
          </InfoRow>
          <InfoRow icon={<CalendarTodayOutlinedIcon sx={{ fontSize: 16 }} />} label="Fecha creación">
            <Typography fontSize="0.8125rem" fontWeight={500}>{formatDate(contingency.createdAt)}</Typography>
          </InfoRow>
          {contingency.closedAt && (
            <InfoRow icon={<CalendarTodayOutlinedIcon sx={{ fontSize: 16 }} />} label="Fecha cierre">
              <Typography fontSize="0.8125rem" fontWeight={500}>{formatDate(contingency.closedAt)}</Typography>
            </InfoRow>
          )}
        </SectionCard>
      </Box>

      {/* Cost / work */}
      {(contingency.cost != null || contingency.provider || contingency.workDescription) && (
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" }, gap: 2 }}>
          {(contingency.cost != null || contingency.provider) && (
            <SectionCard title="Costos y proveedor">
              {contingency.cost != null && (
                <InfoRow icon={<AttachMoneyOutlinedIcon sx={{ fontSize: 16 }} />} label="Costo">
                  <Typography fontSize="0.8125rem" fontWeight={500}>{formatCLP(contingency.cost)}</Typography>
                </InfoRow>
              )}
              {contingency.provider && (
                <InfoRow icon={<BuildOutlinedIcon sx={{ fontSize: 16 }} />} label="Proveedor">
                  <Typography fontSize="0.8125rem" fontWeight={500}>{contingency.provider}</Typography>
                </InfoRow>
              )}
            </SectionCard>
          )}
          {contingency.workDescription && (
            <SectionCard title="Trabajo realizado">
              <InfoRow icon={<DescriptionOutlinedIcon sx={{ fontSize: 16 }} />} label="Detalle">
                <Typography fontSize="0.8125rem" sx={{ lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
                  {contingency.workDescription}
                </Typography>
              </InfoRow>
            </SectionCard>
          )}
        </Box>
      )}

      {/* Attachment + Comments */}
      <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider" }}>
        <CardContent>
          <ContingencyAttachment contingencyId={contingency.id} initialAttachment={serializedAttachment} canUpload={canWrite} />
          <ContingencyComments contingencyId={contingency.id} initialComments={serializedComments} canComment={isOpen} currentUserId={user.id} />
        </CardContent>
      </Card>
    </Box>
  );
}
