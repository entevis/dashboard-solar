import { requireAuth, getAccessiblePowerPlantIds } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { UserRole } from "@prisma/client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatCLP } from "@/lib/utils/formatters";
import { Zap, MapPin, User, Calendar, DollarSign, Wrench, FileText } from "lucide-react";
import Link from "next/link";
import { ContingencyActions } from "@/components/contingencies/contingency-actions";
import { ContingencyComments } from "@/components/contingencies/contingency-comments";
import { ContingencyAttachment } from "@/components/contingencies/contingency-attachment";

interface Props {
  params: Promise<{ contingencyId: string }>;
}

const statusConfig: Record<string, { label: string; className: string }> = {
  OPEN: { label: "Abierta", className: "bg-[var(--color-destructive)]/10 text-[var(--color-destructive)]" },
  IN_PROGRESS: { label: "En progreso", className: "bg-[var(--color-warning)]/10 text-[var(--color-warning)]" },
  CLOSED: { label: "Cerrada", className: "bg-[var(--color-success)]/10 text-[var(--color-success)]" },
};

const typeLabels: Record<string, string> = {
  PREVENTIVE: "Preventiva",
  CORRECTIVE: "Correctiva",
};

export default async function ContingencyDetailPage({ params }: Props) {
  const { contingencyId } = await params;
  const id = parseInt(contingencyId);
  const user = await requireAuth();

  const contingency = await prisma.contingency.findUnique({
    where: { id, active: 1 },
    include: {
      powerPlant: {
        select: { id: true, name: true, location: true, portfolio: { select: { name: true } } },
      },
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

  // Verify access
  const accessibleIds = await getAccessiblePowerPlantIds(user);
  if (accessibleIds !== "all" && !accessibleIds.includes(contingency.powerPlantId)) {
    notFound();
  }

  const status = statusConfig[contingency.status] ?? statusConfig.OPEN;
  const canWrite = user.role === UserRole.MAESTRO || user.role === UserRole.OPERATIVO;
  const isOpen = contingency.status !== "CLOSED";

  // Serialize dates
  const serializedComments = contingency.comments.map((c) => ({
    ...c,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  }));

  const serializedAttachment = contingency.attachment
    ? {
        id: contingency.attachment.id,
        fileName: contingency.attachment.fileName,
        fileUrl: contingency.attachment.fileUrl,
        fileSize: contingency.attachment.fileSize,
        fileType: contingency.attachment.fileType,
      }
    : null;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href="/contingencies"
              className="text-caption text-(--color-muted-foreground) hover:text-(--color-primary)"
            >
              Contingencias
            </Link>
            <span className="text-caption text-(--color-muted-foreground)">/</span>
            <span className="text-caption text-(--color-muted-foreground)">Detalle</span>
          </div>
          <h1 className="text-lg font-bold text-(--color-foreground)">
            Contingencia - {contingency.powerPlant.name}
          </h1>
          <p className="text-label text-(--color-muted-foreground)">
            {typeLabels[contingency.type]} · Creada por {contingency.createdBy.name}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className={`text-caption ${status.className}`}>
            {status.label}
          </Badge>
          {canWrite && contingency.status !== "CLOSED" && (
            <ContingencyActions
              contingencyId={contingency.id}
              currentStatus={contingency.status}
            />
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="border-(--color-border) shadow-sm">
          <CardHeader className="pb-3">
            <h3 className="text-body font-medium">Descripción</h3>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-label text-(--color-foreground) leading-relaxed whitespace-pre-wrap">
              {contingency.description}
            </p>
          </CardContent>
        </Card>

        <Card className="border-(--color-border) shadow-sm">
          <CardHeader className="pb-3">
            <h3 className="text-body font-medium">Información</h3>
          </CardHeader>
          <CardContent className="pt-0 space-y-3">
            <div className="flex items-center gap-3">
              <Zap className="w-4 h-4 text-(--color-muted-foreground)" />
              <div>
                <p className="text-caption text-(--color-muted-foreground)">Planta</p>
                <Link
                  href={`/power-plants/${contingency.powerPlant.id}`}
                  className="text-label font-medium text-(--color-primary) hover:underline"
                >
                  {contingency.powerPlant.name}
                </Link>
              </div>
            </div>
            {contingency.powerPlant.location && (
              <div className="flex items-center gap-3">
                <MapPin className="w-4 h-4 text-(--color-muted-foreground)" />
                <div>
                  <p className="text-caption text-(--color-muted-foreground)">Ubicación</p>
                  <p className="text-label font-medium">{contingency.powerPlant.location}</p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-3">
              <User className="w-4 h-4 text-(--color-muted-foreground)" />
              <div>
                <p className="text-caption text-(--color-muted-foreground)">Creada por</p>
                <p className="text-label font-medium">{contingency.createdBy.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="w-4 h-4 text-(--color-muted-foreground)" />
              <div>
                <p className="text-caption text-(--color-muted-foreground)">Fecha creación</p>
                <p className="text-label font-medium">{formatDate(contingency.createdAt)}</p>
              </div>
            </div>
            {contingency.closedAt && (
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-(--color-muted-foreground)" />
                <div>
                  <p className="text-caption text-(--color-muted-foreground)">Fecha cierre</p>
                  <p className="text-label font-medium">{formatDate(contingency.closedAt)}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {(contingency.cost != null || contingency.provider || contingency.workDescription) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {(contingency.cost != null || contingency.provider) && (
            <Card className="border-(--color-border) shadow-sm">
              <CardHeader className="pb-3">
                <h3 className="text-body font-medium">Costos y proveedor</h3>
              </CardHeader>
              <CardContent className="pt-0 space-y-3">
                {contingency.cost != null && (
                  <div className="flex items-center gap-3">
                    <DollarSign className="w-4 h-4 text-(--color-muted-foreground)" />
                    <div>
                      <p className="text-caption text-(--color-muted-foreground)">Costo</p>
                      <p className="text-label font-medium">{formatCLP(contingency.cost)}</p>
                    </div>
                  </div>
                )}
                {contingency.provider && (
                  <div className="flex items-center gap-3">
                    <Wrench className="w-4 h-4 text-(--color-muted-foreground)" />
                    <div>
                      <p className="text-caption text-(--color-muted-foreground)">Proveedor</p>
                      <p className="text-label font-medium">{contingency.provider}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {contingency.workDescription && (
            <Card className="border-(--color-border) shadow-sm">
              <CardHeader className="pb-3">
                <h3 className="text-body font-medium">Trabajo realizado</h3>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-start gap-3">
                  <FileText className="w-4 h-4 text-(--color-muted-foreground) mt-0.5" />
                  <p className="text-label text-(--color-foreground) leading-relaxed whitespace-pre-wrap">
                    {contingency.workDescription}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Attachment + Comments */}
      <Card className="border-(--color-border) shadow-sm">
        <CardContent className="pt-6">
          <ContingencyAttachment
            contingencyId={contingency.id}
            initialAttachment={serializedAttachment}
            canUpload={canWrite}
          />
          <ContingencyComments
            contingencyId={contingency.id}
            initialComments={serializedComments}
            canComment={isOpen}
            currentUserId={user.id}
          />
        </CardContent>
      </Card>
    </div>
  );
}
