import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";
import { DEFAULT_COURSE_META, DEFAULT_PROGRAM_STATS } from "@/lib/constants/public-content";
import type { CourseSlug } from "@/types/course";

const COURSES = [
  { slug: "bautismo" as CourseSlug, title: "Bautismo", shortDescription: "Preparación para el sacramento del Bautismo", description: "Programa completo de catequesis para el Bautismo. Ideal para padres, padrinos y familias que preparan el bautismo de sus hijos.", instructor: "P. Juan García", price: 2500, passingScore: 70 },
  { slug: "primera-comunion" as CourseSlug, title: "Primera Comunión", shortDescription: "Camino hacia la Eucaristía", description: "Preparación sacramental para la Primera Comunión. Un camino de fe, oración y conocimiento de la Eucaristía.", instructor: "Catequista María López", price: 3500, passingScore: 70 },
  { slug: "confirmacion" as CourseSlug, title: "Confirmación", shortDescription: "Fortalecimiento en la fe", description: "Programa de Confirmación para jóvenes y adultos. Profundiza en los dones del Espíritu Santo.", instructor: "P. Carlos Méndez", price: 4000, passingScore: 75 },
];

const PRAYERS = [
  { slug: "padre-nuestro", title: "Padre Nuestro", order: 1, text: "Padre nuestro, que estás en el cielo, santificado sea tu Nombre..." },
  { slug: "ave-maria", title: "Ave María", order: 2, text: "Dios te salve, María, llena eres de gracia, el Señor es contigo..." },
  { slug: "gloria", title: "Gloria", order: 3, text: "Gloria al Padre, al Hijo y al Espíritu Santo..." },
  { slug: "credo", title: "Credo", order: 4, text: "Creo en Dios, Padre todopoderoso, Creador del cielo y de la tierra..." },
  { slug: "salve", title: "Salve", order: 5, text: "Dios te salve, Reina y Madre de misericordia..." },
];

export async function POST() {
  if (process.env.NODE_ENV === "production" && !process.env.ALLOW_SEED) {
    return NextResponse.json({ error: "Seed deshabilitado en producción" }, { status: 403 });
  }

  const db = getAdminDb();
  const batch = db.batch();

  for (const course of COURSES) {
    const ref = db.collection("courses").doc(course.slug);
    const meta = DEFAULT_COURSE_META[course.slug];
    batch.set(ref, {
      ...course,
      imageUrl: meta.image,
      instructorBio: meta.instructorBio,
      objectives: meta.objectives,
      durationWeeks: meta.durationWeeks,
      durationLabel: meta.duration,
      currency: "USD", category: "sacramental",
      status: "published", moduleOrder: [], stats: { enrollmentCount: 0, completionCount: 0 },
      createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp(),
      publishedAt: FieldValue.serverTimestamp(),
    }, { merge: true });
  }

  for (const prayer of PRAYERS) {
    const ref = db.collection("prayers").doc(prayer.slug);
    batch.set(ref, prayer, { merge: true });
  }

  batch.set(db.collection("settings").doc("global"), {
    institution: { name: "Catequesis Online", logoUrl: "", email: "contacto@catequesis.online", social: {} },
    branding: { primaryColor: "#2563eb", secondaryColor: "#1e40af", accentColor: "#3b82f6" },
    wompi: { publicKey: "", environment: "sandbox", connectionStatus: "disconnected" },
    certificates: { signatureName: "Director Catequético", signatureTitle: "Catequesis Online" },
    email: { fromName: "Catequesis Online", fromEmail: "noreply@catequesis.online" },
    updatedAt: FieldValue.serverTimestamp(), updatedBy: "seed",
  }, { merge: true });

  await batch.commit();

  let modulesCreated = 0;
  let lessonsCreated = 0;

  for (const course of COURSES) {
    const stats = DEFAULT_PROGRAM_STATS[course.slug];
    const moduleIds: string[] = [];

    for (let m = 1; m <= Math.min(stats.modules, 5); m++) {
      const modRef = db.collection("modules").doc(`${course.slug}_mod_${m}`);
      await modRef.set({
        courseId: course.slug,
        title: `Módulo ${m}: ${["Fundamentos", "Doctrina", "Oración", "Vida sacramental", "Preparación final"][m - 1]}`,
        description: `Contenido del módulo ${m}`,
        order: m,
        lessonOrder: [],
        status: "active",
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      }, { merge: true });
      moduleIds.push(modRef.id);
      modulesCreated++;

      const lessonsPerModule = Math.ceil(stats.lessons / Math.min(stats.modules, 5));
      const lessonIds: string[] = [];
      for (let l = 1; l <= Math.min(lessonsPerModule, 6); l++) {
        const lessonRef = db.collection("lessons").doc(`${course.slug}_mod_${m}_les_${l}`);
        await lessonRef.set({
          courseId: course.slug,
          moduleId: modRef.id,
          title: `Lección ${m}.${l}`,
          description: `Contenido de la lección ${m}.${l} del programa ${course.title}`,
          order: l,
          content: { video: { youtubeId: "dQw4w9WgXcQ" }, resources: [] },
          estimatedMinutes: 15,
          status: "published",
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        }, { merge: true });
        lessonIds.push(lessonRef.id);
        lessonsCreated++;
      }
      await modRef.update({ lessonOrder: lessonIds, updatedAt: FieldValue.serverTimestamp() });
    }

    await db.collection("courses").doc(course.slug).update({
      moduleOrder: moduleIds,
      updatedAt: FieldValue.serverTimestamp(),
    });
  }

  return NextResponse.json({
    success: true,
    courses: COURSES.length,
    prayers: PRAYERS.length,
    modules: modulesCreated,
    lessons: lessonsCreated,
  });
}
