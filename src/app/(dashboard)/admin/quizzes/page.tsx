"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable } from "@/components/dashboard/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCourses } from "@/lib/services/courses";
import { getQuizzes, createQuiz, updateQuiz, deleteQuiz } from "@/lib/services/quizzes";
import type { Course, Quiz, QuizQuestionType } from "@/types/course";

type QuizForm = {
  title: string;
  questionType: QuizQuestionType;
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctOption: string;
  passingScore: string;
  maxAttempts: string;
  timeLimitMinutes: string;
};

type OptionFieldKey = "optionA" | "optionB" | "optionC" | "optionD";

const EMPTY_FORM: QuizForm = {
  title: "",
  questionType: "multiple_choice",
  question: "",
  optionA: "",
  optionB: "",
  optionC: "",
  optionD: "",
  correctOption: "0",
  passingScore: "70",
  maxAttempts: "3",
  timeLimitMinutes: "",
};

export default function QuizzesAdminPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [courseId, setCourseId] = useState("");
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<QuizForm>(EMPTY_FORM);

  const selectClass =
    "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

  useEffect(() => {
    getCourses().then((data) => {
      setCourses(data);
      if (data.length > 0) setCourseId(data[0].id);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!courseId) return;
    getQuizzes(courseId).then(setQuizzes);
  }, [courseId]);

  function buildOptions() {
    if (form.questionType === "true_false") {
      return [
        { id: "true", text: "Verdadero", isCorrect: form.correctOption === "0" },
        { id: "false", text: "Falso", isCorrect: form.correctOption === "1" },
      ];
    }
    if (form.questionType === "single_choice") {
      return [
        { id: "opt_a", text: form.optionA, isCorrect: form.correctOption === "0" },
        { id: "opt_b", text: form.optionB, isCorrect: form.correctOption === "1" },
      ];
    }
    return [
      { id: "opt_a", text: form.optionA, isCorrect: form.correctOption === "0" },
      { id: "opt_b", text: form.optionB, isCorrect: form.correctOption === "1" },
      { id: "opt_c", text: form.optionC, isCorrect: form.correctOption === "2" },
      { id: "opt_d", text: form.optionD, isCorrect: form.correctOption === "3" },
    ];
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!courseId) return;
    const options = buildOptions();
    if (!options.some((o) => o.isCorrect) || options.some((o) => !o.text)) {
      toast.error("Completa las opciones y marca la correcta");
      return;
    }
    setSaving(true);
    const payload = {
      courseId,
      type: "lesson" as const,
      title: form.title,
      passingScore: Number(form.passingScore),
      maxAttempts: Number(form.maxAttempts),
      timeLimitMinutes: form.timeLimitMinutes ? Number(form.timeLimitMinutes) : undefined,
      questions: [{ id: "q1", text: form.question, type: form.questionType, options }],
      shuffleQuestions: true,
      shuffleOptions: true,
      status: "draft" as const,
    };
    try {
      if (editingId) {
        await updateQuiz(editingId, payload);
        toast.success("Quiz actualizado");
      } else {
        await createQuiz(payload);
        toast.success("Quiz creado");
      }
      setForm(EMPTY_FORM);
      setEditingId(null);
      setShowForm(false);
      setQuizzes(await getQuizzes(courseId));
    } catch {
      toast.error("Error al guardar el quiz");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar este quiz?")) return;
    try {
      await deleteQuiz(id);
      toast.success("Quiz eliminado");
      setQuizzes(await getQuizzes(courseId));
    } catch {
      toast.error("Error al eliminar");
    }
  }

  if (loading) return <p className="text-muted-foreground">Cargando...</p>;

  const optionKeys: OptionFieldKey[] =
    form.questionType === "multiple_choice"
      ? ["optionA", "optionB", "optionC", "optionD"]
      : ["optionA", "optionB"];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quizzes"
        description="Evaluaciones por lección y examen final"
        action={<Button onClick={() => setShowForm(!showForm)}>{showForm ? "Cancelar" : "Nuevo quiz"}</Button>}
      />

      <div className="max-w-sm space-y-2">
        <Label>Curso</Label>
        <select className={selectClass} value={courseId} onChange={(e) => setCourseId(e.target.value)}>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>{c.title}</option>
          ))}
        </select>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Nuevo quiz</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="max-w-lg space-y-4">
              <div className="space-y-2">
                <Label>Título</Label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label>Nota mínima (%)</Label>
                  <Input type="number" value={form.passingScore} onChange={(e) => setForm({ ...form, passingScore: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Intentos</Label>
                  <Input type="number" value={form.maxAttempts} onChange={(e) => setForm({ ...form, maxAttempts: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Tiempo (min)</Label>
                  <Input type="number" value={form.timeLimitMinutes} onChange={(e) => setForm({ ...form, timeLimitMinutes: e.target.value })} placeholder="Opcional" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Tipo de pregunta</Label>
                <select className={selectClass} value={form.questionType} onChange={(e) => setForm({ ...form, questionType: e.target.value as QuizQuestionType, correctOption: "0" })}>
                  <option value="multiple_choice">Opción múltiple (4 opciones)</option>
                  <option value="single_choice">Respuesta única (2 opciones)</option>
                  <option value="true_false">Verdadero / Falso</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Pregunta</Label>
                <Input value={form.question} onChange={(e) => setForm({ ...form, question: e.target.value })} required />
              </div>
              {form.questionType === "true_false" ? (
                <div className="space-y-2">
                  <Label>Respuesta correcta</Label>
                  <select className={selectClass} value={form.correctOption} onChange={(e) => setForm({ ...form, correctOption: e.target.value })}>
                    <option value="0">Verdadero</option>
                    <option value="1">Falso</option>
                  </select>
                </div>
              ) : (
                <>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {optionKeys.map((key, i) => (
                      <div key={key} className="space-y-2">
                        <Label>Opción {String.fromCharCode(65 + i)}</Label>
                        <Input value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} required />
                      </div>
                    ))}
                  </div>
                  <div className="space-y-2">
                    <Label>Respuesta correcta</Label>
                    <select className={selectClass} value={form.correctOption} onChange={(e) => setForm({ ...form, correctOption: e.target.value })}>
                      {(form.questionType === "multiple_choice" ? ["A", "B", "C", "D"] : ["A", "B"]).map((l, i) => (
                        <option key={l} value={String(i)}>Opción {l}</option>
                      ))}
                    </select>
                  </div>
                </>
              )}
              <Button type="submit" disabled={saving}>{saving ? "Guardando..." : editingId ? "Actualizar quiz" : "Crear quiz"}</Button>
            </form>
          </CardContent>
        </Card>
      )}

      <DataTable
        keyField="id"
        data={quizzes}
        columns={[
          { key: "title", header: "Título", render: (q) => q.title },
          { key: "type", header: "Tipo", render: (q) => q.type === "final_exam" ? "Examen final" : "Lección" },
          { key: "questions", header: "Preguntas", render: (q) => q.questions.length },
          { key: "passing", header: "Mínimo", render: (q) => `${q.passingScore}%` },
          {
            key: "status",
            header: "Estado",
            render: (q) => (
              <Badge variant={q.status === "published" ? "default" : "secondary"}>
                {q.status === "published" ? "Publicado" : "Borrador"}
              </Badge>
            ),
          },
          {
            key: "actions",
            header: "Acciones",
            render: (q) => (
              <div className="flex gap-1">
                <Button size="sm" variant="outline" onClick={() => updateQuiz(q.id, { status: q.status === "published" ? "draft" : "published" }).then(() => getQuizzes(courseId).then(setQuizzes))}>
                  {q.status === "published" ? "Ocultar" : "Publicar"}
                </Button>
                <Button size="sm" variant="destructive" onClick={() => handleDelete(q.id)}>Eliminar</Button>
              </div>
            ),
          },
        ]}
      />
    </div>
  );
}
