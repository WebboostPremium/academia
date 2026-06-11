"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { formatDate } from "@/lib/utils/format";
import { getNewsArticles } from "@/lib/services/news";
import type { NewsArticle } from "@/types/news";

export default function NoticiasPage() {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getNewsArticles(true)
      .then(setArticles)
      .catch(() => setArticles([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = articles.filter(
    (a) =>
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      (a.excerpt ?? "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <h1 className="font-serif text-3xl font-bold">Noticias</h1>
      <p className="mt-2 text-muted-foreground">Novedades y anuncios de catequi online</p>
      <Input
        className="mt-6 max-w-md"
        placeholder="Buscar noticias..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {loading ? (
        <p className="mt-10 text-muted-foreground">Cargando noticias...</p>
      ) : filtered.length === 0 ? (
        <p className="mt-10 text-muted-foreground">
          {articles.length === 0
            ? "Aún no hay noticias publicadas. Vuelve pronto."
            : "No se encontraron noticias con esa búsqueda."}
        </p>
      ) : (
        <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((article) => (
            <Link
              key={article.id}
              href={`/noticias/${article.slug}`}
              className="group overflow-hidden rounded-xl border bg-card transition hover:shadow-md"
            >
              {article.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={article.imageUrl} alt="" className="h-44 w-full object-cover" />
              )}
              <div className="p-4">
                <p className="text-xs text-muted-foreground">
                  {article.publishedAt ? formatDate(article.publishedAt) : ""} · {article.author}
                </p>
                <h2 className="mt-2 font-semibold group-hover:text-primary">{article.title}</h2>
                <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">
                  {article.excerpt ?? article.content.slice(0, 120)}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
