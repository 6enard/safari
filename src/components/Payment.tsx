import { useState } from 'react';
import { ArrowLeft, CreditCard, Smartphone, Banknote, Loader as Loader2, ShieldCheck, Armchair } from 'lucide-react';
import { db, type Departure, type Route } from '@/lib/db';
import { formatKes, formatDate, formatTime, genPaymentRef } from '@/lib/format';

type Props = {
  route: Route;
  departure: Departure;
  seats: number[];
  onBack: () => void;
  onPaid: (bookingIds: string[], paymentRef: string) => void;
};

type Method = 'M-Pesa' | 'Card' | 'Cash';

const methods: { id: Method; icon: typeof Smartphone; desc: string }[] = [
  { id: 'M-Pesa', icon: Smartphone, desc: 'Pay via M-Pesa till' },
  { id: 'Card', icon: CreditCard, desc: 'Visa / Mastercard' },
  { id: 'Cash', icon: Banknote, desc: 'Pay at the booking office' },
];

export function Payment({ route, departure, seats, onBack, onPaid }: Props) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [method, setMethod] = useState<Method>('M-Pesa');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const valid = name.trim().length >= 2 && phone.trim().length >= 10;
  const totalFare = departure.fare * seats.length;

  async function handlePay(e: React.FormEvent) {
    e.preventDefault();
    if (!valid) return;
    setProcessing(true);
    setError(null);
    const paymentRef = genPaymentRef();
    try {
      const { ids } = await db.createBookings({
        departure_id: departure.id,
        seat_numbers: seats,
        passenger_name: name.trim(),
        passenger_phone: phone.trim(),
        payment_method: method,
        payment_ref: paymentRef,
      });
      setProcessing(false);
      onPaid(ids, paymentRef);
    } catch (e: any) {
      setProcessing(false);
      if (e?.code === '23505' || /already booked/i.test(e?.message ?? '')) {
        setError('One of the seats was just booked by someone else. Please go back and pick different seats.');
      } else {
        setError(e?.message ?? 'Booking could not be completed.');
      }
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <button
        onClick={onBack}
        className="group mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition-colors hover:text-brand-700"
      >
        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" /> Back to seat selection
      </button>

      <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl animate-slide-up">Payment & details</h1>
      <p className="mt-2 text-slate-600 animate-slide-up animate-delay-100">Enter your details and choose how to pay.</p>

      <form onSubmit={handlePay} className="mt-8 grid gap-6 md:grid-cols-[1fr_300px]">
        <div className="space-y-6 animate-slide-up animate-delay-200">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">
              Passenger details
            </h2>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Full name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Amara Otieno"
                  className="w-full rounded-xl border border-slate-300 bg-slate-50/50 px-4 py-2.5 text-sm outline-none transition-all focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-200"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Phone number
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 0712 345 678"
                  className="w-full rounded-xl border border-slate-300 bg-slate-50/50 px-4 py-2.5 text-sm outline-none transition-all focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-200"
                />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">
              Payment method
            </h2>
            <div className="space-y-3">
              {methods.map((m) => {
                const Icon = m.icon;
                const active = method === m.id;
                return (
                  <button
                    type="button"
                    key={m.id}
                    onClick={() => setMethod(m.id)}
                    className={[
                      'flex w-full items-center gap-3 rounded-xl border p-4 text-left transition-all duration-200',
                      active
                        ? 'border-brand-500 bg-gradient-to-r from-brand-50 to-teal-50 ring-1 ring-brand-300 shadow-sm'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50',
                    ].join(' ')}
                  >
                    <span
                      className={[
                        'inline-flex h-10 w-10 items-center justify-center rounded-lg transition-all',
                        active ? 'bg-gradient-to-br from-brand-500 to-teal-600 text-white shadow-md shadow-brand-500/30' : 'bg-slate-100 text-slate-600',
                      ].join(' ')}
                    >
                      <Icon className="h-5 w-5" />
                    </span>
                    <span>
                      <span className="block text-sm font-semibold text-slate-800">{m.id}</span>
                      <span className="block text-xs text-slate-500">{m.desc}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 animate-fade-in">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={!valid || processing}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-500 to-teal-600 px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-brand-500/25 transition-all hover:shadow-xl hover:shadow-brand-500/40 hover:brightness-110 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none"
          >
            {processing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Confirming booking...
              </>
            ) : (
              <>
                <ShieldCheck className="h-4 w-4" /> Pay {formatKes(totalFare)}
              </>
            )}
          </button>
        </div>

        <aside className="h-fit overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm md:sticky md:top-6 animate-slide-in-right animate-delay-300">
          <div className="bg-gradient-to-r from-brand-50 to-teal-50 px-6 py-4">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-brand-800">Summary</h3>
          </div>
          <dl className="space-y-3 p-6 text-sm">
            <div className="flex justify-between gap-2">
              <dt className="text-slate-500">Route</dt>
              <dd className="text-right font-medium text-slate-800">
                {route.origin} - {route.destination}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Date</dt>
              <dd className="font-medium text-slate-800">
                {formatDate(departure.departure_date)}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Time</dt>
              <dd className="font-medium text-slate-800">
                {formatTime(departure.departure_time)}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Vehicle</dt>
              <dd className="font-medium text-slate-800">{departure.vehicle_name}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Seats</dt>
              <dd className="flex flex-wrap items-center justify-end gap-1">
                {seats.map((s) => (
                  <span
                    key={s}
                    className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-brand-100 text-xs font-bold text-brand-700"
                  >
                    {s}
                  </span>
                ))}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Fare per seat</dt>
              <dd className="font-medium text-slate-800">{formatKes(departure.fare)}</dd>
            </div>
            <div className="flex justify-between border-t border-slate-100 pt-3 text-base">
              <dt className="font-semibold text-slate-700">
                Total ({seats.length} {seats.length === 1 ? 'seat' : 'seats'})
              </dt>
              <dd className="font-bold text-brand-700">{formatKes(totalFare)}</dd>
            </div>
          </dl>
        </aside>
      </form>
    </div>
  );
}
