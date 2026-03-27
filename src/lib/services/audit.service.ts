import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export async function logAction(
  userId: number,
  action: string,
  entityType: string,
  entityId?: string | number,
  metadata?: Prisma.InputJsonValue
) {
  prisma.auditLog
    .create({
      data: {
        userId,
        action,
        entityType,
        entityId: entityId !== undefined ? String(entityId) : undefined,
        metadata,
      },
    })
    .catch(console.error);
}
