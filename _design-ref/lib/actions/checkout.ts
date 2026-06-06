'use server'

import { adminDb } from '@/lib/firebase/admin'
import { getCurrentUser } from '@/lib/auth/session'
import { COLLECTIONS, COURSE_PRICES } from '@/lib/firebase/collections'
import { getSettings } from '@/lib/services/server-data'
import { generateReference, integritySignature } from '@/lib/services/wompi'

export interface CheckoutResult {
  error?: string
  publicKey?: string
  reference?: string
  amountInCents?: number
  currency?: string
  signature?: string
  redirectUrl?: string
  customerEmail?: string
  /** Modo demostración: aprovisiona sin pasarela cuando Wompi no está activo */
  demo?: boolean
}

/**
 * Inicia el checkout de un curso. Valida el precio en el servidor consultando
 * Firestore (nunca confía en montos del cliente), crea un pago pendiente y
 * devuelve los parámetros firmados para el Widget de Wompi.
 */
export async function startCheckout(
  courseId: string,
): Promise<CheckoutResult> {
  const user = await getCurrentUser()
  if (!user) return { error: 'Debes iniciar sesión' }

  try {
    // Validación del curso y precio en el servidor
    const courseSnap = await adminDb
      .collection(COLLECTIONS.courses)
      .doc(courseId)
      .get()
    if (!courseSnap.exists) return { error: 'Curso no encontrado' }
    const course = courseSnap.data() as { title: string; price?: number }

    const amount = course.price ?? COURSE_PRICES[courseId]
    if (!amount || amount <= 0) return { error: 'Precio inválido' }

    // ¿Ya está inscrito?
    const existing = await adminDb
      .collection(COLLECTIONS.enrollments)
      .where('userId', '==', user.uid)
      .where('courseId', '==', courseId)
      .limit(1)
      .get()
    if (!existing.empty) return { error: 'Ya estás inscrito en este curso' }

    const settings = await getSettings()
    const currency = settings.currency || 'USD'
    const amountInCents = Math.round(amount * 100)
    const reference = generateReference(user.uid, courseId)

    // Registrar pago pendiente
    await adminDb.collection(COLLECTIONS.payments).doc(reference).set({
      reference,
      userId: user.uid,
      userName: user.displayName,
      userEmail: user.email,
      courseId,
      courseName: course.title,
      amount,
      currency,
      status: 'pendiente',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })

    // Si Wompi no está activo/configurado, usar aprovisionamiento demo
    if (
      !settings.wompiActive ||
      !settings.wompiPublicKey ||
      !settings.wompiIntegritySecret
    ) {
      return { demo: true, reference }
    }

    const signature = integritySignature(
      reference,
      amountInCents,
      currency,
      settings.wompiIntegritySecret,
    )

    return {
      publicKey: settings.wompiPublicKey,
      reference,
      amountInCents,
      currency,
      signature,
      customerEmail: user.email,
    }
  } catch (error) {
    console.error('[v0] startCheckout:', error)
    return { error: 'No se pudo iniciar el pago' }
  }
}

/**
 * Aprovisionamiento de demostración: simula un pago aprobado cuando Wompi no
 * está configurado, ejecutando la misma automatización post-pago.
 */
export async function confirmDemoPayment(reference: string) {
  const user = await getCurrentUser()
  if (!user) return { error: 'No autorizado' }

  try {
    const { provisionEnrollment } = await import(
      '@/lib/services/provisioning'
    )
    const result = await provisionEnrollment(reference, `DEMO-${Date.now()}`)
    if (!result.success) return { error: result.error }
    return { success: true }
  } catch (error) {
    console.error('[v0] confirmDemoPayment:', error)
    return { error: 'No se pudo confirmar el pago' }
  }
}
