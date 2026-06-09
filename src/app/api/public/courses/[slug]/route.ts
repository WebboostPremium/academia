import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";

export const dynamic = "force-dynamic";

function mapCourse(id: string, data: FirebaseFirestore.DocumentData) {
  return {
    id,
    slug: data.slug,
    title: data.title,
    description: data.description,
    shortDescription: data.shortDescription,
    imageUrl: data.imageUrl,
    instructor: data.instructor,
    instructorBio: data.instructorBio,
    objectives: data.objectives ?? [],
    durationWeeks: data.durationWeeks,
    durationLabel: data.durationLabel,
    price: data.price,
    currency: "USD",
    category: data.category ?? "sacramental",
    status: data.status,
    passingScore: data.passingScore ?? 70,
    moduleOrder: data.moduleOrder ?? [],
    stats: data.stats ?? { enrollmentCount: 0, completionCount: 0 },
  };
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const db = getAdminDb();
    const snap = await db
      .collection("courses")
      .where("slug", "==", slug)
      .where("status", "==", "published")
      .limit(1)
      .get();

    if (snap.empty) {
      return NextResponse.json({ error: "Programa no encontrado" }, { status: 404 });
    }

    const doc = snap.docs[0];
    const courseId = doc.id;
    const [modsSnap, lessonsSnap] = await Promise.all([
      db.collection("modules").where("courseId", "==", courseId).get(),
      db.collection("lessons").where("courseId", "==", courseId).get(),
    ]);

    const modules = modsSnap.docs
      .map((d) => ({ id: d.id, ...d.data() } as Record<string, unknown>))
      .sort((a, b) => ((a.order as number) ?? 0) - ((b.order as number) ?? 0));

    const lessons = lessonsSnap.docs
      .map((d) => ({ id: d.id, ...d.data() } as Record<string, unknown>))
      .sort((a, b) => ((a.order as number) ?? 0) - ((b.order as number) ?? 0));

    return NextResponse.json({
      course: mapCourse(doc.id, doc.data()),
      modules,
      lessons,
    });
  } catch {
    return NextResponse.json({ error: "Error al cargar el programa" }, { status: 500 });
  }
}
