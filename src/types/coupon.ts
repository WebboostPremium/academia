export type CouponType = "percent" | "fixed";
export type CouponStatus = "active" | "inactive" | "expired";

export interface Coupon {
  id: string;
  code: string;
  type: CouponType;
  value: number;
  courseId?: string;
  maxUses?: number;
  usedCount: number;
  minAmount?: number;
  expiresAt?: Date;
  status: CouponStatus;
  createdAt: Date;
  updatedAt: Date;
}
