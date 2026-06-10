import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase/admin";
import { getRequestSession, isStaffRole } from "@/lib/auth/request-session";
import { sanitizeText } from "@/lib/utils/sanitize";
import { ROLES } from "@/lib/constants/roles";

export const dynamic = "force-dynamic";

type Target = "general" | "student" | "course";

async function resolveUserIds(target: Target, userId?: string, courseId?: string): Promise<string[]> {
  const db = getAdminDb();

  if (target === "student" && userId) return [userId];

  if (target === "course" && courseId) {
    const snap = await db
      .collection("enrollments")
      .where("courseId", "==", courseId)
      .where("status", "in", ["active", "completed"])
      .get();
    return [...new Set(snap.docs.map((d) => d.data().userId as string))];
  }

  const snap = await db.collection("users").where("role", "==", ROLES.ESTUDIANTE).get();
  return snap.docs
    .filter((d) => d.data().status !== "blocked")
    .map((d) => d.id);
}

export async function POST(request: NextRequest) {
  const session = await getRequestSession(request);
  if (!session || !isStaffRole(session.role)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const target = body.target as Target;
    const title = sanitizeText(String(body.title ?? "").trim());
    const text = sanitizeText(String(body.body ?? "").trim());
    const userId = body.userId as string | undefined;
    const courseId = body.courseId as string | undefined;
    const link = body.link ? String(body.link) : undefined;

    if (!title || !text) {
      return NextResponse.json({ error: "Título y mensaje son requeridos" }, { status: 400 });
    }

    if (target === "student" && !userId) {
      return NextResponse.json({ error: "Selecciona un estudiante" }, { status: 400 });
    }

    if (target === "course" && !courseId) {
      return NextResponse.json({ error: "Selecciona un curso" }, { status: 400 });
    }

    const userIds = await resolveUserIds(target, userId, courseId);
    if (userIds.length === 0) {
      return NextResponse.json({ error: "No hay destinatarios para esta notificación" }, { status: 400 });
    }

    const db = getAdminDb();
    const resolvedLink =
      link ??
      (courseId ? `/estudiante/cursos/${courseId}` : undefined);

    const batchSize = 400;
    for (let i = 0; i < userIds.length; i += batchSize) {
      const batch = db.batch();
      for (const uid of userIds.slice(i, i + batchSize)) {
        const ref = db.collection("notifications").doc();
        batch.set(ref, {
          userId: uid,
          type: "system",
          title,
          body: text,
          link: resolvedLink ?? null,
          read: false,
          createdAt: FieldValue.serverTimestamp(),
        });
      }
      await batch.commit();
    }

    return NextResponse.json({ success: true, count: userIds.length });
  } catch (err) {
    console.error("[notifications/send]", err);
    return NextResponse.json({ error: "Error al enviar notificación" }, { status: 500 });
  }
}
