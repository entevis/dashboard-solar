import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { getAccessiblePowerPlantIds } from "@/lib/auth/guards";
import { UserRole } from "@prisma/client";
import { logAction } from "@/lib/services/audit.service";
import { createClient } from "@supabase/supabase-js";
import { SIC_EMISSION_FACTOR_TCO2_PER_MWH } from "@/lib/constants";

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== UserRole.MAESTRO) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const powerPlantIdParam = formData.get("powerPlantId") as string | null;
  const periodMonth = formData.get("periodMonth") as string | null;
  const periodYear = formData.get("periodYear") as string | null;
  const kwhGenerated = formData.get("kwhGenerated") as string | null;

  if (!file || !powerPlantIdParam || !periodMonth || !periodYear || !kwhGenerated) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const powerPlantId = parseInt(powerPlantIdParam);
  if (isNaN(powerPlantId)) {
    return NextResponse.json({ error: "Invalid powerPlantId" }, { status: 400 });
  }

  if (!file.type.includes("pdf")) {
    return NextResponse.json({ error: "Only PDF files are allowed" }, { status: 400 });
  }

  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: "File too large (max 10MB)" }, { status: 400 });
  }

  // Verify access
  const accessibleIds = await getAccessiblePowerPlantIds(user);
  if (accessibleIds !== "all" && !accessibleIds.includes(powerPlantId)) {
    return NextResponse.json({ error: "No access to this plant" }, { status: 403 });
  }

  // Check for existing report
  const existing = await prisma.generationReport.findUnique({
    where: {
      powerPlantId_periodMonth_periodYear: {
        powerPlantId,
        periodMonth: parseInt(periodMonth),
        periodYear: parseInt(periodYear),
      },
    },
  });

  if (existing && existing.active === 1) {
    return NextResponse.json(
      { error: "Ya existe un reporte para este periodo" },
      { status: 409 }
    );
  }

  // Upload to Supabase Storage
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const filePath = `generation/${powerPlantId}/${periodYear}-${String(periodMonth).padStart(2, "0")}.pdf`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await supabase.storage
    .from("generation-reports")
    .upload(filePath, buffer, {
      contentType: "application/pdf",
      upsert: true,
    });

  if (uploadError) {
    return NextResponse.json({ error: "Error uploading file" }, { status: 500 });
  }

  const { data: publicUrl } = supabase.storage
    .from("generation-reports")
    .getPublicUrl(filePath);

  const kwh = parseFloat(kwhGenerated);
  const co2Avoided = (kwh / 1000) * SIC_EMISSION_FACTOR_TCO2_PER_MWH;

  const report = await prisma.generationReport.create({
    data: {
      powerPlantId,
      periodMonth: parseInt(periodMonth),
      periodYear: parseInt(periodYear),
      kwhGenerated: kwh,
      co2Avoided,
      fileUrl: publicUrl.publicUrl,
      fileName: file.name,
    },
  });

  logAction(user.id, "CREATE", "generation_report", report.id, {
    powerPlantId,
    period: `${periodYear}-${periodMonth}`,
  });

  return NextResponse.json(report, { status: 201 });
}
