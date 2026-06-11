import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { getRequestSession } from "@/lib/auth/request-session";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const session = await getRequestSession(request);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  try {
    const db = getAdminDb();
    let snap;
    try {
      snap = await db
        .collection("certificates")
        .where("userId", "==", session.uid)
        .orderBy("issuedAt", "desc")
        .get();
    } catch {
      snap = await db.collection("certificates").where("userId", "==", session.uid).get();
    }

    const certificates = snap.docs
      .map((d) => {
        const data = d.data();
        const issuedAt = data.issuedAt?.toDate?.() ?? new Date();
        return {
          id: d.id,
          userId: data.userId,
          courseId: data.courseId,
          courseTitle: data.courseTitle,
          studentName: data.studentName,
          certificateNumber: data.certificateNumber,
          pdfUrl: data.pdfUrl,
          status: data.status,
          issuedAt: issuedAt.toISOString(),
        };
      })
      .sort((a, b) => new Date(b.issuedAt).getTime() - new Date(a.issuedAt).getTime());

    return NextResponse.json({ certificates });
  } catch (err) {
    console.error("[student/certificates]", err);
    return NextResponse.json({ error: "Error al cargar certificados" }, { status: 500 });
  }
}
