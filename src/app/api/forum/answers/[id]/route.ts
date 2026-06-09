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
  const ref = getAdminDb().collection("forum_answers").doc(id);
  const doc = await ref.get();
  if (!doc.exists) return NextResponse.json({ error: "Respuesta no encontrada" }, { status: 404 });

  await ref.update({ status: "hidden", updatedAt: FieldValue.serverTimestamp() });
  return NextResponse.json({ success: true });
}
