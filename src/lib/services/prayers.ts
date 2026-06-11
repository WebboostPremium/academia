import { getDocs, setDoc, addDoc, updateDoc, deleteDoc, query, where, orderBy, serverTimestamp } from "firebase/firestore";
import { fsCollection, fsDoc } from "@/lib/firebase/firestore-helpers";
import { toDate } from "@/lib/firebase/converters";
import type { Prayer, PrayerProgress } from "@/types";

function slugify(text: string) {
  return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export async function getPrayers(): Promise<Prayer[]> {
  try {
    const snap = await getDocs(query(fsCollection("prayers"), orderBy("order")));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Prayer));
  } catch {
    const snap = await getDocs(fsCollection("prayers"));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Prayer)).sort((a, b) => a.order - b.order);
  }
}

export async function createPrayer(data: Omit<Prayer, "id">): Promise<string> {
  const ref = await addDoc(fsCollection("prayers"), {
    slug: data.slug || slugify(data.title),
    title: data.title,
    text: data.text,
    order: data.order,
    audioUrl: data.audioUrl ?? null,
  });
  return ref.id;
}

export async function updatePrayer(id: string, data: Partial<Prayer>): Promise<void> {
  await updateDoc(fsDoc("prayers", id), { ...data, audioUrl: data.audioUrl ?? null });
}

export async function deletePrayer(id: string): Promise<void> {
  await deleteDoc(fsDoc("prayers", id));
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
