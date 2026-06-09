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

export async function GET() {
  try {
    const snap = await getAdminDb()
      .collection("news")
      .where("status", "==", "published")
      .orderBy("publishedAt", "desc")
      .get();
    return NextResponse.json({
      articles: snap.docs.map((d) => mapArticle(d.id, d.data())),
    });
  } catch {
    return NextResponse.json({ articles: [] });
  }
}
