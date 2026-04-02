import { requireAuth } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import Image from "next/image";
import { SelectPortfolioForm } from "@/components/layout/select-portfolio-form";

export default async function SelectPortfolioPage() {
  const user = await requireAuth();

  if (user.role !== UserRole.MAESTRO) redirect("/dashboard");

  const cookieStore = await cookies();
  const existing = cookieStore.get("portfolio_id")?.value;
  if (existing) redirect("/dashboard");

  const portfolios = await prisma.portfolio.findMany({
    where: { active: 1 },
    select: {
      id: true,
      name: true,
      _count: { select: { powerPlants: { where: { active: 1 } } } },
    },
    orderBy: { id: "asc" },
  });

  const portfoliosWithCount = portfolios.map((p) => ({
    id: p.id,
    name: p.name,
    plantCount: p._count.powerPlants,
  }));

  return (
    <div className="min-h-screen bg-(--color-background) flex items-center justify-center px-4 py-12">
      {/* Decorative ambient blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-(--color-primary)/6 blur-[140px] rounded-full" />
        <div className="absolute -bottom-[20%] -right-[10%] w-[50%] h-[50%] bg-(--color-primary)/4 blur-[140px] rounded-full" />
      </div>

      {/* Top accent line — decorative */}
      <div className="fixed top-0 left-0 w-full h-[3px] bg-gradient-to-r from-(--color-primary) via-(--color-primary)/60 to-transparent" aria-hidden="true" />

      <main className="relative z-10 w-full max-w-sm" aria-label="Selección de portafolio">
        {/* Branding */}
        <div className="flex flex-col items-center text-center mb-10">
          <div className="w-14 h-14 rounded-2xl overflow-hidden mb-5 shadow-md">
            <Image
              src="/logo.jpg"
              alt="S-Invest logo"
              width={56}
              height={56}
              className="object-cover"
              priority
            />
          </div>
          <h1 className="text-[22px] font-headline font-bold text-(--color-on-surface) leading-tight">
            Bienvenido, {user.name.split(" ")[0]}
          </h1>
          <p className="text-[13px] text-(--color-on-surface-variant) mt-1.5">
            Selecciona el portafolio con el que quieres trabajar
          </p>
        </div>

        {/* Selector card */}
        <div className="bg-(--color-surface-container-lowest) rounded-2xl shadow-md p-5">
          <p
            className="text-[11px] font-bold uppercase tracking-widest text-(--color-on-surface-variant) mb-4"
            aria-hidden="true"
          >
            Portafolios disponibles
          </p>
          <SelectPortfolioForm portfolios={portfoliosWithCount} />
        </div>

        <p className="text-center text-[12px] text-(--color-on-surface-variant) mt-6">
          Podrás cambiar el portafolio activo en cualquier momento desde el menú superior
        </p>
      </main>
    </div>
  );
}
