import { addDoc, deleteDoc, getDoc, getDocs, orderBy, query, serverTimestamp, updateDoc, where } from "firebase/firestore";
import { fsCollection, fsDoc } from "@/lib/firebase/firestore-helpers";
import { toDate } from "@/lib/firebase/converters";
import type { NewsArticle } from "@/types/news";

function mapArticle(id: string, data: Record<string, unknown>): NewsArticle {
  return {
    id,
    slug: data.slug as string,
    title: data.title as string,
    excerpt: data.excerpt as string | undefined,
    content: data.content as string,
    imageUrl: data.imageUrl as string | undefined,
    author: data.author as string,
    status: data.status as NewsArticle["status"],
    publishedAt: data.publishedAt ? toDate(data.publishedAt as never) : undefined,
    createdAt: toDate(data.createdAt as never),
    updatedAt: toDate(data.updatedAt as never),
    tags: data.tags as string[] | undefined,
  };
}

export async function getNewsArticles(publishedOnly = false): Promise<NewsArticle[]> {
  try {
    const q = publishedOnly
      ? query(fsCollection("news"), where("status", "==", "published"), orderBy("publishedAt", "desc"))
      : query(fsCollection("news"), orderBy("publishedAt", "desc"));
    const snap = await getDocs(q);
    return snap.docs.map((d) => mapArticle(d.id, d.data()));
  } catch {
    const snap = await getDocs(fsCollection("news"));
    let articles = snap.docs.map((d) => mapArticle(d.id, d.data()));
    if (publishedOnly) articles = articles.filter((a) => a.status === "published");
    return articles.sort(
      (a, b) => (b.publishedAt?.getTime() ?? b.createdAt.getTime()) - (a.publishedAt?.getTime() ?? a.createdAt.getTime())
    );
  }
}

export async function getNewsBySlug(slug: string): Promise<NewsArticle | null> {
  const snap = await getDocs(query(fsCollection("news"), where("slug", "==", slug)));
  if (snap.empty) return null;
  return mapArticle(snap.docs[0].id, snap.docs[0].data());
}

export async function createNewsArticle(data: Omit<NewsArticle, "id" | "createdAt" | "updatedAt">): Promise<string> {
  const ref = await addDoc(fsCollection("news"), {
    ...data,
    publishedAt: data.status === "published" ? data.publishedAt ?? serverTimestamp() : null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateNewsArticle(id: string, data: Partial<NewsArticle>): Promise<void> {
  const payload: Record<string, unknown> = { ...data, updatedAt: serverTimestamp() };
  if (data.status === "published" && !data.publishedAt) payload.publishedAt = serverTimestamp();
  await updateDoc(fsDoc("news", id), payload);
}

export async function deleteNewsArticle(id: string): Promise<void> {
  await deleteDoc(fsDoc("news", id));
}

export async function getNewsArticle(id: string): Promise<NewsArticle | null> {
  const snap = await getDoc(fsDoc("news", id));
  return snap.exists() ? mapArticle(snap.id, snap.data()) : null;
}
