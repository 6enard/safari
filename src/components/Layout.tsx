import { useState } from 'react';
import { Bus, Menu, Package, ShieldCheck, Ticket, X } from 'lucide-react';
import { AuthControls } from '@/components/AuthControls';
import { useAuth } from '@/lib/authContext';
import { isAdminEmail } from '@/lib/adminApi';

type HeaderProps = {
  onOpenProfile: () => void;
  onOpenBookings: () => void;
  onOpenAdmin: () => void;
  onOpenParcels: () => void;
  onGoHome: () => void;
};

const navLinkClass = 'rounded-lg px-3 py-2 transition-all hover:bg-brand-50 hover:text-brand-700';

export function Header({ onOpenProfile, onOpenBookings, onOpenAdmin, onOpenParcels, onGoHome }: HeaderProps) {
  const { user } = useAuth();
  const canUseAdmin = Boolean(user && isAdminEmail(user.email) && user.emailVerified);
  const [menuOpen, setMenuOpen] = useState(false);

  function go(action: () => void) {
    setMenuOpen(false);
    action();
  }

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/60 bg-white/90 backdrop-blur-xl transition-shadow">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-3 py-3 sm:px-4 sm:py-3.5">
        <button type="button" onClick={onGoHome} className="flex min-w-0 items-center gap-2.5 transition-transform hover:scale-[1.02]">
          <span className="relative inline-flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-teal-600 text-white shadow-lg shadow-brand-500/30">
            <Bus className="h-5 w-5" />
          </span>
          <div className="leading-tight">
            <p className="text-base font-bold tracking-tight text-slate-900">South Rift Luxury Shuttle</p>
            <p className="hidden text-[11px] text-slate-500 sm:block">Luxury matatu booking · Kenya</p>
          </div>
        </button>

        <div className="flex min-w-0 items-center gap-1.5 sm:gap-2">
          {canUseAdmin && (
            <button
              type="button"
              onClick={onOpenAdmin}
              aria-label="Admin console"
              className="hidden items-center gap-2 rounded-xl border border-brand-200 bg-brand-50 px-3 py-2 text-sm font-semibold text-brand-700 transition-all hover:border-brand-300 hover:bg-brand-100 sm:inline-flex"
            >
              <ShieldCheck className="h-4 w-4" />
              Admin
            </button>
          )}
          <button
            type="button"
            onClick={onOpenParcels}
            aria-label="Send a parcel"
            className="hidden items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:border-brand-300 hover:text-brand-700 hover:shadow-md sm:inline-flex"
          >
            <Package className="h-4 w-4" />
            Parcels
          </button>
          <nav className="hidden items-center gap-1 text-sm font-medium text-slate-600 sm:flex">
            <a href="#" className={navLinkClass}>Routes</a>
            <a href="#" className={navLinkClass}>Help</a>
          </nav>
          <button
            type="button"
            onClick={onOpenBookings}
            aria-label="My bookings"
            className="hidden items-center gap-2 rounded-xl bg-gradient-to-r from-brand-500 to-teal-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-brand-500/25 transition-all hover:shadow-lg hover:shadow-brand-500/40 hover:brightness-110 sm:inline-flex"
          >
            <Ticket className="h-4 w-4" />
            My bookings
          </button>
          <AuthControls onOpenProfile={onOpenProfile} onOpenBookings={onOpenBookings} onOpenParcels={onOpenParcels} />
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            className="inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition-all hover:border-brand-300 hover:text-brand-700 active:scale-95 sm:hidden"
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div id="mobile-menu" className="absolute inset-x-0 top-full border-b border-slate-200 bg-white px-3 pb-4 pt-2 shadow-xl animate-slide-up sm:hidden">
          <nav className="flex flex-col gap-1 text-sm font-semibold text-slate-700">
            <button type="button" onClick={() => go(onOpenBookings)} className="flex items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors hover:bg-brand-50 hover:text-brand-700">
              <Ticket className="h-4 w-4 text-brand-600" /> My bookings
            </button>
            {canUseAdmin && (
              <button type="button" onClick={() => go(onOpenAdmin)} className="flex items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors hover:bg-brand-50 hover:text-brand-700">
                <ShieldCheck className="h-4 w-4 text-brand-600" /> Admin console
              </button>
            )}
            <button type="button" onClick={() => go(onOpenParcels)} className="flex items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors hover:bg-brand-50 hover:text-brand-700">
              <Package className="h-4 w-4 text-brand-600" /> Send a parcel
            </button>
            <a href="#" onClick={() => setMenuOpen(false)} className="rounded-xl px-3 py-3 transition-colors hover:bg-brand-50 hover:text-brand-700">Routes</a>
            <a href="#" onClick={() => setMenuOpen(false)} className="rounded-xl px-3 py-3 transition-colors hover:bg-brand-50 hover:text-brand-700">Help</a>
          </nav>
        </div>
      )}
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
          <span className="font-bold text-slate-700">South Rift Luxury Shuttle</span>
        </div>
        <p>Book matatu seats across Kenya · Demo project</p>
      </div>
    </footer>
  );
}
