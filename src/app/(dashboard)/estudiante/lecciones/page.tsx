"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Circle } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getCourse, getLessons } from "@/lib/services/courses";
import { getUserEnrollments } from "@/lib/services/enrollments";
import type { Course, Enrollment, Lesson } from "@/types/course";

interface CourseLessons {
  course: Course;
  enrollment: Enrollment;
  lessons: Lesson[];
}

export default function EstudianteLeccionesPage() {
  const { user, loading: authLoading } = useAuth();
  const [courseLessons, setCourseLessons] = useState<CourseLessons[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading || !user) return;

    async function load() {
      try {
        const enrollments = await getUserEnrollments(user!.uid);
        const active = enrollments.filter((e) => e.status === "active" || e.status === "completed");

        const data = await Promise.all(
          active.map(async (enrollment) => {
            const [course, lessons] = await Promise.all([
              getCourse(enrollment.courseId),
              getLessons(enrollment.courseId),
            ]);
            if (!course) return null;
            const published = lessons
              .filter((l) => l.status === "published")
              .sort((a, b) => a.order - b.order);
            return { course, enrollment, lessons: published };
          })
        );

        setCourseLessons(data.filter(Boolean) as CourseLessons[]);
      } catch {
        toast.error("Error al cargar las lecciones");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [user, authLoading]);

  if (authLoading || loading) {
    return <p className="text-muted-foreground">Cargando lecciones...</p>;
  }

  const hasLessons = courseLessons.some((c) => c.lessons.length > 0);

  return (
    <div>
      <PageHeader title="Lecciones" description="Contenido de tus cursos inscritos" />

      {!hasLessons ? (
        <EmptyState
          title="Sin lecciones disponibles"
          description="Inscríbete en un curso para acceder al contenido"
        />
      ) : (
        <div className="space-y-8">
          {courseLessons.map(({ course, enrollment, lessons }) =>
            lessons.length === 0 ? null : (
              <section key={course.id}>
                <h2 className="mb-4 text-lg font-semibold">{course.title}</h2>
                <div className="space-y-2">
                  {lessons.map((lesson) => {
                    const completed = enrollment.progress.lessonsCompleted.includes(lesson.id);
                    return (
                      <Link key={lesson.id} href={`/estudiante/lecciones/${lesson.id}`}>
                        <Card className="transition-colors hover:border-primary/50">
                          <CardHeader className="flex flex-row items-center gap-3 py-4">
                            {completed ? (
                              <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600" />
                            ) : (
                              <Circle className="h-5 w-5 shrink-0 text-muted-foreground" />
                            )}
                            <div className="flex-1">
                              <CardTitle className="text-base">{lesson.title}</CardTitle>
                              {lesson.description && (
                                <p className="text-sm text-muted-foreground">{lesson.description}</p>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              {lesson.quizId && <Badge variant="outline">Quiz</Badge>}
                              <Badge variant="secondary">{lesson.estimatedMinutes} min</Badge>
                            </div>
                          </CardHeader>
                        </Card>
                      </Link>
                    );
                  })}
                </div>
              </section>
            )
          )}
        </div>
      )}
    </div>
  );
}
