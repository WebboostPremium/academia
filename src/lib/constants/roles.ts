export const ROLES = {
  ADMIN: "admin",
  CATEQUISTA: "catequista",
  ESTUDIANTE: "estudiante",
} as const;

export type UserRole = (typeof ROLES)[keyof typeof ROLES];

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Administrador",
  catequista: "Catequista",
  estudiante: "Estudiante",
};
