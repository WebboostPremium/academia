import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { getRequestSession } from "@/lib/auth/request-session";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const session = await getRequestSession(request);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  try {
    const db = getAdminDb();
    const enrollSnap = await db.collection("enrollments").where("userId", "==", session.uid).get();
    const courseIds = enrollSnap.docs
      .filter((d) => {
        const s = d.data().status;
        return s === "active" || s === "completed";
      })
      .map((d) => d.data().courseId as string);

    if (courseIds.length === 0) {
      return NextResponse.json({ assignments: [] });
    }

    const [assignSnap, subSnap] = await Promise.all([
      db.collection("assignments").get(),
      db.collection("submissions").where("userId", "==", session.uid).get(),
    ]);

    const courseSet = new Set(courseIds);
    const courses: Record<string, string> = {};
    await Promise.all(
      courseIds.map(async (id) => {
        const c = await db.collection("courses").doc(id).get();
        if (c.exists) courses[id] = c.data()?.title ?? "Curso";
      })
    );

    const submissions = subSnap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        assignmentId: data.assignmentId as string,
        fileUrl: data.fileUrl as string,
        fileName: data.fileName as string,
        status: data.status as string,
        score: data.score as number | undefined,
        feedback: data.feedback as string | undefined,
      };
    });

    const assignments = assignSnap.docs
      .map((d) => {
        const data = d.data();
        return {
          id: d.id,
          courseId: data.courseId as string,
          title: data.title as string,
          instructions: data.instructions as string,
          maxScore: data.maxScore as number,
          status: data.status as string,
          dueDate: data.dueDate,
        };
      })
      .filter((a) => courseSet.has(a.courseId) && a.status === "active")
      .map((a) => {
        const dueDate = a.dueDate?.toDate?.() ?? new Date();
        const submission = submissions.find((s) => s.assignmentId === a.id);
        return {
          id: a.id,
          courseId: a.courseId,
          courseTitle: courses[a.courseId] ?? "Curso",
          title: a.title,
          instructions: a.instructions,
          maxScore: a.maxScore,
          dueDate: dueDate.toISOString(),
          submission: submission
            ? {
                id: submission.id,
                fileUrl: submission.fileUrl as string,
                fileName: submission.fileName as string,
                status: submission.status as string,
                score: submission.score as number | undefined,
                feedback: submission.feedback as string | undefined,
              }
            : null,
        };
      })
      .sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime());

    return NextResponse.json({ assignments });
  } catch (err) {
    console.error("[student/assignments]", err);
    return NextResponse.json({ error: "Error al cargar las tareas" }, { status: 500 });
  }
}
