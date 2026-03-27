import { requireRole, requireAuth } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";
import { UserTable } from "@/components/admin/user-table";
import { CreateUserDialog } from "@/components/admin/create-user-dialog";

export default async function AdminUsersPage() {
  const currentUser = await requireAuth();
  await requireRole([UserRole.MAESTRO]);

  const [users, customers, portfolios] = await Promise.all([
    prisma.user.findMany({
      where: { active: 1 },
      include: {
        customer: { select: { id: true, name: true, rut: true } },
        assignedPortfolio: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.customer.findMany({
      where: { active: 1 },
      select: { id: true, name: true, rut: true },
      orderBy: { name: "asc" },
    }),
    prisma.portfolio.findMany({
      where: { active: 1 },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-[var(--color-foreground)]">
            Usuarios
          </h1>
          <p className="text-[13px] text-[var(--color-muted-foreground)]">
            Gestión de accesos al sistema
          </p>
        </div>
        <CreateUserDialog customers={customers} portfolios={portfolios} />
      </div>

      <UserTable
        users={users}
        customers={customers}
        portfolios={portfolios}
        currentUserId={currentUser.id}
      />
    </div>
  );
}
