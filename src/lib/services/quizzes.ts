import { getDoc, getDocs, addDoc, updateDoc, deleteDoc, query, where, orderBy, serverTimestamp } from "firebase/firestore";
import { fsCollection, fsDoc } from "@/lib/firebase/firestore-helpers";
import { toDate } from "@/lib/firebase/converters";
import type { Quiz, QuizResult } from "@/types/course";

function mapQuiz(id: string, d: Record<string, unknown>): Quiz {
  return {
    id, courseId: d.courseId as string, lessonId: d.lessonId as string | undefined,
    type: d.type as Quiz["type"], title: d.title as string, description: d.description as string | undefined,
    passingScore: (d.passingScore as number) ?? 70, maxAttempts: (d.maxAttempts as number) ?? 3,
    timeLimitMinutes: d.timeLimitMinutes as number | undefined,
    questions: (d.questions as Quiz["questions"]) ?? [],
    shuffleQuestions: (d.shuffleQuestions as boolean) ?? true,
    shuffleOptions: (d.shuffleOptions as boolean) ?? true,
    status: d.status as Quiz["status"],
    createdAt: toDate(d.createdAt as never), updatedAt: toDate(d.updatedAt as never),
  };
}

export async function getQuizzes(courseId?: string): Promise<Quiz[]> {
  const q = courseId ? query(fsCollection("quizzes"), where("courseId", "==", courseId)) : query(fsCollection("quizzes"));
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => mapQuiz(d.id, d.data()))
    .sort((a, b) => a.title.localeCompare(b.title, "es"));
}

export async function getQuiz(id: string): Promise<Quiz | null> {
  const snap = await getDoc(fsDoc("quizzes", id));
  return snap.exists() ? mapQuiz(snap.id, snap.data()) : null;
}

export async function createQuiz(data: Omit<Quiz, "id" | "createdAt" | "updatedAt">): Promise<string> {
  const ref = await addDoc(fsCollection("quizzes"), { ...data, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
  return ref.id;
}

export async function updateQuiz(id: string, data: Partial<Quiz>): Promise<void> {
  await updateDoc(fsDoc("quizzes", id), { ...data, updatedAt: serverTimestamp() });
}

export async function deleteQuiz(id: string): Promise<void> {
  await deleteDoc(fsDoc("quizzes", id));
}

export async function getQuizResults(userId: string, quizId: string): Promise<QuizResult[]> {
  const snap = await getDocs(query(fsCollection("quiz_results"), where("userId", "==", userId), where("quizId", "==", quizId), orderBy("attemptNumber")));
  return snap.docs.map((d) => {
    const data = d.data();
    return { id: d.id, userId: data.userId, quizId: data.quizId, courseId: data.courseId,
      lessonId: data.lessonId, attemptNumber: data.attemptNumber, score: data.score,
      passed: data.passed, answers: data.answers,
      startedAt: toDate(data.startedAt), completedAt: toDate(data.completedAt) } as QuizResult;
  });
}

export async function submitQuizResult(data: Omit<QuizResult, "id">): Promise<string> {
  const ref = await addDoc(fsCollection("quiz_results"), { ...data, startedAt: data.startedAt, completedAt: data.completedAt });
  return ref.id;
}

export function gradeQuiz(quiz: Quiz, answers: Record<string, string>): { score: number; passed: boolean; graded: QuizResult["answers"] } {
  const graded = quiz.questions.map((q) => {
    const selected = answers[q.id];
    const correct = q.options.find((o) => o.isCorrect);
    const isCorrect = selected === correct?.id;
    return { questionId: q.id, selectedOptionId: selected ?? "", isCorrect };
  });
  const correctCount = graded.filter((a) => a.isCorrect).length;
  const score = quiz.questions.length ? Math.round((correctCount / quiz.questions.length) * 100) : 0;
  return { score, passed: score >= quiz.passingScore, graded };
}
