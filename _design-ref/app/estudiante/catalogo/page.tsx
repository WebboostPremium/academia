import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { CheckCircle2, BookOpen, ArrowRight } from 'lucide-react'
import { getCurrentUser } from '@/lib/auth/session'
import {
  getEnrollmentsByUser,
  getAllCourses,
} from '@/lib/services/server-data'
import { COURSE_PRICES } from '@/lib/firebase/collections'
import { SectionHeader } from '@/components/dashboard/ui'
import { PurchaseButton } from '@/components/estudiante/purchase-button'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export const dynamic = 'force-dynamic'

const COURSE_IMAGES: Record<string, string> = {
  bautismo: '/images/curso-bautismo.png',
  comunion: '/images/curso-comunion.png',
  confirmacion: '/images/curso-confirmacion.png',
}

export default async function CatalogoPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const [enrollments, courses] = await Promise.all([
    getEnrollmentsByUser(user.uid),
    getAllCourses(),
  ])
  const enrolledIds = new Set(enrollments.map((e) => e.courseId))
  const published = courses.filter((c) => c.published)

  return (
    <div className="flex flex-col gap-6">
      <SectionHeader
        title="Catálogo de cursos"
        description="Elige el sacramento que deseas preparar. Cada curso es un pago único."
      />

      {published.length === 0 ? (
        <p className="text-muted-foreground">
          Aún no hay cursos publicados. Vuelve pronto.
        </p>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {published.map((course) => {
            const enrolled = enrolledIds.has(course.id)
            const price = course.price ?? COURSE_PRICES[course.id] ?? 0
            return (
              <Card key={course.id} className="flex flex-col overflow-hidden p-0">
                <div className="relative aspect-[16/10]">
                  <Image
                    src={
                      COURSE_IMAGES[course.id] ||
                      course.coverImage ||
                      '/placeholder.svg'
                    }
                    alt={course.title}
                    fill
                    className="object-cover"
                  />
                  {enrolled && (
                    <Badge className="absolute right-3 top-3 gap-1 bg-primary">
                      <CheckCircle2 className="size-3.5" />
                      Inscrito
                    </Badge>
                  )}
                </div>
                <div className="flex flex-1 flex-col gap-3 p-5">
                  <div className="flex items-center justify-between">
                    <h3 className="font-serif text-lg font-semibold">
                      {course.title}
                    </h3>
                    {!enrolled && (
                      <span className="font-serif text-lg font-semibold text-primary">
                        ${price}
                      </span>
                    )}
                  </div>
                  <p className="line-clamp-3 flex-1 text-sm leading-relaxed text-muted-foreground">
                    {course.description}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <BookOpen className="size-3.5" />
                    {course.totalLessons ?? 0} lecciones ·{' '}
                    {course.totalModules ?? 0} módulos
                  </div>
                  <div className="mt-2">
                    {enrolled ? (
                      <Button asChild variant="outline" className="w-full">
                        <Link href={`/estudiante/cursos/${course.id}`}>
                          Ir al curso
                          <ArrowRight className="size-4" />
                        </Link>
                      </Button>
                    ) : (
                      <PurchaseButton
                        courseId={course.id}
                        courseTitle={course.title}
                        price={price}
                      />
                    )}
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
