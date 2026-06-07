import { getDocs, addDoc, updateDoc, deleteDoc, query, where, orderBy, serverTimestamp } from "firebase/firestore";
import { fsCollection, fsDoc } from "@/lib/firebase/firestore-helpers";
import { toDate } from "@/lib/firebase/converters";
import type { LiveClass } from "@/types";

export async function getLiveClasses(courseId?: string): Promise<LiveClass[]> {
  const col = fsCollection("live_classes");
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
  const ref = await addDoc(fsCollection("live_classes"), { ...data, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
  return ref.id;
}

export async function updateLiveClass(id: string, data: Partial<LiveClass>): Promise<void> {
  await updateDoc(fsDoc("live_classes", id), { ...data, updatedAt: serverTimestamp() });
}

export async function deleteLiveClass(id: string): Promise<void> {
  await deleteDoc(fsDoc("live_classes", id));
}
