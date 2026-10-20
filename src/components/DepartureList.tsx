import { useEffect, useState } from 'react';
import { ArrowLeft, Bus, Clock, Loader2, Wifi, Snowflake, Zap, Coffee } from 'lucide-react';
import { supabase, type Route, type Departure } from '@/lib/supabase';
import { formatKes, formatDate, formatTime } from '@/lib/format';

type Props = {
  route: Route;
  onBack: () => void;
  onSelectDeparture: (departure: Departure) => void;
};

const amenityIcon: Record<string, typeof Wifi> = {
  WiFi: Wifi,
  AC: Snowflake,
  Charging: Zap,
  Snacks: Coffee,
};

export function DepartureList({ route, onBack, onSelectDeparture }: Props) {
  const [departures, setDepartures] = useState<Departure[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      const today = new Date().toISOString().slice(0, 10);
      const { data, error } = await supabase
        .from('departures')
        .select('*')
        .eq('route_id', route.id)
        .gte('departure_date', today)
        .order('departure_date', { ascending: true })
        .order('departure_time', { ascending: true });
      if (!active) return;
      if (error) {
        setError(error.message);
      } else {
        setDepartures(data ?? []);
      }
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [route.id]);

  const grouped = departures.reduce<Record<string, Departure[]>>((acc, dep) => {
    (acc[dep.departure_date] ||= []).push(dep);
    return acc;
  }, {});

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <button
        onClick={onBack}
        className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition-colors hover:text-emerald-700"
      >
        <ArrowLeft className="h-4 w-4" /> All routes
      </button>

      <div className="mb-8 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 p-6 text-white shadow-lg">
        <div className="flex items-center gap-2 text-lg font-bold sm:text-2xl">
          <span>{route.origin}</span>
          <ArrowLeft className="h-5 w-5 rotate-180 opacity-70" />
          <span>{route.destination}</span>
        </div>
        <p className="mt-2 text-sm text-emerald-50">
          {route.distance_km} km · approx {route.duration_hours}h travel · from {formatKes(route.base_fare)}
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-7 w-7 animate-spin text-emerald-600" />
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-red-700">
          Couldn't load departures. {error}
        </div>
      ) : departures.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-10 text-center text-slate-500">
          No scheduled trips for this route right now. Please check back soon.
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(grouped).map(([date, deps]) => (
            <div key={date}>
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
                {formatDate(date)}
              </h3>
              <div className="grid gap-4 md:grid-cols-2">
                {deps.map((dep) => (
                  <button
                    key={dep.id}
                    onClick={() => onSelectDeparture(dep)}
                    className="group flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="inline-flex items-center gap-2 text-lg font-bold text-slate-900">
                          <Bus className="h-5 w-5 text-emerald-600" />
                          {dep.vehicle_name}
                        </div>
                        <p className="mt-1 text-xs text-slate-500">Plate {dep.plate_number}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-emerald-700">{formatKes(dep.fare)}</p>
                        <p className="text-xs text-slate-500">per seat</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                      <div className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-700">
                        <Clock className="h-4 w-4 text-slate-400" />
                        Departs {formatTime(dep.departure_time)}
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {dep.amenities.map((a) => {
                          const Icon = amenityIcon[a] ?? Wifi;
                          return (
                            <span
                              key={a}
                              title={a}
                              className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2 py-1 text-xs font-medium text-slate-600 ring-1 ring-slate-200"
                            >
                              <Icon className="h-3 w-3" /> {a}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-700">
                      Choose seat
                      <ArrowLeft className="h-4 w-4 rotate-180 transition-transform group-hover:translate-x-1" />
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
