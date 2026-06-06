import 'server-only'
import { adminDb } from '@/lib/firebase/admin'
import { COLLECTIONS } from '@/lib/firebase/collections'
import type {
  Course,
  Module,
  Lesson,
  Quiz,
  QuizResult,
  Assignment,
  Submission,
  Attendance,
  LiveClass,
  Prayer,
  PrayerProgress,
  SacramentalRecord,
  Certificate,
  ForumQuestion,
  ForumAnswer,
  AppUser,
  Settings,
  Payment,
  Enrollment,
  LessonProgress,
} from '@/types'

/**
 * Capa de acceso a datos del lado del servidor usando el Admin SDK.
 * Se usa exclusivamente en Server Components y Route Handlers.
 */

function mapDoc<T>(doc: FirebaseFirestore.QueryDocumentSnapshot): T {
  return { id: doc.id, ...doc.data() } as T
}

export async function getSettings(): Promise<Settings> {
  const snap = await adminDb
    .collection(COLLECTIONS.settings)
    .doc('global')
    .get()
  if (!snap.exists) {
    return {
      id: 'global',
      institutionName: 'Catequesis Online',
      logoUrl: '',
      signatureUrl: '',
      primaryColor: '#2d4a7c',
      contactEmail: '',
      certificateTemplate: '',
      wompiPublicKey: '',
      wompiPrivateKey: '',
      wompiIntegritySecret: '',
      wompiActive: false,
      currency: 'USD',
    }
  }
  return { id: 'global', ...snap.data() } as Settings
}

export async function getAllCourses(): Promise<Course[]> {
  const snap = await adminDb.collection(COLLECTIONS.courses).get()
  const courses = snap.docs.map((d) => mapDoc<Course>(d))
  return courses.sort((a, b) => (a.level ?? 0) - (b.level ?? 0))
}

export async function getPublishedCourses(): Promise<Course[]> {
  const courses = await getAllCourses()
  return courses.filter((c) => c.published)
}

export async function getCourse(id: string): Promise<Course | null> {
  const snap = await adminDb.collection(COLLECTIONS.courses).doc(id).get()
  return snap.exists ? ({ id: snap.id, ...snap.data() } as Course) : null
}

export async function getModulesByCourse(courseId: string): Promise<Module[]> {
  const snap = await adminDb
    .collection(COLLECTIONS.modules)
    .where('courseId', '==', courseId)
    .get()
  return snap.docs
    .map((d) => mapDoc<Module>(d))
    .sort((a, b) => a.order - b.order)
}

export async function getLessonsByCourse(courseId: string): Promise<Lesson[]> {
  const snap = await adminDb
    .collection(COLLECTIONS.lessons)
    .where('courseId', '==', courseId)
    .get()
  return snap.docs
    .map((d) => mapDoc<Lesson>(d))
    .sort((a, b) => a.order - b.order)
}

export async function getQuizzesByCourse(courseId: string): Promise<Quiz[]> {
  const snap = await adminDb
    .collection(COLLECTIONS.quizzes)
    .where('courseId', '==', courseId)
    .get()
  return snap.docs.map((d) => mapDoc<Quiz>(d))
}

export async function getQuizResultsByStudent(
  studentId: string,
): Promise<QuizResult[]> {
  const snap = await adminDb
    .collection(COLLECTIONS.quizResults)
    .where('studentId', '==', studentId)
    .get()
  return snap.docs.map((d) => mapDoc<QuizResult>(d))
}

export async function getAllUsers(): Promise<AppUser[]> {
  const snap = await adminDb.collection(COLLECTIONS.users).get()
  const users = snap.docs.map((d) => d.data() as AppUser)
  return users.sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0))
}

export async function getUsersByRole(role: string): Promise<AppUser[]> {
  const users = await getAllUsers()
  return users.filter((u) => u.role === role)
}

export async function getUser(uid: string): Promise<AppUser | null> {
  const snap = await adminDb.collection(COLLECTIONS.users).doc(uid).get()
  return snap.exists ? (snap.data() as AppUser) : null
}

export async function getEnrollmentsByUser(
  userId: string,
): Promise<Enrollment[]> {
  const snap = await adminDb
    .collection(COLLECTIONS.enrollments)
    .where('userId', '==', userId)
    .get()
  return snap.docs.map((d) => mapDoc<Enrollment>(d))
}

export async function getAllPayments(): Promise<Payment[]> {
  const snap = await adminDb.collection(COLLECTIONS.payments).get()
  const payments = snap.docs.map((d) => mapDoc<Payment>(d))
  return payments.sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0))
}

export async function getAssignmentsByCourse(
  courseId: string,
): Promise<Assignment[]> {
  const snap = await adminDb
    .collection(COLLECTIONS.assignments)
    .where('courseId', '==', courseId)
    .get()
  return snap.docs
    .map((d) => mapDoc<Assignment>(d))
    .sort((a, b) => (a.dueDate ?? 0) - (b.dueDate ?? 0))
}

