import 'server-only'
import { cookies } from 'next/headers'
import { adminAuth, adminDb } from '@/lib/firebase/admin'
import type { AppUser, Role } from '@/types'

export const SESSION_COOKIE = 'cq_session'
export const SESSION_MAX_AGE = 60 * 60 * 24 * 5 // 5 días en segundos

export async function getCurrentUser(): Promise<AppUser | null> {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get(SESSION_COOKIE)?.value
  if (!sessionCookie) return null

  try {
    const decoded = await adminAuth.verifySessionCookie(sessionCookie, true)
    const snap = await adminDb.collection('users').doc(decoded.uid).get()
    if (!snap.exists) return null
    return snap.data() as AppUser
  } catch {
    return null
  }
}

export async function requireRole(roles: Role[]): Promise<AppUser | null> {
  const user = await getCurrentUser()
  if (!user || !roles.includes(user.role)) return null
  return user
}

export function roleHome(role: Role): string {
  switch (role) {
    case 'admin':
      return '/admin/dashboard'
    case 'catequista':
      return '/catequista/dashboard'
    default:
      return '/estudiante/dashboard'
  }
}
