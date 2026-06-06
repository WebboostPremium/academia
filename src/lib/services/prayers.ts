import { collection, doc, getDocs, setDoc, query, where, orderBy, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { toDate } from "@/lib/firebase/converters";
import type { Prayer, PrayerProgress } from "@/types";

const prayersCol = collection(db, "prayers");
const progressCol = collection(db, "prayer_progress");

export async function getPrayers(): Promise<Prayer[]> {
  const snap = await getDocs(query(prayersCol, orderBy("order")));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Prayer));
}

export async function getPrayerProgress(userId: string): Promise<PrayerProgress[]> {
  const snap = await getDocs(query(progressCol, where("userId", "==", userId)));
  return snap.docs.map((d) => {
    const data = d.data();
    return { id: d.id, userId: data.userId, prayerId: data.prayerId, learned: data.learned,
      learnedAt: data.learnedAt ? toDate(data.learnedAt) : undefined, practiceCount: data.practiceCount ?? 0 };
  });
}

export async function markPrayerLearned(userId: string, prayerId: string): Promise<void> {
  const id = `${userId}_${prayerId}`;
  await setDoc(doc(db, "prayer_progress", id), {
    userId, prayerId, learned: true, learnedAt: serverTimestamp(), practiceCount: 1,
  }, { merge: true });
}
