import { requireRole } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
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
    <div className="flex flex-col flex-1 min-h-0 gap-4">
      <div className="shrink-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-[var(--color-foreground)]">Clientes</h1>
          <p className="text-[13px] text-[var(--color-muted-foreground)]">
            {customers.length} {customers.length === 1 ? "cliente registrado" : "clientes registrados"}
          </p>
        </div>
        <CreateCustomerDialog />
      </div>

      <div className="flex-1 min-h-0 overflow-hidden border border-[var(--color-border)] rounded-xl bg-white shadow-sm flex flex-col">
        <CustomerTable customers={serialized} />
      </div>
    </div>
  );
}
