"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ChevronDown, ChevronUp } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable } from "@/components/dashboard/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCourses, getModules, createModule, updateModule, deleteModule, reorderModules } from "@/lib/services/courses";
import type { Course, Module } from "@/types/course";

export default function ModulosAdminPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [courseId, setCourseId] = useState("");
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const selectClass =
    "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

  async function loadModules() {
    if (!courseId) return;
    setModules(await getModules(courseId));
  }

  useEffect(() => {
    getCourses().then((data) => {
      setCourses(data);
      if (data.length > 0) setCourseId(data[0].id);
      setLoading(false);
    });
  }, []);

  useEffect(() => { loadModules(); }, [courseId]);

  function openCreate() {
    setEditingId(null);
    setTitle("");
    setDescription("");
    setShowForm(true);
  }

  function openEdit(m: Module) {
    setEditingId(m.id);
    setTitle(m.title);
    setDescription(m.description ?? "");
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!courseId) return;
    setSaving(true);
    try {
      if (editingId) {
        await updateModule(editingId, { title, description: description || undefined });
        toast.success("Módulo actualizado");
      } else {
        await createModule({
          courseId, title, description: description || undefined,
          order: modules.length + 1, lessonOrder: [], status: "active",
        });
        toast.success("Módulo creado");
      }
      setShowForm(false);
      setEditingId(null);
      await loadModules();
    } catch {
      toast.error("Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(m: Module) {
    if (!confirm(`¿Eliminar módulo "${m.title}"?`)) return;
    try {
      await deleteModule(m.id, courseId);
      toast.success("Módulo eliminado");
      await loadModules();
    } catch {
      toast.error("Error al eliminar");
    }
  }

  async function moveModule(id: string, direction: "up" | "down") {
    const idx = modules.findIndex((m) => m.id === id);
    if (idx < 0) return;
    const newIdx = direction === "up" ? idx - 1 : idx + 1;
    if (newIdx < 0 || newIdx >= modules.length) return;
    const ids = modules.map((m) => m.id);
    [ids[idx], ids[newIdx]] = [ids[newIdx], ids[idx]];
    try {
      await reorderModules(courseId, ids);
      await loadModules();
    } catch {
      toast.error("Error al reordenar");
    }
  }

  if (loading) return <p className="text-muted-foreground">Cargando...</p>;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Módulos"
        description="Crear, editar, eliminar y reordenar módulos"
        action={<Button onClick={() => (showForm ? setShowForm(false) : openCreate())}>{showForm ? "Cancelar" : "Nuevo módulo"}</Button>}
      />

      <div className="max-w-sm space-y-2">
        <Label>Curso</Label>
        <select className={selectClass} value={courseId} onChange={(e) => setCourseId(e.target.value)}>
          {courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
        </select>
      </div>

      {showForm && (
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle>{editingId ? "Editar módulo" : "Nuevo módulo"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="max-w-lg space-y-4">
              <div className="space-y-2">
                <Label>Título</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Descripción</Label>
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} />
              </div>
              <Button type="submit" disabled={saving}>{saving ? "Guardando..." : "Guardar"}</Button>
            </form>
          </CardContent>
        </Card>
      )}

      <DataTable
        keyField="id"
        data={modules}
        columns={[
          { key: "order", header: "Orden", render: (m) => m.order },
          { key: "title", header: "Título", render: (m) => m.title },
          { key: "lessons", header: "Lecciones", render: (m) => m.lessonOrder.length },
          { key: "status", header: "Estado", render: (m) => m.status === "active" ? "Activo" : "Archivado" },
          {
            key: "actions",
            header: "Acciones",
            render: (m) => (
              <div className="flex flex-wrap gap-1">
                <Button size="sm" variant="outline" onClick={() => moveModule(m.id, "up")}><ChevronUp className="h-4 w-4" /></Button>
                <Button size="sm" variant="outline" onClick={() => moveModule(m.id, "down")}><ChevronDown className="h-4 w-4" /></Button>
                <Button size="sm" variant="outline" onClick={() => openEdit(m)}>Editar</Button>
                <Button size="sm" variant="destructive" onClick={() => handleDelete(m)}>Eliminar</Button>
              </div>
            ),
          },
        ]}
      />
    </div>
  );
}
