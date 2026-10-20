import { Bus } from 'lucide-react';

export function Header() {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/60 bg-white/70 backdrop-blur-xl transition-shadow">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3.5">
        <div className="flex items-center gap-2.5 transition-transform hover:scale-[1.02]">
          <span className="relative inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-teal-600 text-white shadow-lg shadow-brand-500/30">
            <Bus className="h-5 w-5" />
            <span className="absolute inset-0 rounded-xl bg-gradient-to-br from-brand-400 to-teal-500 opacity-0 blur transition-opacity hover:opacity-60" />
          </span>
          <div className="leading-tight">
            <p className="text-base font-bold tracking-tight text-slate-900">Tiketi</p>
            <p className="text-[11px] text-slate-500">Matatu booking · Kenya</p>
          </div>
        </div>
        <nav className="hidden items-center gap-1 text-sm font-medium text-slate-600 sm:flex">
          <a href="#" className="rounded-lg px-3 py-2 transition-all hover:bg-brand-50 hover:text-brand-700">Routes</a>
          <a href="#" className="rounded-lg px-3 py-2 transition-all hover:bg-brand-50 hover:text-brand-700">Help</a>
          <a
            href="#"
            className="rounded-xl bg-gradient-to-r from-brand-500 to-teal-600 px-4 py-2 text-white shadow-md shadow-brand-500/25 transition-all hover:shadow-lg hover:shadow-brand-500/40 hover:brightness-110"
          >
            My bookings
          </a>
        </nav>
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
