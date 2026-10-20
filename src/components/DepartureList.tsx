import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Bus, Clock, Loader2, Wifi, Snowflake, Zap, Coffee, Calendar, ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
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
  // pad to full weeks
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
          {route.distance_km} km · approx {route.duration_hours}h travel
        </p>
      </div>

      {/* Calendar step */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
          <Calendar className="h-4 w-4" /> Choose your travel date
        </div>

        {loadingDates ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
          </div>
        ) : (
          <>
            <div className="mb-4 flex items-center justify-between">
              <button
                onClick={prevMonth}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition-colors hover:bg-slate-50"
                aria-label="Previous month"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-base font-semibold text-slate-800">
                {MONTHS[viewMonth]} {viewYear}
              </span>
              <button
                onClick={nextMonth}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition-colors hover:bg-slate-50"
                aria-label="Next month"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            <div className="mb-2 grid grid-cols-7 gap-1 text-center text-xs font-medium text-slate-400">
              {WEEKDAYS.map((w) => (
                <span key={w}>{w}</span>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {calendarCells.map((d, idx) => {
                if (!d) return <span key={idx} className="aspect-square" />;
                const iso = toISO(d);
                const isPast = d < today;
                const isAvailable = availableSet.has(iso);
                const isSelected = selectedDate === iso;
                const disabled = isPast || !isAvailable;
                return (
                  <button
                    key={idx}
                    disabled={disabled}
                    onClick={() => setSelectedDate(iso)}
                    className={[
                      'aspect-square rounded-lg text-sm font-medium transition-all',
                      isSelected
                        ? 'bg-emerald-600 text-white shadow-md ring-2 ring-emerald-300'
                        : disabled
                          ? 'cursor-not-allowed text-slate-300'
                          : 'text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 ring-1 ring-slate-200',
                    ].join(' ')}
                  >
                    {d.getDate()}
                  </button>
                );
              })}
            </div>

            <p className="mt-4 text-xs text-slate-400">
              Dates with available matatus are selectable. Past dates are disabled.
            </p>
          </>
        )}
      </div>

      {/* Vehicle list for selected date */}
      {selectedDate && (
        <div className="mt-8">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
            Available matatus · {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-KE', { weekday: 'long', day: 'numeric', month: 'long' })}
          </h3>

          {loadingDepartures ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
            </div>
          ) : departures.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500">
              No matatus scheduled for this date. Try another day.
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {departures.map((dep) => (
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
                      <p className="mt-1 text-xs font-medium text-slate-500">Plate {dep.plate_number}</p>
                    </div>
                    <div className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-1.5 text-sm font-bold text-emerald-700">
                      <Clock className="h-4 w-4" />
                      {formatTime(dep.departure_time)}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {dep.amenities.map((a) => {
                      const Icon = amenityIcon[a] ?? Wifi;
                      return (
                        <span
                          key={a}
                          title={a}
                          className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600 ring-1 ring-slate-200"
                        >
                          <Icon className="h-3 w-3" /> {a}
                        </span>
                      );
                    })}
                  </div>
                  <span className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-700">
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
