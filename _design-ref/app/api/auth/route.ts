import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { adminAuth } from '@/lib/firebase/admin'
import { SESSION_COOKIE, SESSION_MAX_AGE } from '@/lib/auth/session'

export async function POST(request: Request) {
  try {
    const { idToken } = await request.json()
    if (!idToken) {
      return NextResponse.json({ error: 'Falta el token' }, { status: 400 })
    }

    const sessionCookie = await adminAuth.createSessionCookie(idToken, {
      expiresIn: SESSION_MAX_AGE * 1000,
    })

    const cookieStore = await cookies()
    cookieStore.set(SESSION_COOKIE, sessionCookie, {
      maxAge: SESSION_MAX_AGE,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      sameSite: 'lax',
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[v0] Error creating session:', error)
    return NextResponse.json(
      { error: 'No se pudo crear la sesión' },
      { status: 401 },
    )
  }
}

export async function DELETE() {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE)
  return NextResponse.json({ success: true })
}
