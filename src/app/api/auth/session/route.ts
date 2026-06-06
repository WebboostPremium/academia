import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";
import {
  createSessionToken,
  getSessionCookieName,
  getSessionMaxAge,
} from "@/lib/auth/session";
import type { SessionUser } from "@/types/user";

export async function POST(request: NextRequest) {
  try {
    const { idToken } = await request.json();
    if (!idToken || typeof idToken !== "string") {
      return NextResponse.json({ error: "Token requerido" }, { status: 400 });
    }

    const decoded = await getAdminAuth().verifyIdToken(idToken);
    const userDoc = await getAdminDb().collection("users").doc(decoded.uid).get();

    if (!userDoc.exists) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    const data = userDoc.data()!;

    if (data.status === "blocked") {
      return NextResponse.json({ error: "Cuenta bloqueada" }, { status: 403 });
    }

    const sessionUser: SessionUser = {
      uid: decoded.uid,
      email: data.email,
      displayName: data.displayName,
      role: data.role,
      status: data.status,
    };

    const token = await createSessionToken(sessionUser);
    const response = NextResponse.json({ user: sessionUser });

    response.cookies.set(getSessionCookieName(), token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: getSessionMaxAge(),
      path: "/",
    });

    return response;
  } catch {
    return NextResponse.json({ error: "Sesión inválida" }, { status: 401 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.set(getSessionCookieName(), "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });
  return response;
}

export async function GET(request: NextRequest) {
  const token = request.cookies.get(getSessionCookieName())?.value;
  if (!token) {
    return NextResponse.json({ user: null });
  }

  const { verifySessionToken } = await import("@/lib/auth/session");
  const user = await verifySessionToken(token);
  return NextResponse.json({ user });
}
