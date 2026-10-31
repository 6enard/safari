import { useEffect, useState } from 'react';
import { Bus, MapPin, Clock, ArrowRight, TrendingUp, Loader as Loader2, Sparkles, Route as RouteIcon, Gauge } from 'lucide-react';
import { db, type Route } from '@/lib/db';
import { formatKes } from '@/lib/format';

type Props = {
  onSelectRoute: (route: Route) => void;
};

export function RouteSelection({ onSelectRoute }: Props) {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      try {
        const data = await db.listRoutes();
        if (!active) return;
        setRoutes(data);
      } catch (e) {
        if (!active) return;
        setError(e instanceof Error ? e.message : 'Failed to load routes');
      }
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <div className="relative">
          <Loader2 className="h-10 w-10 animate-spin text-brand-500" />
        </div>
        <p className="mt-4 animate-pulse text-sm text-slate-400">Loading routes...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-md rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-red-700 animate-fade-in">
        Couldn't load routes. {error}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="relative mb-12 overflow-hidden rounded-3xl bg-gradient-to-br from-brand-600 via-teal-700 to-cyan-800 px-6 py-14 text-center text-white shadow-2xl shadow-brand-900/30 sm:px-12 sm:py-20">
        <div className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full bg-brand-400/30 blur-3xl animate-float" />
        <div className="pointer-events-none absolute -bottom-24 -right-16 h-72 w-72 rounded-full bg-teal-300/20 blur-3xl animate-float" style={{ animationDelay: '1.5s' }} />
        <div className="pointer-events-none absolute left-1/2 top-0 h-40 w-96 -translate-x-1/2 rounded-full bg-cyan-300/10 blur-2xl" />

        <div className="relative">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-sm font-medium text-white ring-1 ring-white/20 backdrop-blur-sm animate-fade-in">
            <Sparkles className="h-4 w-4" /> Matatu booking, simplified
          </span>
          <h1 className="mt-5 text-4xl font-bold leading-tight tracking-tight animate-slide-up sm:text-6xl">
            Travel across Kenya
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base text-brand-50/90 animate-slide-up animate-delay-100 sm:text-lg">
            Pick a route, choose your seat, and pay in seconds. No queues, no hassle.
          </p>
        </div>
      </div>

      <div className="mb-6 flex items-end justify-between gap-4 animate-fade-in animate-delay-200">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-bold text-slate-900">
            <RouteIcon className="h-5 w-5 text-brand-600" /> Available routes
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {routes.length} {routes.length === 1 ? 'route' : 'routes'} with daily departures
          </p>
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {routes.map((route, idx) => (
          <button
            key={route.id}
            type="button"
            onClick={() => onSelectRoute(route)}
            style={{ animationDelay: `${0.25 + idx * 0.08}s` }}
            className="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-6 text-left shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:border-brand-300 hover:shadow-xl hover:shadow-brand-900/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 animate-slide-up"
          >
            <div className="pointer-events-none absolute inset-x-0 top-0 h-1 origin-left scale-x-0 bg-gradient-to-r from-brand-500 to-teal-500 transition-transform duration-500 group-hover:scale-x-100" />

            {route.popular && (
              <span className="absolute right-5 top-5 z-10 inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 ring-1 ring-amber-200">
                <TrendingUp className="h-3 w-3" /> Popular
              </span>
            )}

            <div className="relative flex gap-4">
              <div className="flex flex-col items-center pt-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-brand-500 ring-4 ring-brand-100" />
                <span className="my-1 w-px flex-1 border-l-2 border-dotted border-slate-300" />
                <span className="h-2.5 w-2.5 rounded-full bg-rose-500 ring-4 ring-rose-100" />
              </div>
              <div className="min-w-0 flex-1 space-y-3 pr-16">
                <p className="truncate text-base font-bold text-slate-900">{route.origin}</p>
                <p className="truncate text-base font-bold text-slate-900">{route.destination}</p>
              </div>
            </div>

            <dl className="mt-6 grid grid-cols-3 gap-2 rounded-xl bg-slate-50 p-3 text-sm">
              <div>
                <dt className="flex items-center gap-1 text-xs text-slate-500"><Gauge className="h-3 w-3" /> Distance</dt>
                <dd className="mt-0.5 font-semibold text-slate-800">{route.distance_km} km</dd>
              </div>
              <div>
                <dt className="flex items-center gap-1 text-xs text-slate-500"><Clock className="h-3 w-3" /> Duration</dt>
                <dd className="mt-0.5 font-semibold text-slate-800">{route.duration_hours}h</dd>
              </div>
              <div>
                <dt className="flex items-center gap-1 text-xs text-slate-500"><MapPin className="h-3 w-3" /> From</dt>
                <dd className="mt-0.5 font-bold text-brand-700">{formatKes(route.base_fare)}</dd>
              </div>
            </dl>

            <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
              <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700">
                <Bus className="h-4 w-4" /> View departures
              </span>
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-brand-50 text-brand-700 transition-all duration-300 group-hover:translate-x-1 group-hover:bg-brand-600 group-hover:text-white">
                <ArrowRight className="h-4 w-4" />
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
