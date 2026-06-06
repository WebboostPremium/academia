import { collection, doc, getDocs, setDoc, query, where, orderBy, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { toDate } from "@/lib/firebase/converters";
import type { Attendance } from "@/types";

const col = collection(db, "attendance");

export async function getAttendance(courseId: string, date?: string): Promise<Attendance[]> {
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
  const snap = await getDocs(query(col, where("userId", "==", userId), where("courseId", "==", courseId), orderBy("date", "desc")));
  return snap.docs.map((d) => {
    const data = d.data();
    return { id: d.id, ...data, createdAt: toDate(data.createdAt), updatedAt: toDate(data.updatedAt) } as Attendance;
  });
}

export async function recordAttendance(data: Omit<Attendance, "id" | "createdAt" | "updatedAt">): Promise<void> {
  const id = `${data.userId}_${data.courseId}_${data.date}`;
  await setDoc(doc(db, "attendance", id), { ...data, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
}
