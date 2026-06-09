import { NextRequest } from "next/server";
import { verifySessionToken, getSessionCookieName } from "@/lib/auth/session";
import type { SessionUser } from "@/types/user";
import { ROLES } from "@/lib/constants/roles";

export async function getRequestSession(request: NextRequest): Promise<SessionUser | null> {
  const token = request.cookies.get(getSessionCookieName())?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export function isStaffRole(role: SessionUser["role"]): boolean {
  return role === ROLES.ADMIN || role === ROLES.CATEQUISTA;
}
