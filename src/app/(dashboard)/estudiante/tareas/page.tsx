"use client";

import { useEffect, useRef, useState } from "react";
import { Upload } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getCourse } from "@/lib/services/courses";
import { getUserEnrollments } from "@/lib/services/enrollments";
import { getAssignments, getSubmissions, createSubmission } from "@/lib/services/assignments";
import { formatDate } from "@/lib/utils/format";
import type { Assignment, Submission } from "@/types";

interface AssignmentItem {
  assignment: Assignment;
  courseTitle: string;
  submission: Submission | null;
}

export default function EstudianteTareasPage() {
  const { user, loading: authLoading } = useAuth();
  const [items, setItems] = useState<AssignmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => {
    if (authLoading || !user) return;

    async function load() {
      try {
        const enrollments = await getUserEnrollments(user!.uid);
        const active = enrollments.filter((e) => e.status === "active" || e.status === "completed");
        const courseIds = active.map((e) => e.courseId);
        const [allAssignments, allSubmissions] = await Promise.all([
          getAssignments(),
          getSubmissions({ userId: user!.uid }),
        ]);

        const relevant = allAssignments.filter(
          (a) => courseIds.includes(a.courseId) && a.status === "active"
        );

        const data = await Promise.all(
          relevant.map(async (assignment) => {
            const course = await getCourse(assignment.courseId);
            const submission =
              allSubmissions.find((s) => s.assignmentId === assignment.id) ?? null;
            return {
              assignment,
              courseTitle: course?.title ?? "Curso",
              submission,
            };
          })
        );

        setItems(data);
      } catch {
        toast.error("Error al cargar las tareas");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [user, authLoading]);

  async function handleUpload(assignmentId: string, courseId: string, file: File) {
    if (!user) return;
    setUploadingId(assignmentId);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("assignmentId", assignmentId);
      formData.append("folder", "submissions");

      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error al subir archivo");

      await createSubmission({
        assignmentId,
        userId: user.uid,
        courseId,
        fileUrl: data.url,
        fileName: data.fileName,
        status: "pending",
      });

      const submissions = await getSubmissions({ userId: user.uid, assignmentId });
      setItems((prev) =>
        prev.map((item) =>
          item.assignment.id === assignmentId
            ? { ...item, submission: submissions[0] ?? null }
            : item
        )
      );
      toast.success("Tarea enviada correctamente");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al enviar la tarea");
    } finally {
      setUploadingId(null);
    }
  }

  function statusLabel(status: Submission["status"]) {
    const labels = { pending: "Pendiente de calificar", graded: "Calificada", returned: "Devuelta" };
    return labels[status];
  }

  if (authLoading || loading) {
    return <p className="text-muted-foreground">Cargando tareas...</p>;
  }

  return (
    <div>
      <PageHeader title="Mis Tareas" description="Asignaciones y entrega de trabajos en PDF" />

      {items.length === 0 ? (
        <EmptyState title="Sin tareas asignadas" description="No hay tareas pendientes en tus cursos" />
      ) : (
        <div className="space-y-4">
          {items.map(({ assignment, courseTitle, submission }) => (
            <Card key={assignment.id}>
              <CardHeader className="flex flex-row items-start justify-between gap-4">
                <div>
                  <CardTitle className="text-base">{assignment.title}</CardTitle>
                  <p className="text-sm text-muted-foreground">{courseTitle}</p>
                </div>
                <Badge variant="outline">Entrega: {formatDate(assignment.dueDate)}</Badge>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm">{assignment.instructions}</p>
                <p className="text-sm text-muted-foreground">Puntaje máximo: {assignment.maxScore} pts</p>

                {submission ? (
                  <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={submission.status === "graded" ? "default" : "secondary"}>
                        {statusLabel(submission.status)}
                      </Badge>
                      {submission.score !== undefined && (
                        <span className="text-sm font-medium">Nota: {submission.score} / {assignment.maxScore}</span>
                      )}
                    </div>
                    <p className="text-sm">
                      Archivo:{" "}
                      <a href={submission.fileUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                        {submission.fileName}
                      </a>
                    </p>
                    {submission.feedback && (
                      <p className="text-sm text-muted-foreground">Retroalimentación: {submission.feedback}</p>
                    )}
                  </div>
                ) : (
                  <div>
                    <input
                      ref={(el) => { fileRefs.current[assignment.id] = el; }}
                      type="file"
                      accept="application/pdf"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleUpload(assignment.id, assignment.courseId, file);
                        e.target.value = "";
                      }}
                    />
                    <Button
                      size="sm"
                      disabled={uploadingId === assignment.id}
                      onClick={() => fileRefs.current[assignment.id]?.click()}
                      className="gap-2"
                    >
                      <Upload className="h-4 w-4" />
                      {uploadingId === assignment.id ? "Subiendo..." : "Subir PDF"}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
