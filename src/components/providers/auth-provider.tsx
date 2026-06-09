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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  const loadUser = useCallback(async (fbUser: User | null) => {
    if (!fbUser) {
      setUser(null);
      return null;
    }
    const profile = await getUserDocument(fbUser.uid);
    setUser(profile);
    return profile;
  }, []);

  const refreshSession = useCallback(async () => {
    const fbUser = getClientAuth().currentUser;
    if (!fbUser) return null;

    const idToken = await fbUser.getIdToken(true);
    await fetch("/api/auth/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
    });

    const sessionRes = await fetch("/api/auth/session");
    const sessionData = await sessionRes.json();
    const profile = await loadUser(fbUser);
    return profile ?? sessionData.user ?? null;
  }, [loadUser]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(getClientAuth(), async (fbUser) => {
      setFirebaseUser(fbUser);
      try {
        if (fbUser) {
          await loadUser(fbUser);
          // Sincronizar cookie sin bloquear la UI
          fbUser
            .getIdToken()
            .then((idToken) =>
              fetch("/api/auth/session", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ idToken }),
              })
            )
            .catch(() => {});
        } else {
          setUser(null);
        }
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    });
    return unsubscribe;
  }, [loadUser]);

  const signOut = useCallback(async () => {
    await fetch("/api/auth/session", { method: "DELETE" });
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