export async function getAllAssignments(): Promise<Assignment[]> {
  const snap = await adminDb.collection(COLLECTIONS.assignments).get()
  return snap.docs.map((d) => mapDoc<Assignment>(d))
}

export async function getSubmissionsByStudent(
  studentId: string,
): Promise<Submission[]> {
  const snap = await adminDb
    .collection(COLLECTIONS.submissions)
    .where('studentId', '==', studentId)
    .get()
  return snap.docs.map((d) => mapDoc<Submission>(d))
}

export async function getAllSubmissions(): Promise<Submission[]> {
  const snap = await adminDb.collection(COLLECTIONS.submissions).get()
  const subs = snap.docs.map((d) => mapDoc<Submission>(d))
  return subs.sort((a, b) => (b.submittedAt ?? 0) - (a.submittedAt ?? 0))
}

export async function getLiveClasses(): Promise<LiveClass[]> {
  const snap = await adminDb.collection(COLLECTIONS.liveClasses).get()
  const classes = snap.docs.map((d) => mapDoc<LiveClass>(d))
  return classes.sort((a, b) => (a.date ?? 0) - (b.date ?? 0))
}

export async function getLiveClassesByCourse(
  courseId: string,
): Promise<LiveClass[]> {
  const all = await getLiveClasses()
  return all.filter((c) => c.courseId === courseId)
}

export async function getPrayers(): Promise<Prayer[]> {
  const snap = await adminDb.collection(COLLECTIONS.prayers).get()
  return snap.docs
    .map((d) => mapDoc<Prayer>(d))
    .sort((a, b) => a.order - b.order)
}

export async function getPrayerProgress(
  studentId: string,
): Promise<PrayerProgress[]> {
  const snap = await adminDb
    .collection(COLLECTIONS.prayerProgress)
    .where('studentId', '==', studentId)
    .get()
  return snap.docs.map((d) => mapDoc<PrayerProgress>(d))
}

export async function getSacramentalRecordsByStudent(
  studentId: string,
): Promise<SacramentalRecord[]> {
  const snap = await adminDb
    .collection(COLLECTIONS.sacramentalRecords)
    .where('studentId', '==', studentId)
    .get()
  return snap.docs.map((d) => mapDoc<SacramentalRecord>(d))
}

export async function getAllSacramentalRecords(): Promise<SacramentalRecord[]> {
  const snap = await adminDb.collection(COLLECTIONS.sacramentalRecords).get()
  return snap.docs.map((d) => mapDoc<SacramentalRecord>(d))
}

export async function getCertificatesByStudent(
  studentId: string,
): Promise<Certificate[]> {
  const snap = await adminDb
    .collection(COLLECTIONS.certificates)
    .where('studentId', '==', studentId)
    .get()
  return snap.docs.map((d) => mapDoc<Certificate>(d))
}

export async function getAttendanceByStudent(
  studentId: string,
): Promise<Attendance[]> {
  const snap = await adminDb
    .collection(COLLECTIONS.attendance)
    .where('studentId', '==', studentId)
    .get()
  return snap.docs.map((d) => mapDoc<Attendance>(d))
}

export async function getAttendanceByClass(
  liveClassId: string,
): Promise<Attendance[]> {
  const snap = await adminDb
    .collection(COLLECTIONS.attendance)
    .where('liveClassId', '==', liveClassId)
    .get()
  return snap.docs.map((d) => mapDoc<Attendance>(d))
}

export async function getForumQuestions(
  courseId?: string,
): Promise<ForumQuestion[]> {
  let ref: FirebaseFirestore.Query = adminDb.collection(
    COLLECTIONS.forumQuestions,
  )
  if (courseId) ref = ref.where('courseId', '==', courseId)
  const snap = await ref.get()
  const questions = snap.docs.map((d) => mapDoc<ForumQuestion>(d))
  return questions.sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0))
}

export async function getForumAnswers(
  questionId: string,
): Promise<ForumAnswer[]> {
  const snap = await adminDb
    .collection(COLLECTIONS.forumAnswers)
    .where('questionId', '==', questionId)
    .get()
  return snap.docs
    .map((d) => mapDoc<ForumAnswer>(d))
    .sort((a, b) => (a.createdAt ?? 0) - (b.createdAt ?? 0))
}

export async function getLessonProgressByStudent(
  studentId: string,
): Promise<LessonProgress[]> {
  const snap = await adminDb
    .collection(COLLECTIONS.lessonProgress)
    .where('studentId', '==', studentId)
    .get()
  return snap.docs.map((d) => mapDoc<LessonProgress>(d))
}
