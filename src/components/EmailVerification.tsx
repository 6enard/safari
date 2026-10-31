import { useState } from 'react';
import { reload, sendEmailVerification } from 'firebase/auth';
import { Loader as Loader2, MailCheck, RefreshCw, ShieldAlert } from 'lucide-react';
import { useAuth } from '@/lib/authContext';
import { auth } from '@/lib/firebase';

type Notice = { tone: 'success' | 'error'; text: string };

export function EmailVerification() {
  const { user, refreshUser } = useAuth();
  const [sending, setSending] = useState(false);
  const [checking, setChecking] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);

  if (!user || user.emailVerified) return null;

  async function handleSend() {
    if (!auth.currentUser) return;
    setSending(true);
    setNotice(null);
    try {
      await sendEmailVerification(auth.currentUser);
      setNotice({ tone: 'success', text: `We sent a link to ${user?.email}. Open it, then press "I've verified".` });
    } catch {
      setNotice({ tone: 'error', text: 'We could not send the email right now. Please wait a moment and try again.' });
    } finally {
      setSending(false);
    }
  }

  async function handleCheck() {
    if (!auth.currentUser) return;
    setChecking(true);
    setNotice(null);
    try {
      await reload(auth.currentUser);
      refreshUser();
      if (!auth.currentUser.emailVerified) {
        setNotice({ tone: 'error', text: 'Your email is not verified yet. Click the link in the email, then try again.' });
      }
    } catch {
      setNotice({ tone: 'error', text: 'We could not check your status. Please try again.' });
    } finally {
      setChecking(false);
    }
  }

  return (
    <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm animate-slide-up">
      <div className="flex items-start gap-4">
        <span className="inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
          <ShieldAlert className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-slate-900">Verify your email address</p>
          <p className="mt-1 text-sm text-slate-700">
            Confirm your email to secure your account and unlock protected features.
          </p>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={handleSend}
              disabled={sending}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-500 to-teal-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-brand-500/25 transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <MailCheck className="h-4 w-4" />}
              Send verification email
            </button>
            <button
              type="button"
              onClick={handleCheck}
              disabled={checking}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-all hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {checking ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              I've verified
            </button>
          </div>
          {notice && (
            <p
              role={notice.tone === 'error' ? 'alert' : 'status'}
              className={`mt-3 text-sm ${notice.tone === 'error' ? 'text-red-700' : 'text-slate-700'}`}
            >
              {notice.text}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
