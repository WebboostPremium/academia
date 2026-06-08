import {
  collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc,
  query, where, serverTimestamp, writeBatch,
} from "firebase/firestore";
import { getClientDb } from "@/lib/firebase/client";
import { fsCollection, fsDoc } from "@/lib/firebase/firestore-helpers";
import { toDate } from "@/lib/firebase/converters";
import { getQuizzes, createQuiz, updateQuiz } from "@/lib/services/quizzes";
import type { Course, CourseSlug, Module, Lesson } from "@/types/course";

function mapCourse(id: string, d: Record<string, unknown>): Course {
  return {
    id, slug: d.slug as CourseSlug, title: d.title as string,
    description: d.description as string, shortDescription: d.shortDescription as string,
    imageUrl: d.imageUrl as string, instructor: d.instructor as string,
    instructorBio: d.instructorBio as string | undefined,
    objectives: (d.objectives as string[]) ?? [],
    durationWeeks: d.durationWeeks as number | undefined,
    durationLabel: d.durationLabel as string | undefined,
    price: d.price as number,
    currency: "USD", category: "sacramental", status: d.status as Course["status"],
    finalExamQuizId: d.finalExamQuizId as string | undefined,
    passingScore: (d.passingScore as number) ?? 70,
    moduleOrder: (d.moduleOrder as string[]) ?? [],
    stats: (d.stats as Course["stats"]) ?? { enrollmentCount: 0, completionCount: 0 },
    createdAt: toDate(d.createdAt as never), updatedAt: toDate(d.updatedAt as never),
    publishedAt: d.publishedAt ? toDate(d.publishedAt as never) : undefined,
  };
}

export async function getCourses(status?: Course["status"]): Promise<Course[]> {
  const q = status ? query(fsCollection("courses"), where("status", "==", status)) : query(fsCollection("courses"));
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => mapCourse(d.id, d.data()))
    .sort((a, b) => a.title.localeCompare(b.title, "es"));
}

export async function getPublishedCourses(): Promise<Course[]> {
  return getCourses("published");
}

export async function getCourse(id: string): Promise<Course | null> {
  const snap = await getDoc(fsDoc("courses", id));
  return snap.exists() ? mapCourse(snap.id, snap.data()) : null;
}

export async function getCourseBySlug(slug: string): Promise<Course | null> {
  const snap = await getDocs(query(fsCollection("courses"), where("slug", "==", slug)));
  if (snap.empty) return null;
  const d = snap.docs[0];
  return mapCourse(d.id, d.data());
}

