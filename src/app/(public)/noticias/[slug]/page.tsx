"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { PublicHeader } from "@/components/layout/public-header";
import { PublicFooter } from "@/components/layout/public-footer";
import { getNewsBySlug, getNewsArticles } from "@/lib/services/news";
import { formatDate } from "@/lib/utils/format";
import type { NewsArticle } from "@/types/news";

export default function NoticiaDetallePage() {
  const params = useParams();
  const slug = params.slug as string;
  const [article, setArticle] = useState<NewsArticle | null>(null);
  const [related, setRelated] = useState<NewsArticle[]>([]);

  useEffect(() => {
    getNewsBySlug(slug).then(async (a) => {
      setArticle(a);
      if (a) {
        const all = await getNewsArticles(true);
        setRelated(all.filter((x) => x.id !== a.id).slice(0, 3));
      }
    });
  }, [slug]);

  if (!article) {
    return (
      <>
        <PublicHeader />
        <main className="mx-auto max-w-3xl px-4 py-16 text-center"><p>Noticia no encontrada</p><Link href="/noticias" className="text-primary">Volver</Link></main>
        <PublicFooter />
      </>
    );
  }

  const shareUrl = typeof window !== "undefined" ? window.location.href : "";

  return (
    <>
      <PublicHeader />
      <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        {article.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={article.imageUrl} alt="" className="mb-6 w-full rounded-xl object-cover" />
        )}
        <p className="text-sm text-muted-foreground">{formatDate(article.publishedAt ?? article.createdAt)} · {article.author}</p>
        <h1 className="mt-2 font-serif text-3xl font-bold">{article.title}</h1>
        <div className="prose prose-neutral mt-6 max-w-none whitespace-pre-wrap">{article.content}</div>
        <div className="mt-8 flex gap-3 text-sm">
          <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`} target="_blank" rel="noopener noreferrer" className="text-primary">Facebook</a>
          <a href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(article.title)}`} target="_blank" rel="noopener noreferrer" className="text-primary">X</a>
        </div>
        {related.length > 0 && (
          <section className="mt-12">
            <h2 className="text-lg font-semibold">Noticias relacionadas</h2>
            <ul className="mt-4 space-y-2">
              {related.map((r) => (
                <li key={r.id}><Link href={`/noticias/${r.slug}`} className="text-primary hover:underline">{r.title}</Link></li>
              ))}
            </ul>
          </section>
        )}
      </article>
      <PublicFooter />
    </>
  );
}
