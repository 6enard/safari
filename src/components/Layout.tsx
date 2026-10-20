import { Bus } from 'lucide-react';

export function Header() {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white">
            <Bus className="h-5 w-5" />
          </span>
          <div className="leading-tight">
            <p className="text-base font-bold text-slate-900">Tiketi</p>
            <p className="text-[11px] text-slate-500">Matatu booking · Kenya</p>
          </div>
        </div>
        <nav className="hidden items-center gap-6 text-sm font-medium text-slate-600 sm:flex">
          <a href="#" className="transition-colors hover:text-emerald-700">Routes</a>
          <a href="#" className="transition-colors hover:text-emerald-700">Help</a>
          <a
            href="#"
            className="rounded-lg bg-emerald-600 px-3 py-1.5 text-white transition-colors hover:bg-emerald-700"
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
    <footer className="mt-12 border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-8 text-center text-sm text-slate-500">
        <p className="font-semibold text-slate-700">Tiketi</p>
        <p className="mt-1">Book matatu seats across Kenya · Demo project</p>
      </div>
    </footer>
  );
}