export async function createCourse(data: Omit<Course, "id" | "createdAt" | "updatedAt" | "stats">): Promise<string> {
  const ref = await addDoc(fsCollection("courses"), { ...data, stats: { enrollmentCount: 0, completionCount: 0 }, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
  return ref.id;
}

export async function updateCourse(id: string, data: Partial<Course>): Promise<void> {
  const { id: _, createdAt, ...rest } = data as Course;
  await updateDoc(fsDoc("courses", id), { ...rest, updatedAt: serverTimestamp() });
}

export async function deleteCourse(id: string): Promise<void> {
  await deleteDoc(fsDoc("courses", id));
}

/** Duplica curso completo: módulos, lecciones, quizzes y referencias (examen final, quiz por lección). */
export async function duplicateCourse(sourceCourseId: string): Promise<string> {
  const course = await getCourse(sourceCourseId);
  if (!course) throw new Error("Curso no encontrado");

  const newSlug = `${course.slug}-copia-${Date.now()}`;

  const newCourseId = await createCourse({
    title: `${course.title} (copia)`,
    slug: newSlug,
    description: course.description,
    shortDescription: course.shortDescription,
    imageUrl: course.imageUrl,
    instructor: course.instructor,
    instructorBio: course.instructorBio,
    objectives: course.objectives,
    durationWeeks: course.durationWeeks,
    durationLabel: course.durationLabel,
    price: course.price,
    currency: course.currency,
    category: course.category,
    status: "draft",
    passingScore: course.passingScore,
    moduleOrder: [],
  });

  const [modules, lessons, quizzes] = await Promise.all([
    getModules(sourceCourseId),
    getLessons(sourceCourseId),
    getQuizzes(sourceCourseId),
  ]);

  const quizIdMap = new Map<string, string>();
  for (const quiz of quizzes) {
    const newQuizId = await createQuiz({
      courseId: newCourseId,
      type: quiz.type,
      title: quiz.title,
      description: quiz.description,
      passingScore: quiz.passingScore,
      maxAttempts: quiz.maxAttempts,
      timeLimitMinutes: quiz.timeLimitMinutes,
      questions: quiz.questions,
      shuffleQuestions: quiz.shuffleQuestions,
      shuffleOptions: quiz.shuffleOptions,
      status: "draft",
    });
    quizIdMap.set(quiz.id, newQuizId);
  }

  const moduleIdMap = new Map<string, string>();
  const newModuleOrder: string[] = [];
  for (const mod of [...modules].sort((a, b) => a.order - b.order)) {
    const newModId = await createModule({
      courseId: newCourseId,
      title: mod.title,
      description: mod.description,
      order: mod.order,
      lessonOrder: [],
      status: mod.status,
    });
    moduleIdMap.set(mod.id, newModId);
    newModuleOrder.push(newModId);
  }

  const lessonIdMap = new Map<string, string>();
  for (const lesson of [...lessons].sort((a, b) => a.order - b.order)) {
    const newModuleId = moduleIdMap.get(lesson.moduleId);
    if (!newModuleId) continue;
    const newLessonId = await createLesson({
      courseId: newCourseId,
      moduleId: newModuleId,
      title: lesson.title,
      description: lesson.description,
      order: lesson.order,
      content: lesson.content,
      quizId: lesson.quizId ? quizIdMap.get(lesson.quizId) : undefined,
      estimatedMinutes: lesson.estimatedMinutes,
      status: "draft",
    });
    lessonIdMap.set(lesson.id, newLessonId);
  }

  for (const quiz of quizzes) {
    if (!quiz.lessonId) continue;
    const newQuizId = quizIdMap.get(quiz.id);
    const newLessonId = lessonIdMap.get(quiz.lessonId);
    if (newQuizId && newLessonId) {
      await updateQuiz(newQuizId, { lessonId: newLessonId });
    }
  }

  const updates: Partial<Course> = { moduleOrder: newModuleOrder };
  if (course.finalExamQuizId) {
    const newFinalId = quizIdMap.get(course.finalExamQuizId);
    if (newFinalId) updates.finalExamQuizId = newFinalId;
  }
  await updateCourse(newCourseId, updates);

  return newCourseId;
}

export async function publishCourse(id: string, publish: boolean): Promise<void> {
  await updateDoc(fsDoc("courses", id), {
    status: publish ? "published" : "draft",
    publishedAt: publish ? serverTimestamp() : null,
    updatedAt: serverTimestamp(),
  });
}

export async function getModules(courseId: string): Promise<Module[]> {
  const snap = await getDocs(query(fsCollection("modules"), where("courseId", "==", courseId)));
  return snap.docs.map((d) => {
    const data = d.data();
    return { id: d.id, courseId: data.courseId, title: data.title, description: data.description,
      order: data.order, lessonOrder: data.lessonOrder ?? [], status: data.status,
      createdAt: toDate(data.createdAt), updatedAt: toDate(data.updatedAt) } as Module;
  }).sort((a, b) => a.order - b.order);
}

export async function createModule(data: Omit<Module, "id" | "createdAt" | "updatedAt">): Promise<string> {
  const ref = await addDoc(fsCollection("modules"), { ...data, lessonOrder: [], createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
  const course = await getCourse(data.courseId);
  if (course) {
    await updateDoc(fsDoc("courses", data.courseId), { moduleOrder: [...course.moduleOrder, ref.id], updatedAt: serverTimestamp() });
  }
  return ref.id;
}

export async function updateModule(id: string, data: Partial<Module>): Promise<void> {
  await updateDoc(fsDoc("modules", id), { ...data, updatedAt: serverTimestamp() });
}

export async function deleteModule(id: string, courseId: string): Promise<void> {
  await deleteDoc(fsDoc("modules", id));
  const course = await getCourse(courseId);
  if (course) {
    await updateDoc(fsDoc("courses", courseId), { moduleOrder: course.moduleOrder.filter((m) => m !== id), updatedAt: serverTimestamp() });
  }
}

export async function getLessons(courseId?: string, moduleId?: string): Promise<Lesson[]> {
  let q = query(fsCollection("lessons"));
  if (moduleId) q = query(fsCollection("lessons"), where("moduleId", "==", moduleId));
  else if (courseId) q = query(fsCollection("lessons"), where("courseId", "==", courseId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data();
    return { id: d.id, courseId: data.courseId, moduleId: data.moduleId, title: data.title,
      description: data.description, order: data.order, content: data.content ?? { resources: [] },
      quizId: data.quizId, estimatedMinutes: data.estimatedMinutes ?? 15, status: data.status,
      createdAt: toDate(data.createdAt), updatedAt: toDate(data.updatedAt) } as Lesson;
  }).sort((a, b) => a.order - b.order);
}

export async function getLesson(id: string): Promise<Lesson | null> {
  const snap = await getDoc(fsDoc("lessons", id));
  if (!snap.exists()) return null;
  const data = snap.data();
  return { id: snap.id, courseId: data.courseId, moduleId: data.moduleId, title: data.title,
    description: data.description, order: data.order, content: data.content ?? { resources: [] },
    quizId: data.quizId, estimatedMinutes: data.estimatedMinutes ?? 15, status: data.status,
    createdAt: toDate(data.createdAt), updatedAt: toDate(data.updatedAt) };
}

export async function createLesson(data: Omit<Lesson, "id" | "createdAt" | "updatedAt">): Promise<string> {
  const { quizId, ...rest } = data;
  const payload: Record<string, unknown> = {
    ...rest,
    content: data.content ?? { resources: [] },
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  if (quizId) payload.quizId = quizId;
  const ref = await addDoc(fsCollection("lessons"), payload);
  const modSnap = await getDoc(fsDoc("modules", data.moduleId));
  if (modSnap.exists()) {
    const lessonOrder = [...(modSnap.data().lessonOrder ?? []), ref.id];
    await updateDoc(fsDoc("modules", data.moduleId), { lessonOrder, updatedAt: serverTimestamp() });
  }
  return ref.id;
}

export async function updateLesson(id: string, data: Partial<Lesson>): Promise<void> {
  await updateDoc(fsDoc("lessons", id), { ...data, updatedAt: serverTimestamp() });
}

export async function deleteLesson(id: string, moduleId: string): Promise<void> {
  await deleteDoc(fsDoc("lessons", id));
  const modSnap = await getDoc(fsDoc("modules", moduleId));
  if (modSnap.exists()) {
    const lessonOrder = (modSnap.data().lessonOrder ?? []).filter((l: string) => l !== id);
    await updateDoc(fsDoc("modules", moduleId), { lessonOrder, updatedAt: serverTimestamp() });
  }
}

export async function reorderModules(courseId: string, moduleIds: string[]): Promise<void> {
  const batch = writeBatch(getClientDb());
  moduleIds.forEach((id, i) => batch.update(fsDoc("modules", id), { order: i + 1 }));
  batch.update(fsDoc("courses", courseId), { moduleOrder: moduleIds, updatedAt: serverTimestamp() });
  await batch.commit();
}
