import { UserRole } from "@prisma/client";

export { UserRole };

export const ROLE_LABELS: Record<UserRole, string> = {
  MAESTRO: "Maestro",
  OPERATIVO: "Operativo",
  CLIENTE: "Cliente",
  CLIENTE_PERFILADO: "Cliente Perfilado",
};

// Defines which route prefixes each role can access
export const ROLE_ACCESS: Record<UserRole, string[]> = {
  MAESTRO: ["*"],
  OPERATIVO: ["dashboard", "power-plants", "contingencies"],
  CLIENTE: ["dashboard", "power-plants", "billing", "reports"],
  CLIENTE_PERFILADO: ["dashboard", "power-plants", "billing", "reports"],
};

// Defines which actions each role can perform
export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  MAESTRO: ["*"],
  OPERATIVO: [
    "contingencies.create",
    "contingencies.update",
    "contingencies.read",
    "power-plants.read",
    "generation.read",
  ],
  CLIENTE: [
    "dashboard.read",
    "power-plants.read",
    "generation.read",
    "billing.read",
    "contingencies.read",
  ],
  CLIENTE_PERFILADO: [
    "dashboard.read",
    "power-plants.read",
    "generation.read",
    "billing.read",
    "contingencies.read",
  ],
};

export function hasPermission(role: UserRole, permission: string): boolean {
  const permissions = ROLE_PERMISSIONS[role];
  return permissions.includes("*") || permissions.includes(permission);
}

export function canAccessRoute(role: UserRole, route: string): boolean {
  const access = ROLE_ACCESS[role];
  if (access.includes("*")) return true;
  return access.some((prefix) => route.startsWith(prefix));
}
