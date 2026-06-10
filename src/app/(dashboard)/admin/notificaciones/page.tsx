"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable } from "@/components/dashboard/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAllUsers } from "@/lib/services/users";
import { getPublishedCourses } from "@/lib/services/courses";
import { formatDateTime } from "@/lib/utils/format";
import { ROLES } from "@/lib/constants/roles";
import type { Notification } from "@/types";

const TYPE_LABELS: Record<Notification["type"], string> = {
  payment: "Pago", course: "Curso", assignment: "Tarea", certificate: "Certificado",
  forum: "Foro", class: "Clase", system: "Sistema",
};

export default function NotificacionesAdminPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [students, setStudents] = useState<Array<{ uid: string; displayName: string }>>([]);
  const [courses, setCourses] = useState<Array<{ id: string; title: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [form, setForm] = useState({ title: "", body: "", target: "general", userId: "", courseId: "" });

  async function load() {
    const [notifRes, studs, crs] = await Promise.all([
      fetch("/api/notifications/recent?limit=50", { credentials: "same-origin" }),
      getAllUsers(ROLES.ESTUDIANTE),
      getPublishedCourses(),
    ]);

    if (notifRes.ok) {
      const data = await notifRes.json();
      setNotifications(
        (data.notifications as Array<Record<string, unknown>>).map((n) => ({
          ...n,
          createdAt: new Date(n.createdAt as string),
        })) as Notification[]
      );
    }

    setStudents(studs.map((s) => ({ uid: s.uid, displayName: s.displayName })));
    setCourses(crs.map((c) => ({ id: c.id, title: c.title })));
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    try {
      const res = await fetch("/api/notifications/send", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          target: form.target,
          title: form.title,
          body: form.body,
          userId: form.userId || undefined,
          courseId: form.courseId || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Error al enviar notificación");
        return;
      }
      toast.success(`Notificación enviada a ${data.count} usuario(s)`);
      setForm({ title: "", body: "", target: "general", userId: "", courseId: "" });
      await load();
    } catch {
      toast.error("Error al enviar notificación");
    } finally {
      setSending(false);
    }
  }

  const selectClass =
    "h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

  if (loading) return <p className="text-muted-foreground">Cargando notificaciones...</p>;

  return (
    <div className="space-y-6">
      <PageHeader title="Notificaciones" description="Enviar y revisar notificaciones" />

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-base">Enviar notificación</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSend} className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Destino</Label>
              <select className={selectClass} value={form.target} onChange={(e) => setForm({ ...form, target: e.target.value })}>
                <option value="general">General (todos los estudiantes)</option>
                <option value="student">Estudiante específico</option>
                <option value="course">Curso específico</option>
              </select>
            </div>
            {form.target === "student" && (
              <div className="space-y-2">
                <Label>Estudiante</Label>
                <select className={selectClass} value={form.userId} onChange={(e) => setForm({ ...form, userId: e.target.value })} required>
                  <option value="">Seleccionar...</option>
                  {students.map((s) => <option key={s.uid} value={s.uid}>{s.displayName}</option>)}
                </select>
              </div>
            )}
            {form.target === "course" && (
              <div className="space-y-2">
                <Label>Curso</Label>
                <select className={selectClass} value={form.courseId} onChange={(e) => setForm({ ...form, courseId: e.target.value })} required>
                  <option value="">Seleccionar...</option>
                  {courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
                </select>
              </div>
            )}
            <div className="space-y-2 sm:col-span-2">
              <Label>Título</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Mensaje</Label>
              <Textarea value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} rows={3} required />
            </div>
            <Button type="submit" disabled={sending} className="sm:col-span-2">
              {sending ? "Enviando..." : "Enviar notificación"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <DataTable
        keyField="id"
        data={notifications}
        columns={[
          { key: "type", header: "Tipo", render: (n) => TYPE_LABELS[n.type] },
          { key: "title", header: "Título", render: (n) => n.title },
          { key: "body", header: "Mensaje", render: (n) => <span className="line-clamp-1 max-w-xs text-muted-foreground">{n.body}</span> },
          { key: "read", header: "Leída", render: (n) => <Badge variant={n.read ? "secondary" : "default"}>{n.read ? "Sí" : "No"}</Badge> },
          { key: "date", header: "Fecha", render: (n) => formatDateTime(n.createdAt) },
        ]}
      />
    </div>
  );
}
