import Link from "next/link";
import Image from "next/image";
import { BookOpen, PlayCircle, Award } from "lucide-react";
import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils/format";
import type { Course } from "@/types/course";
import { DESIGN_IMAGES } from "@/lib/constants/design-images";

const DEFAULT_IMAGES: Record<string, string> = {
  bautismo: DESIGN_IMAGES.bautismo,
  "primera-comunion": DESIGN_IMAGES.primeraComunion,
  confirmacion: DESIGN_IMAGES.confirmacion,
};

interface CourseCardPublicProps {
  course: Course;
  moduleCount?: number;
  lessonCount?: number;
}

export function CourseCardPublic({ course, moduleCount = 0, lessonCount = 0 }: CourseCardPublicProps) {
  const img = course.imageUrl || DEFAULT_IMAGES[course.slug] || DESIGN_IMAGES.bautismo;

  return (
    <Card className="group overflow-hidden p-0 transition-shadow hover:shadow-lg">
      <div className="relative aspect-[4/3] overflow-hidden">
        <Image
          src={img}
          alt={course.title}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          unoptimized
        />
        <span className="absolute bottom-3 left-3 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
          {formatCurrency(course.price)}
        </span>
      </div>
      <div className="flex flex-col gap-2 p-6">
        <h3 className="font-serif text-xl font-semibold">{course.title}</h3>
        <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
          {course.shortDescription || course.description}
        </p>
        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <BookOpen className="size-3.5" />
            {moduleCount || course.moduleOrder.length} módulos
          </span>
          <span className="flex items-center gap-1">
            <PlayCircle className="size-3.5" />
            {lessonCount} lecciones
          </span>
          <span className="flex items-center gap-1">
            <Award className="size-3.5" />
            Certificado
          </span>
        </div>
        <Link
          href={`/cursos/${course.slug}`}
          className="mt-2 text-sm font-medium text-primary hover:underline"
        >
          Ver programa &rarr;
        </Link>
      </div>
    </Card>
  );
}
