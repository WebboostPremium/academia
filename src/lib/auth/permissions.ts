import type { UserRole } from "@/lib/constants/roles";
import { ROUTE_PERMISSIONS } from "@/lib/constants/routes";

export function canAccessRoute(role: UserRole, pathname: string): boolean {
  const matchedPrefix = Object.keys(ROUTE_PERMISSIONS)
    .sort((a, b) => b.length - a.length)
    .find((prefix) => pathname.startsWith(prefix));

  if (!matchedPrefix) return true;

  return ROUTE_PERMISSIONS[matchedPrefix].includes(role);
}
