export type Role = 'admin' | 'catequista' | 'estudiante'

export type SacramentType = 'bautismo' | 'comunion' | 'confirmacion'

export interface AppUser {
  uid: string
  email: string
  displayName: string
  role: Role
  photoURL?: string
  phone?: string
  enrolledCourses: string[]
  active: boolean
  createdAt: number
  updatedAt: number
}

export interface Course {
  id: string
  title: string
  slug: string
  description: string
  coverImage: string
  sacramentType: SacramentType
  level: number
  totalModules: number
  totalLessons: number
  published: boolean
  createdBy: string
  createdAt: number
}

export interface Module {
  id: string
  courseId: string
  title: string
  description: string
  order: number
  createdAt: number
}

export interface Lesson {
  id: string
  moduleId: string
  courseId: string
  title: string
  description: string
  youtubeUrl: string
  pdfUrl?: string
  quizId?: string
  order: number
  duration?: number
  createdAt: number
}

export interface QuizQuestion {
  id: string
  text: string
  options: string[]
  correctIndex: number
}

export interface Quiz {
  id: string
  lessonId?: string
  courseId: string
  title: string
  passingScore: number
  questions: QuizQuestion[]
  createdAt: number
}

export interface QuizResult {
  id: string
  quizId: string
  quizTitle: string
  studentId: string
  studentName: string
  courseId: string
  score: number
  answers: number[]
  passed: boolean
  attemptedAt: number
}

export interface Assignment {
  id: string
  courseId: string
  courseName: string
  title: string
  instructions: string
  attachmentUrl?: string
  dueDate: number
  createdBy: string
  createdAt: number
}

export type SubmissionStatus = 'pendiente' | 'revisada' | 'calificada'

export interface Submission {
  id: string
  assignmentId: string
  assignmentTitle: string
  studentId: string
  studentName: string
  fileUrl: string
  fileName: string
  status: SubmissionStatus
  grade?: number
  feedback?: string
  reviewedBy?: string
  submittedAt: number
  reviewedAt?: number
}

export type AttendanceStatus = 'presente' | 'ausente' | 'justificado'

export interface Attendance {
  id: string
  studentId: string
  studentName: string
  courseId: string
  liveClassId?: string
  date: number
  status: AttendanceStatus
  registeredBy: string
}

export interface LiveClass {
  id: string
  courseId: string
  courseName: string
  title: string
  description: string
  date: number
  time: string
  platform: 'zoom' | 'meet'
  meetingUrl: string
  createdBy: string
  createdAt: number
}

export interface Prayer {
  id: string
  title: string
  content: string
  order: number
}

export interface PrayerProgress {
  id: string
  studentId: string
  prayerId: string
  learned: boolean
  learnedAt?: number
}

export type RecordStatus = 'en_proceso' | 'completo' | 'pendiente'

export interface SacramentalRecord {
  id: string
  studentId: string
  studentName: string
  sacramentType: SacramentType
  status: RecordStatus
  requirementsCompleted: string[]
  requirementsPending: string[]
  observations: string
  updatedBy: string
  updatedAt: number
}

export interface Certificate {
  id: string
  studentId: string
  courseId: string
  studentName: string
  courseName: string
  pdfUrl: string
  issuedAt: number
  issuedBy: string
}

export interface ForumQuestion {
  id: string
  courseId?: string
  authorId: string
  authorName: string
  title: string
  body: string
  answerCount: number
  createdAt: number
}

export interface ForumAnswer {
  id: string
  questionId: string
  authorId: string
  authorName: string
  authorRole: Role
  body: string
  approved: boolean
  createdAt: number
}

export type NotificationType =
  | 'tarea'
  | 'clase'
  | 'certificado'
  | 'respuesta'
  | 'general'

export interface AppNotification {
  id: string
  userId: string
  type: NotificationType
  title: string
  message: string
  read: boolean
  link?: string
  createdAt: number
}

export interface CourseProgress {
  courseId: string
  completedLessons: string[]
  totalLessons: number
  percentage: number
  completed: boolean
  lastAccessedAt: number
}

export interface Settings {
  id: 'global'
  institutionName: string
  logoUrl: string
  signatureUrl: string
  primaryColor: string
  contactEmail: string
  certificateTemplate: string
  wompiPublicKey: string
  wompiPrivateKey: string
  wompiIntegritySecret: string
  wompiActive: boolean
  currency: string
}

export type PaymentStatus = 'pendiente' | 'completado' | 'fallido'

export interface Payment {
  id: string
  reference: string
  userId: string
  userName: string
  userEmail: string
  courseId: string
  courseName: string
  amount: number
  currency: string
  status: PaymentStatus
  wompiTransactionId?: string
  createdAt: number
  updatedAt: number
}

export interface Enrollment {
  id: string
  userId: string
  courseId: string
  paymentId: string
  enrolledAt: number
}

export interface LessonProgress {
  id: string
  studentId: string
  courseId: string
  lessonId: string
  completed: boolean
  completedAt: number
}
