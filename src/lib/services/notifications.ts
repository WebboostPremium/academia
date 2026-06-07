import { getDocs, addDoc, updateDoc, query, where, orderBy, serverTimestamp, limit } from "firebase/firestore";
import { fsCollection, fsDoc } from "@/lib/firebase/firestore-helpers";
import { toDate } from "@/lib/firebase/converters";
import type { Notification } from "@/types";

export async function getRecentNotifications(max = 50): Promise<Notification[]> {
  const snap = await getDocs(query(fsCollection("notifications"), orderBy("createdAt", "desc"), limit(max)));
  return snap.docs.map((d) => {
    const data = d.data();
    return { id: d.id, ...data, createdAt: toDate(data.createdAt) } as Notification;
  });
}

export async function getNotifications(userId: string): Promise<Notification[]> {
  const snap = await getDocs(query(fsCollection("notifications"), where("userId", "==", userId), orderBy("createdAt", "desc")));
  return snap.docs.map((d) => {
    const data = d.data();
    return { id: d.id, ...data, createdAt: toDate(data.createdAt) } as Notification;
  });
}

export async function getUnreadCount(userId: string): Promise<number> {
  const snap = await getDocs(query(fsCollection("notifications"), where("userId", "==", userId), where("read", "==", false)));
  return snap.size;
}

export async function createNotification(data: Omit<Notification, "id" | "createdAt" | "read">): Promise<string> {
  const ref = await addDoc(fsCollection("notifications"), { ...data, read: false, createdAt: serverTimestamp() });
  return ref.id;
}

export async function markAsRead(id: string): Promise<void> {
  await updateDoc(fsDoc("notifications", id), { read: true });
}

export async function markAllRead(userId: string): Promise<void> {
  const notifications = await getNotifications(userId);
  await Promise.all(notifications.filter((n) => !n.read).map((n) => markAsRead(n.id)));
}
