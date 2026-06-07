"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { PlatformCalendar, type CalendarEvent } from "@/components/calendar/platform-calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { getLiveClasses } from "@/lib/services/live-classes";
import { getAssignments } from "@/lib/services/assignments";
import { getUserEnrollments } from "@/lib/services/enrollments";
import { getCourses } from "@/lib/services/courses";

export default function EstudianteCalendarioPage() {
  const { user } = useAuth();
  const [events, setEvents] = useState<CalendarEvent[]>([]);

  useEffect(() => {
    if (!user) return;
    async function load() {
      const [classes, assignments, enrollments, courses] = await Promise.all([
        getLiveClasses(),
        getAssignments(),
        getUserEnrollments(user!.uid),
        getCourses(),
      ]);
      const enrolledIds = new Set(enrollments.map((e) => e.courseId));
      const courseMap = new Map(courses.map((c) => [c.id, c.title]));

      const classEvents = classes
        .filter((c) => enrolledIds.has(c.courseId))
        .map((c) => ({
          id: `class-${c.id}`,
          title: c.title,
          date: c.scheduledAt,
          type: "class" as const,
          link: c.meetingUrl,
        }));

      const taskEvents = assignments
        .filter((a) => enrolledIds.has(a.courseId))
        .map((a) => ({
          id: `task-${a.id}`,
          title: `${a.title} (${courseMap.get(a.courseId) ?? ""})`,
          date: a.dueDate,
          type: "assignment" as const,
          link: "/estudiante/tareas",
        }));

      setEvents([...classEvents, ...taskEvents]);
    }
    load();
  }, [user]);

  const upcoming = events.filter((e) => e.date >= new Date()).sort((a, b) => a.date.getTime() - b.date.getTime()).slice(0, 6);

  return (
    <div className="space-y-6">
      <PageHeader title="Mi calendario" description="Clases en vivo y fechas de entrega" />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <PlatformCalendar events={events} />
        </div>
        <Card className="card-ring h-fit">
          <CardHeader><CardTitle className="font-serif text-lg">Próximamente</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {upcoming.map((e) => (
              <div key={e.id} className="rounded-lg border p-3">
                <div className="flex justify-between gap-2">
                  <p className="text-sm font-medium">{e.title}</p>
                  <Badge variant="outline">{e.type === "class" ? "Clase" : "Tarea"}</Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{e.date.toLocaleString("es")}</p>
                {e.link && e.type === "class" && (
                  <a href={e.link} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-xs text-primary hover:underline">
                    Unirme
                  </a>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
