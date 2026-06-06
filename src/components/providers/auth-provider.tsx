"use client";

import { createContext, useCallback, useEffect, useMemo, useState } from "react";
import { onAuthStateChanged, signOut as firebaseSignOut, type User } from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import { getUserDocument } from "@/lib/services/users";
import type { AppUser } from "@/types/user";

interface AuthContextValue {
  firebaseUser: User | null;
  user: AppUser | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  const loadUser = useCallback(async (fbUser: User | null) => {
    if (!fbUser) {
      setUser(null);
      return;
    }
    const profile = await getUserDocument(fbUser.uid);
    setUser(profile);
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      await loadUser(fbUser);
      setLoading(false);
    });
    return unsubscribe;
  }, [loadUser]);

  const signOut = useCallback(async () => {
    await fetch("/api/auth/session", { method: "DELETE" });
    await firebaseSignOut(auth);
    setUser(null);
    setFirebaseUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    if (firebaseUser) {
      await loadUser(firebaseUser);
    }
  }, [firebaseUser, loadUser]);

  const value = useMemo(
    () => ({ firebaseUser, user, loading, signOut, refreshUser }),
    [firebaseUser, user, loading, signOut, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
