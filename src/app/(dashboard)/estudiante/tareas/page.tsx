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
import { createSubmission } from "@/lib/services/assignments";
import { formatDate } from "@/lib/utils/format";

interface AssignmentItem {
  id: string;
  courseId: string;
  courseTitle: string;
  title: string;
  instructions: string;
  maxScore: number;
  dueDate: string;
  submission: {
    id: string;
    fileUrl: string;
    fileName: string;
    status: string;
    score?: number;
    feedback?: string;
  } | null;
}

export default function EstudianteTareasPage() {
  const { user, loading: authLoading } = useAuth();
  const [items, setItems] = useState<AssignmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }

    async function load() {
      try {
        const res = await fetch("/api/student/assignments", { credentials: "same-origin" });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setItems(data.assignments ?? []);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Error al cargar las tareas");
        setItems([]);
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

      const res = await fetch("/api/upload", { method: "POST", body: formData, credentials: "same-origin" });
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

      const listRes = await fetch("/api/student/assignments", { credentials: "same-origin" });
      const listData = await listRes.json();
      if (listRes.ok) setItems(listData.assignments ?? []);

      toast.success("Tarea enviada correctamente");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al enviar la tarea");
    } finally {
      setUploadingId(null);
    }
  }

  function statusLabel(status: string) {
    const labels: Record<string, string> = { pending: "Pendiente de calificar", graded: "Calificada", returned: "Devuelta" };
    return labels[status] ?? status;
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
          {items.map((assignment) => (
            <Card key={assignment.id}>
              <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <CardTitle className="text-base">{assignment.title}</CardTitle>
                  <p className="text-sm text-muted-foreground">{assignment.courseTitle}</p>
                </div>
                <Badge variant="outline" className="w-fit">Entrega: {formatDate(new Date(assignment.dueDate))}</Badge>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm">{assignment.instructions}</p>
                <p className="text-sm text-muted-foreground">Puntaje máximo: {assignment.maxScore} pts</p>

                {assignment.submission ? (
                  <div className="space-y-2 rounded-lg border bg-muted/30 p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={assignment.submission.status === "graded" ? "default" : "secondary"}>
                        {statusLabel(assignment.submission.status)}
                      </Badge>
                      {assignment.submission.score !== undefined && (
                        <span className="text-sm font-medium">Nota: {assignment.submission.score} / {assignment.maxScore}</span>
                      )}
                    </div>
                    <p className="text-sm">
                      Archivo:{" "}
                      <a href={assignment.submission.fileUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                        {assignment.submission.fileName}
                      </a>
                    </p>
                    {assignment.submission.feedback && (
                      <p className="text-sm text-muted-foreground">Retroalimentación: {assignment.submission.feedback}</p>
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
