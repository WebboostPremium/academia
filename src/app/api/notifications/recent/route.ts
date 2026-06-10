import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { getRequestSession, isStaffRole } from "@/lib/auth/request-session";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const session = await getRequestSession(request);
  if (!session || !isStaffRole(session.role)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const limit = Math.min(Number(request.nextUrl.searchParams.get("limit") ?? 50), 100);
    const snap = await getAdminDb()
      .collection("notifications")
      .orderBy("createdAt", "desc")
      .limit(limit)
      .get();

    const notifications = snap.docs.map((d) => {
      const data = d.data();
      const createdAt = data.createdAt?.toDate?.() ?? new Date();
      return {
        id: d.id,
        userId: data.userId,
        type: data.type,
        title: data.title,
        body: data.body,
        link: data.link ?? undefined,
        read: data.read ?? false,
        createdAt: createdAt.toISOString(),
      };
    });

    return NextResponse.json({ notifications });
  } catch (err) {
    console.error("[notifications/recent]", err);
    return NextResponse.json({ error: "Error al cargar notificaciones" }, { status: 500 });
  }
}
