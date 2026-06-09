import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";
import {
  createSessionToken,
  getSessionCookieName,
  getSessionMaxAge,
  verifySessionToken,
} from "@/lib/auth/session";
import type { SessionUser } from "@/types/user";

function cookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: getSessionMaxAge(),
    path: "/",
  };
}

async function buildSessionUser(uid: string): Promise<SessionUser | null> {
  const userDoc = await getAdminDb().collection("users").doc(uid).get();
  if (!userDoc.exists) return null;
  const data = userDoc.data()!;
  if (data.status === "blocked") return null;
  return {
    uid,
    email: data.email,
    displayName: data.displayName,
    role: data.role,
    status: data.status,
  };
}

function setSessionCookie(response: NextResponse, token: string) {
  response.cookies.set(getSessionCookieName(), token, cookieOptions());
}

export async function POST(request: NextRequest) {
  try {
    const { idToken } = await request.json();
    if (!idToken || typeof idToken !== "string") {
      return NextResponse.json({ error: "Token requerido" }, { status: 400 });
    }

    const decoded = await getAdminAuth().verifyIdToken(idToken);
    const sessionUser = await buildSessionUser(decoded.uid);

    if (!sessionUser) {
      return NextResponse.json({ error: "Usuario no encontrado o bloqueado" }, { status: 403 });
    }

    const token = await createSessionToken(sessionUser);
    const response = NextResponse.json({ user: sessionUser });
    setSessionCookie(response, token);

    const { FieldValue } = await import("firebase-admin/firestore");
    await getAdminDb().collection("users").doc(decoded.uid).update({
      lastLoginAt: FieldValue.serverTimestamp(),
    }).catch(() => {});

    return response;
  } catch {
    return NextResponse.json({ error: "Sesión inválida" }, { status: 401 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.set(getSessionCookieName(), "", { ...cookieOptions(), maxAge: 0 });
  return response;
}

export async function GET(request: NextRequest) {
  const token = request.cookies.get(getSessionCookieName())?.value;
  if (!token) {
    return NextResponse.json({ user: null });
  }

  const current = await verifySessionToken(token);
  if (!current) {
    return NextResponse.json({ user: null });
  }

  const sessionUser = await buildSessionUser(current.uid);
  if (!sessionUser) {
    const response = NextResponse.json({ user: null });
    response.cookies.set(getSessionCookieName(), "", { ...cookieOptions(), maxAge: 0 });
    return response;
  }

  const roleChanged = sessionUser.role !== current.role || sessionUser.status !== current.status;
  const response = NextResponse.json({ user: sessionUser, refreshed: roleChanged });

  if (roleChanged) {
    const newToken = await createSessionToken(sessionUser);
    setSessionCookie(response, newToken);
  }

  return response;
}
