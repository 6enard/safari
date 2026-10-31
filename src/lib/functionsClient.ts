import { auth } from '@/lib/firebase';
import { SUPABASE_URL } from '@/lib/supabaseEnv';

const FUNCTIONS_URL = `${SUPABASE_URL}/functions/v1`;

export async function callFunction<T>(
  name: 'admin' | 'bookings',
  body: Record<string, unknown>,
  needsSignIn: boolean,
): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (needsSignIn) {
    const token = await auth.currentUser?.getIdToken();
    if (!token) throw new Error('Please sign in to continue.');
    headers.Authorization = `Bearer ${token}`;
  }
  let res: Response;
  try {
    res = await fetch(`${FUNCTIONS_URL}/${name}`, { method: 'POST', headers, body: JSON.stringify(body) });
  } catch {
    throw new Error('Network problem. Check your connection and try again.');
  }
  const json = await res.json().catch(() => null);
  if (!res.ok) throw new Error(json?.error ?? 'Something went wrong. Please try again.');
  return json as T;
}
