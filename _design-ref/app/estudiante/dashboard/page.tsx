import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  BookOpen,
  ShoppingBag,
  Award,
  HeartHandshake,
  Video,
  ArrowRight,
} from 'lucide-react'
import { getCurrentUser } from '@/lib/auth/session'
import {
  getEnrollmentsByUser,
  getAllCourses,
  getLessonsByCourse,
  getLessonProgressByStudent,
  getCertificatesByStudent,
  getPrayers,
  getPrayerProgress,
  getLiveClasses,
} from '@/lib/services/server-data'
import { StatCard, SectionHeader, EmptyState } from '@/components/dashboard/ui'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export const dynamic = 'force-dynamic'

export default async function EstudianteDashboard() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const [enrollments, courses, progress, certificates, prayers, prayerProgress, liveClasses] =
    await Promise.all([
      getEnrollmentsByUser(user.uid),
      getAllCourses(),
      getLessonProgressByStudent(user.uid),
      getCertificatesByStudent(user.uid),
      getPrayers(),
      getPrayerProgress(user.uid),
      getLiveClasses(),
    ])

  const enrolledCourseIds = new Set(enrollments.map((e) => e.courseId))
  const myCourses = courses.filter((c) => enrolledCourseIds.has(c.id))

  const courseCards = await Promise.all(
    myCourses.map(async (course) => {
      const lessons = await getLessonsByCourse(course.id)
      const completed = progress.filter(
        (p) => p.courseId === course.id && p.completed,
      ).length
      const pct =
        lessons.length === 0
          ? 0
          : Math.round((completed / lessons.length) * 100)
      return { course, total: lessons.length, completed, pct }
    }),
  )

  const learnedPrayers = prayerProgress.filter((p) => p.learned).length
  const upcoming = liveClasses
    .filter(
      (c) => enrolledCourseIds.has(c.courseId) && c.date >= Date.now() - 86400000,
    )
    .slice(0, 3)

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h2 className="font-serif text-2xl font-semibold tracking-tight">
          Hola, {user.displayName.split(' ')[0]}
        </h2>
        <p className="mt-1 text-muted-foreground">
          Que la paz te acompañe en tu camino de formación.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Mis cursos"
          value={myCourses.length}
          icon={BookOpen}
        />
        <StatCard
          label="Oraciones aprendidas"
          value={`${learnedPrayers}/${prayers.length}`}
          icon={HeartHandshake}
        />
        <StatCard
          label="Certificados"
          value={certificates.length}
          icon={Award}
        />
        <StatCard
          label="Próximas clases"
          value={upcoming.length}
          icon={Video}
        />
      </div>

      <div>
        <SectionHeader
          title="Continúa aprendiendo"
          description="Retoma tus cursos donde los dejaste."
          action={
            <Button variant="outline" size="sm" asChild>
              <Link href="/estudiante/catalogo">
                Explorar catálogo
                <ShoppingBag className="size-4" />
              </Link>
            </Button>
          }
        />
        <div className="mt-5">
          {courseCards.length === 0 ? (
            <EmptyState
              icon={ShoppingBag}
              title="Aún no tienes cursos"
              description="Explora el catálogo e inscríbete en tu primer programa sacramental."
              action={
                <Button asChild className="mt-2">
                  <Link href="/estudiante/catalogo">Ver catálogo</Link>
                </Button>
              }
            />
          ) : (
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {courseCards.map(({ course, total, completed, pct }) => (
                <Card key={course.id} className="flex flex-col gap-4 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-serif text-lg font-semibold">
                        {course.title}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {completed} de {total} lecciones
                      </p>
                    </div>
                    <Badge variant="secondary">{pct}%</Badge>
                  </div>
                  <Progress value={pct} />
                  <Button asChild variant="outline" className="mt-auto">
                    <Link href={`/estudiante/cursos/${course.id}`}>
                      Continuar
                      <ArrowRight className="size-4" />
                    </Link>
                  </Button>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {upcoming.length > 0 && (
        <div>
          <SectionHeader title="Próximas clases en vivo" />
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {upcoming.map((c) => (
              <Card key={c.id} className="flex flex-col gap-2 p-5">
                <Badge variant="secondary" className="w-fit capitalize">
                  {c.platform}
                </Badge>
                <h3 className="font-medium">{c.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {new Date(c.date).toLocaleDateString('es', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                  })}{' '}
                  · {c.time}
                </p>
                <Button asChild size="sm" className="mt-2 w-fit">
                  <a href={c.meetingUrl} target="_blank" rel="noreferrer">
                    Unirme
                  </a>
                </Button>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
