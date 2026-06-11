import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase/admin";
import { getRequestSession } from "@/lib/auth/request-session";

export const dynamic = "force-dynamic";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getRequestSession(request);
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const ref = getAdminDb().collection("news").doc(id);
    const doc = await ref.get();
    if (!doc.exists) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

    const payload: Record<string, unknown> = { updatedAt: FieldValue.serverTimestamp() };
    if (body.status) {
      payload.status = body.status;
      if (body.status === "published" && !doc.data()?.publishedAt) {
        payload.publishedAt = FieldValue.serverTimestamp();
      }
    }
    if (body.title !== undefined) payload.title = body.title;
    if (body.excerpt !== undefined) payload.excerpt = body.excerpt || null;
    if (body.content !== undefined) payload.content = body.content;
    if (body.author !== undefined) payload.author = body.author;
    if (body.imageUrl !== undefined) payload.imageUrl = body.imageUrl || null;

    await ref.update(payload);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[admin/news PATCH]", err);
    return NextResponse.json({ error: "Error al actualizar noticia" }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getRequestSession(_request);
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const { id } = await params;
    await getAdminDb().collection("news").doc(id).delete();
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[admin/news DELETE]", err);
    return NextResponse.json({ error: "Error al eliminar noticia" }, { status: 500 });
  }
}
