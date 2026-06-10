"use client";

import { createContext, useCallback, useEffect, useMemo, useState } from "react";
import { onAuthStateChanged, signOut as firebaseSignOut, type User } from "firebase/auth";
import { getClientAuth } from "@/lib/firebase/client";
import { getUserDocument } from "@/lib/services/users";
import type { AppUser } from "@/types/user";

interface AuthContextValue {
  firebaseUser: User | null;
  user: AppUser | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
  refreshSession: () => Promise<AppUser | null>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

async function syncSessionCookie(idToken: string) {
  await fetch("/api/auth/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken }),
    credentials: "same-origin",
  });
}

async function loadProfileFromSession(): Promise<AppUser | null> {
  const sessionRes = await fetch("/api/auth/session", { credentials: "same-origin" });
  if (!sessionRes.ok) return null;
  const sessionData = await sessionRes.json();
  const sessionUser = sessionData.user as AppUser | null;
  if (!sessionUser) return null;
  return {
    ...sessionUser,
    studyTimeMinutes: sessionUser.studyTimeMinutes ?? 0,
    achievements: sessionUser.achievements ?? [],
    createdAt: sessionUser.createdAt ? new Date(sessionUser.createdAt) : new Date(),
    updatedAt: sessionUser.updatedAt ? new Date(sessionUser.updatedAt) : new Date(),
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  const loadUser = useCallback(async (fbUser: User | null) => {
    if (!fbUser) {
      setUser(null);
      return null;
    }
    try {
      const profile = await getUserDocument(fbUser.uid);
      if (profile) {
        setUser(profile);
        return profile;
      }
    } catch {
      // Firestore puede fallar temporalmente; usar sesión del servidor
    }
    const fallback = await loadProfileFromSession();
    setUser(fallback);
    return fallback;
  }, []);

  const refreshSession = useCallback(async () => {
    const fbUser = getClientAuth().currentUser;
    if (!fbUser) return null;

    const idToken = await fbUser.getIdToken(true);
    await syncSessionCookie(idToken);
    return loadUser(fbUser);
  }, [loadUser]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(getClientAuth(), async (fbUser) => {
      setFirebaseUser(fbUser);
      try {
        if (fbUser) {
          const idToken = await fbUser.getIdToken();
          await syncSessionCookie(idToken);
          await loadUser(fbUser);
        } else {
          setUser(null);
        }
      } catch {
        const fallback = fbUser ? await loadProfileFromSession() : null;
        setUser(fallback);
      } finally {
        setLoading(false);
      }
    });
    return unsubscribe;
  }, [loadUser]);

  const signOut = useCallback(async () => {
    await fetch("/api/auth/session", { method: "DELETE", credentials: "same-origin" });
    await firebaseSignOut(getClientAuth());
    setUser(null);
    setFirebaseUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    await refreshSession();
  }, [refreshSession]);

  const value = useMemo(
    () => ({ firebaseUser, user, loading, signOut, refreshUser, refreshSession }),
    [firebaseUser, user, loading, signOut, refreshUser, refreshSession]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
