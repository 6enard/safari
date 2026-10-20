import { useEffect, useState } from 'react';
import { Bus, MapPin, Clock, ArrowRight, TrendingUp, Loader as Loader2, Sparkles } from 'lucide-react';
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
      } catch (e: any) {
        if (!active) return;
        setError(e?.message ?? 'Failed to load routes');
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
      {/* Hero section */}
      <div className="relative mb-12 overflow-hidden rounded-3xl bg-gradient-to-br from-brand-600 via-teal-700 to-cyan-800 px-6 py-14 text-center text-white shadow-2xl shadow-brand-900/30 sm:px-12 sm:py-20">
        {/* Decorative gradient blobs */}
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

      <h2 className="mb-5 text-lg font-semibold text-slate-800 animate-fade-in animate-delay-200">Popular routes</h2>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {routes.map((route, idx) => (
          <button
            key={route.id}
            onClick={() => onSelectRoute(route)}
            style={{ animationDelay: `${0.25 + idx * 0.08}s` }}
            className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-6 text-left shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:border-brand-300 hover:shadow-xl hover:shadow-brand-900/10 focus:outline-none focus:ring-2 focus:ring-brand-500 animate-slide-up"
          >
            {/* Hover gradient overlay */}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-brand-50/0 to-teal-50/0 opacity-0 transition-opacity duration-300 group-hover:from-brand-50/80 group-hover:to-teal-50/40 group-hover:opacity-100" />

            {route.popular && (
              <span className="absolute right-4 top-4 z-10 inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 ring-1 ring-amber-200 transition-transform group-hover:scale-105">
                <TrendingUp className="h-3 w-3" /> Popular
              </span>
            )}

            <div className="relative flex items-center gap-2 text-base font-bold text-slate-900">
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-4 w-4 text-brand-600" />
                {route.origin}
              </span>
              <ArrowRight className="h-4 w-4 text-slate-400 transition-transform duration-300 group-hover:translate-x-1.5 group-hover:text-brand-500" />
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-4 w-4 text-rose-500" />
                {route.destination}
              </span>
            </div>

            <dl className="relative mt-5 grid grid-cols-3 gap-3 text-sm">
              <div>
                <dt className="text-slate-500">Distance</dt>
                <dd className="font-semibold text-slate-800">{route.distance_km} km</dd>
              </div>
              <div>
                <dt className="text-slate-500">Est. time</dt>
                <dd className="inline-flex items-center gap-1 font-semibold text-slate-800">
                  <Clock className="h-3.5 w-3.5" /> {route.duration_hours}h
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">From</dt>
                <dd className="font-bold text-brand-700">{formatKes(route.base_fare)}</dd>
              </div>
            </dl>

            <div className="relative mt-5 inline-flex items-center gap-1 text-sm font-semibold text-brand-700">
              View departures
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
