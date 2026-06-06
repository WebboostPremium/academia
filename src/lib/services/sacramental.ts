import { collection, doc, getDoc, getDocs, setDoc, updateDoc, query, where, serverTimestamp, arrayUnion } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { toDate } from "@/lib/firebase/converters";
import type { SacramentalRecord } from "@/types";

const col = collection(db, "sacramental_records");

export async function getSacramentalRecord(userId: string, courseId: string): Promise<SacramentalRecord | null> {
  const snap = await getDocs(query(col, where("userId", "==", userId), where("courseId", "==", courseId)));
  if (snap.empty) return null;
  const d = snap.docs[0];
  const data = d.data();
  return { id: d.id, ...data, updatedAt: toDate(data.updatedAt) } as SacramentalRecord;
}

export async function getSacramentalRecords(courseId?: string): Promise<SacramentalRecord[]> {
  const q = courseId ? query(col, where("courseId", "==", courseId)) : query(col);
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data();
    return { id: d.id, ...data, updatedAt: toDate(data.updatedAt) } as SacramentalRecord;
  });
}

export async function createSacramentalRecord(data: Omit<SacramentalRecord, "id" | "updatedAt" | "observations">): Promise<string> {
  const id = `${data.userId}_${data.courseId}`;
  await setDoc(doc(db, "sacramental_records", id), { ...data, observations: [], updatedAt: serverTimestamp() });
  return id;
}

export async function updateSacramentalStatus(id: string, status: SacramentalRecord["status"]): Promise<void> {
  await updateDoc(doc(db, "sacramental_records", id), { status, updatedAt: serverTimestamp() });
}

export async function updateRequirement(id: string, requirementId: string, completed: boolean, completedBy: string): Promise<void> {
  const snap = await getDoc(doc(db, "sacramental_records", id));
  if (!snap.exists()) return;
  const requirements = (snap.data().requirements ?? []).map((r: { id: string }) =>
    r.id === requirementId ? { ...r, completed, completedAt: completed ? new Date() : null, completedBy: completed ? completedBy : null } : r
  );
  await updateDoc(doc(db, "sacramental_records", id), { requirements, updatedAt: serverTimestamp() });
}

export async function addObservation(id: string, text: string, authorId: string, authorRole: string): Promise<void> {
  await updateDoc(doc(db, "sacramental_records", id), {
    observations: arrayUnion({ text, authorId, authorRole, createdAt: new Date() }),
    updatedAt: serverTimestamp(),
  });
}
