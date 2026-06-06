export * from "./user";
export * from "./settings";
export * from "./course";

export interface Payment {
  id: string;
  userId: string;
  courseId: string;
  amount: number;
  currency: "USD";
  status: "pending" | "approved" | "declined" | "refunded";
  wompi: { transactionId: string; reference: string; paymentMethod?: string };
  createdAt: Date;
  approvedAt?: Date;
}

export interface Assignment {
  id: string;
  courseId: string;
  moduleId?: string;
  title: string;
  instructions: string;
  dueDate: Date;
  maxScore: number;
  status: "active" | "archived";
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Submission {
  id: string;
  assignmentId: string;
  userId: string;
  courseId: string;
  fileUrl: string;
  fileName: string;
  status: "pending" | "graded" | "returned";
  score?: number;
  feedback?: string;
  gradedBy?: string;
  submittedAt: Date;
  gradedAt?: Date;
}

export interface Attendance {
  id: string;
  userId: string;
  courseId: string;
  date: string;
  status: "present" | "absent" | "justified";
  notes?: string;
  recordedBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface LiveClass {
  id: string;
  courseId: string;
  title: string;
  description?: string;
  scheduledAt: Date;
  durationMinutes: number;
  platform: "zoom" | "google_meet";
  meetingUrl: string;
  createdBy: string;
  status: "scheduled" | "completed" | "cancelled";
  createdAt: Date;
  updatedAt: Date;
}

export interface Prayer {
  id: string;
  slug: string;
  title: string;
  text: string;
  order: number;
  audioUrl?: string;
}

export interface PrayerProgress {
  id: string;
  userId: string;
  prayerId: string;
  learned: boolean;
  learnedAt?: Date;
  practiceCount: number;
}

export interface SacramentalRecord {
  id: string;
  userId: string;
  courseId: string;
  sacrament: "bautismo" | "primera_comunion" | "confirmacion";
  status: "not_started" | "in_progress" | "requirements_met" | "scheduled" | "completed";
  requirements: Array<{
    id: string;
    title: string;
    description?: string;
    completed: boolean;
    completedAt?: Date;
    completedBy?: string;
  }>;
  observations: Array<{ text: string; authorId: string; authorRole: string; createdAt: Date }>;
  updatedAt: Date;
}

export interface Certificate {
  id: string;
  userId: string;
  courseId: string;
  enrollmentId: string;
  certificateNumber: string;
  studentName: string;
  courseTitle: string;
  issuedAt: Date;
  issuedBy: string;
  status: "active" | "revoked";
  revokedAt?: Date;
  revokedReason?: string;
  pdfUrl: string;
}

export interface ForumQuestion {
  id: string;
  courseId: string;
  userId: string;
  userName: string;
  title: string;
  body: string;
  status: "open" | "answered" | "closed" | "hidden";
  answerCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ForumAnswer {
  id: string;
  questionId: string;
  userId: string;
  userName: string;
  body: string;
  isOfficial: boolean;
  status: "visible" | "hidden";
  createdAt: Date;
  updatedAt: Date;
}

export interface Notification {
  id: string;
  userId: string;
  type: "payment" | "course" | "assignment" | "certificate" | "forum" | "class" | "system";
  title: string;
  body: string;
  link?: string;
  read: boolean;
  createdAt: Date;
}
