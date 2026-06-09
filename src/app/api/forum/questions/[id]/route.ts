import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase/admin";
import { getRequestSession, isStaffRole } from "@/lib/auth/request-session";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getRequestSession(request);
  if (!session || !isStaffRole(session.role)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { id } = await params;
  const { status } = await request.json();
  const allowed = ["open", "answered", "closed", "hidden"];
  if (!allowed.includes(status)) {
    return NextResponse.json({ error: "Estado inválido" }, { status: 400 });
  }

  const ref = getAdminDb().collection("forum_questions").doc(id);
  const doc = await ref.get();
  if (!doc.exists) return NextResponse.json({ error: "Pregunta no encontrada" }, { status: 404 });

  await ref.update({ status, updatedAt: FieldValue.serverTimestamp() });
  return NextResponse.json({ success: true });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getRequestSession(request);
  if (!session || !isStaffRole(session.role)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { id } = await params;
  const db = getAdminDb();
  const ref = db.collection("forum_questions").doc(id);
  const doc = await ref.get();
  if (!doc.exists) return NextResponse.json({ error: "Pregunta no encontrada" }, { status: 404 });

  const answers = await db.collection("forum_answers").where("questionId", "==", id).get();
  const batch = db.batch();
  answers.docs.forEach((a) => batch.delete(a.ref));
  batch.delete(ref);
  await batch.commit();

  return NextResponse.json({ success: true });
}
