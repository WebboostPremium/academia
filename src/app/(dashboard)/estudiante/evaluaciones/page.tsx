"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { QuizTaker } from "@/components/quizzes/quiz-taker";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getCourse } from "@/lib/services/courses";
import { getUserEnrollments, updateEnrollmentProgress } from "@/lib/services/enrollments";
import { getQuizzes, getQuiz, getQuizResults, submitQuizResult, gradeQuiz } from "@/lib/services/quizzes";
import { recalculateProgress } from "@/lib/services/progress";
import type { Course, Enrollment, Quiz } from "@/types/course";

interface QuizItem {
  quiz: Quiz;
  course: Course;
  enrollment: Enrollment;
  attempts: number;
  bestScore: number | null;
  passed: boolean;
}

export default function EstudianteEvaluacionesPage() {
  const { user, loading: authLoading } = useAuth();
  const [quizzes, setQuizzes] = useState<QuizItem[]>([]);
  const [activeQuizId, setActiveQuizId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading || !user) return;

    async function load() {
      try {
        const enrollments = await getUserEnrollments(user!.uid);
        const active = enrollments.filter((e) => e.status === "active" || e.status === "completed");
        const items: QuizItem[] = [];

        for (const enrollment of active) {
          const [course, courseQuizzes] = await Promise.all([
            getCourse(enrollment.courseId),
            getQuizzes(enrollment.courseId),
          ]);
          if (!course) continue;

          const published = courseQuizzes.filter((q) => q.status === "published");
          for (const quiz of published) {
            const results = await getQuizResults(user!.uid, quiz.id);
            const passed = results.some((r) => r.passed);
            const bestScore = results.length
              ? Math.max(...results.map((r) => r.score))
              : null;
            items.push({ quiz, course, enrollment, attempts: results.length, bestScore, passed });
          }

          if (course.finalExamQuizId) {
            const finalQuiz = await getQuiz(course.finalExamQuizId);
            if (finalQuiz && finalQuiz.status === "published" && !items.some((i) => i.quiz.id === finalQuiz.id)) {
              const results = await getQuizResults(user!.uid, finalQuiz.id);
              items.push({
                quiz: finalQuiz,
                course,
                enrollment,
                attempts: results.length,
                bestScore: results.length ? Math.max(...results.map((r) => r.score)) : null,
                passed: enrollment.progress.finalExamPassed || results.some((r) => r.passed),
              });
            }
          }
        }

        setQuizzes(items);
      } catch {
        toast.error("Error al cargar evaluaciones");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [user, authLoading]);

  async function handleQuizSubmit(
    item: QuizItem,
    answers: Record<string, string>,
    result: { score: number; passed: boolean }
  ) {
    if (!user) return;
    try {
      const graded = gradeQuiz(item.quiz, answers);
      await submitQuizResult({
        userId: user.uid,
        quizId: item.quiz.id,
        courseId: item.quiz.courseId,
        lessonId: item.quiz.lessonId,
        attemptNumber: item.attempts + 1,
        score: result.score,
        passed: result.passed,
        answers: graded.graded,
        startedAt: new Date(),
        completedAt: new Date(),
      });

      if (result.passed) {
        const updates =
          item.quiz.type === "final_exam"
            ? { finalExamPassed: true }
            : { quizzesPassed: [...new Set([...item.enrollment.progress.quizzesPassed, item.quiz.id])] };
        await updateEnrollmentProgress(item.enrollment.id, updates);
        await recalculateProgress(user.uid, item.quiz.courseId);
        if (item.quiz.type === "final_exam") {
          fetch("/api/certificates/auto", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ courseId: item.quiz.courseId }),
          }).then((r) => r.json()).then((d) => {
            if (d.certificateId && !d.alreadyExists) toast.success("¡Certificado generado automáticamente!");
          }).catch(() => {});
        }
        toast.success("¡Evaluación aprobada!");
      } else {
        toast.error("No alcanzaste la nota mínima");
      }

      setQuizzes((prev) =>
        prev.map((q) =>
          q.quiz.id === item.quiz.id
            ? {
                ...q,
                attempts: q.attempts + 1,
                bestScore: q.bestScore !== null ? Math.max(q.bestScore, result.score) : result.score,
                passed: q.passed || result.passed,
              }
            : q
        )
      );
      setActiveQuizId(null);
    } catch {
      toast.error("Error al enviar la evaluación");
    }
  }

  if (authLoading || loading) {
    return <p className="text-muted-foreground">Cargando evaluaciones...</p>;
  }

  const activeItem = quizzes.find((q) => q.quiz.id === activeQuizId);

  return (
    <div>
      <PageHeader
        title="Evaluaciones"
        description="Quizzes de lecciones y examen final de tus cursos"
      />

      {quizzes.length === 0 ? (
        <EmptyState title="Sin evaluaciones" description="Inscríbete en un curso para acceder a los quizzes" />
      ) : (
        <div className="space-y-4">
          {quizzes.map((item) => (
            <Card key={item.quiz.id}>
              <CardHeader className="flex flex-row items-start justify-between gap-4">
                <div>
                  <CardTitle className="text-base">{item.quiz.title}</CardTitle>
                  <p className="text-sm text-muted-foreground">{item.course.title}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant={item.quiz.type === "final_exam" ? "default" : "secondary"}>
                    {item.quiz.type === "final_exam" ? "Examen final" : "Quiz"}
                  </Badge>
                  {item.passed ? (
                    <Badge className="bg-green-600">Aprobado</Badge>
                  ) : (
                    <Badge variant="outline">Pendiente</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  <span>Intentos: {item.attempts} / {item.quiz.maxAttempts}</span>
                  <span>Nota mínima: {item.quiz.passingScore}%</span>
                  {item.bestScore !== null && <span>Mejor nota: {item.bestScore}%</span>}
                </div>
                {!item.passed && item.attempts < item.quiz.maxAttempts && activeQuizId !== item.quiz.id && (
                  <Button size="sm" onClick={() => setActiveQuizId(item.quiz.id)}>
                    {item.attempts > 0 ? "Reintentar" : "Comenzar evaluación"}
                  </Button>
                )}
                {!item.passed && item.attempts >= item.quiz.maxAttempts && (
                  <p className="text-sm text-destructive">Has agotado los intentos permitidos</p>
                )}
              </CardContent>
            </Card>
          ))}

          {activeItem && (
            <section className="border-t pt-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold">{activeItem.quiz.title}</h2>
                <Button variant="outline" size="sm" onClick={() => setActiveQuizId(null)}>
                  Cancelar
                </Button>
              </div>
              <QuizTaker
                quiz={activeItem.quiz}
                onSubmit={(answers, result) => handleQuizSubmit(activeItem, answers, result)}
              />
            </section>
          )}
        </div>
      )}
    </div>
  );
}
