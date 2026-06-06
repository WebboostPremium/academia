"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { getPublishedCourses } from "@/lib/services/courses";
import { getLiveClasses, createLiveClass, updateLiveClass, deleteLiveClass } from "@/lib/services/live-classes";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable } from "@/components/dashboard/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/utils/format";
import type { Course } from "@/types/course";
import type { LiveClass } from "@/types";

interface ClassRow extends Record<string, unknown> {
  id: string;
  title: string;
  scheduledAt: Date;
  platform: string;
  status: string;
  meetingUrl: string;
}

const STATUS_LABELS: Record<LiveClass["status"], string> = {
  scheduled: "Programada",
  completed: "Completada",
  cancelled: "Cancelada",
};

export default function ClasesPage() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [courseId, setCourseId] = useState("");
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [durationMinutes, setDurationMinutes] = useState("60");
  const [platform, setPlatform] = useState<LiveClass["platform"]>("zoom");
  const [meetingUrl, setMeetingUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  async function loadClasses(cid: string) {
    const data = await getLiveClasses(cid);
    setClasses(
      data.map((c) => ({
        id: c.id,
        title: c.title,
        scheduledAt: c.scheduledAt,
        platform: c.platform === "zoom" ? "Zoom" : "Google Meet",
        status: STATUS_LABELS[c.status],
        meetingUrl: c.meetingUrl,
      }))
    );
  }

  useEffect(() => {
    getPublishedCourses().then((c) => {
      setCourses(c);
      if (c.length > 0) {
        setCourseId(c[0].id);
        loadClasses(c[0].id);
      }
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (courseId) loadClasses(courseId);
  }, [courseId]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !courseId) return;

    setSaving(true);
    try {
      await createLiveClass({
        courseId,
        title,
        description: description || undefined,
        scheduledAt: new Date(scheduledAt),
        durationMinutes: Number(durationMinutes),
        platform,
        meetingUrl,
        createdBy: user.uid,
        status: "scheduled",
      });
      toast.success("Clase programada");
      setShowForm(false);
      setTitle("");
      setDescription("");
      setScheduledAt("");
      setMeetingUrl("");
      await loadClasses(courseId);
    } catch {
      toast.error("Error al crear la clase");
    } finally {
      setSaving(false);
    }
  }

  async function handleStatus(id: string, status: LiveClass["status"]) {
    try {
      await updateLiveClass(id, { status });
      toast.success("Estado actualizado");
      await loadClasses(courseId);
    } catch {
      toast.error("Error al actualizar");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar esta clase?")) return;
    try {
      await deleteLiveClass(id);
      toast.success("Clase eliminada");
      await loadClasses(courseId);
    } catch {
      toast.error("Error al eliminar");
    }
  }

  if (loading) {
    return <p className="text-muted-foreground">Cargando clases...</p>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Clases en vivo"
        description="Programa y gestiona sesiones en vivo con tus estudiantes"
        action={
          <Button onClick={() => setShowForm(!showForm)}>
            {showForm ? "Cancelar" : "Nueva clase"}
          </Button>
        }
      />

      <div className="space-y-2">
        <Label htmlFor="course">Curso</Label>
        <select
          id="course"
          value={courseId}
          onChange={(e) => setCourseId(e.target.value)}
          className="flex h-10 w-full max-w-sm rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          {courses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.title}
            </option>
          ))}
        </select>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Programar clase</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="title">Título</Label>
                <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="description">Descripción</Label>
                <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="scheduledAt">Fecha y hora</Label>
                <Input id="scheduledAt" type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="duration">Duración (min)</Label>
                <Input id="duration" type="number" min={15} value={durationMinutes} onChange={(e) => setDurationMinutes(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="platform">Plataforma</Label>
                <select
                  id="platform"
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value as LiveClass["platform"])}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="zoom">Zoom</option>
                  <option value="google_meet">Google Meet</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="meetingUrl">Enlace de reunión</Label>
                <Input id="meetingUrl" type="url" value={meetingUrl} onChange={(e) => setMeetingUrl(e.target.value)} required />
              </div>
              <div className="sm:col-span-2">
                <Button type="submit" disabled={saving}>
                  {saving ? "Guardando..." : "Programar clase"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <DataTable
        keyField="id"
        data={classes}
        columns={[
          { key: "title", header: "Título", render: (r) => r.title as string },
          { key: "date", header: "Fecha", render: (r) => formatDateTime(r.scheduledAt as Date) },
          { key: "platform", header: "Plataforma", render: (r) => r.platform as string },
          { key: "status", header: "Estado", render: (r) => <Badge variant="outline">{r.status as string}</Badge> },
          {
            key: "actions",
            header: "Acciones",
            render: (r) => (
              <div className="flex flex-wrap gap-1">
                <Button size="sm" variant="outline" asChild>
                  <a href={r.meetingUrl as string} target="_blank" rel="noopener noreferrer">
                    Enlace
                  </a>
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleStatus(r.id as string, "completed")}>
                  Completar
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleStatus(r.id as string, "cancelled")}>
                  Cancelar
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleDelete(r.id as string)}>
                  Eliminar
                </Button>
              </div>
            ),
          },
        ]}
      />
    </div>
  );
}
