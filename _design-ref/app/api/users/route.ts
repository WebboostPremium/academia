import { NextResponse } from 'next/server'
import { adminAuth, adminDb } from '@/lib/firebase/admin'
import { getCurrentUser } from '@/lib/auth/session'
import { COLLECTIONS } from '@/lib/firebase/collections'
import type { Role } from '@/types'

export async function POST(request: Request) {
  const current = await getCurrentUser()
  if (!current || current.role !== 'admin') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  try {
    const { email, password, displayName, role, phone, enrolledCourses } =
      await request.json()

    if (!email || !password || !displayName || !role) {
      return NextResponse.json(
        { error: 'Faltan campos obligatorios' },
        { status: 400 },
      )
    }

    const userRecord = await adminAuth.createUser({
      email,
      password,
      displayName,
    })

    await adminAuth.setCustomUserClaims(userRecord.uid, { role })

    const now = Date.now()
    await adminDb
      .collection(COLLECTIONS.users)
      .doc(userRecord.uid)
      .set({
        uid: userRecord.uid,
        email,
        displayName,
        role: role as Role,
        phone: phone ?? '',
        enrolledCourses: enrolledCourses ?? [],
        active: true,
        createdAt: now,
        updatedAt: now,
      })

    return NextResponse.json({ uid: userRecord.uid })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Error al crear usuario'
    console.error('[v0] Error creating user:', message)
    return NextResponse.json({ error: message }, { status: 400 })
  }
}

export async function PATCH(request: Request) {
  const current = await getCurrentUser()
  if (!current || current.role !== 'admin') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  try {
    const { uid, displayName, role, phone, active, enrolledCourses } =
      await request.json()
    if (!uid) {
      return NextResponse.json({ error: 'Falta uid' }, { status: 400 })
    }

    const updates: Record<string, unknown> = { updatedAt: Date.now() }
    if (displayName !== undefined) updates.displayName = displayName
    if (role !== undefined) {
      updates.role = role
      await adminAuth.setCustomUserClaims(uid, { role })
    }
    if (phone !== undefined) updates.phone = phone
    if (active !== undefined) updates.active = active
    if (enrolledCourses !== undefined) updates.enrolledCourses = enrolledCourses

    await adminDb.collection(COLLECTIONS.users).doc(uid).update(updates)
    return NextResponse.json({ success: true })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Error al actualizar usuario'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}

export async function DELETE(request: Request) {
  const current = await getCurrentUser()
  if (!current || current.role !== 'admin') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const uid = searchParams.get('uid')
    if (!uid) {
      return NextResponse.json({ error: 'Falta uid' }, { status: 400 })
    }
    await adminAuth.deleteUser(uid)
    await adminDb.collection(COLLECTIONS.users).doc(uid).delete()
    return NextResponse.json({ success: true })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Error al eliminar usuario'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
