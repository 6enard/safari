import { useEffect, useState } from 'react';
import { Bus, MapPin, Clock, ArrowRight, TrendingUp, Loader2 } from 'lucide-react';
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
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-red-700">
        Couldn't load routes. {error}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-10 text-center">
        <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-1.5 text-sm font-medium text-emerald-700 ring-1 ring-emerald-200">
          <Bus className="h-4 w-4" /> Matatu booking, simplified
        </span>
        <h1 className="mt-5 text-3xl font-bold tracking-tight text-slate-900 sm:text-5xl">
          Travel across Kenya
        </h1>
        <p className="mt-4 text-base text-slate-600 sm:text-lg">
          Pick a route, choose your seat, and pay in seconds. No queues, no hassle.
        </p>
      </div>

      <h2 className="mb-4 text-lg font-semibold text-slate-800">Popular routes</h2>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {routes.map((route) => (
          <button
            key={route.id}
            onClick={() => onSelectRoute(route)}
            className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-sm transition-all hover:-translate-y-1 hover:border-emerald-300 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            {route.popular && (
              <span className="absolute right-4 top-4 inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 ring-1 ring-amber-200">
                <TrendingUp className="h-3 w-3" /> Popular
              </span>
            )}
            <div className="flex items-center gap-2 text-base font-bold text-slate-900">
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-4 w-4 text-emerald-600" />
                {route.origin}
              </span>
              <ArrowRight className="h-4 w-4 text-slate-400 transition-transform group-hover:translate-x-1" />
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-4 w-4 text-rose-500" />
                {route.destination}
              </span>
            </div>
            <dl className="mt-5 grid grid-cols-3 gap-3 text-sm">
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
                <dd className="font-semibold text-emerald-700">{formatKes(route.base_fare)}</dd>
              </div>
            </dl>
            <div className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-emerald-700">
              View departures
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
