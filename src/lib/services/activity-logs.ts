import { getDocs, addDoc, query, orderBy, limit, serverTimestamp } from "firebase/firestore";
import { fsCollection } from "@/lib/firebase/firestore-helpers";
import { toDate } from "@/lib/firebase/converters";
import type { ActivityLog, ActivityAction } from "@/types/activity-log";
import type { UserRole } from "@/lib/constants/roles";

function mapLog(id: string, d: Record<string, unknown>): ActivityLog {
  return {
    id,
    userId: d.userId as string,
    userName: d.userName as string,
    userRole: d.userRole as UserRole,
    action: d.action as ActivityAction,
    entityType: d.entityType as string | undefined,
    entityId: d.entityId as string | undefined,
    details: d.details as string | undefined,
    metadata: d.metadata as Record<string, unknown> | undefined,
    createdAt: toDate(d.createdAt as never),
  };
}

export async function logActivity(entry: Omit<ActivityLog, "id" | "createdAt">): Promise<void> {
  try {
    await addDoc(fsCollection("activity_logs"), { ...entry, createdAt: serverTimestamp() });
  } catch {
    // No bloquear flujo principal si falla el log
  }
}

export async function getActivityLogs(max = 100): Promise<ActivityLog[]> {
  const snap = await getDocs(query(fsCollection("activity_logs"), orderBy("createdAt", "desc"), limit(max)));
  return snap.docs.map((d) => mapLog(d.id, d.data()));
}

export async function getActivityLogsByUser(userId: string, max = 50): Promise<ActivityLog[]> {
  const all = await getActivityLogs(200);
  return all.filter((l) => l.userId === userId).slice(0, max);
}
