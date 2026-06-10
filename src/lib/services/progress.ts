import { getCourse, getModules, getLessons } from "./courses";
import { getEnrollment, updateEnrollmentProgress } from "./enrollments";
import { getQuizResults } from "./quizzes";
import type { Enrollment } from "@/types/course";

export async function recalculateProgress(userId: string, courseId: string): Promise<Enrollment | null> {
  const enrollment = await getEnrollment(userId, courseId);
  if (!enrollment) return null;

  const [course, modules, lessons] = await Promise.all([
    getCourse(courseId), getModules(courseId), getLessons(courseId),
  ]);
  if (!course) return enrollment;

  const totalLessons = lessons.filter((l) => l.status === "published").length;
  const lessonQuizzes = lessons.filter((l) => l.quizId).length;
  const lessonsDone = enrollment.progress.lessonsCompleted?.length ?? 0;
  const quizzesPassed = enrollment.progress.quizzesPassed?.length ?? 0;
  const finalPassed = enrollment.progress.finalExamPassed;

  let percent = 0;
  if (totalLessons > 0) percent += (lessonsDone / totalLessons) * 60;
  if (lessonQuizzes > 0) percent += (quizzesPassed / lessonQuizzes) * 25;
  if (finalPassed) percent += 15;

  const allResults = await Promise.all(
    (enrollment.progress.quizzesPassed ?? []).map((qid) => getQuizResults(userId, qid))
  );
  const scores = allResults.flat().map((r) => r.score);
  const averageScore = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

  const modulesCompleted = modules
    .filter((m) => m.lessonOrder.every((lid) => (enrollment.progress.lessonsCompleted ?? []).includes(lid)))
    .map((m) => m.id);

  await updateEnrollmentProgress(enrollment.id, {
    percentComplete: Math.round(Math.min(percent, 100)),
    modulesCompleted, averageScore,
    finalExamPassed: finalPassed,
  });

  return { ...enrollment, progress: { ...enrollment.progress, percentComplete: Math.round(percent), modulesCompleted, averageScore } };
}
