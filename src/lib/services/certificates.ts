import { collection, doc, getDocs, addDoc, updateDoc, query, where, orderBy, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { toDate } from "@/lib/firebase/converters";
import type { Certificate } from "@/types";

const col = collection(db, "certificates");

export async function getCertificates(filters?: { userId?: string; courseId?: string }): Promise<Certificate[]> {
  let q = query(col, orderBy("issuedAt", "desc"));
  if (filters?.userId) q = query(col, where("userId", "==", filters.userId), orderBy("issuedAt", "desc"));
  const snap = await getDocs(q);
  let results = snap.docs.map((d) => {
    const data = d.data();
    return { id: d.id, ...data, issuedAt: toDate(data.issuedAt), revokedAt: data.revokedAt ? toDate(data.revokedAt) : undefined } as Certificate;
  });
  if (filters?.courseId) results = results.filter((c) => c.courseId === filters.courseId);
  return results;
}

export async function createCertificate(data: Omit<Certificate, "id" | "issuedAt">): Promise<string> {
  const ref = await addDoc(col, { ...data, status: "active", issuedAt: serverTimestamp() });
  return ref.id;
}

export async function revokeCertificate(id: string, reason: string): Promise<void> {
  await updateDoc(doc(db, "certificates", id), { status: "revoked", revokedAt: serverTimestamp(), revokedReason: reason });
}

export async function generateCertificateNumber(): Promise<string> {
  const snap = await getDocs(query(col, orderBy("issuedAt", "desc")));
  const count = snap.size + 1;
  return `CERT-${new Date().getFullYear()}-${String(count).padStart(5, "0")}`;
}
