'use server'

import { revalidatePath } from 'next/cache'
import { adminDb } from '@/lib/firebase/admin'
import { getCurrentUser } from '@/lib/auth/session'
import { COLLECTIONS } from '@/lib/firebase/collections'
import { evaluateRequirements } from '@/lib/services/requirements'

export async function toggleLessonComplete(
  courseId: string,
  lessonId: string,
  completed: boolean,
) {
  const user = await getCurrentUser()
  if (!user) return { error: 'No autorizado' }

  try {
    const id = `${user.uid}_${lessonId}`
    await adminDb
      .collection(COLLECTIONS.lessonProgress)
      .doc(id)
      .set({
        studentId: user.uid,
        courseId,
        lessonId,
        completed,
        completedAt: completed ? Date.now() : 0,
      })
    revalidatePath(`/estudiante/cursos/${courseId}`)
    return { success: true }
  } catch (error) {
    console.error('[v0] toggleLessonComplete:', error)
    return { error: 'No se pudo guardar el progreso' }
  }
}

export async function submitQuiz(
  quizId: string,
  courseId: string,
  answers: number[],
) {
  const user = await getCurrentUser()
  if (!user) return { error: 'No autorizado' }

  try {
    const quizSnap = await adminDb
      .collection(COLLECTIONS.quizzes)
      .doc(quizId)
      .get()
    if (!quizSnap.exists) return { error: 'Evaluación no encontrada' }
    const quiz = quizSnap.data() as {
      title: string
      passingScore: number
      questions: { correctIndex: number }[]
    }

    let correct = 0
    quiz.questions.forEach((q, i) => {
      if (answers[i] === q.correctIndex) correct += 1
    })
    const score = Math.round((correct / quiz.questions.length) * 100)
    const passed = score >= (quiz.passingScore ?? 70)

    await adminDb.collection(COLLECTIONS.quizResults).add({
      quizId,
      quizTitle: quiz.title,
      studentId: user.uid,
      studentName: user.displayName,
      courseId,
      score,
      answers,
      passed,
      attemptedAt: Date.now(),
    })

    await evaluateRequirements(user.uid, courseId)
    revalidatePath(`/estudiante/cursos/${courseId}`)
    return { success: true, score, passed }
  } catch (error) {
    console.error('[v0] submitQuiz:', error)
    return { error: 'No se pudo registrar la evaluación' }
  }
}

export async function togglePrayerLearned(
  prayerId: string,
  learned: boolean,
) {
  const user = await getCurrentUser()
  if (!user) return { error: 'No autorizado' }

  try {
    const id = `${user.uid}_${prayerId}`
    await adminDb
      .collection(COLLECTIONS.prayerProgress)
      .doc(id)
      .set({
        studentId: user.uid,
        prayerId,
        learned,
        learnedAt: learned ? Date.now() : 0,
      })
    revalidatePath('/estudiante/oraciones')
    return { success: true }
  } catch (error) {
    console.error('[v0] togglePrayerLearned:', error)
    return { error: 'No se pudo guardar' }
  }
}

export async function createForumQuestion(
  courseId: string,
  title: string,
  body: string,
) {
  const user = await getCurrentUser()
  if (!user) return { error: 'No autorizado' }
  if (!title.trim() || !body.trim()) return { error: 'Completa los campos' }

  try {
    await adminDb.collection(COLLECTIONS.forumQuestions).add({
      courseId: courseId || '',
      authorId: user.uid,
      authorName: user.displayName,
      studentName: user.displayName,
      title: title.trim(),
      body: body.trim(),
      content: body.trim(),
      answerCount: 0,
      createdAt: Date.now(),
    })
    revalidatePath('/estudiante/foro')
    return { success: true }
  } catch (error) {
    console.error('[v0] createForumQuestion:', error)
    return { error: 'No se pudo publicar la pregunta' }
  }
}

export async function createForumAnswer(questionId: string, body: string) {
  const user = await getCurrentUser()
  if (!user) return { error: 'No autorizado' }
  if (!body.trim()) return { error: 'Escribe una respuesta' }

  try {
    await adminDb.collection(COLLECTIONS.forumAnswers).add({
      questionId,
      authorId: user.uid,
      authorName: user.displayName,
      userName: user.displayName,
      authorRole: user.role,
      userRole: user.role,
      body: body.trim(),
      content: body.trim(),
      approved: user.role !== 'estudiante',
      createdAt: Date.now(),
    })
    const qRef = adminDb.collection(COLLECTIONS.forumQuestions).doc(questionId)
    await adminDb.runTransaction(async (tx) => {
      const doc = await tx.get(qRef)
      const count = (doc.data()?.answerCount ?? 0) + 1
      tx.update(qRef, { answerCount: count })
    })
    revalidatePath('/estudiante/foro')
    return { success: true }
  } catch (error) {
    console.error('[v0] createForumAnswer:', error)
    return { error: 'No se pudo publicar la respuesta' }
  }
}

export async function submitAssignment(
  assignmentId: string,
  assignmentTitle: string,
  courseId: string,
  fileUrl: string,
  fileName: string,
) {
  const user = await getCurrentUser()
  if (!user) return { error: 'No autorizado' }
  if (!fileUrl.trim()) return { error: 'Adjunta el enlace de tu tarea' }

  try {
    const id = `${assignmentId}_${user.uid}`
    await adminDb
      .collection(COLLECTIONS.submissions)
      .doc(id)
      .set({
        assignmentId,
        assignmentTitle,
        courseId,
        studentId: user.uid,
        studentName: user.displayName,
        fileUrl: fileUrl.trim(),
        fileName: fileName.trim() || 'tarea.pdf',
        status: 'pendiente',
        submittedAt: Date.now(),
      })
    await evaluateRequirements(user.uid, courseId)
    revalidatePath(`/estudiante/cursos/${courseId}`)
    return { success: true }
  } catch (error) {
    console.error('[v0] submitAssignment:', error)
    return { error: 'No se pudo enviar la tarea' }
  }
}
