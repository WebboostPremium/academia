'use client'

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { onAuthStateChanged, signOut, type User } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase/client'
import type { AppUser } from '@/types'

interface AuthContextValue {
  firebaseUser: User | null
  appUser: AppUser | null
  loading: boolean
  logout: () => Promise<void>
  refresh: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue>({
  firebaseUser: null,
  appUser: null,
  loading: true,
  logout: async () => {},
  refresh: async () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null)
  const [appUser, setAppUser] = useState<AppUser | null>(null)
  const [loading, setLoading] = useState(true)

  async function loadProfile(user: User | null) {
    if (!user) {
      setAppUser(null)
      return
    }
    const snap = await getDoc(doc(db, 'users', user.uid))
    if (snap.exists()) {
      setAppUser(snap.data() as AppUser)
    }
  }

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user)
      await loadProfile(user)
      setLoading(false)
    })
    return () => unsub()
  }, [])

  async function logout() {
    await fetch('/api/auth', { method: 'DELETE' })
    await signOut(auth)
    setAppUser(null)
    window.location.href = '/login'
  }

  async function refresh() {
    await loadProfile(auth.currentUser)
  }

  return (
    <AuthContext.Provider
      value={{ firebaseUser, appUser, loading, logout, refresh }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
