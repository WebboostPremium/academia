"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { getPublishedCourses } from "@/lib/services/courses";
import { getQuestions, getAnswers, createAnswer } from "@/lib/services/forum";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils/format";
import type { Course } from "@/types/course";
import type { ForumQuestion, ForumAnswer } from "@/types";

export default function ForoPage() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [courseId, setCourseId] = useState("");
  const [questions, setQuestions] = useState<ForumQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, ForumAnswer[]>>({});
  const [replyingId, setReplyingId] = useState<string | null>(null);
  const [replyBody, setReplyBody] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getPublishedCourses()
      .then((c) => {
        setCourses(c);
        if (c.length > 0) setCourseId(c[0].id);
      })
      .catch(() => toast.error("Error al cargar cursos"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!courseId) return;
    async function loadForum() {
      try {
        const qs = await getQuestions(courseId, { includeHidden: true });
        const open = qs.filter((q) => q.status === "open" || q.status === "answered");
        setQuestions(open);
        const answerMap: Record<string, ForumAnswer[]> = {};
        await Promise.all(
          open.map(async (q) => {
            answerMap[q.id] = await getAnswers(q.id, { includeHidden: true });
          })
        );
        setAnswers(answerMap);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Error al cargar el foro");
      }
    }
    loadForum();
  }, [courseId]);

  async function handleReply(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !replyingId || !replyBody.trim()) return;

    setSaving(true);
    try {
      await createAnswer({
        questionId: replyingId,
        userId: user.uid,
        userName: user.displayName,
        body: replyBody,
        isOfficial: true,
      });
      toast.success("Respuesta publicada oficialmente");
      setReplyingId(null);
      setReplyBody("");
      const updated = await getAnswers(replyingId, { includeHidden: true });
      setAnswers((prev) => ({ ...prev, [replyingId]: updated }));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al publicar la respuesta");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p className="text-muted-foreground">Cargando foro...</p>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Foro de consultas"
        description="Responde oficialmente las preguntas de los estudiantes"
      />

      <div className="space-y-2">
        <Label htmlFor="course">Curso</Label>
        <select
          id="course"
          value={courseId}
          onChange={(e) => setCourseId(e.target.value)}
          className="flex h-10 w-full max-w-sm rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          {courses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.title}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-4">
        {questions.length === 0 ? (
          <p className="text-sm text-muted-foreground">No hay consultas en este curso</p>
        ) : (
          questions.map((q) => (
            <Card key={q.id}>
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <CardTitle className="text-base">{q.title}</CardTitle>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {q.userName} · {formatDate(q.createdAt)}
                    </p>
                  </div>
                  <Badge variant={q.status === "open" ? "outline" : "secondary"}>
                    {q.status === "open" ? "Abierta" : "Respondida"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm">{q.body}</p>

                {answers[q.id]?.length > 0 && (
                  <div className="space-y-2 rounded-lg bg-muted/50 p-3">
                    {answers[q.id].map((a) => (
                      <div key={a.id} className="text-sm">
                        <p className="font-medium">
                          {a.userName}
                          {a.isOfficial && (
                            <Badge className="ml-2" variant="default">
                              Oficial
                            </Badge>
                          )}
                        </p>
                        <p className="text-muted-foreground">{a.body}</p>
                      </div>
                    ))}
                  </div>
                )}

                {replyingId === q.id ? (
                  <form onSubmit={handleReply} className="space-y-3">
                    <Textarea
                      value={replyBody}
                      onChange={(e) => setReplyBody(e.target.value)}
                      placeholder="Escribe tu respuesta oficial..."
                      rows={3}
                      required
                    />
                    <div className="flex gap-2">
                      <Button type="submit" size="sm" disabled={saving}>
                        {saving ? "Publicando..." : "Publicar respuesta oficial"}
                      </Button>
                      <Button type="button" size="sm" variant="outline" onClick={() => setReplyingId(null)}>
                        Cancelar
                      </Button>
                    </div>
                  </form>
                ) : (
                  <Button size="sm" variant="outline" onClick={() => setReplyingId(q.id)}>
                    Responder oficialmente
                  </Button>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
