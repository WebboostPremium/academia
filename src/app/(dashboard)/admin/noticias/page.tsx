"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable } from "@/components/dashboard/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getNewsArticles, createNewsArticle, updateNewsArticle, deleteNewsArticle } from "@/lib/services/news";
import { formatDate } from "@/lib/utils/format";
import type { NewsArticle } from "@/types/news";

function slugify(text: string) {
  return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

async function announceToStudents(article: NewsArticle) {
  const res = await fetch("/api/notifications/send", {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      target: "general",
      title: `Anuncio: ${article.title}`,
      body: article.excerpt || article.content || article.title,
      link: `/noticias/${article.slug}`,
    }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error((data as { error?: string }).error ?? "No se pudo notificar a estudiantes");
  }
}

export default function AdminNoticiasPage() {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [announce, setAnnounce] = useState(true);
  const [form, setForm] = useState({ title: "", excerpt: "", content: "", author: "Administrador", imageUrl: "" });

  async function load() { setArticles(await getNewsArticles()); }
  useEffect(() => { load(); }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error("El título es obligatorio");
      return;
    }
    try {
      const article = {
        slug: slugify(form.title),
        title: form.title.trim(),
        excerpt: form.excerpt.trim() || undefined,
        content: form.content.trim() || form.excerpt.trim() || form.title.trim(),
        author: form.author.trim() || "Administrador",
        imageUrl: form.imageUrl.trim() || undefined,
        status: "draft" as const,
      };
      await createNewsArticle(article);
      toast.success("Anuncio guardado como borrador");
      setShowForm(false);
      setForm({ title: "", excerpt: "", content: "", author: "Administrador", imageUrl: "" });
      await load();
    } catch { toast.error("Error al crear anuncio"); }
  }

  async function togglePublish(article: NewsArticle) {
    const publishing = article.status !== "published";
    try {
      await updateNewsArticle(article.id, { status: publishing ? "published" : "draft" });
      if (publishing && announce) {
        await announceToStudents(article);
        toast.success("Publicado y notificado a estudiantes");
      } else {
        toast.success(publishing ? "Anuncio publicado" : "Anuncio despublicado");
      }
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al cambiar estado");
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Anuncios y noticias"
        description="Publica avisos para estudiantes y la página pública"
        action={<Button onClick={() => setShowForm(!showForm)}>{showForm ? "Cancelar" : "Nuevo anuncio"}</Button>}
      />

      {showForm && (
        <Card>
          <CardHeader><CardTitle>Crear anuncio</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label>Título *</Label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Ej: Inicio de catequesis de Confirmación" />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Resumen corto (opcional)</Label>
                <Input value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} placeholder="Texto breve para estudiantes y listado" />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Contenido completo (opcional)</Label>
                <Textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} rows={6} placeholder="Si lo dejas vacío, se usará el resumen o el título" />
              </div>
              <div className="space-y-2">
                <Label>Autor (opcional)</Label>
                <Input value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Imagen URL (opcional)</Label>
                <Input value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} />
              </div>
              <div className="sm:col-span-2"><Button type="submit">Guardar borrador</Button></div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="flex items-center gap-2 pt-6">
          <input id="announce" type="checkbox" checked={announce} onChange={(e) => setAnnounce(e.target.checked)} className="size-4" />
          <Label htmlFor="announce">Notificar a todos los estudiantes al publicar</Label>
        </CardContent>
      </Card>

      <DataTable
        keyField="id"
        data={articles}
        columns={[
          { key: "title", header: "Título", render: (a) => a.title },
          { key: "status", header: "Estado", render: (a) => <Badge>{a.status === "published" ? "Publicado" : "Borrador"}</Badge> },
          { key: "date", header: "Fecha", render: (a) => a.publishedAt ? formatDate(a.publishedAt) : "—" },
          {
            key: "actions",
            header: "Acciones",
            render: (a) => (
              <div className="flex gap-1">
                <Button size="sm" variant="outline" onClick={() => togglePublish(a)}>
                  {a.status === "published" ? "Despublicar" : "Publicar"}
                </Button>
                <Button size="sm" variant="destructive" onClick={() => deleteNewsArticle(a.id).then(load)}>Eliminar</Button>
              </div>
            ),
          },
        ]}
      />
    </div>
  );
}
