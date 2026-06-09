import { toDate } from "@/lib/firebase/converters";
import type { ForumQuestion, ForumAnswer } from "@/types";

async function forumFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { ...init, credentials: "same-origin" });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((data as { error?: string }).error ?? "Error en el foro");
  }
  return data as T;
}

function mapQuestion(raw: Record<string, unknown>): ForumQuestion {
  return {
    id: raw.id as string,
    courseId: raw.courseId as string,
    userId: raw.userId as string,
    userName: raw.userName as string,
    title: raw.title as string,
    body: raw.body as string,
    status: raw.status as ForumQuestion["status"],
    answerCount: (raw.answerCount as number) ?? 0,
    createdAt: toDate(raw.createdAt as never),
    updatedAt: toDate(raw.updatedAt as never),
  };
}

function mapAnswer(raw: Record<string, unknown>): ForumAnswer {
  return {
    id: raw.id as string,
    questionId: raw.questionId as string,
    userId: raw.userId as string,
    userName: raw.userName as string,
    body: raw.body as string,
    isOfficial: (raw.isOfficial as boolean) ?? false,
    status: (raw.status as ForumAnswer["status"]) ?? "visible",
    createdAt: toDate(raw.createdAt as never),
    updatedAt: toDate(raw.updatedAt as never),
  };
}

export async function getQuestions(courseId: string): Promise<ForumQuestion[]> {
  const data = await forumFetch<{ questions: Record<string, unknown>[] }>(
    `/api/forum/questions?courseId=${encodeURIComponent(courseId)}`
  );
  return data.questions.map(mapQuestion);
}

export async function createQuestion(data: {
  courseId: string;
  userId: string;
  userName: string;
  title: string;
  body: string;
}): Promise<string> {
  const result = await forumFetch<{ question: Record<string, unknown> }>("/api/forum/questions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      courseId: data.courseId,
      title: data.title,
      body: data.body,
    }),
  });
  return result.question.id as string;
}

export async function updateQuestionStatus(id: string, status: ForumQuestion["status"]): Promise<void> {
  await forumFetch(`/api/forum/questions/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
}

export async function deleteQuestion(id: string): Promise<void> {
  await forumFetch(`/api/forum/questions/${id}`, { method: "DELETE" });
}

export async function getAnswers(questionId: string): Promise<ForumAnswer[]> {
  const data = await forumFetch<{ answers: Record<string, unknown>[] }>(
    `/api/forum/answers?questionId=${encodeURIComponent(questionId)}`
  );
  return data.answers.map(mapAnswer);
}

export async function createAnswer(data: {
  questionId: string;
  userId: string;
  userName: string;
  body: string;
  isOfficial?: boolean;
}): Promise<string> {
  const result = await forumFetch<{ answer: Record<string, unknown> }>("/api/forum/answers", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      questionId: data.questionId,
      body: data.body,
      isOfficial: data.isOfficial,
    }),
  });
  return result.answer.id as string;
}

export async function hideAnswer(id: string): Promise<void> {
  await forumFetch(`/api/forum/answers/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: "hidden" }),
  });
}
