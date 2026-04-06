import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { getAccessiblePowerPlantIds } from "@/lib/auth/guards";
import { UserRole } from "@prisma/client";
import { logAction } from "@/lib/services/audit.service";
import { createClient } from "@supabase/supabase-js";

interface RouteContext {
  params: Promise<{ contingencyId: string }>;
}

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
const BUCKET = "contingency-attachments";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(request: NextRequest, context: RouteContext) {
  const { contingencyId } = await context.params;
  const id = parseInt(contingencyId);
  if (isNaN(id)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (user.role !== UserRole.MAESTRO && user.role !== UserRole.OPERATIVO && user.role !== UserRole.TECNICO) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const contingency = await prisma.contingency.findUnique({
    where: { id, active: 1 },
    select: { id: true, powerPlantId: true, createdById: true },
  });
  if (!contingency) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // TECNICO can only attach files to contingencies they created
  if (user.role === UserRole.TECNICO && contingency.createdById !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
  if (!dbUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const accessibleIds = await getAccessiblePowerPlantIds(dbUser);
  if (accessibleIds !== "all" && !accessibleIds.includes(contingency.powerPlantId)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: "El archivo excede el tamaño máximo de 20MB" }, { status: 400 });
  }

  const supabase = getSupabase();
  const ext = file.name.split(".").pop() ?? "bin";
  const filePath = `contingencies/${id}/${Date.now()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(filePath, buffer, { contentType: file.type, upsert: true });

  if (uploadError) {
    console.error("Supabase upload error:", uploadError);
    return NextResponse.json({ error: "Error al subir el archivo" }, { status: 500 });
  }

  const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(filePath);

  // Remove previous attachment if exists (soft-delete + remove from storage)
  const previous = await prisma.contingencyAttachment.findUnique({
    where: { contingencyId: id },
  });
  if (previous) {
    const prevPath = new URL(previous.fileUrl).pathname.split(`/${BUCKET}/`)[1];
    if (prevPath) await supabase.storage.from(BUCKET).remove([prevPath]);
    await prisma.contingencyAttachment.delete({ where: { contingencyId: id } });
  }

  const attachment = await prisma.contingencyAttachment.create({
    data: {
      contingencyId: id,
      userId: user.id,
      fileUrl: urlData.publicUrl,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
    },
  });

  logAction(user.id, "CREATE", "contingency_attachment", attachment.id, { contingencyId: id });

  return NextResponse.json(attachment, { status: 201 });
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const { contingencyId } = await context.params;
  const id = parseInt(contingencyId);
  if (isNaN(id)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (user.role !== UserRole.MAESTRO && user.role !== UserRole.OPERATIVO && user.role !== UserRole.TECNICO) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const attachment = await prisma.contingencyAttachment.findUnique({
    where: { contingencyId: id },
    include: { contingency: { select: { createdById: true } } },
  });
  if (!attachment) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // TECNICO can only delete attachments on their own contingencies
  if (user.role === UserRole.TECNICO && attachment.contingency.createdById !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const supabase = getSupabase();
  const prevPath = new URL(attachment.fileUrl).pathname.split(`/${BUCKET}/`)[1];
  if (prevPath) await supabase.storage.from(BUCKET).remove([prevPath]);

  await prisma.contingencyAttachment.delete({ where: { contingencyId: id } });

  logAction(user.id, "DELETE", "contingency_attachment", attachment.id, { contingencyId: id });

  return NextResponse.json({ success: true });
}
