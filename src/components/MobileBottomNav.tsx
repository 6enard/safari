import { Bus, CircleHelp, House, Package, Ticket } from 'lucide-react';

export type BottomNavView = 'home' | 'booking' | 'bookings' | 'parcels' | 'help';

type Props = {
  activeView: string;
  onNavigate: (view: BottomNavView) => void;
};

const items: { view: BottomNavView; label: string; icon: typeof House }[] = [
  { view: 'home', label: 'Home', icon: House },
  { view: 'booking', label: 'Book', icon: Bus },
  { view: 'bookings', label: 'My trips', icon: Ticket },
  { view: 'parcels', label: 'Parcels', icon: Package },
  { view: 'help', label: 'Help', icon: CircleHelp },
];

export function MobileBottomNav({ activeView, onNavigate }: Props) {
  return (
    <nav
      aria-label="Main navigation"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200/70 bg-white/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_24px_-12px_rgba(15,23,42,0.18)] backdrop-blur-xl sm:hidden"
    >
      <ul className="mx-auto grid max-w-md grid-cols-5 px-1">
        {items.map(({ view, label, icon: Icon }) => {
          const active = activeView === view;
          return (
            <li key={view}>
              <button
                type="button"
                onClick={() => onNavigate(view)}
                aria-current={active ? 'page' : undefined}
                className={`group flex w-full flex-col items-center gap-1 py-2.5 text-[11px] font-semibold transition-colors active:scale-95 ${
                  active ? 'text-brand-700' : 'text-slate-500 hover:text-brand-600'
                }`}
              >
                <span
                  className={`inline-flex h-8 w-14 items-center justify-center rounded-full transition-all duration-300 ${
                    active ? 'bg-brand-100 text-brand-700 shadow-sm' : 'text-current group-hover:bg-brand-50'
                  }`}
                >
                  <Icon className={`h-5 w-5 transition-transform duration-300 ${active ? 'scale-110' : ''}`} />
                </span>
                {label}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
