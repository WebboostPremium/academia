import 'server-only'
import { adminDb } from '@/lib/firebase/admin'
import { COLLECTIONS } from '@/lib/firebase/collections'

export interface ProvisionResult {
  success: boolean
  error?: string
  alreadyProcessed?: boolean
}

/**
 * Automatización post-pago (transacción atómica):
 *  1. Marca el pago como completado.
 *  2. Crea la inscripción (enrollment).
 *  3. Inicializa el expediente sacramental con estado en_curso.
 *  4. Agrega el curso a enrolledCourses del usuario (desbloqueo).
 * Idempotente: si el pago ya fue completado, no duplica registros.
 */
export async function provisionEnrollment(
  reference: string,
  wompiTransactionId: string,
): Promise<ProvisionResult> {
  const paymentRef = adminDb.collection(COLLECTIONS.payments).doc(reference)

  try {
    const result = await adminDb.runTransaction(async (tx) => {
      const paymentSnap = await tx.get(paymentRef)
      if (!paymentSnap.exists) {
        return { success: false, error: 'Pago no encontrado' }
      }
      const payment = paymentSnap.data() as {
        userId: string
        userName: string
        courseId: string
        courseName: string
        status: string
      }

      if (payment.status === 'completado') {
        return { success: true, alreadyProcessed: true }
      }

      const userRef = adminDb.collection(COLLECTIONS.users).doc(payment.userId)
      const enrollmentRef = adminDb
        .collection(COLLECTIONS.enrollments)
        .doc(`${payment.userId}_${payment.courseId}`)
      const recordRef = adminDb
        .collection(COLLECTIONS.sacramentalRecords)
        .doc(`${payment.userId}_${payment.courseId}`)

      const userSnap = await tx.get(userRef)
      const enrolled: string[] = userSnap.data()?.enrolledCourses ?? []

      // 1. Pago completado
      tx.update(paymentRef, {
        status: 'completado',
        wompiTransactionId,
        updatedAt: Date.now(),
      })

      // 2. Inscripción
      tx.set(enrollmentRef, {
        userId: payment.userId,
        courseId: payment.courseId,
        paymentId: reference,
        enrolledAt: Date.now(),
      })

      // 3. Expediente sacramental inicial
      tx.set(
        recordRef,
        {
          studentId: payment.userId,
          studentName: payment.userName,
          courseId: payment.courseId,
          sacramentType: payment.courseId,
          status: 'en_curso',
          requirements: {
            asistenciaMinima: false,
            quizzesAprobados: false,
            tareasEntregadas: false,
            oracionesAprendidas: false,
          },
          requirementsCompleted: [],
          requirementsPending: [
            'asistenciaMinima',
            'quizzesAprobados',
            'tareasEntregadas',
            'oracionesAprendidas',
          ],
          observations: '',
          updatedBy: 'sistema',
          updatedAt: Date.now(),
        },
        { merge: true },
      )

      // 4. Desbloqueo del curso
      if (!enrolled.includes(payment.courseId)) {
        tx.update(userRef, {
          enrolledCourses: [...enrolled, payment.courseId],
          updatedAt: Date.now(),
        })
      }

      return { success: true }
    })

    return result as ProvisionResult
  } catch (error) {
    console.error('[v0] provisionEnrollment:', error)
    return { success: false, error: 'Error al aprovisionar la inscripción' }
  }
}
