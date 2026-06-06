"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable } from "@/components/dashboard/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { getCourses } from "@/lib/services/courses";
import { getQuestions, updateQuestionStatus, deleteQuestion } from "@/lib/services/forum";
import { formatDateTime } from "@/lib/utils/format";
import type { Course } from "@/types/course";
import type { ForumQuestion } from "@/types";

const STATUS_LABELS: Record<ForumQuestion["status"], string> = {
  open: "Abierta",
  answered: "Respondida",
  closed: "Cerrada",
  hidden: "Oculta",
};

export default function ForoAdminPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [courseId, setCourseId] = useState("all");
  const [questions, setQuestions] = useState<ForumQuestion[]>([]);
  const [loading, setLoading] = useState(true);

  const selectClass =
    "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

  useEffect(() => {
    getCourses().then(async (data) => {
      setCourses(data);
      if (data.length > 0) {
        const qs = await Promise.all(data.map((c) => getQuestions(c.id)));
        setQuestions(qs.flat().sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()));
      }
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!courseId || loading) return;
    if (courseId === "all") {
      Promise.all(courses.map((c) => getQuestions(c.id))).then((qs) =>
        setQuestions(qs.flat().sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()))
      );
    } else {
      getQuestions(courseId).then(setQuestions);
    }
  }, [courseId, courses, loading]);

  async function handleHide(id: string) {
    try {
      await updateQuestionStatus(id, "hidden");
      toast.success("Pregunta oculta");
      refresh();
    } catch {
      toast.error("Error al ocultar");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar esta pregunta?")) return;
    try {
      await deleteQuestion(id);
      toast.success("Pregunta eliminada");
      refresh();
    } catch {
      toast.error("Error al eliminar");
    }
  }

  function refresh() {
    if (courseId === "all") {
      Promise.all(courses.map((c) => getQuestions(c.id))).then((qs) =>
        setQuestions(qs.flat().sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()))
      );
    } else if (courseId) {
      getQuestions(courseId).then(setQuestions);
    }
  }

  if (loading) return <p className="text-muted-foreground">Cargando foro...</p>;

  const courseTitle = (id: string) => courses.find((c) => c.id === id)?.title ?? id;

  return (
    <div className="space-y-6">
      <PageHeader title="Foro" description="Moderación de preguntas y respuestas" />

      <div className="max-w-sm space-y-2">
        <Label>Curso</Label>
        <select className={selectClass} value={courseId} onChange={(e) => setCourseId(e.target.value)}>
          <option value="all">Todos los cursos</option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>{c.title}</option>
          ))}
        </select>
      </div>

      <DataTable
        keyField="id"
        data={questions}
        columns={[
          { key: "title", header: "Título", render: (q) => q.title },
          { key: "author", header: "Autor", render: (q) => q.userName },
          { key: "course", header: "Curso", render: (q) => courseTitle(q.courseId) },
          { key: "answers", header: "Respuestas", render: (q) => q.answerCount },
          {
            key: "status",
            header: "Estado",
            render: (q) => (
              <Badge variant={q.status === "hidden" ? "secondary" : "default"}>
                {STATUS_LABELS[q.status]}
              </Badge>
            ),
          },
          { key: "date", header: "Fecha", render: (q) => formatDateTime(q.createdAt) },
          {
            key: "actions",
            header: "Acciones",
            render: (q) => (
              <div className="flex gap-1">
                {q.status !== "hidden" && (
                  <Button size="sm" variant="outline" onClick={() => handleHide(q.id)}>Ocultar</Button>
                )}
                <Button size="sm" variant="destructive" onClick={() => handleDelete(q.id)}>Eliminar</Button>
              </div>
            ),
          },
        ]}
      />
    </div>
  );
}
