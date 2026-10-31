import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft, ArrowRight, ArrowDown, Bus, Calendar, ChevronLeft, ChevronRight,
  Clock, Loader as Loader2, MapPin, Package, Phone, User as UserIcon, Weight, Tag,
  Wifi, Snowflake, Zap, Coffee, CircleCheck as CheckCircle2, X,
} from 'lucide-react';
import { db, type Departure, type ParcelType, type Route } from '@/lib/db';
import { useAuth } from '@/lib/authContext';
import { formatKes, formatDate, formatTime, toISO } from '@/lib/format';

type Props = {
  onDone: () => void;
};

type Step = 'route' | 'date' | 'details';

const STEP_LABELS = ['Route', 'Date & matatu', 'Parcel details'];
const STEP_HINTS = [
  'choose a route for your parcel',
  'pick a travel date, then a matatu',
  'fill in the parcel and recipient details',
];

const PARCEL_TYPES: { id: ParcelType; label: string; baseFee: number }[] = [
  { id: 'document', label: 'Documents', baseFee: 300 },
  { id: 'electronics', label: 'Electronics', baseFee: 800 },
  { id: 'clothing', label: 'Clothing', baseFee: 500 },
  { id: 'food', label: 'Food / Groceries', baseFee: 400 },
  { id: 'other', label: 'Other', baseFee: 600 },
];

const amenityIcon: Record<string, typeof Wifi> = {
  WiFi: Wifi,
  AC: Snowflake,
  Charging: Zap,
  Snacks: Coffee,
};

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const inputClass =
  'w-full rounded-xl border border-slate-300 bg-slate-50/50 px-4 py-2.5 text-sm outline-none transition-all focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-200';

