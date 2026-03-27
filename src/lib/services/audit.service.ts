import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export async function logAction(
  userId: string,
  action: string,
  entityType: string,
  entityId?: string,
  metadata?: Prisma.InputJsonValue
) {
  prisma.auditLog
    .create({
      data: {
        userId,
        action,
        entityType,
        entityId,
        metadata,
      },
    })
    .catch(console.error);
}
