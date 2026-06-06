'use client'

import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
} from 'firebase/auth'
import { doc, setDoc } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase/client'
import { COLLECTIONS } from '@/lib/firebase/collections'

async function establishSession() {
  const idToken = await auth.currentUser?.getIdToken(true)
  if (!idToken) throw new Error('No se pudo obtener el token')
  const res = await fetch('/api/auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken }),
  })
  if (!res.ok) throw new Error('No se pudo iniciar la sesión')
}

export async function loginWithEmail(email: string, password: string) {
  await signInWithEmailAndPassword(auth, email, password)
  await establishSession()
}

export async function registerStudent(
  email: string,
  password: string,
  displayName: string,
) {
  const cred = await createUserWithEmailAndPassword(auth, email, password)
  await updateProfile(cred.user, { displayName })

  const now = Date.now()
  await setDoc(doc(db, COLLECTIONS.users, cred.user.uid), {
    uid: cred.user.uid,
    email,
    displayName,
    role: 'estudiante',
    phone: '',
    enrolledCourses: [],
    active: true,
    createdAt: now,
    updatedAt: now,
  })

  await establishSession()
}

export async function resetPassword(email: string) {
  await sendPasswordResetEmail(auth, email)
}

export function friendlyAuthError(code: string): string {
  const map: Record<string, string> = {
    'auth/invalid-credential': 'Correo o contraseña incorrectos.',
    'auth/invalid-email': 'El correo no es válido.',
    'auth/user-not-found': 'No existe una cuenta con ese correo.',
    'auth/wrong-password': 'Contraseña incorrecta.',
    'auth/email-already-in-use': 'Ya existe una cuenta con ese correo.',
    'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres.',
    'auth/too-many-requests': 'Demasiados intentos. Intenta más tarde.',
  }
  return map[code] ?? 'Ocurrió un error. Inténtalo de nuevo.'
}