export function ParcelSendFlow({ onDone }: Props) {
  const { user } = useAuth();
  const [step, setStep] = useState<Step>('route');

  // Route step
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loadingRoutes, setLoadingRoutes] = useState(true);
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);

  // Date + departure step
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [loadingDates, setLoadingDates] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [departures, setDepartures] = useState<Departure[]>([]);
  const [loadingDepartures, setLoadingDepartures] = useState(false);
  const [selectedDeparture, setSelectedDeparture] = useState<Departure | null>(null);
  const [viewYear, setViewYear] = useState(() => new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(() => new Date().getMonth());
  const resultsRef = useRef<HTMLDivElement>(null);

  // Details step
  const [senderName, setSenderName] = useState(user?.displayName ?? '');
  const [senderPhone, setSenderPhone] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [description, setDescription] = useState('');
  const [weightKg, setWeightKg] = useState('1');
  const [parcelType, setParcelType] = useState<ParcelType>('document');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // --- Load routes ---
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const r = await db.listRoutes();
        if (!active) return;
        setRoutes(r);
      } catch {
        // ignore
      } finally {
        if (active) setLoadingRoutes(false);
      }
    })();
    return () => { active = false; };
  }, []);

  // --- Load available dates when route selected ---
  useEffect(() => {
    if (!selectedRoute) return;
    let active = true;
    setLoadingDates(true);
    setSelectedDate(null);
    setSelectedDeparture(null);
    (async () => {
      try {
        const dates = await db.listAvailableDates(selectedRoute.id);
        if (!active) return;
        setAvailableDates(dates);
      } catch {
        if (active) setAvailableDates([]);
      } finally {
        if (active) setLoadingDates(false);
      }
    })();
    return () => { active = false; };
  }, [selectedRoute]);

  // --- Load departures when date selected ---
  useEffect(() => {
    if (!selectedRoute || !selectedDate) return;
    let active = true;
    setLoadingDepartures(true);
    setSelectedDeparture(null);
    (async () => {
      try {
        const data = await db.listDeparturesForDate(selectedRoute.id, selectedDate);
        if (!active) return;
        setDepartures(data);
      } catch {
        if (active) setDepartures([]);
      } finally {
        if (active) setLoadingDepartures(false);
      }
    })();
    return () => { active = false; };
  }, [selectedRoute, selectedDate]);

  // Scroll to results when departures load
  useEffect(() => {
    if (selectedDate && !loadingDepartures) {
      resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [selectedDate, loadingDepartures]);

  // --- Calendar logic ---
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
    if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1); }
    else setViewMonth((m) => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1); }
    else setViewMonth((m) => m + 1);
  }

  const stepIndex: Record<Step, number> = { route: 0, date: 1, details: 2 };

  const weight = Number(weightKg) || 0;
  const selectedTypeMeta = PARCEL_TYPES.find((t) => t.id === parcelType)!;
  const parcelFee = Math.round(selectedTypeMeta.baseFee + Math.ceil(weight) * 50);

  const detailsValid =
    senderName.trim().length >= 2 &&
    senderPhone.trim().length >= 10 &&
    recipientName.trim().length >= 2 &&
    recipientPhone.trim().length >= 10 &&
    description.trim().length >= 3 &&
    weight > 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!detailsValid || !selectedRoute || !selectedDeparture) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      await db.createParcel({
        routeId: selectedRoute.id,
        departureId: selectedDeparture.id,
        senderName: senderName.trim(),
        senderPhone: senderPhone.trim(),
        recipientName: recipientName.trim(),
        recipientPhone: recipientPhone.trim(),
        pickupLocation: selectedRoute.origin,
        dropoffLocation: selectedRoute.destination,
        description: description.trim(),
        weightKg: weight,
        parcelType,
      });
      onDone();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Could not send parcel.');
    } finally {
      setSubmitting(false);
    }
  }

  function startOver() {
    setStep('route');
    setSelectedRoute(null);
    setSelectedDate(null);
    setSelectedDeparture(null);
    setDepartures([]);
    setAvailableDates([]);
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      {/* Step indicator */}
      <nav aria-label="Parcel sending progress" className="mb-8">
        <ol className="flex items-center">
          {STEP_LABELS.map((label, idx) => {
            const done = idx < stepIndex[step];
            const active = idx === stepIndex[step];
            return (
              <li key={label} className="flex flex-1 items-center last:flex-none">
                <div className="flex items-center gap-2">
                  <span className={[
                    'inline-flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all duration-300',
                    done ? 'bg-brand-600 text-white' : active ? 'bg-gradient-to-br from-brand-500 to-teal-600 text-white ring-4 ring-brand-100' : 'bg-slate-200 text-slate-500',
                  ].join(' ')}>
                    {done ? <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={3} /> : idx + 1}
                  </span>
                  <span className={[
                    'hidden text-sm font-semibold sm:inline',
                    active ? 'text-brand-800' : done ? 'text-slate-700' : 'text-slate-400',
                  ].join(' ')}>
                    {label}
                  </span>
                </div>
                {idx < STEP_LABELS.length - 1 && (
                  <span className={['mx-3 h-0.5 flex-1 rounded-full transition-colors duration-300', done ? 'bg-brand-500' : 'bg-slate-200'].join(' ')} />
                )}
              </li>
            );
          })}
        </ol>
        <p className="mt-3 text-sm font-medium text-slate-600" aria-live="polite">
          Step {stepIndex[step] + 1} of {STEP_LABELS.length}: <span className="text-brand-700">{STEP_HINTS[stepIndex[step]]}</span>
        </p>
      </nav>

      {/* STEP 1: Route selection */}
      {step === 'route' && (
        <div className="animate-fade-in">
          {loadingRoutes ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {routes.map((route, idx) => (
                <button
                  key={route.id}
                  type="button"
                  onClick={() => { setSelectedRoute(route); setStep('date'); }}
                  style={{ animationDelay: `${idx * 0.06}s` }}
                  className="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 text-left shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-lg animate-fade-in"
                >
                  <div className="pointer-events-none absolute inset-x-0 top-0 h-1 origin-left scale-x-0 bg-gradient-to-r from-brand-500 to-teal-500 transition-transform duration-500 group-hover:scale-x-100" />
                  {route.popular && (
                    <span className="absolute right-4 top-4 z-10 inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 ring-1 ring-amber-200">
                      Popular
                    </span>
                  )}
                  <div className="relative flex gap-4">
                    <div className="flex flex-col items-center pt-1.5">
                      <span className="h-2.5 w-2.5 rounded-full bg-brand-500 ring-4 ring-brand-100" />
                      <span className="my-1 w-px flex-1 border-l-2 border-dotted border-slate-300" />
                      <span className="h-2.5 w-2.5 rounded-full bg-rose-500 ring-4 ring-rose-100" />
                    </div>
                    <div className="min-w-0 flex-1 space-y-3 pr-12">
                      <p className="truncate text-base font-bold text-slate-900">{route.origin}</p>
                      <p className="truncate text-base font-bold text-slate-900">{route.destination}</p>
                    </div>
                  </div>
                  <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
                    <span className="text-sm text-slate-500">{route.distance_km} km · {route.duration_hours}h</span>
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-brand-50 text-brand-700 transition-all duration-300 group-hover:translate-x-1 group-hover:bg-brand-600 group-hover:text-white">
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* STEP 2: Date & matatu selection */}
      {step === 'date' && selectedRoute && (
        <div className="animate-fade-in">
          <button
            type="button"
            onClick={() => { setStep('route'); setSelectedRoute(null); }}
            className="group mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition-colors hover:text-brand-700"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" /> All routes
          </button>

          <div className="relative mb-8 overflow-hidden rounded-2xl bg-gradient-to-br from-brand-600 to-teal-700 p-6 text-white shadow-xl shadow-brand-900/20">
            <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
            <div className="relative flex items-center gap-2 text-lg font-bold sm:text-2xl">
              <span>{selectedRoute.origin}</span>
              <ArrowLeft className="h-5 w-5 rotate-180 opacity-70" />
              <span>{selectedRoute.destination}</span>
            </div>
            <p className="relative mt-2 text-sm text-brand-50">
              {selectedRoute.distance_km} km · approx {selectedRoute.duration_hours}h travel
            </p>
          </div>

          {/* Calendar */}
          <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
            <div className="flex items-center gap-2 border-b border-slate-100 bg-gradient-to-r from-brand-50 to-teal-50 px-6 py-4 text-sm font-semibold uppercase tracking-wide text-brand-800">
              <Calendar className="h-4 w-4" /> Choose a travel date
            </div>

            {loadingDates ? (
              <div className="flex items-center justify-center py-14">
                <Loader2 className="h-7 w-7 animate-spin text-brand-600" />
              </div>
            ) : (
              <div className="p-6">
                <div className="mb-5 flex items-center justify-between">
                  <button onClick={prevMonth} className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition-all hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700 active:scale-95" aria-label="Previous month">
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <span className="text-lg font-bold text-slate-800">{MONTHS[viewMonth]} {viewYear}</span>
                  <button onClick={nextMonth} className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition-all hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700 active:scale-95" aria-label="Next month">
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>

                <div className="mb-2 grid grid-cols-7 gap-1.5 text-center text-xs font-semibold uppercase tracking-wide text-slate-400">
                  {WEEKDAYS.map((w) => <span key={w} className="py-1">{w}</span>)}
                </div>

                <div className="grid grid-cols-7 gap-1.5">
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
                          'relative aspect-square rounded-xl text-sm font-semibold transition-all duration-200',
                          isSelected
                            ? 'bg-gradient-to-br from-brand-500 to-teal-600 text-white shadow-md ring-2 ring-brand-300 scale-105'
                            : disabled
                              ? 'cursor-not-allowed text-slate-300'
                              : 'text-slate-700 ring-1 ring-slate-200 hover:bg-brand-50 hover:text-brand-700 hover:ring-brand-300 hover:scale-105 active:scale-95',
                        ].join(' ')}
                      >
                        {d.getDate()}
                        {isAvailable && !isSelected && (
                          <span className="absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-brand-400" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Departure cards */}
          {selectedDate && (
            <div ref={resultsRef} className="mt-8 scroll-mt-24 animate-fade-in">
              <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
                Available matatus · {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-KE', { weekday: 'long', day: 'numeric', month: 'long' })}
              </h3>

              {loadingDepartures ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="h-6 w-6 animate-spin text-brand-600" />
                </div>
              ) : departures.length === 0 ? (
                <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500">
                  No matatus scheduled for this date. Try another day.
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {departures.map((dep, idx) => {
                    const isSelected = selectedDeparture?.id === dep.id;
                    return (
                      <button
                        key={dep.id}
                        onClick={() => setSelectedDeparture(dep)}
                        style={{ animationDelay: `${idx * 0.06}s` }}
                        className={[
                          'group relative flex flex-col gap-4 overflow-hidden rounded-2xl border p-5 text-left transition-all duration-300 animate-fade-in',
                          isSelected
                            ? 'border-brand-500 bg-brand-50 ring-2 ring-brand-300 shadow-md'
                            : 'border-slate-200/80 bg-white hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-lg',
                        ].join(' ')}
                      >
                        <div className="flex items-start justify-between">
                          <div className="inline-flex items-center gap-2">
                            <span className={[
                              'inline-flex h-10 w-10 items-center justify-center rounded-lg transition-transform group-hover:scale-110',
                              isSelected ? 'bg-gradient-to-br from-brand-500 to-teal-600 text-white' : 'bg-gradient-to-br from-brand-100 to-teal-100 text-brand-700',
                            ].join(' ')}>
                              <Bus className="h-5 w-5" />
                            </span>
                            <span className="font-mono text-base font-bold tracking-wide text-slate-900">{dep.plate_number}</span>
                          </div>
                          <div className="inline-flex items-center gap-1.5 rounded-lg bg-brand-50 px-3 py-1.5 text-sm font-bold text-brand-700 ring-1 ring-brand-100">
                            <Clock className="h-4 w-4" />{formatTime(dep.departure_time)}
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {dep.amenities.map((a) => {
                            const Icon = amenityIcon[a] ?? Wifi;
                            return (
                              <span key={a} title={a} className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600 ring-1 ring-slate-200">
                                <Icon className="h-3 w-3" /> {a}
                              </span>
                            );
                          })}
                        </div>
                        <span className="inline-flex items-center gap-1 text-sm font-semibold text-brand-700">
                          {isSelected ? 'Selected' : 'Choose this matatu'}
                          {!isSelected && <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Continue button */}
          {selectedDeparture && (
            <div className="mt-8 flex flex-col gap-3 rounded-2xl border border-brand-200 bg-brand-50 p-5 sm:flex-row sm:items-center sm:justify-between animate-fade-in">
              <div className="text-sm">
                <p className="font-semibold text-slate-900">
                  {selectedRoute.origin} → {selectedRoute.destination}
                </p>
                <p className="text-slate-600">
                  {formatDate(selectedDeparture.departure_date)} · {formatTime(selectedDeparture.departure_time)} · {selectedDeparture.vehicle_name} ({selectedDeparture.plate_number})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setStep('details')}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-500 to-teal-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-500/25 transition-all hover:shadow-xl hover:shadow-brand-500/40 hover:brightness-110 active:scale-[0.98]"
              >
                Continue to details <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* STEP 3: Parcel details */}
      {step === 'details' && selectedRoute && selectedDeparture && (
        <form onSubmit={handleSubmit} className="animate-fade-in">
          <button
            type="button"
            onClick={() => setStep('date')}
            className="group mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition-colors hover:text-brand-700"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" /> Back to date & matatu
          </button>

          {/* Trip summary */}
          <div className="mb-6 overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-lg font-bold text-slate-900">
                  {selectedRoute.origin} → {selectedRoute.destination}
                </p>
                <p className="text-sm text-slate-500">
                  {selectedDeparture.vehicle_name} · Plate {selectedDeparture.plate_number}
                </p>
              </div>
              <div className="text-right text-sm">
                <p className="font-semibold text-slate-800">{formatDate(selectedDeparture.departure_date)}</p>
                <p className="text-slate-500">{formatTime(selectedDeparture.departure_time)}</p>
              </div>
            </div>
          </div>

          {/* Pickup & drop-off (auto-filled from route) */}
          <div className="mb-6 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">Pickup & drop-off</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl bg-brand-50/60 p-4 ring-1 ring-brand-100">
                <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-brand-700"><MapPin className="h-3.5 w-3.5" /> Pickup</p>
                <p className="mt-1 text-sm font-bold text-slate-900">{selectedRoute.origin}</p>
              </div>
              <div className="rounded-xl bg-rose-50/60 p-4 ring-1 ring-rose-100">
                <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-rose-700"><MapPin className="h-3.5 w-3.5" /> Drop-off</p>
                <p className="mt-1 text-sm font-bold text-slate-900">{selectedRoute.destination}</p>
              </div>
            </div>
            <p className="mt-3 text-xs text-slate-500">Pickup and drop-off points are set by the route you chose.</p>
          </div>

          {/* Sender & recipient */}
          <div className="mb-6 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">Sender details</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Sender name</label>
                <input className={inputClass} value={senderName} onChange={(e) => setSenderName(e.target.value)} required placeholder="Your name" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Sender phone</label>
                <input className={inputClass} type="tel" value={senderPhone} onChange={(e) => setSenderPhone(e.target.value)} required placeholder="0712 345 678" />
              </div>
            </div>
          </div>

          <div className="mb-6 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">Recipient details</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Recipient name</label>
                <input className={inputClass} value={recipientName} onChange={(e) => setRecipientName(e.target.value)} required placeholder="Who will receive it" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Recipient phone</label>
                <input className={inputClass} type="tel" value={recipientPhone} onChange={(e) => setRecipientPhone(e.target.value)} required placeholder="0712 345 678" />
              </div>
            </div>
          </div>

          {/* Parcel details */}
          <div className="mb-6 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">Parcel details</h2>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">What are you sending?</label>
                <textarea className={`${inputClass} min-h-[80px] resize-y`} value={description} onChange={(e) => setDescription(e.target.value)} required maxLength={500} placeholder="Describe the parcel contents" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Weight (kg)</label>
                  <input className={inputClass} type="number" min="0.1" step="0.1" max="1000" value={weightKg} onChange={(e) => setWeightKg(e.target.value)} required />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Parcel type</label>
                  <select className={inputClass} value={parcelType} onChange={(e) => setParcelType(e.target.value as ParcelType)}>
                    {PARCEL_TYPES.map((t) => (
                      <option key={t.id} value={t.id}>{t.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Fee summary */}
          <div className="mb-6 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
            <div className="bg-gradient-to-r from-brand-50 to-teal-50 px-6 py-4">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-brand-800">Fee summary</h3>
            </div>
            <dl className="space-y-3 p-6 text-sm">
              <div className="flex justify-between">
                <dt className="text-slate-500">Route</dt>
                <dd className="font-medium text-slate-800">{selectedRoute.origin} - {selectedRoute.destination}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Matatu</dt>
                <dd className="font-medium text-slate-800">{selectedDeparture.vehicle_name} ({selectedDeparture.plate_number})</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Date & time</dt>
                <dd className="font-medium text-slate-800">{formatDate(selectedDeparture.departure_date)} · {formatTime(selectedDeparture.departure_time)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Parcel type</dt>
                <dd className="font-medium text-slate-800">{selectedTypeMeta.label}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Weight</dt>
                <dd className="font-medium text-slate-800">{weight} kg</dd>
              </div>
              <div className="flex justify-between border-t border-slate-100 pt-3 text-base">
                <dt className="font-semibold text-slate-700">Delivery fee</dt>
                <dd className="font-bold text-brand-700">{formatKes(parcelFee)}</dd>
              </div>
            </dl>
          </div>

          {submitError && (
            <div role="alert" className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 animate-fade-in">
              {submitError}
            </div>
          )}

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={startOver}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition-all hover:bg-slate-50"
            >
              <X className="h-4 w-4" /> Cancel
            </button>
            <button
              type="submit"
              disabled={!detailsValid || submitting}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-500 to-teal-600 px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-brand-500/25 transition-all hover:shadow-xl hover:shadow-brand-500/40 hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none"
            >
              {submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Sending parcel...</> : <><Package className="h-4 w-4" /> Send parcel · {formatKes(parcelFee)}</>}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
