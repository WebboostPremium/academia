import {
  addDoc,
  getDoc,
  getDocs,
  increment,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
  type QueryConstraint,
} from "firebase/firestore";
import { getClientDb } from "@/lib/firebase/client";
import { fsCollection, fsDoc } from "@/lib/firebase/firestore-helpers";
import { toDate } from "@/lib/firebase/converters";
import type { ForumAnswer, ForumQuestion } from "@/types";

const VISIBLE_QUESTION_STATUSES = ["open", "answered", "closed"];

function firestoreErrorMessage(err: unknown): string {
  if (err && typeof err === "object" && "code" in err) {
    const code = String((err as { code: string }).code);
    if (code === "permission-denied") {
      return "Sin permiso para acceder al foro. Verifica tu inscripción activa.";
    }
  }
  return err instanceof Error ? err.message : "Error en el foro";
}

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

export async function getQuestions(
  courseId: string,
  options?: { includeHidden?: boolean }
): Promise<ForumQuestion[]> {
  const includeHidden = options?.includeHidden ?? false;

  async function fetchQuestions(withOrder: boolean) {
    const constraints: QueryConstraint[] = [where("courseId", "==", courseId)];
    if (!includeHidden) {
      constraints.push(where("status", "in", VISIBLE_QUESTION_STATUSES));
    }
    if (withOrder) {
      constraints.push(orderBy("createdAt", "desc"));
    }
    const snap = await getDocs(query(fsCollection("forum_questions"), ...constraints));
    return snap.docs.map((d) => mapQuestion(d.id, d.data()));
  }

  try {
    return await fetchQuestions(true);
  } catch {
    try {
      const results = await fetchQuestions(false);
      return results.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    } catch (err) {
      throw new Error(firestoreErrorMessage(err));
    }
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

export async function getAnswers(
  questionId: string,
  options?: { includeHidden?: boolean }
): Promise<ForumAnswer[]> {
  const includeHidden = options?.includeHidden ?? false;

  async function fetchAnswers(withOrder: boolean) {
    const constraints: QueryConstraint[] = [where("questionId", "==", questionId)];
    if (!includeHidden) {
      constraints.push(where("status", "==", "visible"));
    }
    if (withOrder) {
      constraints.push(orderBy("createdAt", "asc"));
    }
    const snap = await getDocs(query(fsCollection("forum_answers"), ...constraints));
    return snap.docs.map((d) => mapAnswer(d.id, d.data()));
  }

  try {
    return await fetchAnswers(true);
  } catch {
    try {
      const results = await fetchAnswers(false);
      return results.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    } catch (err) {
      throw new Error(firestoreErrorMessage(err));
    }
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
