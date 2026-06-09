"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  BookOpen,
  Video,
  Award,
  Users,
  CheckCircle2,
  Heart,
  Calendar,
  MessageCircleQuestion,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CourseCardPublic } from "@/components/courses/course-card-public";
import { getPublishedCourses, getLessons, getModules } from "@/lib/services/courses";
import { getAllUsers } from "@/lib/services/users";
import { getSettings } from "@/lib/services/settings";
import { ROLES } from "@/lib/constants/roles";
import {
  BENEFITS,
  TESTIMONIALS,
  FAQ_ITEMS,
  PROMO_VIDEO_ID,
  DEFAULT_PROGRAM_STATS,
} from "@/lib/constants/public-content";
import { DESIGN_IMAGES } from "@/lib/constants/design-images";
import type { Course } from "@/types/course";

const FEATURES = [
  { icon: Video, title: "Clases en video", desc: "Lecciones grabadas y encuentros en vivo por Zoom o Meet." },
  { icon: BookOpen, title: "Material descargable", desc: "Recursos en PDF para acompañar cada lección." },
  { icon: CheckCircle2, title: "Evaluaciones", desc: "Quizzes con calificación automática para medir tu avance." },
  { icon: Heart, title: "Oraciones", desc: "Aprende las oraciones esenciales a tu propio ritmo." },
  { icon: Calendar, title: "Asistencia", desc: "Seguimiento de tu participación en cada encuentro." },
  { icon: Award, title: "Certificados", desc: "Recibe tu constancia al completar cada curso." },
  { icon: MessageCircleQuestion, title: "Foro de dudas", desc: "Pregunta a tus catequistas y resuelve tus inquietudes." },
  { icon: Users, title: "Acompañamiento", desc: "Catequistas que guían tu proceso sacramental." },
];

const PASOS = [
  { n: "01", title: "Inscríbete", desc: "Crea tu cuenta y elige el sacramento que vas a preparar." },
  { n: "02", title: "Aprende", desc: "Avanza por los módulos con videos, lecturas y evaluaciones." },
  { n: "03", title: "Recibe el sacramento", desc: "Completa tu formación y obtén tu certificado de participación." },
];

const FALLBACK_COURSES = [
  { slug: "bautismo" as const, title: "Bautismo", desc: "Prepárate para recibir el primer sacramento de iniciación cristiana.", img: DESIGN_IMAGES.bautismo },
  { slug: "primera-comunion" as const, title: "Primera Comunión", desc: "Un camino para encontrarte con Jesús en la Eucaristía.", img: DESIGN_IMAGES.primeraComunion },
  { slug: "confirmacion" as const, title: "Confirmación", desc: "Fortalece tu fe y recibe los dones del Espíritu Santo.", img: DESIGN_IMAGES.confirmacion },
];

