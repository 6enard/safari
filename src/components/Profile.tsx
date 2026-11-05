import { useEffect, useRef, useState } from 'react';
import { updateProfile } from 'firebase/auth';
import { ArrowLeft, Mail, Calendar, User as UserIcon, Pencil, Loader as Loader2, Check, X, Camera } from 'lucide-react';
import { PhotoBackdrop } from '@/components/PhotoBackdrop';
import { EmailVerification } from '@/components/EmailVerification';
import { useAuth } from '@/lib/authContext';
import { auth } from '@/lib/firebase';
import { db } from '@/lib/db';
import { imageFileToAvatarDataUrl } from '@/lib/avatarImage';
import { formatDateTime } from '@/lib/format';

type Props = {
  onBack: () => void;
};

const inputClass =
  'w-full rounded-xl border border-slate-300 bg-slate-50/50 px-4 py-2.5 text-sm outline-none transition-all focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-200';

export function Profile({ onBack }: Props) {
  const { user, refreshUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedNotice, setSavedNotice] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarBusy, setAvatarBusy] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    db.getAvatarUrl().then(setAvatarUrl).catch(() => setAvatarUrl(null));
  }, []);

  if (!user) return null;

  const displayName = user.displayName ?? 'Traveler';
  const initial = displayName.charAt(0).toUpperCase();

  function startEditing() {
    setName(user?.displayName ?? '');
    setError(null);
    setEditing(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (trimmed.length < 2 || !auth.currentUser) return;
    setSaving(true);
    setError(null);
    try {
      await updateProfile(auth.currentUser, { displayName: trimmed });
      refreshUser();
      setEditing(false);
      setSavedNotice(true);
      setTimeout(() => setSavedNotice(false), 2500);
    } catch {
      setError('We could not save your name. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setAvatarError('Please choose an image file (JPG, PNG or WebP).');
      return;
    }
    setAvatarBusy(true);
    setAvatarError(null);
    try {
      const dataUrl = await imageFileToAvatarDataUrl(file);
      setAvatarUrl(await db.updateAvatar(dataUrl));
    } catch (err) {
      setAvatarError(err instanceof Error ? err.message : 'We could not update your photo. Please try again.');
    } finally {
      setAvatarBusy(false);
    }
  }

  const details = [
    { icon: UserIcon, label: 'Full name', value: user.displayName ?? 'Not set' },
    { icon: Mail, label: 'Email', value: user.email ?? 'Not set' },
    {
      icon: Calendar,
      label: 'Member since',
      value: user.createdAt ? formatDateTime(user.createdAt) : 'Not available',
    },
  ];

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <button
        type="button"
        onClick={onBack}
        className="group mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition-colors hover:text-brand-700"
      >
        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" /> Back to booking
      </button>

      <div className="relative mb-8 overflow-hidden rounded-2xl bg-brand-800 p-6 text-white shadow-xl shadow-brand-900/20 animate-slide-up sm:p-8">
        <PhotoBackdrop />
        <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        <div className="relative flex items-center gap-5">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={avatarBusy}
            aria-label="Change profile photo"
            className="group relative inline-flex h-16 w-16 flex-shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white/20 text-2xl font-bold ring-1 ring-white/30 transition-transform hover:scale-105 disabled:cursor-wait"
          >
            {avatarUrl ? <img src={avatarUrl} alt="" className="h-full w-full object-cover" /> : initial}
            <span className={`absolute inset-0 flex items-center justify-center bg-slate-900/50 transition-opacity ${avatarBusy ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100'}`}>
              {avatarBusy ? <Loader2 className="h-5 w-5 animate-spin" /> : <Camera className="h-5 w-5" />}
            </span>
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-wide text-brand-100">Your profile</p>
            <h1 className="truncate text-2xl font-bold sm:text-3xl">{displayName}</h1>
            {user.email && <p className="truncate text-sm text-brand-50">{user.email}</p>}
          </div>
        </div>
      </div>

      {avatarError && (
        <div role="alert" className="mb-6 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 animate-fade-in">
          {avatarError}
        </div>
      )}

      {savedNotice && (
        <div role="status" className="mb-6 inline-flex items-center gap-2 rounded-xl border border-brand-200 bg-brand-50 px-4 py-2.5 text-sm font-medium text-brand-700 animate-fade-in">
          <Check className="h-4 w-4" /> Your profile has been updated.
        </div>
      )}

      <EmailVerification />

      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm animate-slide-up animate-delay-100">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Account details</h2>
          {!editing && (
            <button
              type="button"
              onClick={startEditing}
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold text-brand-700 transition-colors hover:bg-brand-50"
            >
              <Pencil className="h-3.5 w-3.5" /> Edit name
            </button>
          )}
        </div>

        {editing ? (
          <form onSubmit={handleSave} className="space-y-4 p-6 animate-fade-in">
            <div>
              <label htmlFor="profile-name" className="mb-1 block text-sm font-medium text-slate-700">
                Full name
              </label>
              <input
                id="profile-name"
                type="text"
                required
                minLength={2}
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={inputClass}
              />
            </div>
            {error && (
              <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            )}
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-all hover:bg-slate-50"
              >
                <X className="h-4 w-4" /> Cancel
              </button>
              <button
                type="submit"
                disabled={saving || name.trim().length < 2}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-500 to-brand-700 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-brand-500/25 transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                Save name
              </button>
            </div>
          </form>
        ) : (
          <dl className="divide-y divide-slate-100">
            {details.map((d) => {
              const Icon = d.icon;
              return (
                <div key={d.label} className="flex items-center gap-4 px-6 py-4">
                  <span className="inline-flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <dt className="text-xs uppercase tracking-wide text-slate-500">{d.label}</dt>
                    <dd className="truncate text-sm font-medium text-slate-800">{d.value}</dd>
                  </div>
                </div>
              );
            })}
          </dl>
        )}
      </div>
    </div>
  );
}
