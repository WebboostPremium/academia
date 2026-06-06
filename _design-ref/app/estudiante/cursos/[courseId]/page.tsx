import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { Lock } from 'lucide-react'
import { getCurrentUser } from '@/lib/auth/session'
import {
  getCourse,
  getEnrollmentsByUser,
  getModulesByCourse,
  getLessonsByCourse,
  getQuizzesByCourse,
  getAssignmentsByCourse,
  getLessonProgressByStudent,
  getSubmissionsByStudent,
  getQuizResultsByStudent,
} from '@/lib/services/server-data'
import { CourseView } from '@/components/estudiante/course-view'
import { Button } from '@/components/ui/button'

export const dynamic = 'force-dynamic'

export default async function CursoPage({
  params,
}: {
  params: Promise<{ courseId: string }>
}) {
  const { courseId } = await params
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const course = await getCourse(courseId)
  if (!course) notFound()

  const enrollments = await getEnrollmentsByUser(user.uid)
  const hasAccess = enrollments.some((e) => e.courseId === courseId)

  if (!hasAccess) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-4 rounded-xl border border-dashed border-border bg-card/50 px-6 py-16 text-center">
        <span className="inline-flex size-12 items-center justify-center rounded-full bg-secondary text-primary">
          <Lock className="size-6" />
        </span>
        <h2 className="font-serif text-xl font-semibold">Curso bloqueado</h2>
        <p className="text-sm text-muted-foreground">
          Aún no has adquirido <strong>{course.title}</strong>. Inscríbete desde
          el catálogo para acceder al contenido.
        </p>
        <Button asChild className="mt-2">
          <Link href="/estudiante/catalogo">Ir al catálogo</Link>
        </Button>
      </div>
    )
  }

  const [modules, lessons, quizzes, assignments, progress, submissions, quizResults] =
    await Promise.all([
      getModulesByCourse(courseId),
      getLessonsByCourse(courseId),
      getQuizzesByCourse(courseId),
      getAssignmentsByCourse(courseId),
      getLessonProgressByStudent(user.uid),
      getSubmissionsByStudent(user.uid),
      getQuizResultsByStudent(user.uid),
    ])

  const completedLessonIds = progress
    .filter((p) => p.courseId === courseId && p.completed)
    .map((p) => p.lessonId)

  return (
    <CourseView
      course={course}
      modules={modules}
      lessons={lessons}
      quizzes={quizzes}
      assignments={assignments}
      completedLessonIds={completedLessonIds}
      submissions={submissions.filter((s) => s.courseId === courseId)}
      quizResults={quizResults.filter((r) => r.courseId === courseId)}
    />
  )
}
