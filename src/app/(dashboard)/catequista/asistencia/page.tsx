"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { getStudentsByCatequista } from "@/lib/services/users";
import { getPublishedCourses } from "@/lib/services/courses";
import { getAttendance, recordAttendance } from "@/lib/services/attendance";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import type { AppUser } from "@/types/user";
import type { Course } from "@/types/course";
import type { Attendance } from "@/types";

type AttendanceStatus = Attendance["status"];

export default function AsistenciaPage() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [students, setStudents] = useState<AppUser[]>([]);
  const [courseId, setCourseId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [statuses, setStatuses] = useState<Record<string, AttendanceStatus>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    Promise.all([getPublishedCourses(), getStudentsByCatequista(user.uid)]).then(([c, s]) => {
      setCourses(c);
      setStudents(s);
      if (c.length > 0) setCourseId(c[0].id);
      setLoading(false);
    });
  }, [user]);

  useEffect(() => {
    if (!courseId || !date) return;
    getAttendance(courseId, date).then((records) => {
      const map: Record<string, AttendanceStatus> = {};
      records.forEach((r) => {
        map[r.userId] = r.status;
      });
      setStatuses(map);
    });
  }, [courseId, date]);

  async function handleSave() {
    if (!user || !courseId) return;
    setSaving(true);
    try {
      await Promise.all(
        students.map((s) =>
          recordAttendance({
            userId: s.uid,
            courseId,
            date,
            status: statuses[s.uid] ?? "absent",
            recordedBy: user.uid,
          })
        )
      );
      toast.success("Asistencia registrada");
    } catch {
      toast.error("Error al registrar asistencia");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p className="text-muted-foreground">Cargando...</p>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Registro de asistencia"
        description="Marca la asistencia de tus estudiantes por fecha"
        action={
          <Button onClick={handleSave} disabled={saving || students.length === 0}>
            {saving ? "Guardando..." : "Guardar asistencia"}
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="course">Curso</Label>
          <select
            id="course"
            value={courseId}
            onChange={(e) => setCourseId(e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="date">Fecha</Label>
          <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
      </div>

      <Card>
        <CardContent className="divide-y p-0">
          {students.length === 0 ? (
            <p className="p-6 text-center text-sm text-muted-foreground">No tienes estudiantes asignados</p>
          ) : (
            students.map((s) => (
              <div key={s.uid} className="flex items-center justify-between gap-4 px-4 py-3">
                <span className="font-medium">{s.displayName}</span>
                <select
                  value={statuses[s.uid] ?? "absent"}
                  onChange={(e) =>
                    setStatuses((prev) => ({ ...prev, [s.uid]: e.target.value as AttendanceStatus }))
                  }
                  className="rounded-md border border-input bg-background px-3 py-1.5 text-sm"
                >
                  <option value="present">Presente</option>
                  <option value="absent">Ausente</option>
                  <option value="justified">Justificado</option>
                </select>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
