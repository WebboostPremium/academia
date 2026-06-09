import type { UserRole } from "./roles";

export const PUBLIC_ROUTES = ["/", "/cursos", "/nosotros", "/contacto", "/galeria", "/noticias", "/login", "/registro", "/recuperar"];

export const AUTH_ROUTES = ["/login", "/registro", "/recuperar"];

export const ROLE_DASHBOARD: Record<UserRole, string> = {
  admin: "/admin",
  catequista: "/catequista",
  estudiante: "/estudiante",
};

export const ROUTE_PERMISSIONS: Record<string, UserRole[]> = {
  "/admin": ["admin"],
  "/catequista": ["admin", "catequista"],
  "/estudiante": ["admin", "catequista", "estudiante"],
};

export function getRoleHomePath(role: UserRole): string {
  return ROLE_DASHBOARD[role];
}
