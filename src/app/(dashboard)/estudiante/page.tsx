"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Clock, BookOpen, ClipboardList, Award, Flame, Video, Megaphone } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CircularProgress } from "@/components/ui/circular-progress";
import { getCourse } from "@/lib/services/courses";
import { getUserEnrollments } from "@/lib/services/enrollments";
import { getUpcomingClasses } from "@/lib/services/live-classes";
import { getPrayers, getPrayerProgress } from "@/lib/services/prayers";
import { getQuizResults } from "@/lib/services/quizzes";
import { getNewsArticles } from "@/lib/services/news";
import { formatDateTime } from "@/lib/utils/format";
import type { Course, Enrollment } from "@/types/course";

const COURSE_IMAGES: Record<string, string> = {
  bautismo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=200&fit=crop",
  "primera-comunion": "https://images.unsplash.com/photo-1519494026892-80bbd9d6ecb6?w=400&h=200&fit=crop",
  confirmacion: "https://images.unsplash.com/photo-1438232992991-995b9458d3c0?w=400&h=200&fit=crop",
};

export default function EstudianteDashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const [enrollments, setEnrollments] = useState<Array<{ course: Course; enrollment: Enrollment }>>([]);
  const [nextClass, setNextClass] = useState<{ title: string; date: string; url: string } | null>(null);
  const [stats, setStats] = useState({ studyTime: 0, lessons: 0, quizzes: 0, certs: 0, prayers: 0 });
  const [announcements, setAnnouncements] = useState<Array<{ slug: string; title: string; excerpt?: string }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }
    async function load() {
      try {
        const [enrollmentsRes, prayersRes, progressRes, newsRes] = await Promise.allSettled([
          getUserEnrollments(user!.uid),
          getPrayers(),
          getPrayerProgress(user!.uid),
          getNewsArticles(true),
        ]);

        const userEnrollments = enrollmentsRes.status === "fulfilled" ? enrollmentsRes.value : [];
        const prayers = prayersRes.status === "fulfilled" ? prayersRes.value : [];
        const prayerProgress = progressRes.status === "fulfilled" ? progressRes.value : [];
        const news = newsRes.status === "fulfilled" ? newsRes.value : [];

        if (enrollmentsRes.status === "rejected") toast.error("No se pudieron cargar tus cursos");

        setAnnouncements(
          news.slice(0, 5).map((a) => ({
            slug: a.slug,
            title: a.title,
            excerpt: a.excerpt,
          }))
        );
        const active = userEnrollments.filter((e) => e.status === "active" || e.status === "completed");
        const enrolled = (await Promise.allSettled(
          active.map(async (enrollment) => {
            const course = await getCourse(enrollment.courseId);
            return course ? { course, enrollment } : null;
          })
        ))
          .filter((r) => r.status === "fulfilled" && r.value)
          .map((r) => (r as PromiseFulfilledResult<{ course: Course; enrollment: Enrollment } | null>).value!)
          .filter(Boolean) as Array<{ course: Course; enrollment: Enrollment }>;
        setEnrollments(enrolled);

        const courseIds = active.map((e) => e.courseId);
        try {
          const upcoming = (await getUpcomingClasses()).filter((c) => courseIds.includes(c.courseId));
          if (upcoming[0]) {
            setNextClass({ title: upcoming[0].title, date: formatDateTime(upcoming[0].scheduledAt), url: upcoming[0].meetingUrl });
          }
        } catch {
          // clases en vivo opcionales
        }

        const totalLessons = enrolled.reduce(
          (s, e) => s + (e.enrollment.progress.lessonsCompleted?.length ?? 0),
          0
        );
        const totalQuizzes = enrolled.reduce(
          (s, e) => s + (e.enrollment.progress.quizzesPassed?.length ?? 0),
          0
        );
        const certs = enrolled.filter((e) => e.enrollment.status === "completed").length;
        const prayersLearned = prayers.filter((p) => prayerProgress.some((pp) => pp.prayerId === p.id && pp.learned)).length;

        setStats({
          studyTime: user!.studyTimeMinutes ?? 0,
          lessons: totalLessons,
          quizzes: totalQuizzes,
          certs,
          prayers: prayersLearned,
        });
      } catch {
        toast.error("Error al cargar el panel");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user, authLoading]);

  const primary = enrollments.reduce((best, curr) => {
    const bestDate = best?.enrollment.progress.lastActivityAt?.getTime() ?? 0;
    const currDate = curr.enrollment.progress.lastActivityAt?.getTime() ?? 0;
    return currDate > bestDate ? curr : best;
  }, enrollments[0]);
  const overallProgress = primary?.enrollment.progress.percentComplete ?? 0;
  const continueHref = primary?.enrollment.progress.lastLessonId
    ? `/estudiante/lecciones/${primary.enrollment.progress.lastLessonId}`
    : "/estudiante/lecciones";
  const firstName = user?.displayName?.split(" ")[0] ?? "";

  if (authLoading || loading) {
    return <div className="flex h-64 items-center justify-center text-muted-foreground">Cargando...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">¡Bienvenido{firstName ? `, ${firstName}` : ""}!</h1>
        <p className="text-muted-foreground">Continúa tu preparación sacramental</p>
      </div>

      {announcements.length > 0 && (
        <div className="card-shadow rounded-2xl bg-white p-5">
          <div className="mb-3 flex items-center gap-2 text-primary">
            <Megaphone className="h-5 w-5" />
            <h2 className="font-semibold">Anuncios de la parroquia</h2>
          </div>
          <ul className="space-y-3">
            {announcements.map((item) => (
              <li key={item.slug} className="rounded-lg border border-border/60 p-3">
                <Link href={`/noticias/${item.slug}`} className="font-medium hover:text-primary">
                  {item.title}
                </Link>
                {item.excerpt && <p className="mt-1 text-sm text-muted-foreground">{item.excerpt}</p>}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Top row */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="card-shadow flex items-center justify-center rounded-2xl bg-white p-6">
          <CircularProgress value={overallProgress} label="Progreso General" />
        </div>
        <div className="card-shadow rounded-2xl bg-white p-5">
          <div className="flex items-center gap-2 text-primary">
            <Video className="h-5 w-5" />
            <h3 className="font-semibold">Próxima Clase</h3>
          </div>
          {nextClass ? (
            <div className="mt-3">
              <p className="font-medium">{nextClass.title}</p>
              <p className="text-sm text-muted-foreground">{nextClass.date}</p>
              <Button asChild size="sm" className="mt-3 rounded-full">
                <a href={nextClass.url} target="_blank" rel="noopener noreferrer">Unirse</a>
              </Button>
            </div>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">Sin clases programadas</p>
          )}
        </div>
        <div className="card-shadow rounded-2xl bg-white p-5">
          <div className="flex items-center gap-2 text-orange-500">
            <Flame className="h-5 w-5" />
            <h3 className="font-semibold">Última Actividad</h3>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            {primary ? `Continuaste ${primary.course.title}` : "Sin actividad reciente"}
          </p>
          {primary && (
            <>
              <p className="mt-1 text-xs text-primary">
                {primary.enrollment.progress.percentComplete}% del curso completado
              </p>
              {primary.enrollment.progress.lastActivityAt && (
                <p className="mt-1 text-xs text-muted-foreground">
                  {formatDateTime(primary.enrollment.progress.lastActivityAt)}
                </p>
              )}
            </>
          )}
        </div>
      </div>

      {/* Mis Cursos */}
      {enrollments.length > 0 && (
        <div>
          <h2 className="mb-4 text-lg font-bold">Mis Cursos</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {enrollments.map(({ course, enrollment }) => (
              <div key={course.id} className="card-shadow overflow-hidden rounded-2xl bg-white">
                <div className="relative h-32">
                  <Image src={course.imageUrl || COURSE_IMAGES[course.slug] || COURSE_IMAGES.bautismo}
                    alt={course.title} fill className="object-cover" unoptimized />
                </div>
                <div className="p-4">
                  <h3 className="font-semibold">{course.title}</h3>
                  <Progress value={enrollment.progress.percentComplete} className="mt-3" />
                  <p className="mt-1 text-xs text-muted-foreground">{enrollment.progress.percentComplete}% completado</p>
                  <Button asChild size="sm" variant="outline" className="mt-3 w-full rounded-full">
                    <Link href={enrollment.progress.lastLessonId ? `/estudiante/lecciones/${enrollment.progress.lastLessonId}` : "/estudiante/lecciones"}>
                      Continuar
                    </Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Continuar aprendiendo */}
      <div className="card-shadow rounded-2xl bg-gradient-to-r from-primary/5 to-primary/10 p-6">
        <h2 className="text-lg font-bold">Continuar aprendiendo</h2>
        {primary ? (
          <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="font-medium">{primary.course.title}</p>
              <p className="text-sm text-muted-foreground">
                {primary.enrollment.progress.percentComplete}% completado
              </p>
            </div>
            <Button asChild className="rounded-full px-6">
              <Link href={continueHref}>Continuar →</Link>
            </Button>
          </div>
        ) : (
          <div className="mt-3">
            <p className="text-muted-foreground">Explora el catálogo y comienza tu preparación</p>
            <Button asChild className="mt-3 rounded-full"><Link href="/estudiante/cursos">Ver cursos</Link></Button>
          </div>
        )}
      </div>

      {/* Mis Logros */}
      <div className="card-shadow rounded-2xl bg-white p-5">
        <h2 className="font-bold">Mis Logros</h2>
        <div className="mt-4 flex flex-wrap gap-3">
          {stats.prayers >= 5 && <span className="rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">🙏 Devoto</span>}
          {stats.lessons >= 1 && <span className="rounded-full bg-green-100 px-4 py-2 text-sm font-medium text-green-700">📖 Primer paso</span>}
          {stats.quizzes >= 5 && <span className="rounded-full bg-blue-100 px-4 py-2 text-sm font-medium text-blue-700">✅ Quiz master</span>}
          {stats.certs >= 1 && <span className="rounded-full bg-yellow-100 px-4 py-2 text-sm font-medium text-yellow-700">🏆 Graduado</span>}
          {stats.lessons === 0 && stats.quizzes === 0 && (
            <p className="text-sm text-muted-foreground">Completa lecciones para desbloquear logros</p>
          )}
        </div>
      </div>

      {/* Footer stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { icon: Clock, label: "Tiempo estudiado", value: `${Math.floor(stats.studyTime / 60)}h ${stats.studyTime % 60}m` },
          { icon: BookOpen, label: "Lecciones", value: stats.lessons },
          { icon: ClipboardList, label: "Quizzes aprobados", value: stats.quizzes },
          { icon: Award, label: "Certificados", value: stats.certs },
        ].map((s) => (
          <div key={s.label} className="card-shadow rounded-2xl bg-white p-4 text-center">
            <s.icon className="mx-auto h-5 w-5 text-primary" />
            <p className="mt-2 text-xl font-bold">{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
