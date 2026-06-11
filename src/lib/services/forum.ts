import {
  addDoc,
  deleteDoc,
  getDoc,
  getDocs,
  increment,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { getClientDb } from "@/lib/firebase/client";
import { fsCollection, fsDoc } from "@/lib/firebase/firestore-helpers";
import { toDate } from "@/lib/firebase/converters";
import type { ForumAnswer, ForumQuestion } from "@/types";

function mapQuestion(id: string, data: Record<string, unknown>): ForumQuestion {
  return {
    id,
    courseId: data.courseId as string,
    userId: data.userId as string,
    userName: data.userName as string,
    title: data.title as string,
    body: data.body as string,
    status: data.status as ForumQuestion["status"],
    answerCount: (data.answerCount as number) ?? 0,
    createdAt: toDate(data.createdAt as never),
    updatedAt: toDate(data.updatedAt as never),
  };
}

function mapAnswer(id: string, data: Record<string, unknown>): ForumAnswer {
  return {
    id,
    questionId: data.questionId as string,
    userId: data.userId as string,
    userName: data.userName as string,
    body: data.body as string,
    isOfficial: (data.isOfficial as boolean) ?? false,
    status: (data.status as ForumAnswer["status"]) ?? "visible",
    createdAt: toDate(data.createdAt as never),
    updatedAt: toDate(data.updatedAt as never),
  };
}

export async function getQuestions(courseId: string): Promise<ForumQuestion[]> {
  try {
    const snap = await getDocs(
      query(
        fsCollection("forum_questions"),
        where("courseId", "==", courseId),
        orderBy("createdAt", "desc")
      )
    );
    return snap.docs.map((d) => mapQuestion(d.id, d.data()));
  } catch {
    const snap = await getDocs(
      query(fsCollection("forum_questions"), where("courseId", "==", courseId))
    );
    return snap.docs
      .map((d) => mapQuestion(d.id, d.data()))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
}

export async function createQuestion(data: {
  courseId: string;
  userId: string;
  userName: string;
  title: string;
  body: string;
}): Promise<string> {
  const ref = await addDoc(fsCollection("forum_questions"), {
    courseId: data.courseId,
    userId: data.userId,
    userName: data.userName,
    title: data.title.trim(),
    body: data.body.trim(),
    status: "open",
    answerCount: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateQuestionStatus(
  id: string,
  status: ForumQuestion["status"]
): Promise<void> {
  await updateDoc(fsDoc("forum_questions", id), {
    status,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteQuestion(id: string): Promise<void> {
  const answers = await getDocs(
    query(fsCollection("forum_answers"), where("questionId", "==", id))
  );
  const batch = writeBatch(getClientDb());
  answers.docs.forEach((d) => batch.delete(d.ref));
  batch.delete(fsDoc("forum_questions", id));
  await batch.commit();
}

export async function getAnswers(questionId: string): Promise<ForumAnswer[]> {
  try {
    const snap = await getDocs(
      query(
        fsCollection("forum_answers"),
        where("questionId", "==", questionId),
        orderBy("createdAt", "asc")
      )
    );
    return snap.docs.map((d) => mapAnswer(d.id, d.data()));
  } catch {
    const snap = await getDocs(
      query(fsCollection("forum_answers"), where("questionId", "==", questionId))
    );
    return snap.docs
      .map((d) => mapAnswer(d.id, d.data()))
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }
}

export async function createAnswer(data: {
  questionId: string;
  userId: string;
  userName: string;
  body: string;
  isOfficial?: boolean;
}): Promise<string> {
  const questionRef = fsDoc("forum_questions", data.questionId);
  const question = await getDoc(questionRef);
  if (!question.exists()) throw new Error("Pregunta no encontrada");

  const ref = await addDoc(fsCollection("forum_answers"), {
    questionId: data.questionId,
    userId: data.userId,
    userName: data.userName,
    body: data.body.trim(),
    isOfficial: data.isOfficial !== false,
    status: "visible",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  await updateDoc(questionRef, {
    answerCount: increment(1),
    status: "answered",
    updatedAt: serverTimestamp(),
  });

  return ref.id;
}

export async function hideAnswer(id: string): Promise<void> {
  await updateDoc(fsDoc("forum_answers", id), {
    status: "hidden",
    updatedAt: serverTimestamp(),
  });
}
