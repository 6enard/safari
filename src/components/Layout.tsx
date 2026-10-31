import { Bus, ShieldCheck, Ticket } from 'lucide-react';
import { AuthControls } from '@/components/AuthControls';
import { useAuth } from '@/lib/authContext';
import { isAdminEmail } from '@/lib/adminApi';

type HeaderProps = {
  onOpenProfile: () => void;
  onOpenBookings: () => void;
  onOpenAdmin: () => void;
};

export function Header({ onOpenProfile, onOpenBookings, onOpenAdmin }: HeaderProps) {
  const { user } = useAuth();
  const canUseAdmin = Boolean(user && isAdminEmail(user.email) && user.emailVerified);
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/60 bg-white/70 backdrop-blur-xl transition-shadow">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-3 py-3 sm:px-4 sm:py-3.5">
        <div className="flex items-center gap-2.5 transition-transform hover:scale-[1.02]">
          <span className="relative inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-teal-600 text-white shadow-lg shadow-brand-500/30">
            <Bus className="h-5 w-5" />
            <span className="absolute inset-0 rounded-xl bg-gradient-to-br from-brand-400 to-teal-500 opacity-0 blur transition-opacity hover:opacity-60" />
          </span>
          <div className="leading-tight">
            <p className="text-base font-bold tracking-tight text-slate-900">Tiketi</p>
            <p className="hidden text-[11px] text-slate-500 sm:block">Matatu booking · Kenya</p>
          </div>
        </div>
        <div className="flex min-w-0 items-center gap-1.5 sm:gap-2">
          {canUseAdmin && (
            <button
              type="button"
              onClick={onOpenAdmin}
              aria-label="Admin console"
              className="inline-flex items-center gap-2 rounded-xl border border-brand-200 bg-brand-50 px-3 py-2 text-sm font-semibold text-brand-700 transition-all hover:border-brand-300 hover:bg-brand-100"
            >
              <ShieldCheck className="h-4 w-4" />
              <span className="hidden sm:inline">Admin</span>
            </button>
          )}
          <nav className="hidden items-center gap-1 text-sm font-medium text-slate-600 sm:flex">
            <a href="#" className="rounded-lg px-3 py-2 transition-all hover:bg-brand-50 hover:text-brand-700">Routes</a>
            <a href="#" className="rounded-lg px-3 py-2 transition-all hover:bg-brand-50 hover:text-brand-700">Help</a>
          </nav>
          <button
            type="button"
            onClick={onOpenBookings}
            aria-label="My bookings"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-500 to-teal-600 px-3 py-2 text-sm font-semibold text-white shadow-md shadow-brand-500/25 transition-all hover:shadow-lg hover:shadow-brand-500/40 hover:brightness-110 sm:px-4"
          >
            <Ticket className="h-4 w-4 sm:hidden" />
            <span className="hidden sm:inline">My bookings</span>
            <span className="sm:hidden">Bookings</span>
          </button>
          <AuthControls onOpenProfile={onOpenProfile} onOpenBookings={onOpenBookings} />
        </div>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="mt-12 border-t border-slate-200/60 bg-white/50">
      <div className="mx-auto max-w-6xl px-4 py-8 text-center text-sm text-slate-500">
        <div className="mb-2 inline-flex items-center gap-2">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-teal-600 text-white">
            <Bus className="h-4 w-4" />
          </span>
          <span className="font-bold text-slate-700">Tiketi</span>
        </div>
        <p>Book matatu seats across Kenya · Demo project</p>
      </div>
    </footer>
  );
}
