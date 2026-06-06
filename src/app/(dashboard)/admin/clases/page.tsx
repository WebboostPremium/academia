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
import { getLiveClasses, createLiveClass } from "@/lib/services/live-classes";
import { formatDateTime } from "@/lib/utils/format";
import type { Course } from "@/types/course";
import type { LiveClass } from "@/types";

export default function ClasesAdminPage() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [classes, setClasses] = useState<LiveClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    courseId: "",
    title: "",
    description: "",
    scheduledAt: "",
    scheduledTime: "",
    durationMinutes: "60",
    platform: "zoom" as LiveClass["platform"],
    meetingUrl: "",
  });

  const selectClass =
    "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

  async function load() {
    const [crs, cls] = await Promise.all([getCourses(), getLiveClasses()]);
    setCourses(crs);
    setClasses(cls);
    if (crs.length > 0) setForm((f) => ({ ...f, courseId: crs[0].id }));
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    const scheduledAt = new Date(`${form.scheduledAt}T${form.scheduledTime}`);
    setSaving(true);
    try {
      await createLiveClass({
        courseId: form.courseId,
        title: form.title,
        description: form.description || undefined,
        scheduledAt,
        durationMinutes: Number(form.durationMinutes),
        platform: form.platform,
        meetingUrl: form.meetingUrl,
        createdBy: user.uid,
        status: "scheduled",
      });
      toast.success("Clase creada");
      setForm((f) => ({ ...f, title: "", description: "", scheduledAt: "", scheduledTime: "", meetingUrl: "" }));
      setShowForm(false);
      setClasses(await getLiveClasses());
    } catch {
      toast.error("Error al crear la clase");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="text-muted-foreground">Cargando clases...</p>;

  const courseTitle = (id: string) => courses.find((c) => c.id === id)?.title ?? id;

  const STATUS_LABELS: Record<LiveClass["status"], string> = {
    scheduled: "Programada",
    completed: "Completada",
    cancelled: "Cancelada",
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Clases en vivo"
        description="Sesiones programadas con Zoom o Meet"
        action={<Button onClick={() => setShowForm(!showForm)}>{showForm ? "Cancelar" : "Nueva clase"}</Button>}
      />

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Nueva clase</CardTitle>
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
                <Label>Descripción</Label>
                <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Fecha</Label>
                <Input type="date" value={form.scheduledAt} onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Hora</Label>
                <Input type="time" value={form.scheduledTime} onChange={(e) => setForm({ ...form, scheduledTime: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Duración (min)</Label>
                <Input type="number" value={form.durationMinutes} onChange={(e) => setForm({ ...form, durationMinutes: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Plataforma</Label>
                <select className={selectClass} value={form.platform} onChange={(e) => setForm({ ...form, platform: e.target.value as LiveClass["platform"] })}>
                  <option value="zoom">Zoom</option>
                  <option value="google_meet">Google Meet</option>
                </select>
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>URL de reunión</Label>
                <Input value={form.meetingUrl} onChange={(e) => setForm({ ...form, meetingUrl: e.target.value })} required />
              </div>
              <div className="sm:col-span-2">
                <Button type="submit" disabled={saving}>{saving ? "Creando..." : "Crear clase"}</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <DataTable
        keyField="id"
        data={classes}
        columns={[
          { key: "title", header: "Título", render: (c) => c.title },
          { key: "course", header: "Curso", render: (c) => courseTitle(c.courseId) },
          { key: "date", header: "Fecha", render: (c) => formatDateTime(c.scheduledAt) },
          { key: "duration", header: "Duración", render: (c) => `${c.durationMinutes} min` },
          { key: "platform", header: "Plataforma", render: (c) => c.platform === "zoom" ? "Zoom" : "Meet" },
          {
            key: "status",
            header: "Estado",
            render: (c) => (
              <Badge variant={c.status === "scheduled" ? "default" : "secondary"}>
                {STATUS_LABELS[c.status]}
              </Badge>
            ),
          },
        ]}
      />
    </div>
  );
}
