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

export async function GET() {
  try {
    const db = getAdminDb();
    const snap = await db.collection("courses").where("status", "==", "published").get();
    const courses = await Promise.all(
      snap.docs.map(async (doc) => {
        const [mods, lessons] = await Promise.all([
          db.collection("modules").where("courseId", "==", doc.id).get(),
          db.collection("lessons").where("courseId", "==", doc.id).get(),
        ]);
        return {
          ...mapCourse(doc.id, doc.data()),
          moduleCount: mods.size,
          lessonCount: lessons.size,
        };
      })
    );
    courses.sort((a, b) => String(a.title).localeCompare(String(b.title), "es"));
    return NextResponse.json({ courses });
  } catch {
    return NextResponse.json({ courses: [] });
  }
}
