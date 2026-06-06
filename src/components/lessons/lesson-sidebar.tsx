"use client";

import Link from "next/link";
import { CheckCircle2, Circle, Lock, PlayCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Module, Lesson } from "@/types/course";
import type { Enrollment } from "@/types/course";

interface LessonSidebarProps {
  modules: Module[];
  lessons: Lesson[];
  currentLessonId: string;
  enrollment: Enrollment;
  courseTitle: string;
}

export function LessonSidebar({ modules, lessons, currentLessonId, enrollment, courseTitle }: LessonSidebarProps) {
  const completed = new Set(enrollment.progress.lessonsCompleted);

  return (
    <aside className="w-full shrink-0 border-r bg-white md:w-72">
      <div className="border-b p-4">
        <p className="text-xs font-medium text-muted-foreground">Curso</p>
        <p className="font-semibold">{courseTitle}</p>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${enrollment.progress.percentComplete}%` }} />
        </div>
        <p className="mt-1 text-xs text-muted-foreground">{enrollment.progress.percentComplete}% completado</p>
      </div>
      <nav className="max-h-[calc(100vh-200px)] overflow-y-auto p-3">
        {modules.map((mod) => {
          const modLessons = lessons.filter((l) => l.moduleId === mod.id).sort((a, b) => a.order - b.order);
          return (
            <div key={mod.id} className="mb-4">
              <p className="mb-2 px-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {mod.title}
              </p>
              {modLessons.map((lesson) => {
                const isCurrent = lesson.id === currentLessonId;
                const isDone = completed.has(lesson.id);
                return (
                  <Link
                    key={lesson.id}
                    href={`/estudiante/lecciones/${lesson.id}`}
                    className={cn(
                      "mb-0.5 flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors",
                      isCurrent ? "bg-primary text-white" : "hover:bg-muted/60"
                    )}
                  >
                    {isDone ? (
                      <CheckCircle2 className={cn("h-4 w-4 shrink-0", isCurrent ? "text-white" : "text-green-500")} />
                    ) : isCurrent ? (
                      <PlayCircle className="h-4 w-4 shrink-0 text-white" />
                    ) : (
                      <Circle className="h-4 w-4 shrink-0 text-muted-foreground" />
                    )}
                    <span className="line-clamp-2 leading-tight">{lesson.title}</span>
                  </Link>
                );
              })}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
