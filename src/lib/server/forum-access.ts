import { getAdminDb } from "@/lib/firebase/admin";
import type { SessionUser } from "@/types/user";
import { isStaffRole } from "@/lib/auth/request-session";

export async function hasForumCourseAccess(
  uid: string,
  role: SessionUser["role"],
  courseId: string
): Promise<boolean> {
  if (isStaffRole(role)) return true;

  const db = getAdminDb();
  const direct = await db.collection("enrollments").doc(`${uid}_${courseId}`).get();
  if (direct.exists) {
    const status = direct.data()?.status;
    return status === "active" || status === "completed";
  }

  const snap = await db
    .collection("enrollments")
    .where("userId", "==", uid)
    .where("courseId", "==", courseId)
    .limit(5)
    .get();

  return snap.docs.some((d) => {
    const status = d.data().status;
    return status === "active" || status === "completed";
  });
}
