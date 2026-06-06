import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowRight, ShoppingBag } from 'lucide-react'
import { getCurrentUser } from '@/lib/auth/session'
import {
  getEnrollmentsByUser,
  getAllCourses,
  getLessonsByCourse,
  getLessonProgressByStudent,
} from '@/lib/services/server-data'
import { SectionHeader, EmptyState } from '@/components/dashboard/ui'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export const dynamic = 'force-dynamic'

export default async function MisCursosPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const [enrollments, courses, progress] = await Promise.all([
    getEnrollmentsByUser(user.uid),
    getAllCourses(),
    getLessonProgressByStudent(user.uid),
  ])
  const enrolledIds = new Set(enrollments.map((e) => e.courseId))
  const myCourses = courses.filter((c) => enrolledIds.has(c.id))

  const cards = await Promise.all(
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

  return (
    <div className="flex flex-col gap-6">
      <SectionHeader
        title="Mis cursos"
        description="Tus programas sacramentales en curso."
      />

      {cards.length === 0 ? (
        <EmptyState
          icon={ShoppingBag}
          title="No tienes cursos activos"
          description="Inscríbete en un curso desde el catálogo para comenzar."
          action={
            <Button asChild className="mt-2">
              <Link href="/estudiante/catalogo">Ver catálogo</Link>
            </Button>
          }
        />
      ) : (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {cards.map(({ course, total, completed, pct }) => (
            <Card key={course.id} className="flex flex-col gap-4 p-5">
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-serif text-lg font-semibold">
                  {course.title}
                </h3>
                <Badge variant="secondary">{pct}%</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {completed} de {total} lecciones completadas
              </p>
              <Progress value={pct} />
              <Button asChild variant="outline" className="mt-auto">
                <Link href={`/estudiante/cursos/${course.id}`}>
                  {pct === 0 ? 'Comenzar' : 'Continuar'}
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
