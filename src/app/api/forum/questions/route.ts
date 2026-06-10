import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase/admin";
import { getRequestSession, isStaffRole } from "@/lib/auth/request-session";
import { sanitizeText } from "@/lib/utils/sanitize";
import type { SessionUser } from "@/types/user";

export const dynamic = "force-dynamic";

function mapQuestion(id: string, data: FirebaseFirestore.DocumentData) {
  const createdAt = data.createdAt?.toDate?.() ?? new Date();
  const updatedAt = data.updatedAt?.toDate?.() ?? createdAt;
  return {
    id,
    courseId: data.courseId,
    userId: data.userId,
    userName: data.userName,
    title: data.title,
    body: data.body,
    status: data.status,
    answerCount: data.answerCount ?? 0,
    createdAt: createdAt.toISOString(),
    updatedAt: updatedAt.toISOString(),
  };
}

async function hasCourseAccess(uid: string, role: SessionUser["role"], courseId: string): Promise<boolean> {
  if (isStaffRole(role)) return true;
  const doc = await getAdminDb().collection("enrollments").doc(`${uid}_${courseId}`).get();
  if (!doc.exists) return false;
  const status = doc.data()?.status;
  return status === "active" || status === "completed";
}

export async function GET(request: NextRequest) {
  const session = await getRequestSession(request);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const courseId = request.nextUrl.searchParams.get("courseId");
  if (!courseId) return NextResponse.json({ error: "courseId requerido" }, { status: 400 });

  if (!(await hasCourseAccess(session.uid, session.role, courseId))) {
    return NextResponse.json({ error: "Sin acceso a este curso" }, { status: 403 });
  }

  const snap = await getAdminDb()
    .collection("forum_questions")
    .where("courseId", "==", courseId)
    .orderBy("createdAt", "desc")
    .get();

  const questions = snap.docs
    .map((d) => mapQuestion(d.id, d.data()))
    .filter((q) => isStaffRole(session.role) || q.status !== "hidden");

  return NextResponse.json({ questions });
}

export async function POST(request: NextRequest) {
  const session = await getRequestSession(request);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await request.json();
  const courseId = body.courseId as string | undefined;
  const title = sanitizeText(String(body.title ?? "").trim());
  const text = sanitizeText(String(body.body ?? "").trim());

  if (!courseId || !title || !text) {
    return NextResponse.json({ error: "Curso, título y detalle son requeridos" }, { status: 400 });
  }

  if (!(await hasCourseAccess(session.uid, session.role, courseId))) {
    return NextResponse.json({ error: "Sin acceso a este curso" }, { status: 403 });
  }

  const ref = await getAdminDb().collection("forum_questions").add({
    courseId,
    userId: session.uid,
    userName: session.displayName || session.email,
    title,
    body: text,
    status: "open",
    answerCount: 0,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  const doc = await ref.get();
  return NextResponse.json({ question: mapQuestion(doc.id, doc.data()!) }, { status: 201 });
}
