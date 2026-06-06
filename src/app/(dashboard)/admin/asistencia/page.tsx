"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getPublishedCourses } from "@/lib/services/courses";
import { getCourseEnrollments } from "@/lib/services/enrollments";
import { getAllUsers } from "@/lib/services/users";
import { getAttendance, recordAttendance } from "@/lib/services/attendance";
import { ROLES } from "@/lib/constants/roles";
import { formatDate } from "@/lib/utils/format";
import type { Course } from "@/types/course";
import type { AppUser } from "@/types/user";
import type { Attendance } from "@/types";

type AttendanceStatus = Attendance["status"];

export default function AsistenciaAdminPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [allStudents, setAllStudents] = useState<AppUser[]>([]);
  const [enrolledStudents, setEnrolledStudents] = useState<AppUser[]>([]);
  const [courseId, setCourseId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [statuses, setStatuses] = useState<Record<string, AttendanceStatus>>({});
  const [history, setHistory] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([getPublishedCourses(), getAllUsers(ROLES.ESTUDIANTE)]).then(([c, s]) => {
      setCourses(c);
      setAllStudents(s);
      if (c.length > 0) setCourseId(c[0].id);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!courseId) return;
    getCourseEnrollments(courseId).then((enrollments) => {
      const enrolledIds = new Set(enrollments.map((e) => e.userId));
      setEnrolledStudents(allStudents.filter((s) => enrolledIds.has(s.uid)));
    });
    getAttendance(courseId).then(setHistory);
  }, [courseId, allStudents]);

  useEffect(() => {
    if (!courseId || !date) return;
    getAttendance(courseId, date).then((records) => {
      const map: Record<string, AttendanceStatus> = {};
      records.forEach((r) => { map[r.userId] = r.status; });
      setStatuses(map);
    });
  }, [courseId, date]);

  async function handleSave() {
    if (!courseId) return;
    setSaving(true);
    try {
      await Promise.all(
        enrolledStudents.map((s) =>
          recordAttendance({
            userId: s.uid,
            courseId,
            date,
            status: statuses[s.uid] ?? "absent",
            recordedBy: "admin",
          })
        )
      );
      toast.success("Asistencia guardada");
      const updated = await getAttendance(courseId);
      setHistory(updated);
    } catch {
      toast.error("Error al guardar asistencia");
    } finally {
      setSaving(false);
    }
  }

  const selectClass =
    "h-9 rounded-md border border-input bg-background px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

  if (loading) return <p className="text-muted-foreground">Cargando...</p>;

  return (
    <div className="space-y-6">
      <PageHeader title="Gestión de Asistencia" description="Control de presente, ausente y justificado" />

      <Card className="rounded-2xl">
        <CardContent className="flex flex-wrap items-end gap-4 pt-6">
          <div className="space-y-2">
            <Label>Curso</Label>
            <select className={selectClass} value={courseId} onChange={(e) => setCourseId(e.target.value)}>
              {courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <Label>Fecha</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <Button onClick={handleSave} disabled={saving}>{saving ? "Guardando..." : "Guardar asistencia"}</Button>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {enrolledStudents.length === 0 ? (
          <p className="text-muted-foreground">No hay estudiantes inscritos en este curso.</p>
        ) : (
          enrolledStudents.map((s) => (
            <Card key={s.uid} className="rounded-xl">
              <CardContent className="flex items-center justify-between py-4">
                <div>
                  <p className="font-medium">{s.displayName}</p>
                  <p className="text-sm text-muted-foreground">{s.email}</p>
                </div>
                <select
                  className={selectClass}
                  value={statuses[s.uid] ?? "absent"}
                  onChange={(e) => setStatuses((prev) => ({ ...prev, [s.uid]: e.target.value as AttendanceStatus }))}
                >
                  <option value="present">Presente</option>
                  <option value="absent">Ausente</option>
                  <option value="justified">Justificado</option>
                </select>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <div>
        <h2 className="text-lg font-bold">Historial</h2>
        <div className="mt-4 space-y-2">
          {history.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin registros aún.</p>
          ) : (
            history.slice(0, 50).map((r) => {
              const student = allStudents.find((s) => s.uid === r.userId);
              return (
                <div key={r.id} className="flex items-center justify-between rounded-lg border px-4 py-2 text-sm">
                  <span>{student?.displayName ?? r.userId.slice(0, 8)}</span>
                  <span className="text-muted-foreground">{formatDate(new Date(r.date))}</span>
                  <Badge variant={r.status === "present" ? "default" : "secondary"}>
                    {r.status === "present" ? "Presente" : r.status === "justified" ? "Justificado" : "Ausente"}
                  </Badge>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
