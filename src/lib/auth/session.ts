import { SignJWT, jwtVerify } from "jose";
import type { SessionUser } from "@/types/user";

const SESSION_COOKIE = "catequesis_session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

function getSecret(): Uint8Array {
  const secret = process.env.SESSION_SECRET ?? "dev-only-change-in-production";
  return new TextEncoder().encode(secret);
}

export async function createSessionToken(user: SessionUser): Promise<string> {
  return new SignJWT({
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    role: user.role,
    status: user.status,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(getSecret());
}

export async function verifySessionToken(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (
      typeof payload.uid !== "string" ||
      typeof payload.email !== "string" ||
      typeof payload.displayName !== "string" ||
      typeof payload.role !== "string" ||
      typeof payload.status !== "string"
    ) {
      return null;
    }
    return {
      uid: payload.uid,
      email: payload.email,
      displayName: payload.displayName,
      role: payload.role as SessionUser["role"],
      status: payload.status as SessionUser["status"],
    };
  } catch {
    return null;
  }
}

export function getSessionCookieName(): string {
  return SESSION_COOKIE;
}

export function getSessionMaxAge(): number {
  return SESSION_MAX_AGE;
}
