import { getDocs, addDoc, updateDoc, deleteDoc, query, where, orderBy, serverTimestamp } from "firebase/firestore";
import { fsCollection, fsDoc } from "@/lib/firebase/firestore-helpers";
import { toDate } from "@/lib/firebase/converters";
import type { Assignment, Submission } from "@/types";

export async function getAssignments(courseId?: string): Promise<Assignment[]> {
  const q = courseId ? query(fsCollection("assignments"), where("courseId", "==", courseId)) : query(fsCollection("assignments"));
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => {
      const data = d.data();
      return { id: d.id, ...data, dueDate: toDate(data.dueDate), createdAt: toDate(data.createdAt), updatedAt: toDate(data.updatedAt) } as Assignment;
    })
    .sort((a, b) => b.dueDate.getTime() - a.dueDate.getTime());
}

export async function createAssignment(data: Omit<Assignment, "id" | "createdAt" | "updatedAt">): Promise<string> {
  const ref = await addDoc(fsCollection("assignments"), { ...data, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
  return ref.id;
}

export async function updateAssignment(id: string, data: Partial<Assignment>): Promise<void> {
  await updateDoc(fsDoc("assignments", id), { ...data, updatedAt: serverTimestamp() });
}

export async function deleteAssignment(id: string): Promise<void> {
  await deleteDoc(fsDoc("assignments", id));
}

export async function getSubmissions(filters?: { assignmentId?: string; userId?: string; status?: Submission["status"] }): Promise<Submission[]> {
  let q = query(fsCollection("submissions"), orderBy("submittedAt", "desc"));
  if (filters?.assignmentId) q = query(fsCollection("submissions"), where("assignmentId", "==", filters.assignmentId), orderBy("submittedAt", "desc"));
  if (filters?.userId) q = query(fsCollection("submissions"), where("userId", "==", filters.userId), orderBy("submittedAt", "desc"));
  const snap = await getDocs(q);
  let results = snap.docs.map((d) => {
    const data = d.data();
    return { id: d.id, ...data, submittedAt: toDate(data.submittedAt), gradedAt: data.gradedAt ? toDate(data.gradedAt) : undefined } as Submission;
  });
  if (filters?.status) results = results.filter((s) => s.status === filters.status);
  return results;
}

export async function createSubmission(data: Omit<Submission, "id" | "submittedAt" | "gradedAt">): Promise<string> {
  const ref = await addDoc(fsCollection("submissions"), { ...data, status: "pending", submittedAt: serverTimestamp() });
  return ref.id;
}

export async function gradeSubmission(id: string, score: number, feedback: string, gradedBy: string): Promise<void> {
  await updateDoc(fsDoc("submissions", id), { score, feedback, gradedBy, status: "graded", gradedAt: serverTimestamp() });
}
