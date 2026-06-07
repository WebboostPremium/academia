import { getDocs, addDoc, updateDoc, deleteDoc, query, where, orderBy, serverTimestamp, increment } from "firebase/firestore";
import { fsCollection, fsDoc } from "@/lib/firebase/firestore-helpers";
import { toDate } from "@/lib/firebase/converters";
import { sanitizeText } from "@/lib/utils/sanitize";
import type { ForumQuestion, ForumAnswer } from "@/types";

export async function getQuestions(courseId: string): Promise<ForumQuestion[]> {
  const snap = await getDocs(query(fsCollection("forum_questions"), where("courseId", "==", courseId), orderBy("createdAt", "desc")));
  return snap.docs.map((d) => {
    const data = d.data();
    return { id: d.id, ...data, createdAt: toDate(data.createdAt), updatedAt: toDate(data.updatedAt) } as ForumQuestion;
  });
}

export async function createQuestion(data: { courseId: string; userId: string; userName: string; title: string; body: string }): Promise<string> {
  const ref = await addDoc(fsCollection("forum_questions"), {
    ...data, title: sanitizeText(data.title), body: sanitizeText(data.body),
    status: "open", answerCount: 0, createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateQuestionStatus(id: string, status: ForumQuestion["status"]): Promise<void> {
  await updateDoc(fsDoc("forum_questions", id), { status, updatedAt: serverTimestamp() });
}

export async function deleteQuestion(id: string): Promise<void> {
  await deleteDoc(fsDoc("forum_questions", id));
}

export async function getAnswers(questionId: string): Promise<ForumAnswer[]> {
  const snap = await getDocs(query(fsCollection("forum_answers"), where("questionId", "==", questionId), orderBy("createdAt", "asc")));
  return snap.docs.map((d) => {
    const data = d.data();
    return { id: d.id, ...data, createdAt: toDate(data.createdAt), updatedAt: toDate(data.updatedAt) } as ForumAnswer;
  });
}

export async function createAnswer(data: { questionId: string; userId: string; userName: string; body: string; isOfficial?: boolean }): Promise<string> {
  const ref = await addDoc(fsCollection("forum_answers"), {
    ...data, body: sanitizeText(data.body), isOfficial: data.isOfficial ?? false,
    status: "visible", createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
  });
  await updateDoc(fsDoc("forum_questions", data.questionId), {
    answerCount: increment(1), status: "answered", updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function hideAnswer(id: string): Promise<void> {
  await updateDoc(fsDoc("forum_answers", id), { status: "hidden", updatedAt: serverTimestamp() });
}
