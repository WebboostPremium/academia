import Link from 'next/link'
import Image from 'next/image'
import {
  BookOpen,
  Video,
  Award,
  Users,
  CheckCircle2,
  Heart,
  Calendar,
  MessageCircleQuestion,
} from 'lucide-react'
import { SiteHeader } from '@/components/landing/site-header'
import { Logo } from '@/components/shared/logo'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

const cursos = [
  {
    title: 'Bautismo',
    desc: 'Prepárate para recibir el primer sacramento de iniciación cristiana.',
    img: '/images/curso-bautismo.png',
  },
  {
    title: 'Primera Comunión',
    desc: 'Un camino para encontrarte con Jesús en la Eucaristía.',
    img: '/images/curso-comunion.png',
  },
  {
    title: 'Confirmación',
    desc: 'Fortalece tu fe y recibe los dones del Espíritu Santo.',
    img: '/images/curso-confirmacion.png',
  },
]

const features = [
  {
    icon: Video,
    title: 'Clases en video',
    desc: 'Lecciones grabadas y encuentros en vivo por Zoom o Meet.',
  },
  {
    icon: BookOpen,
    title: 'Material descargable',
    desc: 'Recursos en PDF para acompañar cada lección.',
  },
  {
    icon: CheckCircle2,
    title: 'Evaluaciones',
    desc: 'Quizzes con calificación automática para medir tu avance.',
  },
  {
    icon: Heart,
    title: 'Oraciones',
    desc: 'Aprende las oraciones esenciales a tu propio ritmo.',
  },
  {
    icon: Calendar,
    title: 'Asistencia',
    desc: 'Seguimiento de tu participación en cada encuentro.',
  },
  {
    icon: Award,
    title: 'Certificados',
    desc: 'Recibe tu constancia al completar cada curso.',
  },
  {
    icon: MessageCircleQuestion,
    title: 'Foro de dudas',
    desc: 'Pregunta a tus catequistas y resuelve tus inquietudes.',
  },
  {
    icon: Users,
    title: 'Acompañamiento',
    desc: 'Catequistas que guían tu proceso sacramental.',
  },
]

const pasos = [
  {
    n: '01',
    title: 'Inscríbete',
    desc: 'Crea tu cuenta y elige el sacramento que vas a preparar.',
  },
  {
    n: '02',
    title: 'Aprende',
    desc: 'Avanza por los módulos con videos, lecturas y evaluaciones.',
  },
  {
    n: '03',
    title: 'Recibe el sacramento',
    desc: 'Completa tu formación y obtén tu certificado de participación.',
  },
]

