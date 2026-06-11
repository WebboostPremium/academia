import { getDocs, addDoc, updateDoc, query, where, orderBy, serverTimestamp, limit } from "firebase/firestore";
import { fsCollection, fsDoc } from "@/lib/firebase/firestore-helpers";
import { toDate } from "@/lib/firebase/converters";
import { ROLES } from "@/lib/constants/roles";
import { getAllUsers } from "@/lib/services/users";
import { getCourseEnrollments } from "@/lib/services/enrollments";
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

export async function sendAdminNotification(data: {
  target: "general" | "student" | "course";
  title: string;
  body: string;
  userId?: string;
  courseId?: string;
  link?: string;
}): Promise<number> {
  let userIds: string[] = [];

  if (data.target === "student" && data.userId) {
    userIds = [data.userId];
  } else if (data.target === "course" && data.courseId) {
    const enrollments = await getCourseEnrollments(data.courseId);
    userIds = [
      ...new Set(
        enrollments
          .filter((e) => e.status === "active" || e.status === "completed")
          .map((e) => e.userId)
      ),
    ];
  } else {
    const students = await getAllUsers(ROLES.ESTUDIANTE);
    userIds = students.filter((s) => s.status !== "blocked").map((s) => s.uid);
  }

  if (userIds.length === 0) {
    throw new Error("No hay destinatarios para esta notificación");
  }

  const link =
    data.link ?? (data.courseId ? `/estudiante/cursos/${data.courseId}` : undefined);

  const chunkSize = 20;
  for (let i = 0; i < userIds.length; i += chunkSize) {
    const chunk = userIds.slice(i, i + chunkSize);
    await Promise.all(
      chunk.map((uid) =>
        createNotification({
          userId: uid,
          type: "system",
          title: data.title.trim(),
          body: data.body.trim(),
          link,
        })
      )
    );
  }

  return userIds.length;
}
