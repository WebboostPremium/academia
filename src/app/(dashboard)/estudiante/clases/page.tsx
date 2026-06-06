"use client";

import { useEffect, useState } from "react";
import { Calendar, ExternalLink, Video } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getCourse } from "@/lib/services/courses";
import { getUserEnrollments } from "@/lib/services/enrollments";
import { getUpcomingClasses } from "@/lib/services/live-classes";
import { formatDateTime } from "@/lib/utils/format";
import type { LiveClass } from "@/types";

interface ClassItem {
  liveClass: LiveClass;
  courseTitle: string;
}

export default function EstudianteClasesPage() {
  const { user, loading: authLoading } = useAuth();
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading || !user) return;

    async function load() {
      try {
        const enrollments = await getUserEnrollments(user!.uid);
        const courseIds = enrollments
          .filter((e) => e.status === "active" || e.status === "completed")
          .map((e) => e.courseId);

        const allUpcoming = await getUpcomingClasses();
        const relevant = allUpcoming.filter((c) => courseIds.includes(c.courseId));

        const items = await Promise.all(
          relevant.map(async (liveClass) => {
            const course = await getCourse(liveClass.courseId);
            return { liveClass, courseTitle: course?.title ?? "Curso" };
          })
        );

        setClasses(items.sort((a, b) => a.liveClass.scheduledAt.getTime() - b.liveClass.scheduledAt.getTime()));
      } catch {
        toast.error("Error al cargar las clases en vivo");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [user, authLoading]);

  if (authLoading || loading) {
    return <p className="text-muted-foreground">Cargando clases...</p>;
  }

  return (
    <div>
      <PageHeader
        title="Clases en Vivo"
        description="Próximas sesiones programadas en tus cursos"
      />

      {classes.length === 0 ? (
        <EmptyState title="Sin clases programadas" description="No hay clases en vivo próximas en tus cursos" />
      ) : (
        <div className="space-y-4">
          {classes.map(({ liveClass, courseTitle }) => (
            <Card key={liveClass.id}>
              <CardHeader className="flex flex-row items-start justify-between gap-4">
                <div>
                  <CardTitle className="text-base">{liveClass.title}</CardTitle>
                  <p className="text-sm text-muted-foreground">{courseTitle}</p>
                </div>
                <Badge variant="secondary">
                  {liveClass.platform === "zoom" ? "Zoom" : "Google Meet"}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-4">
                {liveClass.description && (
                  <p className="text-sm">{liveClass.description}</p>
                )}
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {formatDateTime(liveClass.scheduledAt)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Video className="h-4 w-4" />
                    {liveClass.durationMinutes} min
                  </span>
                </div>
                {liveClass.meetingUrl && (
                  <Button asChild size="sm" className="gap-2">
                    <a href={liveClass.meetingUrl} target="_blank" rel="noopener noreferrer">
                      Unirse a la clase
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
