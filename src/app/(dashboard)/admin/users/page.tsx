import { requireRole, requireAuth } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";
import { UserTable } from "@/components/admin/user-table";
import { CreateUserDialog } from "@/components/admin/create-user-dialog";
import { UserFilterBar } from "@/components/admin/user-filter-bar";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

interface Props {
  searchParams: Promise<{ q?: string; role?: string }>;
}

const VALID_ROLES = ["MAESTRO", "OPERATIVO", "CLIENTE", "CLIENTE_PERFILADO"] as const;

export default async function AdminUsersPage({ searchParams }: Props) {
  const currentUser = await requireAuth();
  await requireRole([UserRole.MAESTRO]);

  const params = await searchParams;
  const q = params.q?.trim() ?? "";
  const role = VALID_ROLES.includes(params.role as UserRole) ? (params.role as UserRole) : undefined;

  const [users, customers, portfolios] = await Promise.all([
    prisma.user.findMany({
      where: {
        active: 1,
        ...(role ? { role } : {}),
        ...(q ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } },
          ],
        } : {}),
      },
      include: {
        customer: { select: { id: true, name: true, rut: true } },
        assignedPortfolio: { select: { id: true, name: true } },
      },
      orderBy: { name: "asc" },
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
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3, flex: 1, minHeight: 0 }}>
      <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, alignItems: { sm: "flex-end" }, justifyContent: "space-between", gap: 2, flexWrap: "wrap", flexShrink: 0 }}>
        <Box>
          <Typography variant="h5" fontWeight={700} color="text.primary">Usuarios</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
            {users.length} {users.length === 1 ? "usuario encontrado" : "usuarios encontrados"}
          </Typography>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}>
          <UserFilterBar />
          <CreateUserDialog customers={customers} portfolios={portfolios} />
        </Box>
      </Box>

      <Box sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, backgroundColor: "white", overflow: "hidden", display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
        <UserTable
          users={users}
          customers={customers}
          portfolios={portfolios}
          currentUserId={currentUser.id}
        />
      </Box>
    </Box>
  );
}
