import { getDocs, addDoc, updateDoc, deleteDoc, query, where, serverTimestamp, getDoc, increment } from "firebase/firestore";
import { fsCollection, fsDoc } from "@/lib/firebase/firestore-helpers";
import { toDate } from "@/lib/firebase/converters";
import type { Coupon } from "@/types/coupon";

function mapCoupon(id: string, d: Record<string, unknown>): Coupon {
  return {
    id,
    code: (d.code as string).toUpperCase(),
    type: d.type as Coupon["type"],
    value: d.value as number,
    courseId: d.courseId as string | undefined,
    maxUses: d.maxUses as number | undefined,
    usedCount: (d.usedCount as number) ?? 0,
    minAmount: d.minAmount as number | undefined,
    expiresAt: d.expiresAt ? toDate(d.expiresAt as never) : undefined,
    status: d.status as Coupon["status"],
    createdAt: toDate(d.createdAt as never),
    updatedAt: toDate(d.updatedAt as never),
  };
}

export async function getCoupons(): Promise<Coupon[]> {
  const snap = await getDocs(fsCollection("coupons"));
  return snap.docs.map((d) => mapCoupon(d.id, d.data())).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export async function getCouponByCode(code: string): Promise<Coupon | null> {
  const normalized = code.trim().toUpperCase();
  const snap = await getDocs(query(fsCollection("coupons"), where("code", "==", normalized)));
  if (snap.empty) return null;
  const d = snap.docs[0];
  return mapCoupon(d.id, d.data());
}

export async function createCoupon(data: Omit<Coupon, "id" | "createdAt" | "updatedAt" | "usedCount">): Promise<string> {
  const payload: Record<string, unknown> = {
    code: data.code.trim().toUpperCase(),
    type: data.type,
    value: data.value,
    usedCount: 0,
    status: data.status,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  if (data.courseId) payload.courseId = data.courseId;
  if (data.maxUses) payload.maxUses = data.maxUses;
  if (data.minAmount) payload.minAmount = data.minAmount;
  if (data.expiresAt) payload.expiresAt = data.expiresAt;

  const ref = await addDoc(fsCollection("coupons"), payload);
  return ref.id;
}

export async function deleteCoupon(id: string): Promise<void> {
  await deleteDoc(fsDoc("coupons", id));
}

export async function updateCoupon(id: string, data: Partial<Coupon>): Promise<void> {
  const payload = { ...data, updatedAt: serverTimestamp() } as Record<string, unknown>;
  if (typeof data.code === "string") payload.code = data.code.trim().toUpperCase();
  await updateDoc(fsDoc("coupons", id), payload);
}

export function validateCoupon(
  coupon: Coupon,
  courseId: string,
  amountCents: number
): { valid: boolean; error?: string; discountCents: number } {
  if (coupon.status !== "active") return { valid: false, error: "Cupón inactivo", discountCents: 0 };
  if (coupon.expiresAt && coupon.expiresAt < new Date()) return { valid: false, error: "Cupón expirado", discountCents: 0 };
  if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) return { valid: false, error: "Cupón agotado", discountCents: 0 };
  if (coupon.courseId && coupon.courseId !== courseId) return { valid: false, error: "Cupón no válido para este curso", discountCents: 0 };
  if (coupon.minAmount && amountCents < coupon.minAmount) return { valid: false, error: "Monto mínimo no alcanzado", discountCents: 0 };

  const discountCents =
    coupon.type === "percent"
      ? Math.round(amountCents * (coupon.value / 100))
      : Math.min(coupon.value, amountCents);

  return { valid: true, discountCents };
}

export async function redeemCoupon(id: string): Promise<void> {
  await updateDoc(fsDoc("coupons", id), { usedCount: increment(1), updatedAt: serverTimestamp() });
}

export async function getCoupon(id: string): Promise<Coupon | null> {
  const snap = await getDoc(fsDoc("coupons", id));
  return snap.exists() ? mapCoupon(snap.id, snap.data()) : null;
}
