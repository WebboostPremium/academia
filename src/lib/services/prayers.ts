import { getDocs, setDoc, query, where, orderBy, serverTimestamp } from "firebase/firestore";
import { fsCollection, fsDoc } from "@/lib/firebase/firestore-helpers";
import { toDate } from "@/lib/firebase/converters";
import type { Prayer, PrayerProgress } from "@/types";

export async function getPrayers(): Promise<Prayer[]> {
  const snap = await getDocs(query(fsCollection("prayers"), orderBy("order")));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Prayer));
}

export async function getPrayerProgress(userId: string): Promise<PrayerProgress[]> {
  const snap = await getDocs(query(fsCollection("prayer_progress"), where("userId", "==", userId)));
  return snap.docs.map((d) => {
    const data = d.data();
    return { id: d.id, userId: data.userId, prayerId: data.prayerId, learned: data.learned,
      learnedAt: data.learnedAt ? toDate(data.learnedAt) : undefined, practiceCount: data.practiceCount ?? 0 };
  });
}

export async function markPrayerLearned(userId: string, prayerId: string): Promise<void> {
  const id = `${userId}_${prayerId}`;
  await setDoc(fsDoc("prayer_progress", id), {
    userId, prayerId, learned: true, learnedAt: serverTimestamp(), practiceCount: 1,
  }, { merge: true });
}
