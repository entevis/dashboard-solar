import { requireRole } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { CustomerTable } from "@/components/admin/customer-table";
import { CreateCustomerDialog } from "@/components/admin/create-customer-dialog";

export default async function CustomersPage() {
  await requireRole(["MAESTRO"]);

  const customers = await prisma.customer.findMany({
    where: { active: 1 },
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-[var(--color-foreground)]">
            Clientes
          </h1>
          <p className="text-[13px] text-[var(--color-muted-foreground)]">
            Gestión de clientes propietarios de plantas
          </p>
        </div>
        <CreateCustomerDialog />
      </div>

      <Card className="border-[var(--color-border)] shadow-sm">
        <CardContent className="p-0">
          <CustomerTable customers={serialized} />
        </CardContent>
      </Card>
    </div>
  );
}
