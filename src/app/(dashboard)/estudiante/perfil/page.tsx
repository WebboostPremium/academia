"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Award, BookOpen, Clock, TrendingUp } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { updateUser } from "@/lib/services/users";
import { getUserEnrollments } from "@/lib/services/enrollments";
import { getCertificates } from "@/lib/services/certificates";
import { getActivityLogsByUser } from "@/lib/services/activity-logs";
import { getCourse } from "@/lib/services/courses";
import { ProfilePhotoUpload } from "@/components/profile/profile-photo-upload";
import { StatCard } from "@/components/dashboard/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { ROLE_LABELS } from "@/lib/constants/roles";
import type { Enrollment } from "@/types/course";
import type { ActivityLog } from "@/types/activity-log";

export default function EstudiantePerfilPage() {
  const { user, refreshUser } = useAuth();
  const [displayName, setDisplayName] = useState(user?.displayName ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [saving, setSaving] = useState(false);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [certCount, setCertCount] = useState(0);
  const [activity, setActivity] = useState<ActivityLog[]>([]);
  const [courseTitles, setCourseTitles] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!user) return;
    setDisplayName(user.displayName);
    setPhone(user.phone ?? "");
    (async () => {
      const [enrRes, certRes, logRes] = await Promise.allSettled([
        getUserEnrollments(user.uid),
        fetch("/api/student/certificates", { credentials: "same-origin" }).then((r) => r.json()),
        getActivityLogsByUser(user.uid, 10),
      ]);

      if (enrRes.status === "fulfilled") {
        const enr = enrRes.value;
        setEnrollments(enr);
        const titles = await Promise.allSettled(
          enr.map(async (e) => {
            const course = await getCourse(e.courseId);
            return course ? ([course.id, course.title] as const) : null;
          })
        );
        setCourseTitles(
          Object.fromEntries(
            titles
              .filter((r) => r.status === "fulfilled" && r.value)
              .map((r) => (r as PromiseFulfilledResult<[string, string] | null>).value!) as Array<readonly [string, string]>
          )
        );
      }

      if (certRes.status === "fulfilled" && certRes.value.certificates) {
        setCertCount(certRes.value.certificates.length);
      } else if (certRes.status === "rejected") {
        try {
          const certs = await getCertificates({ userId: user.uid });
          setCertCount(certs.length);
        } catch { /* sin certificados */ }
      }

      if (logRes.status === "fulfilled") setActivity(logRes.value);
    })();
  }, [user]);

  if (!user) return null;

  const avgProgress =
    enrollments.length > 0
      ? Math.round(enrollments.reduce((s, e) => s + e.progress.percentComplete, 0) / enrollments.length)
      : 0;
  const avgScore =
    enrollments.length > 0
      ? Math.round(enrollments.reduce((s, e) => s + (e.progress.averageScore ?? 0), 0) / enrollments.length)
      : 0;

  async function handleSave() {
    setSaving(true);
    try {
      await updateUser(user!.uid, { displayName, phone: phone || undefined });
      await refreshUser();
      toast.success("Perfil actualizado");
    } catch {
      toast.error("Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <h1 className="font-serif text-2xl font-semibold">Mi Perfil</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Cursos activos" value={enrollments.length} icon={<BookOpen className="h-5 w-5" />} />
        <StatCard title="Progreso promedio" value={`${avgProgress}%`} icon={<TrendingUp className="h-5 w-5" />} />
        <StatCard title="Promedio académico" value={`${avgScore}%`} icon={<Award className="h-5 w-5" />} />
        <StatCard title="Tiempo de estudio" value={`${user.studyTimeMinutes} min`} icon={<Clock className="h-5 w-5" />} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="card-ring">
          <CardHeader className="items-center text-center">
            <ProfilePhotoUpload uid={user.uid} displayName={user.displayName} photoURL={user.photoURL} onUpdated={() => refreshUser()} />
            <CardTitle className="mt-2 font-serif">{user.displayName}</CardTitle>
            <Badge variant="secondary">{ROLE_LABELS[user.role]}</Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre</Label>
              <Input id="name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Correo</Label>
              <Input value={user.email} disabled />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Teléfono</Label>
              <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <Button className="w-full" onClick={handleSave} disabled={saving}>
              {saving ? "Guardando..." : "Guardar cambios"}
            </Button>
          </CardContent>
        </Card>

        <Card className="card-ring">
          <CardHeader>
            <CardTitle className="font-serif text-lg">Historial académico</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {enrollments.length === 0 && <p className="text-sm text-muted-foreground">Aún no tienes cursos inscritos.</p>}
            {enrollments.map((e) => (
              <div key={e.id} className="space-y-2 rounded-lg border p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium">{courseTitles[e.courseId] ?? "Curso"}</p>
                  <Badge variant={e.status === "completed" ? "default" : "secondary"}>{e.status}</Badge>
                </div>
                <Progress value={e.progress.percentComplete} className="h-2" />
                <p className="text-xs text-muted-foreground">
                  {e.progress.percentComplete}% · {(e.progress.lessonsCompleted ?? []).length} lecciones · Promedio {e.progress.averageScore ?? 0}%
                </p>
              </div>
            ))}
            <div className="flex flex-wrap gap-2 pt-2">
              <Button asChild variant="outline" size="sm"><Link href="/estudiante/certificados">Certificados ({certCount})</Link></Button>
              <Button asChild variant="outline" size="sm"><Link href="/estudiante/compras">Historial de compras</Link></Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {activity.length > 0 && (
        <Card className="card-ring">
          <CardHeader><CardTitle className="font-serif text-lg">Actividad reciente</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {activity.map((log) => (
              <div key={log.id} className="flex justify-between gap-2 text-sm border-b pb-2 last:border-0">
                <span>{log.details ?? log.action}</span>
                <span className="shrink-0 text-muted-foreground">{log.createdAt.toLocaleDateString("es")}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
