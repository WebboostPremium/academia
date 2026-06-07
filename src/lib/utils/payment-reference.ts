export function generateReference(courseSlug: string, userId: string): string {
  return `CO-${courseSlug}-${userId.slice(0, 6)}-${Date.now()}`;
}
