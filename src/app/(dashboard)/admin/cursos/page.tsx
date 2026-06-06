"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable } from "@/components/dashboard/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getCourses,
  createCourse,
  updateCourse,
  deleteCourse,
  duplicateCourse,
  publishCourse,
} from "@/lib/services/courses";
import { ImageUpload } from "@/components/shared/image-upload";
import { formatCurrency } from "@/lib/utils/format";
import type { Course, CourseSlug } from "@/types/course";

const SLUGS: { value: CourseSlug; label: string }[] = [
  { value: "bautismo", label: "Bautismo" },
  { value: "primera-comunion", label: "Primera Comunión" },
  { value: "confirmacion", label: "Confirmación" },
];

const emptyForm = {
  title: "",
  slug: "bautismo" as CourseSlug,
  description: "",
  shortDescription: "",
  imageUrl: "",
  instructor: "",
  instructorBio: "",
  objectives: "",
  durationLabel: "",
  price: "",
  passingScore: "70",
};

export default function CursosAdminPage() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  async function load() {
    const data = await getCourses();
    setCourses(data);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
  }

  function openEdit(course: Course) {
    setEditingId(course.id);
    setForm({
      title: course.title,
      slug: course.slug,
      description: course.description,
      shortDescription: course.shortDescription,
      imageUrl: course.imageUrl,
      instructor: course.instructor,
      instructorBio: course.instructorBio ?? "",
      objectives: (course.objectives ?? []).join("\n"),
      durationLabel: course.durationLabel ?? "",
      price: String(course.price),
      passingScore: String(course.passingScore),
    });
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    try {
      const data = {
        slug: form.slug,
        title: form.title,
        description: form.description,
        shortDescription: form.shortDescription,
        imageUrl: form.imageUrl,
        instructor: form.instructor,
        instructorBio: form.instructorBio || undefined,
        objectives: form.objectives.split("\n").map((o) => o.trim()).filter(Boolean),
        durationLabel: form.durationLabel || undefined,
        price: Number(form.price),
        currency: "USD" as const,
        category: "sacramental" as const,
        status: "draft" as const,
        passingScore: Number(form.passingScore),
        moduleOrder: [] as string[],
      };
      if (editingId) {
        await updateCourse(editingId, data);
        toast.success("Curso actualizado");
      } else {
        await createCourse(data);
        toast.success("Curso creado");
      }
      setShowForm(false);
      setEditingId(null);
      setForm(emptyForm);
      await load();
    } catch {
      toast.error("Error al guardar el curso");
    } finally {
      setSaving(false);
    }
  }

  async function handlePublish(id: string, publish: boolean) {
    try {
      await publishCourse(id, publish);
      toast.success(publish ? "Curso publicado" : "Curso despublicado");
      await load();
    } catch {
      toast.error("Error al cambiar el estado");
    }
  }

  async function handleDuplicate(id: string) {
    try {
      await duplicateCourse(id);
      toast.success("Curso duplicado");
      await load();
    } catch {
      toast.error("Error al duplicar");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar este curso?")) return;
    try {
      await deleteCourse(id);
      toast.success("Curso eliminado");
      await load();
    } catch {
      toast.error("Error al eliminar");
    }
  }

  const selectClass =
    "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

  if (loading) return <p className="text-muted-foreground">Cargando cursos...</p>;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cursos"
        description="Gestiona los cursos de catequesis"
        action={
          <Button onClick={() => (showForm && !editingId ? (setShowForm(false), setForm(emptyForm)) : openCreate())}>
            {showForm && !editingId ? "Cancelar" : "Nuevo curso"}
          </Button>
        }
      />

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? "Editar curso" : "Nuevo curso"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Título</Label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Sacramento</Label>
                <select className={selectClass} value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value as CourseSlug })}>
                  {SLUGS.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Descripción corta</Label>
                <Input value={form.shortDescription} onChange={(e) => setForm({ ...form, shortDescription: e.target.value })} required />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Descripción</Label>
                <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Instructor</Label>
                <Input value={form.instructor} onChange={(e) => setForm({ ...form, instructor: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Duración</Label>
                <Input value={form.durationLabel} onChange={(e) => setForm({ ...form, durationLabel: e.target.value })} placeholder="Ej: 8 semanas" />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Biografía del instructor</Label>
                <Textarea value={form.instructorBio} onChange={(e) => setForm({ ...form, instructorBio: e.target.value })} rows={2} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Objetivos (uno por línea)</Label>
                <Textarea value={form.objectives} onChange={(e) => setForm({ ...form, objectives: e.target.value })} rows={4} />
              </div>
              <div className="space-y-2">
                <Label>Precio (centavos)</Label>
                <Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Portada del curso (Cloudinary)</Label>
                <ImageUpload folder="courses" value={form.imageUrl} onChange={(url) => setForm({ ...form, imageUrl: url })} />
                <Input value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} placeholder="O pega URL manual" className="mt-2" />
              </div>
              <div className="space-y-2">
                <Label>Puntaje mínimo (%)</Label>
                <Input type="number" value={form.passingScore} onChange={(e) => setForm({ ...form, passingScore: e.target.value })} />
              </div>
              <div className="flex gap-2 sm:col-span-2">
                <Button type="submit" disabled={saving}>{saving ? "Guardando..." : "Guardar"}</Button>
                <Button type="button" variant="outline" onClick={() => { setShowForm(false); setEditingId(null); }}>Cancelar</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <DataTable
        keyField="id"
        data={courses}
        columns={[
          { key: "title", header: "Título", render: (c) => c.title },
          { key: "slug", header: "Sacramento", render: (c) => SLUGS.find((s) => s.value === c.slug)?.label ?? c.slug },
          { key: "price", header: "Precio", render: (c) => formatCurrency(c.price) },
          {
            key: "status",
            header: "Estado",
            render: (c) => (
              <Badge variant={c.status === "published" ? "default" : "secondary"}>
                {c.status === "published" ? "Publicado" : c.status === "draft" ? "Borrador" : "Archivado"}
              </Badge>
            ),
          },
          {
            key: "actions",
            header: "Acciones",
            render: (c) => (
              <div className="flex flex-wrap gap-1">
                <Button size="sm" variant="outline" onClick={() => openEdit(c)}>Editar</Button>
                <Button size="sm" variant="outline" onClick={() => handlePublish(c.id, c.status !== "published")}>
                  {c.status === "published" ? "Despublicar" : "Publicar"}
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleDuplicate(c.id)}>Duplicar</Button>
                <Button size="sm" variant="destructive" onClick={() => handleDelete(c.id)}>Eliminar</Button>
              </div>
            ),
          },
        ]}
      />
    </div>
  );
}
