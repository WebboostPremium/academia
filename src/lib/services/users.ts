import { doc, getDoc, setDoc, updateDoc, getDocs, collection, query, where, serverTimestamp, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { ROLES, type UserRole } from "@/lib/constants/roles";
import { toDate } from "@/lib/firebase/converters";
import type { AppUser } from "@/types/user";

function mapUser(id: string, data: Record<string, unknown>): AppUser {
  return {
    uid: id, email: data.email as string, displayName: data.displayName as string,
    photoURL: data.photoURL as string | undefined, role: data.role as UserRole,
    phone: data.phone as string | undefined, status: data.status as AppUser["status"],
    assignedCatequistaId: data.assignedCatequistaId as string | undefined,
    assignedCourseIds: (data.assignedCourseIds as string[]) ?? [],
    studyTimeMinutes: (data.studyTimeMinutes as number) ?? 0,
    achievements: (data.achievements as string[]) ?? [],
    createdAt: toDate(data.createdAt as never), updatedAt: toDate(data.updatedAt as never),
    lastLoginAt: data.lastLoginAt ? toDate(data.lastLoginAt as never) : undefined,
  };
}

export async function createUserDocument(uid: string, data: { email: string; displayName: string; role?: UserRole }): Promise<void> {
  await setDoc(doc(db, "users", uid), {
    uid, email: data.email, displayName: data.displayName,
    role: data.role ?? ROLES.ESTUDIANTE, status: "active",
    studyTimeMinutes: 0, achievements: [],
    createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
  });
}

export async function getUserDocument(uid: string): Promise<AppUser | null> {
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? mapUser(snap.id, snap.data()) : null;
}

export async function getAllUsers(role?: UserRole): Promise<AppUser[]> {
  const q = role ? query(collection(db, "users"), where("role", "==", role)) : query(collection(db, "users"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => mapUser(d.id, d.data()));
}

export async function getStudentsByCatequista(catequistaId: string): Promise<AppUser[]> {
  const snap = await getDocs(query(collection(db, "users"), where("assignedCatequistaId", "==", catequistaId), where("role", "==", ROLES.ESTUDIANTE)));
  return snap.docs.map((d) => mapUser(d.id, d.data()));
}

export async function updateUser(uid: string, data: Partial<AppUser>): Promise<void> {
  await updateDoc(doc(db, "users", uid), { ...data, updatedAt: serverTimestamp() });
}

export async function blockUser(uid: string, blocked: boolean): Promise<void> {
  await updateDoc(doc(db, "users", uid), { status: blocked ? "blocked" : "active", updatedAt: serverTimestamp() });
}

export async function deleteUser(uid: string): Promise<void> {
  await deleteDoc(doc(db, "users", uid));
}
