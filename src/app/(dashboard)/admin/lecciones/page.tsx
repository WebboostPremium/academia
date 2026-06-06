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
import { getCourses, getModules, getLessons, createLesson, updateLesson, deleteLesson } from "@/lib/services/courses";
import { parseYoutubeId } from "@/lib/utils/youtube";
import type { Course, Module, Lesson } from "@/types/course";

const emptyForm = { title: "", description: "", youtubeUrl: "", pdfUrl: "", resourceTitle: "", resourceUrl: "" };

export default function LeccionesAdminPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [courseId, setCourseId] = useState("");
  const [moduleId, setModuleId] = useState("");
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const selectClass =
    "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

  async function reload() {
    if (moduleId) setLessons(await getLessons(undefined, moduleId));
  }

  useEffect(() => {
    getCourses().then((data) => {
      setCourses(data);
      if (data.length > 0) setCourseId(data[0].id);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!courseId) return;
    getModules(courseId).then((mods) => {
      setModules(mods);
      setModuleId(mods[0]?.id ?? "");
    });
  }, [courseId]);

  useEffect(() => { reload(); }, [moduleId]);

  function openEdit(l: Lesson) {
    setEditingId(l.id);
    const res = l.content.resources?.[0];
    setForm({
      title: l.title,
      description: l.description ?? "",
      youtubeUrl: l.content.video?.youtubeId ? `https://youtube.com/watch?v=${l.content.video.youtubeId}` : "",
      pdfUrl: l.content.pdfUrl ?? "",
      resourceTitle: res?.title ?? "",
      resourceUrl: res?.url ?? "",
    });
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!courseId || !moduleId) return;
    setSaving(true);
    const ytId = parseYoutubeId(form.youtubeUrl);
    const content = {
      video: ytId ? { youtubeId: ytId } : undefined,
      pdfUrl: form.pdfUrl || undefined,
      resources: form.resourceUrl ? [{ title: form.resourceTitle || "Recurso", url: form.resourceUrl, type: "link" as const }] : [],
    };
    try {
      if (editingId) {
        await updateLesson(editingId, { title: form.title, description: form.description || undefined, content });
        toast.success("Lección actualizada");
      } else {
        await createLesson({
          courseId, moduleId, title: form.title, description: form.description || undefined,
          order: lessons.length + 1, content, estimatedMinutes: 15, status: "draft",
        });
        toast.success("Lección creada");
      }
      setShowForm(false);
      setEditingId(null);
      setForm(emptyForm);
      await reload();
    } catch {
      toast.error("Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(l: Lesson) {
    if (!confirm(`¿Eliminar "${l.title}"?`)) return;
    try {
      await deleteLesson(l.id, l.moduleId);
      toast.success("Lección eliminada");
      await reload();
    } catch {
      toast.error("Error al eliminar");
    }
  }

  async function togglePublish(l: Lesson) {
    try {
      await updateLesson(l.id, { status: l.status === "published" ? "draft" : "published" });
      toast.success(l.status === "published" ? "Lección oculta" : "Lección publicada");
      await reload();
    } catch {
      toast.error("Error al cambiar estado");
    }
  }

  if (loading) return <p className="text-muted-foreground">Cargando...</p>;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Lecciones"
        description="Video YouTube, PDF, recursos, quiz y tarea"
        action={<Button onClick={() => { setShowForm(!showForm); setEditingId(null); setForm(emptyForm); }}>{showForm ? "Cancelar" : "Nueva lección"}</Button>}
      />

      <div className="grid max-w-2xl gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Curso</Label>
          <select className={selectClass} value={courseId} onChange={(e) => setCourseId(e.target.value)}>
            {courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
          </select>
        </div>
        <div className="space-y-2">
          <Label>Módulo</Label>
          <select className={selectClass} value={moduleId} onChange={(e) => setModuleId(e.target.value)}>
            {modules.map((m) => <option key={m.id} value={m.id}>{m.title}</option>)}
          </select>
        </div>
      </div>

      {showForm && (
        <Card className="rounded-2xl">
          <CardHeader><CardTitle>{editingId ? "Editar lección" : "Nueva lección"}</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid max-w-2xl gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label>Título</Label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Descripción</Label>
                <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Enlace de YouTube (video oculto/unlisted)</Label>
                <Input value={form.youtubeUrl} onChange={(e) => setForm({ ...form, youtubeUrl: e.target.value })} placeholder="https://www.youtube.com/watch?v=..." />
                <p className="text-xs text-muted-foreground">Pega el enlace completo. Los videos se alojan en YouTube, no en Firebase.</p>
              </div>
              <div className="space-y-2">
                <Label>URL del PDF</Label>
                <Input value={form.pdfUrl} onChange={(e) => setForm({ ...form, pdfUrl: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Recurso (título)</Label>
                <Input value={form.resourceTitle} onChange={(e) => setForm({ ...form, resourceTitle: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Recurso (URL)</Label>
                <Input value={form.resourceUrl} onChange={(e) => setForm({ ...form, resourceUrl: e.target.value })} />
              </div>
              <div className="sm:col-span-2">
                <Button type="submit" disabled={saving}>{saving ? "Guardando..." : "Guardar"}</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <DataTable
        keyField="id"
        data={lessons}
        columns={[
          { key: "order", header: "Orden", render: (l) => l.order },
          { key: "title", header: "Título", render: (l) => l.title },
          { key: "video", header: "Video", render: (l) => l.content.video?.youtubeId ?? "—" },
          { key: "pdf", header: "PDF", render: (l) => l.content.pdfUrl ? "Sí" : "—" },
          { key: "status", header: "Estado", render: (l) => <Badge variant={l.status === "published" ? "default" : "secondary"}>{l.status === "published" ? "Publicada" : "Borrador"}</Badge> },
          {
            key: "actions",
            header: "Acciones",
            render: (l) => (
              <div className="flex flex-wrap gap-1">
                <Button size="sm" variant="outline" onClick={() => openEdit(l)}>Editar</Button>
                <Button size="sm" variant="outline" onClick={() => togglePublish(l)}>{l.status === "published" ? "Ocultar" : "Publicar"}</Button>
                <Button size="sm" variant="destructive" onClick={() => handleDelete(l)}>Eliminar</Button>
              </div>
            ),
          },
        ]}
      />
    </div>
  );
}
