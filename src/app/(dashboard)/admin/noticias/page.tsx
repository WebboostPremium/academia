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

export default function AdminNoticiasPage() {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", excerpt: "", content: "", author: "Administrador", imageUrl: "" });

  async function load() { setArticles(await getNewsArticles()); }
  useEffect(() => { load(); }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    try {
      await createNewsArticle({
        slug: slugify(form.title),
        title: form.title,
        excerpt: form.excerpt,
        content: form.content,
        author: form.author,
        imageUrl: form.imageUrl || undefined,
        status: "draft",
      });
      toast.success("Noticia creada");
      setShowForm(false);
      setForm({ title: "", excerpt: "", content: "", author: "Administrador", imageUrl: "" });
      await load();
    } catch { toast.error("Error al crear noticia"); }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Noticias" description="Publica novedades de la academia" action={<Button onClick={() => setShowForm(!showForm)}>{showForm ? "Cancelar" : "Nueva noticia"}</Button>} />

      {showForm && (
        <Card>
          <CardHeader><CardTitle>Crear noticia</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2"><Label>Título</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></div>
              <div className="space-y-2 sm:col-span-2"><Label>Resumen</Label><Input value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} /></div>
              <div className="space-y-2 sm:col-span-2"><Label>Contenido</Label><Textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} rows={8} required /></div>
              <div className="space-y-2"><Label>Autor</Label><Input value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })} /></div>
              <div className="space-y-2"><Label>Imagen URL</Label><Input value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} /></div>
              <div className="sm:col-span-2"><Button type="submit">Guardar borrador</Button></div>
            </form>
          </CardContent>
        </Card>
      )}

      <DataTable
        keyField="id"
        data={articles}
        columns={[
          { key: "title", header: "Título", render: (a) => a.title },
          { key: "status", header: "Estado", render: (a) => <Badge>{a.status}</Badge> },
          { key: "date", header: "Fecha", render: (a) => a.publishedAt ? formatDate(a.publishedAt) : "—" },
          {
            key: "actions",
            header: "Acciones",
            render: (a) => (
              <div className="flex gap-1">
                <Button size="sm" variant="outline" onClick={() => updateNewsArticle(a.id, { status: a.status === "published" ? "draft" : "published" }).then(load)}>
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
