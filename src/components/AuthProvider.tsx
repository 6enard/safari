import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { AuthContext, type AuthUser } from '@/lib/authContext';

function toAuthUser(u: User | null): AuthUser | null {
  return u
    ? {
        uid: u.uid,
        email: u.email,
        displayName: u.displayName,
        createdAt: u.metadata.creationTime ?? null,
        emailVerified: u.emailVerified,
      }
    : null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(
    () =>
      onAuthStateChanged(auth, (u) => {
        setUser(toAuthUser(u));
        setLoading(false);
      }),
    [],
  );

  const refreshUser = useCallback(() => setUser(toAuthUser(auth.currentUser)), []);

  const value = useMemo(() => ({ user, loading, refreshUser }), [user, loading, refreshUser]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
