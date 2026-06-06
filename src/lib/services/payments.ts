import { collection, doc, getDocs, addDoc, updateDoc, query, where, orderBy, serverTimestamp, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { toDate } from "@/lib/firebase/converters";
import type { Payment } from "@/types";

const col = collection(db, "payments");

function mapPayment(id: string, d: Record<string, unknown>): Payment {
  return {
    id, userId: d.userId as string, courseId: d.courseId as string,
    amount: d.amount as number, currency: "USD", status: d.status as Payment["status"],
    wompi: d.wompi as Payment["wompi"],
    createdAt: toDate(d.createdAt as never),
    approvedAt: d.approvedAt ? toDate(d.approvedAt as never) : undefined,
  };
}

export async function getPayments(filters?: { userId?: string; status?: Payment["status"] }): Promise<Payment[]> {
  let q = query(col);
  if (filters?.userId && filters?.status) {
    q = query(col, where("userId", "==", filters.userId), where("status", "==", filters.status));
  } else if (filters?.userId) {
    q = query(col, where("userId", "==", filters.userId));
  } else if (filters?.status) {
    q = query(col, where("status", "==", filters.status));
  }
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => mapPayment(d.id, d.data()))
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export async function getPayment(id: string): Promise<Payment | null> {
  const snap = await getDoc(doc(db, "payments", id));
  return snap.exists() ? mapPayment(snap.id, snap.data()) : null;
}

export async function createPayment(data: Omit<Payment, "id" | "createdAt" | "approvedAt">): Promise<string> {
  const ref = await addDoc(col, { ...data, createdAt: serverTimestamp() });
  return ref.id;
}

export async function approvePayment(id: string, wompiData: Partial<Payment["wompi"]>): Promise<void> {
  await updateDoc(doc(db, "payments", id), {
    status: "approved", approvedAt: serverTimestamp(),
    wompi: wompiData,
  });
}

export function generateReference(courseSlug: string, userId: string): string {
  return `CO-${courseSlug}-${userId.slice(0, 6)}-${Date.now()}`;
}
