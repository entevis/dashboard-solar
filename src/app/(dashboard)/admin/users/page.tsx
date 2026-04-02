import { requireRole, requireAuth } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";
import { UserTable } from "@/components/admin/user-table";
import { CreateUserDialog } from "@/components/admin/create-user-dialog";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

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
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 2, flexWrap: "wrap" }}>
        <Box>
          <Typography variant="h5" fontWeight={700} color="text.primary">Usuarios</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>Gestión de accesos al sistema</Typography>
        </Box>
        <CreateUserDialog customers={customers} portfolios={portfolios} />
      </Box>

      <UserTable
        users={users}
        customers={customers}
        portfolios={portfolios}
        currentUserId={currentUser.id}
      />
    </Box>
  );
}
