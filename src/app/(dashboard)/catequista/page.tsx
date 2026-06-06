"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Users, FileText, Calendar, MessageSquare, Video } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { getStudentsByCatequista } from "@/lib/services/users";
import { getSubmissions } from "@/lib/services/assignments";
import { getUpcomingClasses } from "@/lib/services/live-classes";
import { getQuestions } from "@/lib/services/forum";
import { getPublishedCourses } from "@/lib/services/courses";
import { getUserEnrollments } from "@/lib/services/enrollments";
import { StatCard } from "@/components/dashboard/stat-card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/utils/format";

export default function CatequistaDashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ students: 0, tasks: 0, classes: 0, questions: 0 });
  const [recentStudents, setRecentStudents] = useState<Array<{ name: string; course: string; progress: number; avatar: string }>>([]);
  const [activities, setActivities] = useState<string[]>([]);
  const [nextClass, setNextClass] = useState<{ title: string; date: string; url: string; platform: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    async function load() {
      const students = await getStudentsByCatequista(user!.uid);
      const studentIds = new Set(students.map((s) => s.uid));
      const submissions = (await getSubmissions({ status: "pending" })).filter((s) => studentIds.has(s.userId));
      const classes = await getUpcomingClasses();
      const courses = await getPublishedCourses();
      const questions = (await Promise.all(courses.map((c) => getQuestions(c.id)))).flat().filter((q) => q.status === "open");

      setStats({ students: students.length, tasks: submissions.length, classes: classes.length, questions: questions.length });

      const studentData = await Promise.all(students.slice(0, 5).map(async (s) => {
        const enrollments = await getUserEnrollments(s.uid);
        const active = enrollments.find((e) => e.status === "active");
        const course = active ? courses.find((c) => c.id === active.courseId) : null;
        return {
          name: s.displayName,
          course: course?.title ?? "Sin curso",
          progress: active?.progress.percentComplete ?? 0,
          avatar: s.displayName.split(" ").map((n) => n[0]).join("").slice(0, 2),
        };
      }));
      setRecentStudents(studentData);
      setActivities(submissions.slice(0, 4).map((s) => `Nueva entrega de tarea pendiente de revisión`));
      if (classes[0]) {
        setNextClass({ title: classes[0].title, date: formatDateTime(classes[0].scheduledAt),
          url: classes[0].meetingUrl, platform: classes[0].platform === "zoom" ? "Zoom" : "Google Meet" });
      }
      setLoading(false);
    }
    load();
  }, [user]);

  if (loading) return <div className="flex h-64 items-center justify-center text-muted-foreground">Cargando...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Panel del Catequista</h1>
        <p className="text-muted-foreground">Seguimiento de estudiantes y actividades</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Estudiantes asignados" value={stats.students} icon={<Users className="h-5 w-5" />} />
        <StatCard title="Tareas pendientes" value={stats.tasks} icon={<FileText className="h-5 w-5" />} />
        <StatCard title="Próximas clases" value={stats.classes} icon={<Calendar className="h-5 w-5" />} />
        <StatCard title="Consultas pendientes" value={stats.questions} icon={<MessageSquare className="h-5 w-5" />} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Estudiantes recientes */}
        <div className="card-shadow rounded-2xl bg-white p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-bold">Estudiantes Recientes</h2>
            <Button asChild variant="outline" size="sm" className="rounded-full">
              <Link href="/catequista/estudiantes">Ver todos</Link>
            </Button>
          </div>
          {recentStudents.length === 0 ? (
            <p className="text-sm text-muted-foreground">No hay estudiantes asignados</p>
          ) : (
            <div className="space-y-4">
              {recentStudents.map((s) => (
                <div key={s.name} className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
                    {s.avatar}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{s.name}</p>
                    <p className="text-xs text-muted-foreground">{s.course}</p>
                  </div>
                  <div className="w-24">
                    <Progress value={s.progress} />
                    <p className="text-right text-xs text-muted-foreground">{s.progress}%</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Próximas clases */}
        <div className="card-shadow rounded-2xl bg-white p-5">
          <h2 className="font-bold">Próximas Clases</h2>
          {nextClass ? (
            <div className="mt-4">
              <div className="flex items-center gap-2 text-primary">
                <Video className="h-4 w-4" />
                <span className="text-sm font-medium">{nextClass.platform}</span>
              </div>
              <p className="mt-2 font-semibold">{nextClass.title}</p>
              <p className="text-sm text-muted-foreground">{nextClass.date}</p>
              <Button asChild size="sm" className="mt-3 w-full rounded-full">
                <a href={nextClass.url} target="_blank" rel="noopener noreferrer">Unirse</a>
              </Button>
            </div>
          ) : (
            <p className="mt-4 text-sm text-muted-foreground">Sin clases programadas</p>
          )}
        </div>
      </div>

      {/* Actividades recientes */}
      <div className="card-shadow rounded-2xl bg-white p-5">
        <h2 className="mb-4 font-bold">Actividades Recientes</h2>
        {activities.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin actividad reciente</p>
        ) : (
          <ul className="space-y-3">
            {activities.map((a, i) => (
              <li key={i} className="flex items-center gap-3 text-sm">
                <span className="h-2 w-2 rounded-full bg-primary" />
                {a}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
