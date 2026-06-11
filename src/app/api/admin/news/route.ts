import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase/admin";
import { getRequestSession, isStaffRole } from "@/lib/auth/request-session";
import { sanitizeText } from "@/lib/utils/sanitize";

export const dynamic = "force-dynamic";

function mapArticle(id: string, data: FirebaseFirestore.DocumentData) {
  const createdAt = data.createdAt?.toDate?.() ?? new Date();
  const updatedAt = data.updatedAt?.toDate?.() ?? createdAt;
  const publishedAt = data.publishedAt?.toDate?.();
  return {
    id,
    slug: data.slug,
    title: data.title,
    excerpt: data.excerpt ?? undefined,
    content: data.content ?? "",
    author: data.author ?? "Administrador",
    imageUrl: data.imageUrl ?? undefined,
    status: data.status,
    publishedAt: publishedAt?.toISOString(),
    createdAt: createdAt.toISOString(),
    updatedAt: updatedAt.toISOString(),
  };
}

export async function GET(request: NextRequest) {
  const session = await getRequestSession(request);
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const snap = await getAdminDb().collection("news").get();
    const articles = snap.docs
      .map((d) => mapArticle(d.id, d.data()))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return NextResponse.json({ articles });
  } catch (err) {
    console.error("[admin/news GET]", err);
    return NextResponse.json({ error: "Error al cargar noticias" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getRequestSession(request);
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const title = sanitizeText(String(body.title ?? "").trim());
    if (!title) return NextResponse.json({ error: "El título es obligatorio" }, { status: 400 });

    const slug = String(body.slug ?? title.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""));
    const excerpt = sanitizeText(String(body.excerpt ?? "").trim());
    const content = sanitizeText(String(body.content ?? "").trim()) || excerpt || title;

    const ref = await getAdminDb().collection("news").add({
      slug,
      title,
      excerpt: excerpt || null,
      content,
      author: sanitizeText(String(body.author ?? "Administrador").trim()) || "Administrador",
      imageUrl: body.imageUrl ? String(body.imageUrl) : null,
      status: "draft",
      publishedAt: null,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    const doc = await ref.get();
    return NextResponse.json({ article: mapArticle(doc.id, doc.data()!) }, { status: 201 });
  } catch (err) {
    console.error("[admin/news POST]", err);
    return NextResponse.json({ error: "Error al crear noticia" }, { status: 500 });
  }
}
