import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase/admin";
import { getRequestSession, isStaffRole } from "@/lib/auth/request-session";
import { sanitizeText } from "@/lib/utils/sanitize";

export const dynamic = "force-dynamic";

function mapAnswer(id: string, data: FirebaseFirestore.DocumentData) {
  const createdAt = data.createdAt?.toDate?.() ?? new Date();
  const updatedAt = data.updatedAt?.toDate?.() ?? createdAt;
  return {
    id,
    questionId: data.questionId,
    userId: data.userId,
    userName: data.userName,
    body: data.body,
    isOfficial: data.isOfficial ?? false,
    status: data.status ?? "visible",
    createdAt: createdAt.toISOString(),
    updatedAt: updatedAt.toISOString(),
  };
}

export async function GET(request: NextRequest) {
  const session = await getRequestSession(request);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const questionId = request.nextUrl.searchParams.get("questionId");
  if (!questionId) return NextResponse.json({ error: "questionId requerido" }, { status: 400 });

  const question = await getAdminDb().collection("forum_questions").doc(questionId).get();
  if (!question.exists) return NextResponse.json({ error: "Pregunta no encontrada" }, { status: 404 });

  const courseId = question.data()!.courseId as string;
  if (!isStaffRole(session.role)) {
    const enrollment = await getAdminDb().collection("enrollments").doc(`${session.uid}_${courseId}`).get();
    const status = enrollment.data()?.status;
    if (!enrollment.exists || (status !== "active" && status !== "completed")) {
      return NextResponse.json({ error: "Sin acceso" }, { status: 403 });
    }
  }

  const snap = await getAdminDb()
    .collection("forum_answers")
    .where("questionId", "==", questionId)
    .orderBy("createdAt", "asc")
    .get();

  const answers = snap.docs
    .map((d) => mapAnswer(d.id, d.data()))
    .filter((a) => isStaffRole(session.role) || a.status !== "hidden");

  return NextResponse.json({ answers });
}

export async function POST(request: NextRequest) {
  const session = await getRequestSession(request);
  if (!session || !isStaffRole(session.role)) {
    return NextResponse.json({ error: "Solo catequistas y administradores pueden responder" }, { status: 403 });
  }

  const body = await request.json();
  const questionId = body.questionId as string | undefined;
  const text = sanitizeText(String(body.body ?? "").trim());
  const isOfficial = body.isOfficial !== false;

  if (!questionId || !text) {
    return NextResponse.json({ error: "Pregunta y respuesta son requeridos" }, { status: 400 });
  }

  const db = getAdminDb();
  const questionRef = db.collection("forum_questions").doc(questionId);
  const question = await questionRef.get();
  if (!question.exists) return NextResponse.json({ error: "Pregunta no encontrada" }, { status: 404 });

  const answerRef = await db.collection("forum_answers").add({
    questionId,
    userId: session.uid,
    userName: session.displayName || session.email,
    body: text,
    isOfficial,
    status: "visible",
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  await questionRef.update({
    answerCount: FieldValue.increment(1),
    status: "answered",
    updatedAt: FieldValue.serverTimestamp(),
  });

  const answerDoc = await answerRef.get();
  return NextResponse.json({ answer: mapAnswer(answerDoc.id, answerDoc.data()!) }, { status: 201 });
}
