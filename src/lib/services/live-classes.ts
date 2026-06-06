import { collection, doc, getDocs, addDoc, updateDoc, deleteDoc, query, where, orderBy, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { toDate } from "@/lib/firebase/converters";
import type { LiveClass } from "@/types";

const col = collection(db, "live_classes");

export async function getLiveClasses(courseId?: string): Promise<LiveClass[]> {
  const q = courseId
    ? query(col, where("courseId", "==", courseId), orderBy("scheduledAt", "asc"))
    : query(col, orderBy("scheduledAt", "asc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data();
    return { id: d.id, ...data, scheduledAt: toDate(data.scheduledAt), createdAt: toDate(data.createdAt), updatedAt: toDate(data.updatedAt) } as LiveClass;
  });
}

export async function getUpcomingClasses(courseId?: string): Promise<LiveClass[]> {
  const classes = await getLiveClasses(courseId);
  const now = new Date();
  return classes.filter((c) => c.status === "scheduled" && c.scheduledAt > now);
}

export async function createLiveClass(data: Omit<LiveClass, "id" | "createdAt" | "updatedAt">): Promise<string> {
  const ref = await addDoc(col, { ...data, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
  return ref.id;
}

export async function updateLiveClass(id: string, data: Partial<LiveClass>): Promise<void> {
  await updateDoc(doc(db, "live_classes", id), { ...data, updatedAt: serverTimestamp() });
}

export async function deleteLiveClass(id: string): Promise<void> {
  await deleteDoc(doc(db, "live_classes", id));
}