export default function HomePage() {
  const [courses, setCourses] = useState<Array<Course & { moduleCount: number; lessonCount: number }>>([]);
  const [stats, setStats] = useState({ programs: 3, students: 0 });
  const [contactEmail, setContactEmail] = useState("contacto@catequesis.online");
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  useEffect(() => {
    async function load() {
      const [published, students, settings] = await Promise.all([
        getPublishedCourses(),
        getAllUsers(ROLES.ESTUDIANTE).catch(() => []),
        getSettings().catch(() => null),
      ]);
      if (settings?.institution?.email) setContactEmail(settings.institution.email);
      setStats((s) => ({ ...s, programs: published.length || 3, students: students.length }));

      const list = published.length ? published : [];
      const enriched = await Promise.all(
        list.map(async (c) => {
          const [mods, lessons] = await Promise.all([
            getModules(c.id).catch(() => []),
            getLessons(c.id).catch(() => []),
          ]);
          return { ...c, moduleCount: mods.length, lessonCount: lessons.length };
        })
      );
      setCourses(enriched);
    }
    load();
  }, []);

  return (
    <main className="flex-1">
      {/* Hero */}
      <section className="relative min-h-[88vh] overflow-hidden">
        <Image
          src={DESIGN_IMAGES.hero}
          alt="Vitral de iglesia católica con luz dorada"
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/85 to-background/50" />
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />

        <div className="relative mx-auto grid w-full max-w-6xl items-center gap-10 px-4 py-20 sm:px-6 md:grid-cols-2 md:py-28">
          <div className="flex flex-col items-start gap-6">
            <span className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs font-medium text-primary">
              <Heart className="size-3.5 text-accent" />
              Academia católica de nuestra parroquia
            </span>
            <h1 className="text-balance font-serif text-4xl font-semibold leading-tight tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              Camina en la fe, a tu ritmo y acompañado
            </h1>
            <p className="text-pretty text-lg leading-relaxed text-muted-foreground">
              Prepara los sacramentos de Bautismo, Primera Comunión y Confirmación con la guía
              de catequistas de la Iglesia Católica, desde cualquier lugar.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Button size="lg" asChild>
                <Link href="/registro">Comenzar ahora</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="#cursos">Ver sacramentos</Link>
              </Button>
            </div>
            <div className="flex flex-wrap items-center gap-6 pt-2 text-sm text-muted-foreground">
              <span>
                <strong className="text-foreground">+{stats.students || 140}</strong> familias formadas
              </span>
              <span>
                <strong className="text-foreground">{stats.programs}</strong> sacramentos
              </span>
              <span>
                <strong className="text-foreground">24/7</strong> acceso
              </span>
            </div>
          </div>
          <div className="relative hidden md:block">
            <div className="overflow-hidden rounded-2xl border border-border/60 shadow-2xl ring-1 ring-accent/20">
              <Image
                src={DESIGN_IMAGES.eucharist}
                alt="Velas encendidas en el altar de una iglesia católica"
                width={640}
                height={480}
                className="h-full w-full object-cover"
              />
            </div>
            <p className="mt-4 text-center font-serif text-sm italic text-muted-foreground">
              &ldquo;Esto es mi Cuerpo, que será entregado por vosotros&rdquo; — Lc 22:19
            </p>
          </div>
        </div>
      </section>

      {/* Misión */}
      <section className="border-y border-border bg-secondary/40 py-16 md:py-20">
        <div className="mx-auto grid w-full max-w-6xl items-center gap-10 px-4 sm:px-6 md:grid-cols-2">
          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl shadow-lg">
            <Image
              src={DESIGN_IMAGES.mission}
              alt="Interior de catedral católica"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </div>
          <div className="space-y-4">
            <h2 className="font-serif text-3xl font-semibold tracking-tight sm:text-4xl">
              Formación en la tradición de la Iglesia
            </h2>
            <p className="leading-relaxed text-muted-foreground">
              Catequi Online es la plataforma de catequesis de nuestra comunidad parroquial.
              Acompañamos a familias y jóvenes en la preparación de los sacramentos con contenido
              fiel a la doctrina católica, materiales litúrgicos y el seguimiento de catequistas
              comprometidos con la misión evangelizadora.
            </p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-accent" />
                Catequesis sacramental: Bautismo, Primera Comunión y Confirmación
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-accent" />
                Oraciones, liturgia y vida de fe integradas al programa
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-accent" />
                Acompañamiento personal de catequistas de la parroquia
              </li>
            </ul>
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
              Cada curso está diseñado para acompañarte paso a paso en tu preparación.
            </p>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {courses.length > 0 ? (
              courses.map((c) => (
                <CourseCardPublic key={c.id} course={c} moduleCount={c.moduleCount} lessonCount={c.lessonCount} />
              ))
            ) : (
              FALLBACK_COURSES.map((c, i) => {
                const programStats = DEFAULT_PROGRAM_STATS[c.slug];
                return (
                  <CourseCardPublic
                    key={c.slug}
                    course={{
                      id: c.slug,
                      slug: c.slug,
                      title: c.title,
                      description: c.desc,
                      shortDescription: c.desc,
                      imageUrl: c.img,
                      instructor: "",
                      price: programStats.price,
                      currency: "USD",
                      category: "sacramental",
                      status: "published",
                      passingScore: 70,
                      objectives: [],
                      durationWeeks: [4, 8, 10][i],
                      durationLabel: ["4 semanas", "8 semanas", "10 semanas"][i],
                      moduleOrder: [],
                      stats: { enrollmentCount: 0, completionCount: 0 },
                      createdAt: new Date(),
                      updatedAt: new Date(),
                    }}
                    moduleCount={programStats.modules}
                    lessonCount={programStats.lessons}
                  />
                );
              })
            )}
          </div>
        </div>
      </section>

      {/* Video */}
      <section className="py-16 md:py-20">
        <div className="mx-auto w-full max-w-4xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-serif text-3xl font-semibold tracking-tight sm:text-4xl">
              Conoce nuestra plataforma
            </h2>
            <p className="mt-3 text-muted-foreground">Mira cómo funciona Catequesis Online</p>
          </div>
          <div className="relative mt-10 aspect-video overflow-hidden rounded-2xl border border-border shadow-lg">
            <iframe
              src={`https://www.youtube.com/embed/${PROMO_VIDEO_ID}?rel=0`}
              title="Video promocional"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="absolute inset-0 h-full w-full"
            />
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-secondary/30 py-16 md:py-24">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-balance font-serif text-3xl font-semibold tracking-tight sm:text-4xl">
              Todo lo que necesitas para tu formación
            </h2>
            <p className="mt-3 text-pretty text-muted-foreground">
              Una plataforma completa pensada para estudiantes, catequistas y la institución.
            </p>
          </div>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f) => (
              <Card key={f.title} className="p-6">
                <span className="inline-flex size-11 items-center justify-center rounded-lg bg-secondary text-primary">
                  <f.icon className="size-5" />
                </span>
                <h3 className="mt-4 font-medium">{f.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Beneficios */}
      <section className="py-16 md:py-20">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-serif text-3xl font-semibold tracking-tight sm:text-4xl">
              ¿Por qué elegirnos?
            </h2>
          </div>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {BENEFITS.map((b) => (
              <Card key={b.title} className="p-6">
                <CheckCircle2 className="size-5 text-accent" />
                <h3 className="mt-3 font-medium">{b.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{b.desc}</p>
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
            {PASOS.map((p) => (
              <div key={p.n} className="flex flex-col gap-3">
                <span className="font-serif text-4xl font-semibold text-accent">{p.n}</span>
                <h3 className="text-xl font-medium">{p.title}</h3>
                <p className="text-pretty leading-relaxed text-primary-foreground/80">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonios */}
      <section id="testimonios" className="relative py-16 md:py-24">
        <div className="absolute inset-0 -z-10 opacity-[0.07]">
          <Image src={DESIGN_IMAGES.faith} alt="" fill className="object-cover" aria-hidden />
        </div>
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-balance font-serif text-3xl font-semibold tracking-tight sm:text-4xl">
              Historias de fe en nuestra comunidad
            </h2>
            <p className="mt-3 text-muted-foreground">
              Familias que han vivido su preparación sacramental con nosotros
            </p>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {TESTIMONIALS.map((t) => (
              <Card key={t.name} className="flex flex-col gap-4 border-accent/20 p-6 shadow-sm">
                <p className="text-pretty leading-relaxed text-foreground">&ldquo;{t.text}&rdquo;</p>
                <div className="mt-auto border-t border-border pt-4">
                  <p className="font-medium">{t.name}</p>
                  <p className="text-sm text-muted-foreground">{t.course}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Preguntas y respuestas */}
      <section id="faq" className="bg-secondary/30 py-16 md:py-20">
        <div className="mx-auto w-full max-w-3xl px-4 sm:px-6">
          <h2 className="text-center font-serif text-3xl font-semibold tracking-tight sm:text-4xl">
            Preguntas y respuestas
          </h2>
          <div className="mt-8 space-y-3">
            {FAQ_ITEMS.map((item, i) => (
              <Card key={item.q} className="overflow-hidden">
                <button
                  type="button"
                  className="flex w-full items-center justify-between px-5 py-4 text-left font-medium"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  {item.q}
                  <ChevronDown className={`size-5 shrink-0 transition-transform ${openFaq === i ? "rotate-180" : ""}`} />
                </button>
                {openFaq === i && (
                  <p className="border-t border-border px-5 py-4 text-sm leading-relaxed text-muted-foreground">
                    {item.a}
                  </p>
                )}
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Contacto */}
      <section id="contacto" className="py-16 md:py-20">
        <div className="mx-auto w-full max-w-3xl px-4 text-center sm:px-6">
          <h2 className="font-serif text-3xl font-semibold tracking-tight sm:text-4xl">
            ¿Tienes preguntas?
          </h2>
          <p className="mt-3 text-muted-foreground">Estamos aquí para acompañarte en tu camino de fe</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button size="lg" asChild>
              <Link href="/contacto">Formulario de contacto</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <a href={`mailto:${contactEmail}`}>Enviar correo</a>
            </Button>
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
            Inscríbete hoy y comienza tu preparación sacramental con acompañamiento personalizado.
          </p>
          <Button size="lg" asChild>
            <Link href="/registro">Crear mi cuenta</Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
