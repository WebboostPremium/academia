import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";

export const dynamic = "force-dynamic";

function mapArticle(id: string, data: FirebaseFirestore.DocumentData) {
  const publishedAt = data.publishedAt?.toDate?.();
  const createdAt = data.createdAt?.toDate?.() ?? new Date();
  const updatedAt = data.updatedAt?.toDate?.() ?? createdAt;
  return {
    id,
    slug: data.slug,
    title: data.title,
    excerpt: data.excerpt,
    content: data.content,
    imageUrl: data.imageUrl,
    author: data.author,
    status: data.status,
    publishedAt: publishedAt?.toISOString() ?? null,
    createdAt: createdAt.toISOString(),
    updatedAt: updatedAt.toISOString(),
    tags: data.tags,
  };
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const snap = await getAdminDb()
      .collection("news")
      .where("slug", "==", slug)
      .where("status", "==", "published")
      .limit(1)
      .get();

    if (snap.empty) {
      return NextResponse.json({ error: "Noticia no encontrada" }, { status: 404 });
    }

    const doc = snap.docs[0];
    const allSnap = await getAdminDb()
      .collection("news")
      .where("status", "==", "published")
      .orderBy("publishedAt", "desc")
      .limit(4)
      .get();

    const related = allSnap.docs
      .filter((d) => d.id !== doc.id)
      .slice(0, 3)
      .map((d) => mapArticle(d.id, d.data()));

    return NextResponse.json({
      article: mapArticle(doc.id, doc.data()),
      related,
    });
  } catch {
    return NextResponse.json({ error: "Error al cargar la noticia" }, { status: 500 });
  }
}
