import type { Timestamp } from "firebase/firestore";

export function toDate(value: Timestamp | Date | undefined | null): Date {
  if (!value) return new Date();
  if (value instanceof Date) return value;
  return value.toDate();
}

export function docToData<T extends Record<string, unknown>>(id: string, data: Record<string, unknown>, dateFields: string[] = []): T {
  const result = { id, ...data } as Record<string, unknown>;
  for (const field of dateFields) {
    if (result[field]) result[field] = toDate(result[field] as Timestamp);
  }
  return result as T;
}
