import { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, Bus, Calendar, Loader as Loader2, Route as RouteIcon, ShieldCheck, Ticket, Users } from 'lucide-react';
import { adminApi, type AdminData } from '@/lib/adminApi';
import { RoutesAdmin } from '@/components/admin/RoutesAdmin';
import { SchedulesAdmin } from '@/components/admin/SchedulesAdmin';
import { VehiclesAdmin } from '@/components/admin/VehiclesAdmin';
import { DriversAdmin } from '@/components/admin/DriversAdmin';
import { BookingsAdmin } from '@/components/admin/BookingsAdmin';

type Props = {
  onBack: () => void;
};

type Tab = 'routes' | 'schedules' | 'vehicles' | 'drivers' | 'bookings';

const VALID_TABS: Tab[] = ['routes', 'schedules', 'vehicles', 'drivers', 'bookings'];

function tabFromHash(): Tab {
  const hash = window.location.hash;
  const match = hash.match(/admin[?&]tab=([^&]+)/);
  const raw = match ? decodeURIComponent(match[1]) : '';
  return VALID_TABS.includes(raw as Tab) ? (raw as Tab) : 'routes';
}

function adminHashWithTab(tab: Tab): string {
  return `#/admin?tab=${tab}`;
}

const TABS: { id: Tab; label: string; icon: typeof RouteIcon }[] = [
  { id: 'routes', label: 'Routes', icon: RouteIcon },
  { id: 'schedules', label: 'Schedules & prices', icon: Calendar },
  { id: 'vehicles', label: 'Matatus', icon: Bus },
  { id: 'drivers', label: 'Drivers', icon: Users },
  { id: 'bookings', label: 'Bookings', icon: Ticket },
];

export function Admin({ onBack }: Props) {
  const [data, setData] = useState<AdminData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>(() => tabFromHash());

  function changeTab(next: Tab) {
    setTab(next);
    window.history.replaceState(null, '', adminHashWithTab(next));
  }

  // If the user hits back/forward while on admin, follow the hash.
  useEffect(() => {
    function onHashChange() {
      setTab(tabFromHash());
    }
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const load = useCallback(async () => {
    setError(null);
    try {
      setData(await adminApi.load());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load the admin data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <button
        type="button"
        onClick={onBack}
        className="group mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition-colors hover:text-brand-700"
      >
        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" /> Back to booking
      </button>

      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between animate-slide-up">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-brand-700 ring-1 ring-brand-100">
            <ShieldCheck className="h-3.5 w-3.5" /> Admin
          </span>
          <h1 className="mt-3 text-3xl font-bold text-slate-900">Admin console</h1>
          <p className="mt-1 text-slate-600">Manage routes, prices, schedules, matatus and drivers.</p>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
        </div>
      )}

      {!loading && error && (
        <div role="alert" className="mx-auto max-w-lg rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-red-700 animate-fade-in">
          <p>{error}</p>
          <button
            type="button"
            onClick={() => {
              setLoading(true);
              load();
            }}
            className="mt-4 rounded-xl border border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-700 transition-colors hover:bg-red-50"
          >
            Try again
          </button>
        </div>
      )}

      {!loading && data && (
        <>
          <div role="tablist" className="mb-8 flex gap-1 overflow-x-auto rounded-2xl bg-slate-100 p-1">
            {TABS.map((t) => {
              const Icon = t.icon;
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => changeTab(t.id)}
                  className={[
                    'inline-flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-semibold transition-all',
                    active ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-500 hover:text-slate-700',
                  ].join(' ')}
                >
                  <Icon className="h-4 w-4" /> {t.label}
                </button>
              );
            })}
          </div>

          {tab === 'routes' && <RoutesAdmin data={data} onChanged={load} />}
          {tab === 'schedules' && <SchedulesAdmin data={data} onChanged={load} />}
          {tab === 'vehicles' && <VehiclesAdmin data={data} onChanged={load} />}
          {tab === 'drivers' && <DriversAdmin data={data} onChanged={load} />}
          {tab === 'bookings' && <BookingsAdmin data={data} onChanged={load} />}
        </>
      )}
    </div>
  );
}
