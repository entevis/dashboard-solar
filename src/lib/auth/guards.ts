import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "./session";
import { UserRole } from "@prisma/client";
import type { User } from "@prisma/client";

/**
 * Require authenticated user. Redirects to /login if not authenticated.
 */
export async function requireAuth(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

/**
 * Require specific role(s). Redirects to /dashboard if unauthorized.
 */
export async function requireRole(allowedRoles: UserRole[]): Promise<User> {
  const user = await requireAuth();
  if (!allowedRoles.includes(user.role)) {
    redirect("/dashboard");
  }
  return user;
}

/**
 * Get the list of power plant IDs accessible by a user based on their role.
 */
export async function getAccessiblePowerPlantIds(user: User): Promise<number[] | "all"> {
  switch (user.role) {
    case UserRole.MAESTRO:
      return "all";

    case UserRole.OPERATIVO: {
      if (!user.assignedPortfolioId) return [];
      const plants = await prisma.powerPlant.findMany({
        where: { portfolioId: user.assignedPortfolioId, active: 1 },
        select: { id: true },
      });
      return plants.map((p) => p.id);
    }

    case UserRole.CLIENTE: {
      if (!user.customerId) return [];
      const plants = await prisma.powerPlant.findMany({
        where: { customerId: user.customerId, active: 1 },
        select: { id: true },
      });
      return plants.map((p) => p.id);
    }

    case UserRole.CLIENTE_PERFILADO: {
      const permissions = await prisma.userPlantPermission.findMany({
        where: { userId: user.id, active: 1 },
        select: { powerPlantId: true },
      });
      return permissions.map((p) => p.powerPlantId);
    }

    default:
      return [];
  }
}

/**
 * Build a Prisma where clause for power plant filtering based on user access.
 */
export async function buildPlantAccessFilter(user: User) {
  const accessibleIds = await getAccessiblePowerPlantIds(user);
  if (accessibleIds === "all") {
    return { active: 1 };
  }
  return { id: { in: accessibleIds }, active: 1 };
}

/**
 * Validate that the user has access to a specific portfolio.
 * MAESTRO: any portfolio. OPERATIVO: only their assigned portfolio.
 * CLIENTE/CLIENTE_PERFILADO: any portfolio that has plants belonging to their customer.
 * Returns the portfolio or redirects.
 */
export async function requirePortfolioAccess(user: User, portfolioId: number) {
  const portfolio = await prisma.portfolio.findUnique({
    where: { id: portfolioId, active: 1 },
    select: { id: true, name: true, duemintCompanyId: true },
  });

  if (!portfolio) redirect("/portfolios");

  if (user.role === UserRole.MAESTRO) return portfolio;

  if (user.role === UserRole.OPERATIVO) {
    if (user.assignedPortfolioId !== portfolioId) {
      redirect(user.assignedPortfolioId ? `/${user.assignedPortfolioId}/power-plants` : "/dashboard");
    }
    return portfolio;
  }

  if (user.role === UserRole.CLIENTE || user.role === UserRole.CLIENTE_PERFILADO) {
    const plant = await prisma.powerPlant.findFirst({
      where: { portfolioId, customerId: user.customerId ?? -1, active: 1 },
      select: { id: true },
    });
    if (!plant) redirect("/dashboard");
    return portfolio;
  }

  redirect("/dashboard");
}
