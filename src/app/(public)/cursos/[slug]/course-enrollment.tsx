"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { BookOpen, Clock, User, CheckCircle2, PlayCircle } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { WompiCheckout } from "@/components/payments/wompi-checkout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DEFAULT_COURSE_META } from "@/lib/constants/public-content";
import { formatCurrency } from "@/lib/utils/format";
import type { Course, CourseSlug, Module, Lesson } from "@/types/course";

export function CourseEnrollment({ slug }: { slug: string }) {
  const { user } = useAuth();
  const [course, setCourse] = useState<Course | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/public/courses/${slug}`);
        if (res.status === 404) {
          setNotFound(true);
          return;
        }
        if (!res.ok) throw new Error("Error al cargar");
        const data = await res.json();
        setCourse({
          ...data.course,
          createdAt: new Date(),
          updatedAt: new Date(),
        } as Course);
        setModules(
          (data.modules as Array<Record<string, unknown>>).map((m) => ({
            id: m.id as string,
            courseId: m.courseId as string,
            title: m.title as string,
            description: (m.description as string) ?? "",
            order: (m.order as number) ?? 0,
            lessonOrder: (m.lessonOrder as string[]) ?? [],
            status: (m.status as Module["status"]) ?? "published",
            createdAt: new Date(),
            updatedAt: new Date(),
          }))
        );
        setLessons(
          (data.lessons as Array<Record<string, unknown>>).map((l) => ({
            id: l.id as string,
            courseId: l.courseId as string,
            moduleId: l.moduleId as string,
            title: l.title as string,
            description: l.description as string | undefined,
            order: (l.order as number) ?? 0,
            content: (l.content as Lesson["content"]) ?? { resources: [] },
            quizId: l.quizId as string | undefined,
            estimatedMinutes: (l.estimatedMinutes as number) ?? 0,
            status: (l.status as Lesson["status"]) ?? "published",
            createdAt: new Date(),
            updatedAt: new Date(),
          }))
        );
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [slug]);

  if (loading) {
    return <p className="py-20 text-center text-muted-foreground">Cargando programa...</p>;
  }

  if (notFound || !course) {
    return (
      <div className="py-20 text-center">
        <p className="text-muted-foreground">Programa no encontrado</p>
        <Button asChild className="mt-4"><Link href="/cursos">Ver todos los programas</Link></Button>
      </div>
    );
  }

  const meta = DEFAULT_COURSE_META[course.slug as CourseSlug];
  const image = course.imageUrl || meta?.image;
  const objectives = course.objectives?.length ? course.objectives : meta?.objectives ?? [];
  const duration = course.durationLabel || meta?.duration || "Flexible";
  const instructorBio = course.instructorBio || meta?.instructorBio;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 lg:px-8">
      <div className="grid gap-10 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-8">
          <div className="relative h-64 overflow-hidden rounded-3xl md:h-80">
            <Image src={image} alt={course.title} fill className="object-cover" unoptimized />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute bottom-6 left-6 text-white">
              <h1 className="text-3xl font-bold md:text-4xl">{course.title}</h1>
              <p className="mt-1 text-white/90">{course.shortDescription || course.description}</p>
            </div>
          </div>

          <section>
            <h2 className="text-xl font-bold">Descripción</h2>
            <p className="mt-3 leading-relaxed text-muted-foreground">{course.description}</p>
          </section>

          {objectives.length > 0 && (
            <section>
              <h2 className="text-xl font-bold">Objetivos del programa</h2>
              <ul className="mt-4 space-y-2">
                {objectives.map((obj) => (
                  <li key={obj} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    {obj}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section>
            <h2 className="text-xl font-bold">Temario</h2>
            {modules.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">El temario se publicará próximamente.</p>
            ) : (
              <div className="mt-4 space-y-4">
                {modules.map((mod) => {
                  const modLessons = lessons.filter((l) => l.moduleId === mod.id).sort((a, b) => a.order - b.order);
                  return (
                    <Card key={mod.id} className="rounded-xl">
                      <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-base">
                          <BookOpen className="h-4 w-4 text-primary" />
                          {mod.title}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-1">
                          {modLessons.map((l) => (
                            <li key={l.id} className="flex items-center gap-2 text-sm text-muted-foreground">
                              <PlayCircle className="h-3.5 w-3.5" />
                              {l.title}
                            </li>
                          ))}
                          {modLessons.length === 0 && (
                            <li className="text-sm text-muted-foreground">Lecciones por publicar</li>
                          )}
                        </ul>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </section>

          {course.instructor && (
            <section>
              <h2 className="text-xl font-bold">Instructor</h2>
              <div className="mt-4 flex items-start gap-4 rounded-xl border p-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <User className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-semibold">{course.instructor}</p>
                  {instructorBio && <p className="mt-1 text-sm text-muted-foreground">{instructorBio}</p>}
                </div>
              </div>
            </section>
          )}
        </div>

        <div>
          <Card className="card-shadow sticky top-24 rounded-2xl">
            <CardHeader>
              <CardTitle>Inscríbete ahora</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-3xl font-bold text-primary">{formatCurrency(course.price)}</p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary" className="gap-1">
                  <Clock className="h-3 w-3" />{duration}
                </Badge>
                <Badge variant="secondary" className="gap-1">
                  <BookOpen className="h-3 w-3" />{modules.length} módulos
                </Badge>
                <Badge variant="secondary" className="gap-1">
                  <PlayCircle className="h-3 w-3" />{lessons.length} lecciones
                </Badge>
              </div>
              {user ? (
                <WompiCheckout courseId={course.id} courseTitle={course.title} price={course.price} />
              ) : (
                <>
                  <p className="text-sm text-muted-foreground">
                    Crea tu cuenta o inicia sesión para comprar y comenzar tu preparación.
                  </p>
                  <Button asChild className="w-full rounded-full">
                    <Link href={`/registro?redirect=/cursos/${slug}`}>Registrarse y comprar</Link>
                  </Button>
                  <Button asChild variant="outline" className="w-full rounded-full">
                    <Link href={`/login?redirect=/cursos/${slug}`}>Ya tengo cuenta</Link>
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
