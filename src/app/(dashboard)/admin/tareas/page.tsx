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
import { getCourses } from "@/lib/services/courses";
import { getAssignments, createAssignment } from "@/lib/services/assignments";
import { formatDate } from "@/lib/utils/format";
import type { Course } from "@/types/course";
import type { Assignment } from "@/types";

export default function TareasAdminPage() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ courseId: "", title: "", instructions: "", dueDate: "", maxScore: "100" });

  const selectClass =
    "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

  async function load() {
    const [crs, tasks] = await Promise.all([getCourses(), getAssignments()]);
    setCourses(crs);
    setAssignments(tasks);
    if (crs.length > 0) setForm((f) => ({ ...f, courseId: crs[0].id }));
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    try {
      await createAssignment({
        courseId: form.courseId,
        title: form.title,
        instructions: form.instructions,
        dueDate: new Date(form.dueDate),
        maxScore: Number(form.maxScore),
        status: "active",
        createdBy: user.uid,
      });
      toast.success("Tarea creada");
      setForm((f) => ({ ...f, title: "", instructions: "", dueDate: "" }));
      setShowForm(false);
      setAssignments(await getAssignments());
    } catch {
      toast.error("Error al crear la tarea");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="text-muted-foreground">Cargando tareas...</p>;

  const courseTitle = (id: string) => courses.find((c) => c.id === id)?.title ?? id;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tareas"
        description="Asignaciones para estudiantes"
        action={<Button onClick={() => setShowForm(!showForm)}>{showForm ? "Cancelar" : "Nueva tarea"}</Button>}
      />

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Nueva tarea</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="grid gap-4 sm:grid-cols-2 max-w-2xl">
              <div className="space-y-2 sm:col-span-2">
                <Label>Curso</Label>
                <select className={selectClass} value={form.courseId} onChange={(e) => setForm({ ...form, courseId: e.target.value })}>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>{c.title}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Título</Label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Instrucciones</Label>
                <Textarea value={form.instructions} onChange={(e) => setForm({ ...form, instructions: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Fecha límite</Label>
                <Input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Puntaje máximo</Label>
                <Input type="number" value={form.maxScore} onChange={(e) => setForm({ ...form, maxScore: e.target.value })} />
              </div>
              <div className="sm:col-span-2">
                <Button type="submit" disabled={saving}>{saving ? "Creando..." : "Crear tarea"}</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <DataTable
        keyField="id"
        data={assignments}
        columns={[
          { key: "title", header: "Título", render: (a) => a.title },
          { key: "course", header: "Curso", render: (a) => courseTitle(a.courseId) },
          { key: "due", header: "Fecha límite", render: (a) => formatDate(a.dueDate) },
          { key: "score", header: "Puntaje", render: (a) => a.maxScore },
          {
            key: "status",
            header: "Estado",
            render: (a) => (
              <Badge variant={a.status === "active" ? "default" : "secondary"}>
                {a.status === "active" ? "Activa" : "Archivada"}
              </Badge>
            ),
          },
        ]}
      />
    </div>
  );
}
