import { useEffect, useState } from 'react';
import { CircleCheck as CheckCircle2, Download, Chrome as Home, MapPin, Clock, Calendar, Bus, Armchair, Phone, Smartphone, Loader as Loader2, ArrowRight } from 'lucide-react';
import { PhotoBackdrop } from '@/components/PhotoBackdrop';
import { db, type Booking, type Departure, type Route } from '@/lib/db';
import { formatKes, formatDate, formatTime, formatDateTime } from '@/lib/format';
import { downloadReceiptPDF } from '@/lib/pdfReceipt';

type Props = {
  paymentRef: string;
  onDone: () => void;
};

export function Receipt({ paymentRef, onDone }: Props) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [departure, setDeparture] = useState<Departure | null>(null);
  const [route, setRoute] = useState<Route | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      try {
        const result = await db.getBookingsByRef(paymentRef);
        if (!active) return;
        if (!result) {
          setError('Booking not found');
          setLoading(false);
          return;
        }
        setBookings(result.bookings);
        setDeparture(result.departure);
        setRoute(result.route);
      } catch (e) {
        if (!active) return;
        setError(e instanceof Error ? e.message : 'Failed to load receipt');
      }
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [paymentRef]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
      </div>
    );
  }
  if (error || !departure || !route || bookings.length === 0) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center animate-fade-in">
        <p className="text-red-600">{error ?? 'Could not load your receipt.'}</p>
        <button
          onClick={onDone}
          className="mt-4 rounded-xl bg-gradient-to-r from-brand-500 to-brand-700 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-brand-500/25"
        >
          Back to home
        </button>
      </div>
    );
  }

  const activeBookings = bookings.filter((b) => b.status !== 'cancelled');
  const totalFare = departure.fare * activeBookings.length;

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <div className="mb-8 text-center animate-slide-up">
        <div className="relative mx-auto mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-brand-100">
          <span className="absolute inset-0 rounded-full bg-brand-400/40 animate-pulse-ring" />
          <CheckCircle2 className="h-9 w-9 text-brand-600 animate-check-bounce" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl animate-slide-up animate-delay-100">Booking confirmed!</h1>
        <p className="mt-2 text-slate-600 animate-slide-up animate-delay-200">
          Your {bookings.length > 1 ? `${bookings.length} seats are` : 'seat is'} reserved. Show this receipt to the conductor before boarding.
        </p>
      </div>

      <div className="overflow-hidden rounded-3xl bg-white shadow-xl shadow-brand-900/10 ring-1 ring-brand-100 animate-slide-up animate-delay-300">
        <div className="relative overflow-hidden bg-brand-800 px-6 pb-8 pt-6 text-white sm:px-8">
          <PhotoBackdrop />
          <div className="relative flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/25">
                <Bus className="h-5 w-5" />
              </span>
              <span className="text-sm font-semibold tracking-wide">South Rift Luxury Shuttle</span>
            </div>
            <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold ring-1 ring-white/25">
              Confirmed
            </span>
          </div>

          <div className="relative mt-8 grid grid-cols-[1fr_auto_1fr] items-end gap-3">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-100">From</p>
              <p className="mt-1 truncate font-display text-xl font-bold sm:text-2xl">{route.origin}</p>
            </div>
            <ArrowRight className="mb-2 h-5 w-5 text-brand-100" />
            <div className="min-w-0 text-right">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-100">To</p>
              <p className="mt-1 truncate font-display text-xl font-bold sm:text-2xl">{route.destination}</p>
            </div>
          </div>

          <div className="relative mt-6 flex items-center justify-between border-t border-white/15 pt-4 text-sm">
            <span className="text-brand-100">Receipt No.</span>
            <span className="font-mono font-semibold tracking-wider">{paymentRef}</span>
          </div>
        </div>

        <div className="px-6 py-6 sm:px-8">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field icon={<Calendar className="h-4 w-4" />} label="Date">
              {formatDate(departure.departure_date)}
            </Field>
            <Field icon={<Clock className="h-4 w-4" />} label="Departure">
              {formatTime(departure.departure_time)}
            </Field>
            <Field icon={<Bus className="h-4 w-4" />} label="Matatu">
              {departure.vehicle_name} ({departure.plate_number})
            </Field>
            <Field icon={<Smartphone className="h-4 w-4" />} label="Payment">
              {bookings[0].payment_method}
            </Field>
            <Field icon={<MapPin className="h-4 w-4" />} label="Passenger">
              {bookings[0].passenger_name}
            </Field>
            <Field icon={<Phone className="h-4 w-4" />} label="Phone">
              {bookings[0].passenger_phone}
            </Field>
          </div>

          <div className="mt-6">
            <p className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              <Armchair className="h-3.5 w-3.5 text-brand-600" />
              {bookings.length > 1 ? 'Seats' : 'Seat'}
            </p>
            <div className="flex flex-wrap gap-2">
              {bookings.map((b) => (
                <span
                  key={b.id}
                  className={`inline-flex h-8 min-w-8 items-center justify-center rounded-lg px-2.5 text-sm font-bold ${b.status === 'cancelled' ? 'bg-red-50 text-red-700 line-through ring-1 ring-red-200' : 'bg-brand-100 text-brand-700 ring-1 ring-brand-200'}`}
                >
                  {b.seat_number}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-6 rounded-2xl bg-brand-50 p-5 ring-1 ring-brand-100">
            <div className="flex items-center justify-between text-sm text-slate-600">
              <span>
                {bookings.length} {bookings.length === 1 ? 'seat' : 'seats'} × {formatKes(departure.fare)}
              </span>
              <span>{formatDateTime(bookings[0].created_at)}</span>
            </div>
            <div className="mt-3 flex items-end justify-between border-t border-brand-100 pt-3">
              <span className="text-sm font-semibold uppercase tracking-wide text-brand-800">Amount paid</span>
              <span className="font-display text-2xl font-bold text-brand-700">{formatKes(totalFare)}</span>
            </div>
          </div>

          <div className="my-6 border-t border-dashed border-brand-200" />

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              onClick={() => downloadReceiptPDF({ bookings, departure, route, paymentRef })}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition-all hover:bg-slate-50 active:scale-[0.98]"
            >
              <Download className="h-4 w-4" /> Download PDF receipt
            </button>
            <button
              onClick={onDone}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-500 to-brand-700 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-500/25 transition-all hover:shadow-xl hover:shadow-brand-500/40 hover:brightness-110 active:scale-[0.98]"
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
      <div className="min-w-0">
        <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
        <p className="text-sm font-medium text-slate-800">{children}</p>
      </div>
    </div>
  );
}
