import type { UserRole } from "@/lib/constants/roles";

export type ActivityAction =
  | "course.create" | "course.update" | "course.delete" | "course.duplicate" | "course.publish"
  | "payment.approved" | "enrollment.create"
  | "certificate.issue"
  | "user.block" | "user.unblock"
  | "coupon.create" | "coupon.redeem"
  | "settings.update"
  | "login" | "register";

export interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: ActivityAction;
  entityType?: string;
  entityId?: string;
  details?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}
