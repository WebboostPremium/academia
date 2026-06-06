import type { UserRole } from "@/lib/constants/roles";

export type UserStatus = "active" | "blocked";

export interface AppUser {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: UserRole;
  phone?: string;
  status: UserStatus;
  assignedCatequistaId?: string;
  assignedCourseIds?: string[];
  studyTimeMinutes: number;
  achievements: string[];
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
}

export interface SessionUser {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  status: UserStatus;
}
