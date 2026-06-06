export const COLLECTIONS = {
  users: 'users',
  courses: 'courses',
  modules: 'modules',
  lessons: 'lessons',
  quizzes: 'quizzes',
  quizResults: 'quiz_results',
  assignments: 'assignments',
  submissions: 'submissions',
  attendance: 'attendance',
  liveClasses: 'live_classes',
  prayers: 'prayers',
  prayerProgress: 'prayer_progress',
  sacramentalRecords: 'sacramental_records',
  certificates: 'certificates',
  forumQuestions: 'forum_questions',
  forumAnswers: 'forum_answers',
  notifications: 'notifications',
  settings: 'settings',
  payments: 'payments',
  enrollments: 'enrollments',
  lessonProgress: 'lesson_progress',
} as const

export const COURSE_PRICES: Record<string, number> = {
  bautismo: 15,
  comunion: 25,
  confirmacion: 30,
}
