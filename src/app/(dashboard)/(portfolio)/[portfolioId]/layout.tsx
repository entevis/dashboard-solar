import { requireAuth, requirePortfolioAccess } from "@/lib/auth/guards";

export default async function PortfolioLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ portfolioId: string }>;
}) {
  const { portfolioId } = await params;
  const pid = parseInt(portfolioId);

  if (isNaN(pid) || pid <= 0) {
    const { notFound } = await import("next/navigation");
    notFound();
  }

  const user = await requireAuth();
  await requirePortfolioAccess(user, pid);

  return <>{children}</>;
}
