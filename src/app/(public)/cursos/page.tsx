"use client";

import { useEffect, useState } from "react";
import { CourseCardPublic } from "@/components/courses/course-card-public";
import { DEFAULT_PROGRAM_STATS } from "@/lib/constants/public-content";
import { DESIGN_IMAGES } from "@/lib/constants/design-images";
import type { Course } from "@/types/course";

const FALLBACK = [
  { slug: "bautismo" as const, title: "Bautismo", desc: "Prepárate para recibir el primer sacramento de iniciación cristiana.", img: DESIGN_IMAGES.bautismo },
  { slug: "primera-comunion" as const, title: "Primera Comunión", desc: "Un camino para encontrarte con Jesús en la Eucaristía.", img: DESIGN_IMAGES.primeraComunion },
  { slug: "confirmacion" as const, title: "Confirmación", desc: "Fortalece tu fe y recibe los dones del Espíritu Santo.", img: DESIGN_IMAGES.confirmacion },
];

export default function CursosPage() {
  const [courses, setCourses] = useState<Array<Course & { moduleCount: number; lessonCount: number }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/public/courses")
      .then((r) => r.json())
      .then((data) => {
        const list = (data.courses ?? []) as Array<Course & { moduleCount: number; lessonCount: number }>;
        if (list.length > 0) {
          setCourses(list.map((c) => ({ ...c, createdAt: new Date(), updatedAt: new Date() })));
        } else {
          setCourses(
            FALLBACK.map((c, i) => {
              const stats = DEFAULT_PROGRAM_STATS[c.slug];
              return {
                id: c.slug,
                slug: c.slug,
                title: c.title,
                description: c.desc,
                shortDescription: c.desc,
                imageUrl: c.img,
                instructor: "",
                price: stats.price,
                currency: "USD" as const,
                category: "sacramental" as const,
                status: "published" as const,
                passingScore: 70,
                objectives: [],
                durationWeeks: [4, 8, 10][i],
                durationLabel: ["4 semanas", "8 semanas", "10 semanas"][i],
                moduleOrder: [],
                stats: { enrollmentCount: 0, completionCount: 0 },
                createdAt: new Date(),
                updatedAt: new Date(),
                moduleCount: stats.modules,
                lessonCount: stats.lessons,
              };
            })
          );
        }
      })
      .catch(() => setCourses([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="mx-auto max-w-7xl px-4 py-16 lg:px-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold">Nuestros Programas</h1>
        <p className="mt-2 text-muted-foreground">
          Preparación sacramental para Bautismo, Primera Comunión y Confirmación
        </p>
      </div>
      {loading ? (
        <p className="mt-10 text-center text-muted-foreground">Cargando programas...</p>
      ) : courses.length === 0 ? (
        <p className="mt-10 text-center text-muted-foreground">No hay programas publicados aún.</p>
      ) : (
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {courses.map((c) => (
            <CourseCardPublic key={c.id} course={c} moduleCount={c.moduleCount} lessonCount={c.lessonCount} />
          ))}
        </div>
      )}
    </main>
  );
}
