import { createContext, useContext } from 'react';

export type AuthUser = {
  uid: string;
  email: string | null;
  displayName: string | null;
};

export type AuthState = {
  user: AuthUser | null;
  loading: boolean;
  refreshUser: () => void;
};

export const AuthContext = createContext<AuthState | null>(null);

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
