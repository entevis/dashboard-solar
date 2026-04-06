import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { getAccessiblePowerPlantIds } from "@/lib/auth/guards";
import { UserRole, ContingencyStatus, ContingencyType } from "@prisma/client";
import { logAction } from "@/lib/services/audit.service";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

const createSchema = z.object({
  powerPlantId: z.coerce.number().int().positive(),
  code: z.string().max(100).optional().nullable(),
  type: z.nativeEnum(ContingencyType),
  description: z.string().min(1).max(2000),
  cost: z.number().nullable().optional(),
  provider: z.string().nullable().optional(),
  workDescription: z.string().nullable().optional(),
});

const MAX_FILE_SIZE = 20 * 1024 * 1024;
const BUCKET = "contingency-attachments";

function getSupabase() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
}

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const accessibleIds = await getAccessiblePowerPlantIds(user);
  const { searchParams } = new URL(request.url);

  const status = searchParams.get("status") as ContingencyStatus | null;
  const type = searchParams.get("type") as ContingencyType | null;
  const powerPlantIdRaw = searchParams.get("powerPlantId");

  const where: Record<string, unknown> = { active: 1 };

  if (accessibleIds !== "all") {
    where.powerPlantId = { in: accessibleIds };
  }

  if (status) where.status = status;
  if (type) where.type = type;
  if (powerPlantIdRaw) where.powerPlantId = parseInt(powerPlantIdRaw);

  const contingencies = await prisma.contingency.findMany({
    where,
    include: {
      powerPlant: { select: { name: true, portfolio: { select: { name: true } } } },
      createdBy: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(contingencies);
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (user.role !== UserRole.MAESTRO && user.role !== UserRole.OPERATIVO && user.role !== UserRole.TECNICO) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const contentType = request.headers.get("content-type") ?? "";
  let fields: Record<string, unknown>;
  let file: File | null = null;

  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    fields = {
      powerPlantId: formData.get("powerPlantId"),
      code: formData.get("code") || null,
      type: formData.get("type"),
      description: formData.get("description"),
      cost: formData.get("cost") ? parseFloat(formData.get("cost") as string) : null,
      provider: formData.get("provider") || null,
      workDescription: formData.get("workDescription") || null,
    };
    const f = formData.get("file");
    if (f instanceof File && f.size > 0) file = f;
  } else {
    fields = await request.json();
  }

  const parsed = createSchema.safeParse(fields);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  if (file && file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: "El archivo excede el tamaño máximo de 20MB" }, { status: 400 });
  }

  const accessibleIds = await getAccessiblePowerPlantIds(user);
  if (accessibleIds !== "all" && !accessibleIds.includes(parsed.data.powerPlantId)) {
    return NextResponse.json({ error: "No access to this plant" }, { status: 403 });
  }

  const contingency = await prisma.contingency.create({
    data: { ...parsed.data, createdById: user.id },
    include: { powerPlant: { select: { name: true } } },
  });

  // Upload attachment if provided
  if (file) {
    const supabase = getSupabase();
    const ext = file.name.split(".").pop() ?? "bin";
    const filePath = `contingencies/${contingency.id}/${Date.now()}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(filePath, buffer, { contentType: file.type, upsert: true });

    if (!uploadError) {
      const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(filePath);
      await prisma.contingencyAttachment.create({
        data: {
          contingencyId: contingency.id,
          userId: user.id,
          fileUrl: urlData.publicUrl,
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
        },
      });
    }
  }

  logAction(user.id, "CREATE", "contingency", contingency.id, {
    powerPlantId: parsed.data.powerPlantId,
    type: parsed.data.type,
  });

  return NextResponse.json(contingency, { status: 201 });
}
