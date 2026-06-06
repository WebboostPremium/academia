export type CourseSlug = "bautismo" | "primera-comunion" | "confirmacion";
export type CourseStatus = "draft" | "published" | "archived";

export interface Course {
  id: string;
  slug: CourseSlug;
  title: string;
  description: string;
  shortDescription: string;
  imageUrl: string;
  instructor: string;
  instructorBio?: string;
  objectives?: string[];
  durationWeeks?: number;
  durationLabel?: string;
  price: number;
  currency: "USD";
  category: "sacramental";
  status: CourseStatus;
  finalExamQuizId?: string;
  passingScore: number;
  moduleOrder: string[];
  stats: { enrollmentCount: number; completionCount: number };
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
}

export interface Module {
  id: string;
  courseId: string;
  title: string;
  description?: string;
  order: number;
  lessonOrder: string[];
  status: "active" | "archived";
  createdAt: Date;
  updatedAt: Date;
}

export interface Lesson {
  id: string;
  courseId: string;
  moduleId: string;
  title: string;
  description?: string;
  order: number;
  content: {
    video?: { youtubeId: string; duration?: number };
    pdfUrl?: string;
    pdfFileName?: string;
    resources: Array<{ title: string; url: string; type: "link" | "pdf" | "doc" }>;
  };
  quizId?: string;
  estimatedMinutes: number;
  status: "draft" | "published";
  createdAt: Date;
  updatedAt: Date;
}

export type QuizQuestionType = "multiple_choice" | "true_false" | "single_choice";

export interface QuizQuestion {
  id: string;
  text: string;
  type: QuizQuestionType;
  options: Array<{ id: string; text: string; isCorrect: boolean }>;
  explanation?: string;
}

export interface Quiz {
  id: string;
  courseId: string;
  lessonId?: string;
  type: "lesson" | "final_exam";
  title: string;
  description?: string;
  passingScore: number;
  maxAttempts: number;
  timeLimitMinutes?: number;
  questions: QuizQuestion[];
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  status: "draft" | "published";
  createdAt: Date;
  updatedAt: Date;
}

export interface QuizResult {
  id: string;
  userId: string;
  quizId: string;
  courseId: string;
  lessonId?: string;
  attemptNumber: number;
  score: number;
  passed: boolean;
  answers: Array<{ questionId: string; selectedOptionId: string; isCorrect: boolean }>;
  startedAt: Date;
  completedAt: Date;
}

export interface Enrollment {
  id: string;
  userId: string;
  courseId: string;
  paymentId?: string;
  status: "active" | "completed" | "revoked";
  enrolledAt: Date;
  completedAt?: Date;
  progress: {
    percentComplete: number;
    modulesCompleted: string[];
    lessonsCompleted: string[];
    quizzesPassed: string[];
    finalExamPassed: boolean;
    averageScore: number;
    lastActivityAt: Date;
    lastLessonId?: string;
  };
}
