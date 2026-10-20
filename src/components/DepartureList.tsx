import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Bus, Clock, Loader as Loader2, Wifi, Snowflake, Zap, Coffee, Calendar, ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { db, type Route, type Departure } from '@/lib/db';
import { formatTime } from '@/lib/format';

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

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function toISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function DepartureList({ route, onBack, onSelectDeparture }: Props) {
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [loadingDates, setLoadingDates] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const [departures, setDepartures] = useState<Departure[]>([]);
  const [loadingDepartures, setLoadingDepartures] = useState(false);

  const [viewYear, setViewYear] = useState(() => new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(() => new Date().getMonth());

  useEffect(() => {
    let active = true;
    (async () => {
      setLoadingDates(true);
      try {
        const dates = await db.listAvailableDates(route.id);
        if (!active) return;
        setAvailableDates(dates);
      } catch {
        // ignore — calendar just shows no available days
      }
      setLoadingDates(false);
    })();
    return () => {
      active = false;
    };
  }, [route.id]);

  useEffect(() => {
    if (!selectedDate) return;
    let active = true;
    (async () => {
      setLoadingDepartures(true);
      try {
        const data = await db.listDeparturesForDate(route.id, selectedDate);
        if (!active) return;
        setDepartures(data);
      } catch {
        if (!active) return;
        setDepartures([]);
      }
      setLoadingDepartures(false);
    })();
    return () => {
      active = false;
    };
  }, [route.id, selectedDate]);

  const availableSet = useMemo(() => new Set(availableDates), [availableDates]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const firstOfMonth = new Date(viewYear, viewMonth, 1);
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const startWeekday = firstOfMonth.getDay();

  const calendarCells: (Date | null)[] = [];
  for (let i = 0; i < startWeekday; i++) calendarCells.push(null);
  for (let d = 1; d <= daysInMonth; d++) calendarCells.push(new Date(viewYear, viewMonth, d));
  while (calendarCells.length % 7 !== 0) calendarCells.push(null);

  function prevMonth() {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  }
  function nextMonth() {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <button
        onClick={onBack}
        className="group mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition-colors hover:text-brand-700"
      >
        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" /> All routes
      </button>

      <div className="relative mb-8 overflow-hidden rounded-2xl bg-gradient-to-br from-brand-600 to-teal-700 p-6 text-white shadow-xl shadow-brand-900/20 animate-slide-up">
        <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-10 left-10 h-32 w-32 rounded-full bg-cyan-300/15 blur-2xl" />
        <div className="relative flex items-center gap-2 text-lg font-bold sm:text-2xl">
          <span>{route.origin}</span>
          <ArrowLeft className="h-5 w-5 rotate-180 opacity-70" />
          <span>{route.destination}</span>
        </div>
        <p className="relative mt-2 text-sm text-brand-50">
          {route.distance_km} km · approx {route.duration_hours}h travel
        </p>
      </div>

      {/* Calendar */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm animate-slide-up animate-delay-100">
        <div className="flex items-center gap-2 border-b border-slate-100 bg-gradient-to-r from-brand-50 to-teal-50 px-6 py-4 text-sm font-semibold uppercase tracking-wide text-brand-800">
          <Calendar className="h-4 w-4" /> Choose your travel date
        </div>

        {loadingDates ? (
          <div className="flex items-center justify-center py-14">
            <Loader2 className="h-7 w-7 animate-spin text-brand-600" />
          </div>
        ) : (
          <div className="p-6">
            <div className="mb-5 flex items-center justify-between">
              <button
                onClick={prevMonth}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition-all hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700 active:scale-95"
                aria-label="Previous month"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <span className="text-lg font-bold text-slate-800">
                {MONTHS[viewMonth]} {viewYear}
              </span>
              <button
                onClick={nextMonth}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition-all hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700 active:scale-95"
                aria-label="Next month"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>

            <div className="mb-2 grid grid-cols-7 gap-1.5 text-center text-xs font-semibold uppercase tracking-wide text-slate-400">
              {WEEKDAYS.map((w) => (
                <span key={w} className="py-1">{w}</span>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1.5">
              {calendarCells.map((d, idx) => {
                if (!d) return <span key={idx} className="aspect-square" />;
                const iso = toISO(d);
                const isPast = d < today;
                const isAvailable = availableSet.has(iso);
                const isSelected = selectedDate === iso;
                const isToday = toISO(today) === iso;
                const disabled = isPast || !isAvailable;
                return (
                  <button
                    key={idx}
                    disabled={disabled}
                    onClick={() => setSelectedDate(iso)}
                    className={[
                      'relative aspect-square rounded-xl text-sm font-semibold transition-all duration-200',
                      isSelected
                        ? 'bg-gradient-to-br from-brand-500 to-teal-600 text-white shadow-md ring-2 ring-brand-300 scale-105'
                        : disabled
                          ? 'cursor-not-allowed text-slate-300'
                          : 'text-slate-700 ring-1 ring-slate-200 hover:bg-brand-50 hover:text-brand-700 hover:ring-brand-300 hover:scale-105 active:scale-95',
                    ].join(' ')}
                  >
                    {d.getDate()}
                    {isToday && !isSelected && (
                      <span className="absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-brand-500" />
                    )}
                    {isAvailable && !isSelected && (
                      <span className="absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-brand-400" />
                    )}
                  </button>
                );
              })}
            </div>

            <div className="mt-5 flex items-center justify-center gap-5 text-xs text-slate-500">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-md bg-gradient-to-br from-brand-500 to-teal-600" /> Selected
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-md ring-1 ring-slate-200" /> Available
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-md bg-slate-100" /> No trips
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Departure cards */}
      {selectedDate && (
        <div className="mt-8 animate-fade-in">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
            Available matatus · {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-KE', { weekday: 'long', day: 'numeric', month: 'long' })}
          </h3>

          {loadingDepartures ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-brand-600" />
            </div>
          ) : departures.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500 animate-fade-in">
              No matatus scheduled for this date. Try another day.
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {departures.map((dep, idx) => (
                <button
                  key={dep.id}
                  onClick={() => onSelectDeparture(dep)}
                  style={{ animationDelay: `${idx * 0.06}s` }}
                  className="group relative flex flex-col gap-4 overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 text-left shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-lg animate-fade-in"
                >
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-brand-50/0 to-teal-50/0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                  <div className="relative flex items-start justify-between">
                    <div className="inline-flex items-center gap-2">
                      <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-brand-100 to-teal-100 text-brand-700 transition-transform group-hover:scale-110">
                        <Bus className="h-5 w-5" />
                      </span>
                      <span className="font-mono text-base font-bold tracking-wide text-slate-900">
                        {dep.plate_number}
                      </span>
                    </div>
                    <div className="inline-flex items-center gap-1.5 rounded-lg bg-brand-50 px-3 py-1.5 text-sm font-bold text-brand-700 ring-1 ring-brand-100">
                      <Clock className="h-4 w-4" />
                      {formatTime(dep.departure_time)}
                    </div>
                  </div>
                  <div className="relative flex flex-wrap gap-1.5">
                    {dep.amenities.map((a) => {
                      const Icon = amenityIcon[a] ?? Wifi;
                      return (
                        <span
                          key={a}
                          title={a}
                          className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600 ring-1 ring-slate-200 transition-colors group-hover:bg-brand-50 group-hover:text-brand-700 group-hover:ring-brand-200"
                        >
                          <Icon className="h-3 w-3" /> {a}
                        </span>
                      );
                    })}
                  </div>
                  <span className="relative inline-flex items-center gap-1 text-sm font-semibold text-brand-700">
                    Choose seat
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
