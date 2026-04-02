import { requireRole } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { CustomerTable } from "@/components/admin/customer-table";
import { CreateCustomerDialog } from "@/components/admin/create-customer-dialog";
import { CustomerFilterBar } from "@/components/admin/customer-filter-bar";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Card from "@mui/material/Card";

interface Props {
  searchParams: Promise<{ q?: string }>;
}

export default async function CustomersPage({ searchParams }: Props) {
  await requireRole(["MAESTRO"]);

  const params = await searchParams;
  const q = params.q?.trim() ?? "";

  const customers = await prisma.customer.findMany({
    where: {
      active: 1,
      ...(q ? {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { rut: { contains: q, mode: "insensitive" } },
          { altName: { contains: q, mode: "insensitive" } },
        ],
      } : {}),
    },
    include: {
      _count: {
        select: {
          powerPlants: { where: { active: 1 } },
          users: { where: { active: 1 } },
        },
      },
    },
    orderBy: { name: "asc" },
  });

  const serialized = customers.map((c) => ({
    ...c,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  }));

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, alignItems: { sm: "flex-end" }, justifyContent: "space-between", gap: 2, flexWrap: "wrap" }}>
        <Box>
          <Typography variant="h5" fontWeight={700} color="text.primary">Clientes</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
            {customers.length} {customers.length === 1 ? "cliente encontrado" : "clientes encontrados"}
          </Typography>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}>
          <CustomerFilterBar />
          <CreateCustomerDialog />
        </Box>
      </Box>

      <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", overflow: "hidden" }}>
        <CustomerTable customers={serialized} />
      </Card>
    </Box>
  );
}
