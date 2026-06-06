"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { getCourse, getLessons } from "@/lib/services/courses";
import { getUserEnrollments } from "@/lib/services/enrollments";
import { recalculateProgress } from "@/lib/services/progress";
import { formatDateTime } from "@/lib/utils/format";
import type { Course, Enrollment } from "@/types/course";

interface ProgressItem {
  course: Course;
  enrollment: Enrollment;
  totalLessons: number;
}

export default function EstudianteProgresoPage() {
  const { user, loading: authLoading } = useAuth();
  const [items, setItems] = useState<ProgressItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading || !user) return;

    async function load() {
      try {
        const enrollments = await getUserEnrollments(user!.uid);
        const active = enrollments.filter((e) => e.status === "active" || e.status === "completed");

        const data = await Promise.all(
          active.map(async (enrollment) => {
            await recalculateProgress(user!.uid, enrollment.courseId);
            const [course, lessons] = await Promise.all([
              getCourse(enrollment.courseId),
              getLessons(enrollment.courseId),
            ]);
            const updatedEnrollment = (await getUserEnrollments(user!.uid)).find(
              (e) => e.id === enrollment.id
            ) ?? enrollment;
            return {
              course: course!,
              enrollment: updatedEnrollment,
              totalLessons: lessons.filter((l) => l.status === "published").length,
            };
          })
        );

        setItems(data.filter((d) => d.course));
      } catch {
        toast.error("Error al cargar el progreso");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [user, authLoading]);

  if (authLoading || loading) {
    return <p className="text-muted-foreground">Cargando progreso...</p>;
  }

  return (
    <div>
      <PageHeader title="Mi Progreso" description="Estadísticas de avance por curso inscrito" />

      {items.length === 0 ? (
        <EmptyState title="Sin progreso" description="Inscríbete en un curso para comenzar" />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {items.map(({ course, enrollment, totalLessons }) => {
            const p = enrollment.progress;
            return (
              <Card key={course.id}>
                <CardHeader className="flex flex-row items-start justify-between gap-2">
                  <CardTitle className="text-base">{course.title}</CardTitle>
                  <Badge variant={enrollment.status === "completed" ? "default" : "secondary"}>
                    {enrollment.status === "completed" ? "Completado" : "Activo"}
                  </Badge>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="mb-1 flex justify-between text-sm">
                      <span>Progreso general</span>
                      <span className="font-medium">{p.percentComplete}%</span>
                    </div>
                    <Progress value={p.percentComplete} />
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-lg border p-3">
                      <p className="text-muted-foreground">Lecciones</p>
                      <p className="text-lg font-semibold">
                        {p.lessonsCompleted.length} / {totalLessons}
                      </p>
                    </div>
                    <div className="rounded-lg border p-3">
                      <p className="text-muted-foreground">Quizzes</p>
                      <p className="text-lg font-semibold">{p.quizzesPassed.length}</p>
                    </div>
                    <div className="rounded-lg border p-3">
                      <p className="text-muted-foreground">Módulos</p>
                      <p className="text-lg font-semibold">{p.modulesCompleted.length}</p>
                    </div>
                    <div className="rounded-lg border p-3">
                      <p className="text-muted-foreground">Promedio</p>
                      <p className="text-lg font-semibold">{p.averageScore}%</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 text-sm">
                    <Badge variant={p.finalExamPassed ? "default" : "outline"}>
                      Examen final: {p.finalExamPassed ? "Aprobado" : "Pendiente"}
                    </Badge>
                  </div>

                  {p.lastActivityAt && (
                    <p className="text-xs text-muted-foreground">
                      Última actividad: {formatDateTime(p.lastActivityAt)}
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
