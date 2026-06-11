import type { Timestamp } from "firebase/firestore";

type DateLike =
  | Timestamp
  | Date
  | string
  | { toDate?: () => Date; seconds?: number; _seconds?: number }
  | undefined
  | null;

export function toDate(value: DateLike): Date {
  if (!value) return new Date();
  if (value instanceof Date) return value;
  if (typeof value === "string") return new Date(value);
  if (typeof value === "object") {
    if ("toDate" in value && typeof value.toDate === "function") return value.toDate();
    const raw = value as { seconds?: number; _seconds?: number };
    const seconds = raw.seconds ?? raw._seconds;
    if (typeof seconds === "number") return new Date(seconds * 1000);
  }
  return new Date();
}

export function docToData<T extends Record<string, unknown>>(id: string, data: Record<string, unknown>, dateFields: string[] = []): T {
  const result = { id, ...data } as Record<string, unknown>;
  for (const field of dateFields) {
    if (result[field]) result[field] = toDate(result[field] as Timestamp);
  }
  return result as T;
}
