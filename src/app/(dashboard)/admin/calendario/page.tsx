"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { PlatformCalendar, type CalendarEvent } from "@/components/calendar/platform-calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getLiveClasses } from "@/lib/services/live-classes";
import { getAssignments } from "@/lib/services/assignments";
import { getCourses } from "@/lib/services/courses";

export default function CalendarioAdminPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selected, setSelected] = useState<CalendarEvent | null>(null);
  const [month] = useState(new Date());

  useEffect(() => {
    async function load() {
      const [classes, assignments, courses] = await Promise.all([
        getLiveClasses(),
        getAssignments(),
        getCourses(),
      ]);
      const courseMap = new Map(courses.map((c) => [c.id, c.title]));

      const classEvents: CalendarEvent[] = classes.map((c) => ({
        id: `class-${c.id}`,
        title: c.title,
        date: c.scheduledAt,
        type: "class",
        link: c.meetingUrl,
      }));

      const assignmentEvents: CalendarEvent[] = assignments.map((a) => ({
        id: `task-${a.id}`,
        title: `${a.title} (${courseMap.get(a.courseId) ?? "Curso"})`,
        date: a.dueDate,
        type: "assignment",
        link: "/admin/tareas",
      }));

      setEvents([...classEvents, ...assignmentEvents].sort((a, b) => a.date.getTime() - b.date.getTime()));
    }
    load();
  }, []);

  const upcoming = events.filter((e) => e.date >= new Date()).slice(0, 8);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Calendario"
        description="Clases en vivo, tareas y eventos centralizados"
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <PlatformCalendar events={events} month={month} onSelectEvent={setSelected} />
        </div>
        <Card className="card-ring h-fit">
          <CardHeader>
            <CardTitle className="font-serif text-lg">Próximos eventos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {upcoming.length === 0 && <p className="text-sm text-muted-foreground">Sin eventos próximos</p>}
            {upcoming.map((e) => (
              <div key={e.id} className="rounded-lg border p-3">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium">{e.title}</p>
                  <Badge variant="outline">{e.type === "class" ? "Clase" : "Tarea"}</Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {e.date.toLocaleString("es", { dateStyle: "medium", timeStyle: "short" })}
                </p>
                {e.link && e.type === "class" && (
                  <a href={e.link} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-xs text-primary hover:underline">
                    Abrir enlace
                  </a>
                )}
                {e.type === "assignment" && (
                  <Link href={e.link ?? "#"} className="mt-2 inline-block text-xs text-primary hover:underline">
                    Ver tareas
                  </Link>
                )}
              </div>
            ))}
            {selected && (
              <div className="rounded-lg bg-muted/50 p-3 text-sm">
                <p className="font-medium">Seleccionado: {selected.title}</p>
                <p className="text-muted-foreground">{selected.date.toLocaleString("es")}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
