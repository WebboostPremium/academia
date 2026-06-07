import { getDocs, addDoc, updateDoc, query, where, serverTimestamp, getDoc } from "firebase/firestore";
import { fsCollection, fsDoc } from "@/lib/firebase/firestore-helpers";
import { toDate } from "@/lib/firebase/converters";
import type { Payment } from "@/types";

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
  const col = fsCollection("payments");
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
  const snap = await getDoc(fsDoc("payments", id));
  return snap.exists() ? mapPayment(snap.id, snap.data()) : null;
}

export async function createPayment(data: Omit<Payment, "id" | "createdAt" | "approvedAt">): Promise<string> {
  const ref = await addDoc(fsCollection("payments"), { ...data, createdAt: serverTimestamp() });
  return ref.id;
}

export async function approvePayment(id: string, wompiData: Partial<Payment["wompi"]>): Promise<void> {
  await updateDoc(fsDoc("payments", id), {
    status: "approved", approvedAt: serverTimestamp(),
    wompi: wompiData,
  });
}

export { generateReference } from "@/lib/utils/payment-reference";
