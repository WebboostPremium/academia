"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { getStudentsByCatequista } from "@/lib/services/users";
import { getUserEnrollments } from "@/lib/services/enrollments";
import { getPublishedCourses } from "@/lib/services/courses";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable } from "@/components/dashboard/data-table";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import type { AppUser } from "@/types/user";
import type { Enrollment } from "@/types/course";
import type { Course } from "@/types/course";

interface StudentRow extends Record<string, unknown> {
  uid: string;
  displayName: string;
  email: string;
  status: string;
  progress: number;
  courseTitle: string;
}

export default function EstudiantesPage() {
  const { user } = useAuth();
  const [rows, setRows] = useState<StudentRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    async function load() {
      const [students, courses] = await Promise.all([
        getStudentsByCatequista(user!.uid),
        getPublishedCourses(),
      ]);
      const courseMap = new Map(courses.map((c) => [c.id, c]));

      const data = await Promise.all(
        students.map(async (s: AppUser) => {
          const enrollments = await getUserEnrollments(s.uid);
          const active = enrollments.find((e: Enrollment) => e.status === "active" || e.status === "completed");
          const course = active ? courseMap.get(active.courseId) : undefined;
          return {
            uid: s.uid,
            displayName: s.displayName,
            email: s.email,
            status: s.status,
            progress: active?.progress.percentComplete ?? 0,
            courseTitle: course?.title ?? "Sin inscripción",
          };
        })
      );

      setRows(data);
      setLoading(false);
    }

    load();
  }, [user]);

  if (loading) {
    return <p className="text-muted-foreground">Cargando estudiantes...</p>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Estudiantes asignados"
        description="Seguimiento del progreso de tus estudiantes"
      />
      <DataTable
        keyField="uid"
        data={rows}
        columns={[
          { key: "name", header: "Nombre", render: (r) => r.displayName as string },
          { key: "email", header: "Correo", render: (r) => r.email as string },
          { key: "course", header: "Curso", render: (r) => r.courseTitle as string },
          {
            key: "progress",
            header: "Progreso",
            render: (r) => (
              <div className="flex min-w-[120px] items-center gap-2">
                <Progress value={r.progress as number} className="flex-1" />
                <span className="text-xs text-muted-foreground">{r.progress as number}%</span>
              </div>
            ),
          },
          {
            key: "status",
            header: "Estado",
            render: (r) => (
              <Badge variant={r.status === "active" ? "default" : "secondary"}>
                {r.status === "active" ? "Activo" : "Bloqueado"}
              </Badge>
            ),
          },
        ]}
      />
    </div>
  );
}
