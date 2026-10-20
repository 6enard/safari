import { useEffect, useState } from 'react';
import { CircleCheck as CheckCircle2, Download, Chrome as Home, MapPin, Clock, Calendar, Bus, Armchair, Phone, Smartphone, CreditCard, Banknote, Loader as Loader2 } from 'lucide-react';
import { db, type Booking, type Departure, type Route } from '@/lib/db';
import { formatKes, formatDate, formatTime, formatDateTime } from '@/lib/format';

type Props = {
  bookingId: string;
  paymentRef: string;
  onDone: () => void;
};

const methodIcon: Record<string, typeof Smartphone> = {
  'M-Pesa': Smartphone,
  Card: CreditCard,
  Cash: Banknote,
};

export function Receipt({ bookingId, paymentRef, onDone }: Props) {
  const [booking, setBooking] = useState<Booking | null>(null);
  const [departure, setDeparture] = useState<Departure | null>(null);
  const [route, setRoute] = useState<Route | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      try {
        const result = await db.getBooking(bookingId);
        if (!active) return;
        if (!result) {
          setError('Booking not found');
          setLoading(false);
          return;
        }
        setBooking(result.booking);
        setDeparture(result.departure);
        setRoute(result.route);
      } catch (e: any) {
        if (!active) return;
        setError(e?.message ?? 'Failed to load receipt');
      }
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [bookingId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
      </div>
    );
  }
  if (error || !booking || !departure || !route) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center animate-fade-in">
        <p className="text-red-600">{error ?? 'Could not load your receipt.'}</p>
        <button
          onClick={onDone}
          className="mt-4 rounded-xl bg-gradient-to-r from-brand-500 to-teal-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-brand-500/25"
        >
          Back to home
        </button>
      </div>
    );
  }

  const MethodIcon = methodIcon[booking.payment_method] ?? Smartphone;

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <div className="mb-8 text-center animate-slide-up">
        <div className="relative mx-auto mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-brand-100">
          <span className="absolute inset-0 rounded-full bg-brand-400/40 animate-pulse-ring" />
          <CheckCircle2 className="h-9 w-9 text-brand-600 animate-check-bounce" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl animate-slide-up animate-delay-100">Booking confirmed!</h1>
        <p className="mt-2 text-slate-600 animate-slide-up animate-delay-200">
          Your seat is reserved. Show this receipt to the conductor before boarding.
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xl shadow-brand-900/10 animate-slide-up animate-delay-300">
        <div className="relative overflow-hidden bg-gradient-to-r from-brand-600 to-teal-700 px-6 py-5 text-white">
          <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10 blur-xl" />
          <div className="relative flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-brand-100">Receipt No.</p>
              <p className="font-mono text-lg font-bold">{paymentRef}</p>
            </div>
            <Bus className="h-8 w-8 opacity-80" />
          </div>
        </div>

        <div className="p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field icon={<MapPin className="h-4 w-4" />} label="Route">
              {route.origin} - {route.destination}
            </Field>
            <Field icon={<Bus className="h-4 w-4" />} label="Vehicle">
              {departure.vehicle_name} ({departure.plate_number})
            </Field>
            <Field icon={<Calendar className="h-4 w-4" />} label="Date">
              {formatDate(departure.departure_date)}
            </Field>
            <Field icon={<Clock className="h-4 w-4" />} label="Departure">
              {formatTime(departure.departure_time)}
            </Field>
            <Field icon={<Armchair className="h-4 w-4" />} label="Seat">
              Seat {booking.seat_number}
            </Field>
            <Field icon={<MethodIcon className="h-4 w-4" />} label="Payment">
              {booking.payment_method}
            </Field>
            <Field icon={<MapPin className="h-4 w-4" />} label="Passenger">
              {booking.passenger_name}
            </Field>
            <Field icon={<Phone className="h-4 w-4" />} label="Phone">
              {booking.passenger_phone}
            </Field>
          </div>

          <div className="mt-6 rounded-xl bg-gradient-to-r from-brand-50 to-teal-50 p-4 ring-1 ring-brand-100">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600">Amount paid</span>
              <span className="text-lg font-bold text-brand-700">{formatKes(departure.fare)}</span>
            </div>
            <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
              <span>Booked on</span>
              <span>{formatDateTime(booking.created_at)}</span>
            </div>
          </div>

          <div className="my-6 border-t-2 border-dashed border-slate-200" />

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              onClick={() => window.print()}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition-all hover:bg-slate-50 active:scale-[0.98]"
            >
              <Download className="h-4 w-4" /> Print / Save receipt
            </button>
            <button
              onClick={onDone}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-500 to-teal-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-500/25 transition-all hover:shadow-xl hover:shadow-brand-500/40 hover:brightness-110 active:scale-[0.98]"
            >
              <Home className="h-4 w-4" /> Book another trip
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
        {icon}
      </span>
      <div>
        <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
        <p className="text-sm font-medium text-slate-800">{children}</p>
      </div>
    </div>
  );
}
