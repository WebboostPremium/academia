import 'server-only'
import { adminDb } from '@/lib/firebase/admin'
import { COLLECTIONS } from '@/lib/firebase/collections'

const MIN_ATTENDANCE = 0.7 // 70% de asistencia mínima

export interface RequirementState {
  asistenciaMinima: boolean
  quizzesAprobados: boolean
  tareasEntregadas: boolean
  oracionesAprendidas: boolean
}

/**
 * Recalcula el estado de los requisitos sacramentales de un estudiante para
 * un curso y actualiza (o crea) su expediente en `sacramental_records`.
 * Devuelve el estado de requisitos y si el curso quedó completado al 100%.
 */
export async function evaluateRequirements(
  studentId: string,
  courseId: string,
): Promise<{ requirements: RequirementState; completed: boolean }> {
  // Quizzes del curso vs aprobados
  const [quizzesSnap, quizResultsSnap, assignmentsSnap, submissionsSnap, prayersSnap, prayerProgressSnap, attendanceSnap, liveClassesSnap, studentSnap] =
    await Promise.all([
      adminDb.collection(COLLECTIONS.quizzes).where('courseId', '==', courseId).get(),
      adminDb
        .collection(COLLECTIONS.quizResults)
        .where('studentId', '==', studentId)
        .where('courseId', '==', courseId)
        .get(),
      adminDb.collection(COLLECTIONS.assignments).where('courseId', '==', courseId).get(),
      adminDb
        .collection(COLLECTIONS.submissions)
        .where('studentId', '==', studentId)
        .where('courseId', '==', courseId)
        .get(),
      adminDb.collection(COLLECTIONS.prayers).get(),
      adminDb
        .collection(COLLECTIONS.prayerProgress)
        .where('studentId', '==', studentId)
        .get(),
      adminDb
        .collection(COLLECTIONS.attendance)
        .where('studentId', '==', studentId)
        .where('courseId', '==', courseId)
        .get(),
      adminDb.collection(COLLECTIONS.liveClasses).where('courseId', '==', courseId).get(),
      adminDb.collection(COLLECTIONS.users).doc(studentId).get(),
    ])

  // Quizzes aprobados: al menos un resultado aprobado por cada quiz del curso
  const totalQuizzes = quizzesSnap.size
  const passedQuizIds = new Set(
    quizResultsSnap.docs
      .filter((d) => d.data().passed)
      .map((d) => d.data().quizId),
  )
  const quizzesAprobados =
    totalQuizzes === 0 ? true : passedQuizIds.size >= totalQuizzes

  // Tareas entregadas
  const totalAssignments = assignmentsSnap.size
  const submittedAssignmentIds = new Set(
    submissionsSnap.docs.map((d) => d.data().assignmentId),
  )
  const tareasEntregadas =
    totalAssignments === 0
      ? true
      : submittedAssignmentIds.size >= totalAssignments

  // Oraciones aprendidas (todas)
  const totalPrayers = prayersSnap.size
  const learnedPrayers = prayerProgressSnap.docs.filter(
    (d) => d.data().learned,
  ).length
  const oracionesAprendidas =
    totalPrayers === 0 ? true : learnedPrayers >= totalPrayers

  // Asistencia mínima
  const totalClasses = liveClassesSnap.size
  const presentCount = attendanceSnap.docs.filter(
    (d) => d.data().status === 'presente',
  ).length
  const asistenciaMinima =
    totalClasses === 0 ? true : presentCount / totalClasses >= MIN_ATTENDANCE

  const requirements: RequirementState = {
    asistenciaMinima,
    quizzesAprobados,
    tareasEntregadas,
    oracionesAprendidas,
  }

  const completed =
    asistenciaMinima &&
    quizzesAprobados &&
    tareasEntregadas &&
    oracionesAprendidas

  const studentName = (studentSnap.data()?.displayName as string) ?? ''
  const recordId = `${studentId}_${courseId}`
  const recordRef = adminDb
    .collection(COLLECTIONS.sacramentalRecords)
    .doc(recordId)
  const existing = await recordRef.get()
  const currentStatus = existing.data()?.status

  await recordRef.set(
    {
      studentId,
      studentName,
      courseId,
      sacramentType: courseId,
      status:
        currentStatus === 'suspendido'
          ? 'suspendido'
          : completed
            ? 'completado'
            : 'en_curso',
      requirements,
      requirementsCompleted: Object.entries(requirements)
        .filter(([, v]) => v)
        .map(([k]) => k),
      requirementsPending: Object.entries(requirements)
        .filter(([, v]) => !v)
        .map(([k]) => k),
      observations: existing.data()?.observations ?? '',
      updatedBy: 'sistema',
      updatedAt: Date.now(),
    },
    { merge: true },
  )

  return { requirements, completed }
}
