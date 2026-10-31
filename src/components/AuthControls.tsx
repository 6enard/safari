import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { signOut } from 'firebase/auth';
import { ChevronDown, LogIn, LogOut, Ticket, CircleUser as UserCircle } from 'lucide-react';
import { AuthDialog } from '@/components/AuthDialog';
import { useAuth } from '@/lib/authContext';
import { auth } from '@/lib/firebase';

type Props = {
  onOpenProfile: () => void;
  onOpenBookings: () => void;
};

export function AuthControls({ onOpenProfile, onOpenBookings }: Props) {
  const { user, loading } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    function onPointerDown(e: MouseEvent) {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setMenuOpen(false);
    }
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

  if (loading) return <div className="h-9 w-24" aria-hidden />;

  if (!user) {
    return (
      <>
        <button
          type="button"
          onClick={() => setDialogOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:border-brand-300 hover:text-brand-700 hover:shadow-md"
        >
          <LogIn className="h-4 w-4" /> Sign in
        </button>
        {dialogOpen && createPortal(<AuthDialog onClose={() => setDialogOpen(false)} />, document.body)}
      </>
    );
  }

  const label = user.displayName ?? user.email ?? 'Account';
  const initial = label.charAt(0).toUpperCase();

  async function handleSignOut() {
    setMenuOpen(false);
    await signOut(auth);
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setMenuOpen((open) => !open)}
        aria-expanded={menuOpen}
        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white py-1.5 pl-1.5 pr-3 text-sm font-medium text-slate-700 shadow-sm transition-all hover:border-brand-300 hover:shadow-md"
      >
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-teal-600 text-xs font-bold text-white">
          {initial}
        </span>
        <span className="hidden max-w-[120px] truncate md:inline">{label}</span>
        <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${menuOpen ? 'rotate-180' : ''}`} />
      </button>

      {menuOpen && (
        <div className="absolute right-0 z-50 mt-2 w-64 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl animate-fade-in">
          <div className="border-b border-slate-100 px-4 py-3">
            <p className="truncate text-sm font-semibold text-slate-900">{label}</p>
            {user.email && <p className="truncate text-xs text-slate-500">{user.email}</p>}
          </div>
          <button
            type="button"
            onClick={() => {
              setMenuOpen(false);
              onOpenProfile();
            }}
            className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-medium text-slate-700 transition-colors hover:bg-brand-50 hover:text-brand-700"
          >
            <UserCircle className="h-4 w-4" /> My profile
          </button>
          <button
            type="button"
            onClick={() => {
              setMenuOpen(false);
              onOpenBookings();
            }}
            className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-medium text-slate-700 transition-colors hover:bg-brand-50 hover:text-brand-700"
          >
            <Ticket className="h-4 w-4" /> My bookings
          </button>
          <button
            type="button"
            onClick={handleSignOut}
            className="flex w-full items-center gap-2 border-t border-slate-100 px-4 py-3 text-left text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
          >
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
      )}
    </div>
  );
}
