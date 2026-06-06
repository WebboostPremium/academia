import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";
import { registerSchema } from "@/lib/validations/auth";
import { ROLES } from "@/lib/constants/roles";
import { FieldValue } from "firebase-admin/firestore";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
        { status: 400 }
      );
    }

    const { email, password, displayName, phone } = parsed.data;
    const auth = getAdminAuth();
    const db = getAdminDb();

    const existing = await auth.getUserByEmail(email).catch(() => null);
    if (existing) {
      return NextResponse.json({ error: "El correo ya está registrado" }, { status: 409 });
    }

    const userRecord = await auth.createUser({
      email,
      password,
      displayName,
    });

    await db.collection("users").doc(userRecord.uid).set({
      uid: userRecord.uid,
      email,
      displayName,
      phone: phone || null,
      role: ROLES.ESTUDIANTE,
      status: "active",
      studyTimeMinutes: 0,
      achievements: [],
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ uid: userRecord.uid });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al registrar";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