const testimonios = [
  {
    quote:
      'La plataforma me permitió preparar la confirmación de mi hijo sin descuidar el trabajo. Todo muy claro y humano.',
    name: 'María Fernanda',
    role: 'Madre de familia',
  },
  {
    quote:
      'Como catequista, llevar la asistencia y revisar tareas es ahora muchísimo más sencillo. Una bendición.',
    name: 'Diácono Rafael',
    role: 'Catequista',
  },
  {
    quote:
      'Pude aprender las oraciones y ver las clases cuando tenía tiempo. Me sentí acompañado en todo momento.',
    name: 'Andrés',
    role: 'Estudiante de Comunión',
  },
]

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="mx-auto grid w-full max-w-6xl items-center gap-10 px-4 py-16 sm:px-6 md:grid-cols-2 md:py-24">
            <div className="flex flex-col items-start gap-6">
              <span className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
                <Heart className="size-3.5 text-accent" />
                Formación católica en línea
              </span>
              <h1 className="text-balance font-serif text-4xl font-semibold leading-tight tracking-tight text-foreground sm:text-5xl">
                Camina en la fe, a tu ritmo y acompañado
              </h1>
              <p className="text-pretty text-lg leading-relaxed text-muted-foreground">
                Prepara los sacramentos de Bautismo, Primera Comunión y
                Confirmación con clases, materiales y catequistas que te guían en
                cada paso.
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <Button size="lg" asChild>
                  <Link href="/registro">Comenzar ahora</Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="#cursos">Ver cursos</Link>
                </Button>
              </div>
              <div className="flex items-center gap-6 pt-2 text-sm text-muted-foreground">
                <span>
                  <strong className="text-foreground">+140</strong> estudiantes
                </span>
                <span>
                  <strong className="text-foreground">3</strong> sacramentos
                </span>
                <span>
                  <strong className="text-foreground">87%</strong> asistencia
                </span>
              </div>
            </div>
            <div className="relative">
              <div className="overflow-hidden rounded-2xl border border-border shadow-lg">
                <Image
                  src="/images/hero-catequesis.png"
                  alt="Biblia abierta y vela junto a un vitral de capilla"
                  width={720}
                  height={560}
                  className="h-full w-full object-cover"
                  priority
                />
              </div>
            </div>
          </div>
        </section>

        {/* Cursos */}
        <section id="cursos" className="bg-secondary/50 py-16 md:py-24">
          <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-balance font-serif text-3xl font-semibold tracking-tight sm:text-4xl">
                Nuestros caminos sacramentales
              </h2>
              <p className="mt-3 text-pretty text-muted-foreground">
                Cada curso está diseñado para acompañarte paso a paso en tu
                preparación.
              </p>
            </div>
            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {cursos.map((c) => (
                <Card
                  key={c.title}
                  className="group overflow-hidden p-0 transition-shadow hover:shadow-lg"
                >
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <Image
                      src={c.img || '/placeholder.svg'}
                      alt={c.title}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="flex flex-col gap-2 p-6">
                    <h3 className="font-serif text-xl font-semibold">
                      {c.title}
                    </h3>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {c.desc}
                    </p>
                    <Link
                      href="/registro"
                      className="mt-2 text-sm font-medium text-primary hover:underline"
                    >
                      Inscribirme &rarr;
                    </Link>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-16 md:py-24">
          <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-balance font-serif text-3xl font-semibold tracking-tight sm:text-4xl">
                Todo lo que necesitas para tu formación
              </h2>
              <p className="mt-3 text-pretty text-muted-foreground">
                Una plataforma completa pensada para estudiantes, catequistas y
                la institución.
              </p>
            </div>
            <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {features.map((f) => (
                <Card key={f.title} className="p-6">
                  <span className="inline-flex size-11 items-center justify-center rounded-lg bg-secondary text-primary">
                    <f.icon className="size-5" />
                  </span>
                  <h3 className="mt-4 font-medium">{f.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    {f.desc}
                  </p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Cómo funciona */}
        <section id="como-funciona" className="bg-primary py-16 text-primary-foreground md:py-24">
          <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-balance font-serif text-3xl font-semibold tracking-tight sm:text-4xl">
                Cómo funciona
              </h2>
              <p className="mt-3 text-pretty text-primary-foreground/80">
                Comenzar tu camino de fe es muy sencillo.
              </p>
            </div>
            <div className="mt-12 grid gap-8 md:grid-cols-3">
              {pasos.map((p) => (
                <div key={p.n} className="flex flex-col gap-3">
                  <span className="font-serif text-4xl font-semibold text-accent">
                    {p.n}
                  </span>
                  <h3 className="text-xl font-medium">{p.title}</h3>
                  <p className="text-pretty leading-relaxed text-primary-foreground/80">
                    {p.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonios */}
        <section id="testimonios" className="py-16 md:py-24">
          <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-balance font-serif text-3xl font-semibold tracking-tight sm:text-4xl">
                Historias de fe
              </h2>
            </div>
            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {testimonios.map((t) => (
                <Card key={t.name} className="flex flex-col gap-4 p-6">
                  <p className="text-pretty leading-relaxed text-foreground">
                    {'"'}
                    {t.quote}
                    {'"'}
                  </p>
                  <div className="mt-auto">
                    <p className="font-medium">{t.name}</p>
                    <p className="text-sm text-muted-foreground">{t.role}</p>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="border-t border-border bg-secondary/50 py-16 md:py-20">
          <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-6 px-4 text-center sm:px-6">
            <h2 className="text-balance font-serif text-3xl font-semibold tracking-tight sm:text-4xl">
              Da el primer paso en tu camino de fe
            </h2>
            <p className="text-pretty text-muted-foreground">
              Inscríbete hoy y comienza tu preparación sacramental con
              acompañamiento personalizado.
            </p>
            <Button size="lg" asChild>
              <Link href="/registro">Crear mi cuenta</Link>
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t border-border bg-background py-10">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6">
          <Logo />
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Catequesis Online. Formación en la
            fe.
          </p>
        </div>
      </footer>
    </div>
  )
}
