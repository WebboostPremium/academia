"use client";

import { useEffect, useState } from "react";
import { MessageSquare, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { getCourse } from "@/lib/services/courses";
import { getUserEnrollments } from "@/lib/services/enrollments";
import { getQuestions, createQuestion, getAnswers } from "@/lib/services/forum";
import { formatDateTime } from "@/lib/utils/format";
import type { Course } from "@/types/course";
import type { ForumAnswer, ForumQuestion } from "@/types";

interface QuestionItem {
  question: ForumQuestion;
  answers: ForumAnswer[];
}

export default function EstudianteForoPage() {
  const { user, loading: authLoading } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (authLoading || !user) return;

    async function loadCourses() {
      try {
        const enrollments = await getUserEnrollments(user!.uid);
        const active = enrollments.filter((e) => e.status === "active" || e.status === "completed");
        const courseList = (
          await Promise.all(active.map((e) => getCourse(e.courseId)))
        ).filter(Boolean) as Course[];
        setCourses(courseList);
        if (courseList.length > 0) setSelectedCourseId(courseList[0].id);
      } catch {
        toast.error("Error al cargar cursos");
      } finally {
        setLoading(false);
      }
    }

    loadCourses();
  }, [user, authLoading]);

  useEffect(() => {
    if (!selectedCourseId) return;

    async function loadQuestions() {
      try {
        const qs = await getQuestions(selectedCourseId);
        const items = await Promise.all(
          qs.map(async (question) => ({
            question,
            answers: await getAnswers(question.id),
          }))
        );
        setQuestions(items);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Error al cargar preguntas del foro");
      }
    }

    loadQuestions();
  }, [selectedCourseId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !selectedCourseId || !title.trim() || !body.trim()) {
      toast.error("Completa todos los campos");
      return;
    }
    setSubmitting(true);
    try {
      await createQuestion({
        courseId: selectedCourseId,
        userId: user.uid,
        userName: user.displayName || user.email,
        title: title.trim(),
        body: body.trim(),
      });
      const qs = await getQuestions(selectedCourseId);
      const items = await Promise.all(
        qs.map(async (question) => ({
          question,
          answers: await getAnswers(question.id),
        }))
      );
      setQuestions(items);
      setTitle("");
      setBody("");
      toast.success("Pregunta publicada");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al publicar la pregunta");
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleAnswers(questionId: string) {
    if (expandedId === questionId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(questionId);
    const item = questions.find((q) => q.question.id === questionId);
    if (item && item.answers.length === 0) {
      try {
        const answers = await getAnswers(questionId);
        setQuestions((prev) =>
          prev.map((q) => (q.question.id === questionId ? { ...q, answers } : q))
        );
      } catch {
        toast.error("Error al cargar respuestas");
      }
    }
  }

  const statusLabels: Record<ForumQuestion["status"], string> = {
    open: "Abierta",
    answered: "Respondida",
    closed: "Cerrada",
    hidden: "Oculta",
  };

  if (authLoading || loading) {
    return <p className="text-muted-foreground">Cargando foro...</p>;
  }

  if (courses.length === 0) {
    return (
      <div>
        <PageHeader title="Foro" description="Preguntas y respuestas de tus cursos" />
        <EmptyState title="Sin acceso al foro" description="Inscríbete en un curso para participar" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Foro" description="Haz preguntas y consulta las respuestas de tus catequistas" />

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">Nueva pregunta</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="course">Curso</Label>
              <select
                id="course"
                value={selectedCourseId}
                onChange={(e) => setSelectedCourseId(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="title">Título</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="¿Cuál es tu pregunta?"
                maxLength={200}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="body">Detalle</Label>
              <Textarea
                id="body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Describe tu duda con más detalle..."
                rows={4}
              />
            </div>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Publicando..." : "Publicar pregunta"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Preguntas del curso</h2>
        {questions.length === 0 ? (
          <EmptyState title="Sin preguntas" description="Sé el primero en preguntar en este curso" />
        ) : (
          questions.map(({ question, answers }) => (
            <Card key={question.id}>
              <CardHeader>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="flex items-start gap-2">
                    <MessageSquare className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    <div>
                      <CardTitle className="text-base">{question.title}</CardTitle>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {question.userName} · {formatDateTime(question.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant="outline">{statusLabels[question.status]}</Badge>
                    <Badge variant="secondary">{question.answerCount} respuestas</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm">{question.body}</p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleAnswers(question.id)}
                  className="gap-2"
                >
                  {expandedId === question.id ? (
                    <>
                      <ChevronUp className="h-4 w-4" />
                      Ocultar respuestas
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-4 w-4" />
                      Ver respuestas ({question.answerCount})
                    </>
                  )}
                </Button>
                {expandedId === question.id && (
                  <div className="space-y-3 border-l-2 border-muted pl-4">
                    {answers.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Aún no hay respuestas</p>
                    ) : (
                      answers
                        .filter((a) => a.status === "visible")
                        .map((answer) => (
                          <div key={answer.id} className="rounded-lg bg-muted/40 p-3">
                            <div className="mb-1 flex flex-wrap items-center gap-2">
                              <span className="text-sm font-medium">{answer.userName}</span>
                              {answer.isOfficial && (
                                <Badge variant="default" className="text-xs">Oficial</Badge>
                              )}
                              <span className="text-xs text-muted-foreground">
                                {formatDateTime(answer.createdAt)}
                              </span>
                            </div>
                            <p className="text-sm">{answer.body}</p>
                          </div>
                        ))
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </section>
    </div>
  );
}
