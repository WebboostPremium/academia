"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, CheckCircle2, Download, ExternalLink, List } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { VideoPlayer } from "@/components/lessons/video-player";
import { LessonSidebar } from "@/components/lessons/lesson-sidebar";
import { QuizTaker } from "@/components/quizzes/quiz-taker";
import { Button } from "@/components/ui/button";
import { getLesson, getLessons, getModules, getCourse } from "@/lib/services/courses";
import { getEnrollment, markLessonComplete, updateEnrollmentProgress } from "@/lib/services/enrollments";
import { getQuiz, getQuizResults, submitQuizResult, gradeQuiz } from "@/lib/services/quizzes";
import { recalculateProgress } from "@/lib/services/progress";
import type { Course, Enrollment, Lesson, Module, Quiz } from "@/types/course";

export default function EstudianteLeccionPage() {
  const params = useParams();
  const lessonId = params.lessonId as string;
  const { user, loading: authLoading } = useAuth();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [quizPassed, setQuizPassed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (authLoading || !user || !lessonId) return;
    async function load() {
      try {
        const lessonData = await getLesson(lessonId);
        if (!lessonData) { setLoading(false); return; }
        const [courseData, modulesData, lessonsData, enrollmentData] = await Promise.all([
          getCourse(lessonData.courseId),
          getModules(lessonData.courseId),
          getLessons(lessonData.courseId),
          getEnrollment(user!.uid, lessonData.courseId),
        ]);
        setLesson(lessonData);
        setCourse(courseData);
        setModules(modulesData);
        setLessons(lessonsData);
        setEnrollment(enrollmentData);
        if (lessonData.quizId) {
          const quizData = await getQuiz(lessonData.quizId);
          setQuiz(quizData);
          if (quizData) {
            const results = await getQuizResults(user!.uid, quizData.id);
            setQuizPassed(results.some((r) => r.passed));
          }
        }
      } catch { toast.error("Error al cargar la lección"); }
      finally { setLoading(false); }
    }
    load();
  }, [user, authLoading, lessonId]);

  async function handleMarkComplete() {
    if (!user || !lesson || !enrollment) return;
    setMarking(true);
    try {
      const allLessons = await getLessons(lesson.courseId);
      await markLessonComplete(enrollment.id, lesson.id, allLessons.filter((l) => l.status === "published").length, enrollment);
      await recalculateProgress(user.uid, lesson.courseId);
      setEnrollment(await getEnrollment(user.uid, lesson.courseId));
      toast.success("Lección completada");
    } catch { toast.error("Error al guardar"); }
    finally { setMarking(false); }
  }

  async function handleQuizSubmit(answers: Record<string, string>, result: { score: number; passed: boolean }) {
    if (!user || !quiz || !enrollment || !lesson) return;
    const graded = gradeQuiz(quiz, answers);
    const previous = await getQuizResults(user.uid, quiz.id);
    await submitQuizResult({ userId: user.uid, quizId: quiz.id, courseId: lesson.courseId, lessonId: lesson.id,
      attemptNumber: previous.length + 1, score: result.score, passed: result.passed, answers: graded.graded,
      startedAt: new Date(), completedAt: new Date() });
    if (result.passed) {
      await updateEnrollmentProgress(enrollment.id, { quizzesPassed: [...new Set([...enrollment.progress.quizzesPassed, quiz.id])] });
      await recalculateProgress(user.uid, lesson.courseId);
      setQuizPassed(true);
      toast.success("¡Quiz aprobado!");
    } else toast.error("No alcanzaste la nota mínima");
  }

  const nextLesson = lessons.find((l, i) => lessons[i - 1]?.id === lessonId || (i > 0 && lessons[i - 1].id === lessonId));
  const currentIdx = lessons.findIndex((l) => l.id === lessonId);
  const next = currentIdx >= 0 ? lessons[currentIdx + 1] : null;
  const isComplete = (enrollment?.progress.lessonsCompleted ?? []).includes(lessonId);

  if (loading) return <div className="flex h-64 items-center justify-center">Cargando...</div>;
  if (!lesson || !enrollment || !course) return <div className="p-8 text-center text-muted-foreground">Lección no disponible</div>;

  return (
    <div className="-m-3 flex min-h-[calc(100vh-64px)] flex-col sm:-m-5 md:-m-6 md:flex-row">
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 md:hidden" onClick={() => setSidebarOpen(false)} aria-hidden />
      )}
      <LessonSidebar
        modules={modules}
        lessons={lessons}
        currentLessonId={lessonId}
        enrollment={enrollment}
        courseTitle={course.title}
        onNavigate={() => setSidebarOpen(false)}
        className={cn(
          "fixed inset-y-0 left-0 z-50 max-w-[85vw] shadow-xl transition-transform md:static md:z-auto md:max-w-none md:shadow-none",
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center justify-between gap-2 border-b bg-white px-3 py-3 sm:px-4">
          <div className="flex items-center gap-1">
            <Button type="button" variant="outline" size="sm" className="gap-1 md:hidden" onClick={() => setSidebarOpen(true)}>
              <List className="h-4 w-4" /> Lecciones
            </Button>
            <Button asChild variant="ghost" size="sm" className="gap-1.5 text-muted-foreground">
              <Link href="/estudiante/lecciones"><ArrowLeft className="h-4 w-4" /><span className="hidden sm:inline">Volver</span></Link>
            </Button>
          </div>
          <span className="truncate text-center text-sm font-semibold">{course.title}</span>
          <div className="w-16 sm:w-24">
            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
              <div className="h-full bg-primary" style={{ width: `${enrollment.progress.percentComplete}%` }} />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 md:p-6">
          <h1 className="text-xl font-bold">{lesson.title}</h1>
          {lesson.description && <p className="mt-1 text-sm text-muted-foreground">{lesson.description}</p>}

          {lesson.content.video?.youtubeId && (
            <div className="mt-4"><VideoPlayer youtubeId={lesson.content.video.youtubeId} /></div>
          )}

          {/* Recursos */}
          {(lesson.content.pdfUrl || lesson.content.resources.length > 0) && (
            <div className="mt-6 card-shadow rounded-2xl bg-white p-5">
              <h3 className="font-semibold">Recursos</h3>
              <div className="mt-3 space-y-2">
                {lesson.content.pdfUrl && (
                  <a href={lesson.content.pdfUrl} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 rounded-lg border p-3 text-sm hover:bg-muted/40">
                    <Download className="h-4 w-4 text-primary" />
                    {lesson.content.pdfFileName ?? "Notas de la lección.pdf"}
                    <ExternalLink className="ml-auto h-3 w-3 text-muted-foreground" />
                  </a>
                )}
                {lesson.content.resources.map((r, i) => (
                  <a key={i} href={r.url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 rounded-lg border p-3 text-sm hover:bg-muted/40">
                    <Download className="h-4 w-4 text-primary" />{r.title}
                  </a>
                ))}
              </div>
            </div>
          )}

          {quiz && quiz.status === "published" && !quizPassed && (
            <div className="mt-6"><QuizTaker quiz={quiz} onSubmit={handleQuizSubmit} /></div>
          )}

          {/* Bottom actions */}
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t pt-5">
            {isComplete ? (
              <span className="flex items-center gap-2 text-sm font-medium text-green-600">
                <CheckCircle2 className="h-5 w-5" /> Lección completada
              </span>
            ) : (
              <Button onClick={handleMarkComplete} disabled={marking} variant="outline" className="rounded-full">
                {marking ? "Guardando..." : "Marcar como completada"}
              </Button>
            )}
            {next && (
              <Button asChild className="rounded-full">
                <Link href={`/estudiante/lecciones/${next.id}`}>Siguiente Lección →</Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
