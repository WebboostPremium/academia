"use client";

import { useEffect, useState } from "react";
import { CourseCardPublic } from "@/components/courses/course-card-public";
import { getPublishedCourses, getModules, getLessons } from "@/lib/services/courses";
import type { Course } from "@/types/course";

export default function CursosPage() {
  const [courses, setCourses] = useState<Array<Course & { moduleCount: number; lessonCount: number }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPublishedCourses().then(async (published) => {
      const enriched = await Promise.all(
        published.map(async (c) => {
          const [mods, lessons] = await Promise.all([
            getModules(c.id).catch(() => []),
            getLessons(c.id).catch(() => []),
          ]);
          return { ...c, moduleCount: mods.length, lessonCount: lessons.length };
        })
      );
      setCourses(enriched);
      setLoading(false);
    });
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
