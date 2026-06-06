import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  type QueryConstraint,
} from 'firebase/firestore'
import { db } from '@/lib/firebase/client'

/**
 * Helpers genéricos del lado del cliente para Firestore.
 * Las operaciones sensibles (crear usuarios, asignar roles, emitir
 * certificados) se realizan en Route Handlers con el Admin SDK.
 */

export async function getOne<T>(
  col: string,
  id: string,
): Promise<T | null> {
  const snap = await getDoc(doc(db, col, id))
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as T) : null
}

export async function getMany<T>(
  col: string,
  ...constraints: QueryConstraint[]
): Promise<T[]> {
  const q = query(collection(db, col), ...constraints)
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as T)
}

export async function create<T extends Record<string, unknown>>(
  col: string,
  data: T,
): Promise<string> {
  const ref = await addDoc(collection(db, col), {
    ...data,
    createdAt: Date.now(),
  })
  return ref.id
}

export async function upsert<T extends Record<string, unknown>>(
  col: string,
  id: string,
  data: T,
): Promise<void> {
  await setDoc(doc(db, col, id), data, { merge: true })
}

export async function update<T extends Record<string, unknown>>(
  col: string,
  id: string,
  data: Partial<T>,
): Promise<void> {
  await updateDoc(doc(db, col, id), data as Record<string, unknown>)
}

export async function remove(col: string, id: string): Promise<void> {
  await deleteDoc(doc(db, col, id))
}

export { where, orderBy, serverTimestamp }
