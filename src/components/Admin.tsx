import { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, Ban, Bus, Calendar, CheckCircle2, Clock3, Loader as Loader2, MapPin, Package, Route as RouteIcon, ShieldCheck, Ticket, Users } from 'lucide-react';
import { adminApi, type AdminData } from '@/lib/adminApi';
import { RoutesAdmin } from '@/components/admin/RoutesAdmin';
import { SchedulesAdmin } from '@/components/admin/SchedulesAdmin';
import { VehiclesAdmin } from '@/components/admin/VehiclesAdmin';
import { DriversAdmin } from '@/components/admin/DriversAdmin';
import { BookingsAdmin } from '@/components/admin/BookingsAdmin';
import { CancellationsAdmin } from '@/components/admin/CancellationsAdmin';
import { ParcelsAdmin } from '@/components/admin/ParcelsAdmin';
import { PickupPointsAdmin } from '@/components/admin/PickupPointsAdmin';

type Props = {
  onBack: () => void;
};

type Tab = 'routes' | 'schedules' | 'pickup' | 'vehicles' | 'drivers' | 'bookings' | 'cancellations' | 'parcels';

const VALID_TABS: Tab[] = ['routes', 'schedules', 'pickup', 'vehicles', 'drivers', 'bookings', 'cancellations', 'parcels'];

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
  { id: 'pickup', label: 'Pickup points', icon: MapPin },
  { id: 'vehicles', label: 'Matatus', icon: Bus },
  { id: 'drivers', label: 'Drivers', icon: Users },
  { id: 'bookings', label: 'Bookings', icon: Ticket },
  { id: 'cancellations', label: 'Cancellations', icon: Ban },
  { id: 'parcels', label: 'Parcels', icon: Package },
];

function AdminOverview({ data }: { data: AdminData | null }) {
  if (!data) return null;
  const today = new Date().toISOString().slice(0, 10);
  const activeBookings = data.bookings.filter((booking) => booking.status === 'confirmed').length;
  const upcomingTrips = data.departures.filter((departure) => departure.departure_date >= today).length;
  const pendingParcels = data.parcels.filter((parcel) => parcel.status === 'pending').length;
  const unassignedVehicles = data.vehicles.filter((vehicle) => !vehicle.driver_id).length;
  const metrics = [
    { label: 'Active bookings', value: activeBookings, detail: `${data.bookings.length} total records`, icon: Ticket, tone: 'brand' },
    { label: 'Upcoming trips', value: upcomingTrips, detail: `${data.departures.length} scheduled`, icon: Clock3, tone: 'sky' },
    { label: 'Pending parcels', value: pendingParcels, detail: `${data.parcels.length} total parcels`, icon: Package, tone: 'amber' },
    { label: 'Fleet readiness', value: data.vehicles.length - unassignedVehicles, detail: `${unassignedVehicles} need a driver`, icon: Bus, tone: 'emerald' },
  ] as const;

  return (
    <section aria-label="Operations overview" className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {metrics.map(({ label, value, detail, icon: Icon, tone }) => (
        <div key={label} className="group rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
              <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">{value}</p>
            </div>
            <span className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${tone === 'brand' ? 'bg-brand-50 text-brand-700' : tone === 'sky' ? 'bg-sky-50 text-sky-700' : tone === 'amber' ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'}`}>
              <Icon className="h-5 w-5" />
            </span>
          </div>
          <p className="mt-3 text-xs text-slate-500">{detail}</p>
        </div>
      ))}
    </section>
  );
}

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
            <ShieldCheck className="h-3.5 w-3.5" /> Operations desk
          </span>
          <h1 className="mt-3 text-3xl font-bold text-slate-900 sm:text-4xl">Keep every trip moving</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">A single view for today’s bookings, fleet readiness, parcel handovers, and the records your team needs to run South Rift smoothly.</p>
        </div>
        <div className="hidden items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800 sm:flex">
          <CheckCircle2 className="h-4 w-4" /> Records are live
        </div>
      </div>

      <AdminOverview data={data} />

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
          <div role="tablist" className="mb-8 grid grid-cols-2 gap-1 rounded-2xl bg-slate-100 p-1 sm:grid-cols-4 lg:flex">
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
                    'inline-flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-xl px-2 py-2.5 text-xs font-semibold transition-all sm:gap-2 sm:px-4 sm:text-sm',
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
          {tab === 'pickup' && <PickupPointsAdmin data={data} onChanged={load} />}
          {tab === 'vehicles' && <VehiclesAdmin data={data} onChanged={load} />}
          {tab === 'drivers' && <DriversAdmin data={data} onChanged={load} />}
          {tab === 'bookings' && <BookingsAdmin data={data} onChanged={load} />}
          {tab === 'cancellations' && <CancellationsAdmin data={data} />}
          {tab === 'parcels' && <ParcelsAdmin data={data} onChanged={load} />}
        </>
      )}
    </div>
  );
}
