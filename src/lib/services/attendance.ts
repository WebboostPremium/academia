import { getDocs, setDoc, query, where, orderBy, serverTimestamp } from "firebase/firestore";
import { fsCollection, fsDoc } from "@/lib/firebase/firestore-helpers";
import { toDate } from "@/lib/firebase/converters";
import type { Attendance } from "@/types";

export async function getAttendance(courseId: string, date?: string): Promise<Attendance[]> {
  const col = fsCollection("attendance");
  let q = query(col, where("courseId", "==", courseId));
  if (date) q = query(col, where("courseId", "==", courseId), where("date", "==", date));
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => {
      const data = d.data();
      return { id: d.id, ...data, createdAt: toDate(data.createdAt), updatedAt: toDate(data.updatedAt) } as Attendance;
    })
    .sort((a, b) => String(b.date).localeCompare(String(a.date)));
}

export async function getUserAttendance(userId: string, courseId: string): Promise<Attendance[]> {
  const snap = await getDocs(query(fsCollection("attendance"), where("userId", "==", userId), where("courseId", "==", courseId), orderBy("date", "desc")));
  return snap.docs.map((d) => {
    const data = d.data();
    return { id: d.id, ...data, createdAt: toDate(data.createdAt), updatedAt: toDate(data.updatedAt) } as Attendance;
  });
}

export async function recordAttendance(data: Omit<Attendance, "id" | "createdAt" | "updatedAt">): Promise<void> {
  const id = `${data.userId}_${data.courseId}_${data.date}`;
  await setDoc(fsDoc("attendance", id), { ...data, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
}
