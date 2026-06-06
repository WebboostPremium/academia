import { collection, doc, getDoc, getDocs, setDoc, updateDoc, query, where, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { toDate } from "@/lib/firebase/converters";
import type { Enrollment } from "@/types/course";

const col = collection(db, "enrollments");

function mapEnrollment(id: string, d: Record<string, unknown>): Enrollment {
  const p = d.progress as Enrollment["progress"];
  return {
    id, userId: d.userId as string, courseId: d.courseId as string,
    paymentId: d.paymentId as string | undefined, status: d.status as Enrollment["status"],
    enrolledAt: toDate(d.enrolledAt as never),
    completedAt: d.completedAt ? toDate(d.completedAt as never) : undefined,
    progress: { ...p, lastActivityAt: toDate(p?.lastActivityAt as never) },
  };
}

export async function getEnrollment(userId: string, courseId: string): Promise<Enrollment | null> {
  const snap = await getDocs(query(col, where("userId", "==", userId), where("courseId", "==", courseId)));
  if (snap.empty) return null;
  const d = snap.docs[0];
  return mapEnrollment(d.id, d.data());
}

export async function getUserEnrollments(userId: string): Promise<Enrollment[]> {
  const snap = await getDocs(query(col, where("userId", "==", userId)));
  return snap.docs.map((d) => mapEnrollment(d.id, d.data()));
}

export async function getCourseEnrollments(courseId: string): Promise<Enrollment[]> {
  const snap = await getDocs(query(col, where("courseId", "==", courseId)));
  return snap.docs.map((d) => mapEnrollment(d.id, d.data()));
}

export async function createEnrollment(userId: string, courseId: string, paymentId?: string): Promise<string> {
  const id = `${userId}_${courseId}`;
  await setDoc(doc(db, "enrollments", id), {
    userId, courseId, paymentId: paymentId ?? null, status: "active",
    enrolledAt: serverTimestamp(),
    progress: { percentComplete: 0, modulesCompleted: [], lessonsCompleted: [], quizzesPassed: [],
      finalExamPassed: false, averageScore: 0, lastActivityAt: serverTimestamp() },
  });
  return id;
}

export async function updateEnrollmentProgress(id: string, progress: Partial<Enrollment["progress"]>): Promise<void> {
  await updateDoc(doc(db, "enrollments", id), { progress: { ...progress, lastActivityAt: serverTimestamp() } });
}

export async function markLessonComplete(enrollmentId: string, lessonId: string, totalLessons: number, current: Enrollment): Promise<void> {
  const lessonsCompleted = [...new Set([...current.progress.lessonsCompleted, lessonId])];
  const percent = Math.round((lessonsCompleted.length / totalLessons) * 60);
  await updateEnrollmentProgress(enrollmentId, { lessonsCompleted, percentComplete: Math.min(percent, 100), lastLessonId: lessonId });
}

export async function resetEnrollmentProgress(id: string): Promise<void> {
  await updateDoc(doc(db, "enrollments", id), {
    progress: { percentComplete: 0, modulesCompleted: [], lessonsCompleted: [], quizzesPassed: [],
      finalExamPassed: false, averageScore: 0, lastActivityAt: serverTimestamp() },
    status: "active", completedAt: null,
  });
}

export async function hasAccess(userId: string, courseId: string): Promise<boolean> {
  const e = await getEnrollment(userId, courseId);
  return e?.status === "active" || e?.status === "completed";
}
