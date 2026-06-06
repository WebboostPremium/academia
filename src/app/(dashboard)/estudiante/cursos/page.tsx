"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { WompiCheckout } from "@/components/payments/wompi-checkout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { getPublishedCourses, getCourse } from "@/lib/services/courses";
import { getUserEnrollments } from "@/lib/services/enrollments";
import type { Course, Enrollment } from "@/types/course";

interface EnrolledCourse {
  course: Course;
  enrollment: Enrollment;
}

export default function EstudianteCursosPage() {
  const { user, loading: authLoading } = useAuth();
  const [enrolled, setEnrolled] = useState<EnrolledCourse[]>([]);
  const [available, setAvailable] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading || !user) return;

    async function load() {
      try {
        const [enrollments, published] = await Promise.all([
          getUserEnrollments(user!.uid),
          getPublishedCourses(),
        ]);

        const activeEnrollments = enrollments.filter(
          (e) => e.status === "active" || e.status === "completed"
        );

        const enrolledCourses = await Promise.all(
          activeEnrollments.map(async (enrollment) => {
            const course = await getCourse(enrollment.courseId);
            return course ? { course, enrollment } : null;
          })
        );

        const enrolledList = enrolledCourses.filter(Boolean) as EnrolledCourse[];
        const enrolledIds = new Set(enrolledList.map((e) => e.course.id));
        const availableList = published.filter((c) => !enrolledIds.has(c.id));

        setEnrolled(enrolledList);
        setAvailable(availableList);
      } catch {
        toast.error("Error al cargar los cursos");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [user, authLoading]);

  if (authLoading || loading) {
    return <p className="text-muted-foreground">Cargando cursos...</p>;
  }

  return (
    <div>
      <PageHeader
        title="Mis Cursos"
        description="Cursos inscritos y catálogo disponible para comprar"
      />

      <section className="mb-10 space-y-4">
        <h2 className="text-lg font-semibold">Cursos inscritos</h2>
        {enrolled.length === 0 ? (
          <EmptyState
            title="Sin cursos inscritos"
            description="Explora el catálogo y comienza tu preparación sacramental"
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {enrolled.map(({ course, enrollment }) => (
              <Card key={course.id}>
                <CardHeader className="flex flex-row items-start justify-between gap-2">
                  <div>
                    <CardTitle className="text-base">{course.title}</CardTitle>
                    <p className="mt-1 text-sm text-muted-foreground">{course.shortDescription}</p>
                  </div>
                  <Badge variant={enrollment.status === "completed" ? "default" : "secondary"}>
                    {enrollment.status === "completed" ? "Completado" : "En progreso"}
                  </Badge>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="mb-1 flex justify-between text-sm">
                      <span>Progreso</span>
                      <span>{enrollment.progress.percentComplete}%</span>
                    </div>
                    <Progress value={enrollment.progress.percentComplete} />
                  </div>
                  <Button asChild size="sm">
                    <Link href="/estudiante/lecciones">Continuar lecciones</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Disponibles para comprar</h2>
        {available.length === 0 ? (
          <EmptyState title="No hay cursos nuevos" description="Ya tienes acceso a todos los cursos publicados" />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {available.map((course) => (
              <Card key={course.id}>
                <CardHeader>
                  <CardTitle className="text-base">{course.title}</CardTitle>
                  <p className="text-sm text-muted-foreground">{course.shortDescription}</p>
                </CardHeader>
                <CardContent>
                  <WompiCheckout courseId={course.id} courseTitle={course.title} price={course.price} />
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
