"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { formatDate } from "@/lib/utils/format";
import { toDate } from "@/lib/firebase/converters";
import type { NewsArticle } from "@/types/news";

function mapArticle(a: Record<string, unknown>): NewsArticle {
  return {
    id: a.id as string,
    slug: a.slug as string,
    title: a.title as string,
    excerpt: a.excerpt as string | undefined,
    content: a.content as string,
    imageUrl: a.imageUrl as string | undefined,
    author: a.author as string,
    status: a.status as NewsArticle["status"],
    publishedAt: a.publishedAt ? toDate(a.publishedAt as never) : undefined,
    createdAt: toDate(a.createdAt as never),
    updatedAt: toDate(a.updatedAt as never),
    tags: a.tags as string[] | undefined,
  };
}

export default function NoticiaDetallePage() {
  const params = useParams();
  const slug = params.slug as string;
  const [article, setArticle] = useState<NewsArticle | null>(null);
  const [related, setRelated] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetch(`/api/public/news/${slug}`)
      .then(async (res) => {
        if (res.status === 404) {
          setNotFound(true);
          return;
        }
        const data = await res.json();
        if (data.article) {
          setArticle(mapArticle(data.article));
          setRelated((data.related ?? []).map(mapArticle));
        } else {
          setNotFound(true);
        }
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16 text-center">
        <p className="text-muted-foreground">Cargando noticia...</p>
      </main>
    );
  }

  if (notFound || !article) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16 text-center">
        <p className="text-muted-foreground">Noticia no encontrada</p>
        <Link href="/noticias" className="mt-4 inline-block text-primary hover:underline">
          Volver a noticias
        </Link>
      </main>
    );
  }

  const shareUrl = typeof window !== "undefined" ? window.location.href : "";

  return (
    <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      {article.imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={article.imageUrl} alt="" className="mb-6 w-full rounded-xl object-cover" />
      )}
      <p className="text-sm text-muted-foreground">
        {formatDate(article.publishedAt ?? article.createdAt)} · {article.author}
      </p>
      <h1 className="mt-2 font-serif text-3xl font-bold">{article.title}</h1>
      <div className="prose prose-neutral mt-6 max-w-none whitespace-pre-wrap">{article.content}</div>
      <div className="mt-8 flex gap-3 text-sm">
        <a
          href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary"
        >
          Facebook
        </a>
        <a
          href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(article.title)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary"
        >
          X
        </a>
      </div>
      {related.length > 0 && (
        <section className="mt-12">
          <h2 className="text-lg font-semibold">Noticias relacionadas</h2>
          <ul className="mt-4 space-y-2">
            {related.map((r) => (
              <li key={r.id}>
                <Link href={`/noticias/${r.slug}`} className="text-primary hover:underline">
                  {r.title}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </article>
  );
}
