"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { formatDate } from "@/lib/utils/format";
import { getNewsArticles, getNewsBySlug } from "@/lib/services/news";
import type { NewsArticle } from "@/types/news";

export default function NoticiaDetallePage() {
  const params = useParams();
  const slug = params.slug as string;
  const [article, setArticle] = useState<NewsArticle | null>(null);
  const [related, setRelated] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const found = await getNewsBySlug(slug);
        if (!found || found.status !== "published") {
          setNotFound(true);
          return;
        }
        setArticle(found);
        const all = await getNewsArticles(true);
        setRelated(all.filter((a) => a.slug !== slug).slice(0, 3));
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [slug]);

  if (loading) {
    return <p className="mx-auto max-w-3xl px-4 py-12 text-muted-foreground">Cargando noticia...</p>;
  }

  if (notFound || !article) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-12 text-center">
        <h1 className="text-2xl font-bold">Noticia no encontrada</h1>
        <Link href="/noticias" className="mt-4 inline-block text-primary hover:underline">
          Volver a noticias
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <Link href="/noticias" className="text-sm text-primary hover:underline">
        ← Volver a noticias
      </Link>

      <article className="mt-6">
        <p className="text-sm text-muted-foreground">
          {article.publishedAt ? formatDate(article.publishedAt) : ""} · {article.author}
        </p>
        <h1 className="mt-2 font-serif text-3xl font-bold">{article.title}</h1>
        {article.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={article.imageUrl} alt="" className="mt-6 w-full rounded-xl object-cover" />
        )}
        {article.excerpt && (
          <p className="mt-6 text-lg text-muted-foreground">{article.excerpt}</p>
        )}
        <div className="prose prose-neutral mt-8 max-w-none whitespace-pre-wrap dark:prose-invert">
          {article.content}
        </div>
      </article>

      {related.length > 0 && (
        <section className="mt-12 border-t pt-8">
          <h2 className="text-lg font-semibold">Más noticias</h2>
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
    </main>
  );
}
