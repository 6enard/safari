import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Armchair, Bus, Calendar, ChevronRight, Clock, Loader as Loader2, MapPin, Ticket, Trash2 } from 'lucide-react';
import { db, type BookingGroup } from '@/lib/db';
import { formatDate, formatDateTime, formatKes, formatTime, refundStatusLabel } from '@/lib/format';
import { BookingDetailDialog } from '@/components/BookingDetailDialog';

type Props = {
  onBack: () => void;
};

type Filter = 'upcoming' | 'past';

function departureTimestamp(group: BookingGroup): number {
  const time = group.departure.departure_time.length === 5 ? `${group.departure.departure_time}:00` : group.departure.departure_time;
  return new Date(`${group.departure.departure_date}T${time}`).getTime();
}

export function MyBookings({ onBack }: Props) {
  const [groups, setGroups] = useState<BookingGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>('upcoming');
  const [openGroup, setOpenGroup] = useState<BookingGroup | null>(null);
  const [removingRef, setRemovingRef] = useState<string | null>(null);
  const [removeError, setRemoveError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      setGroups(await db.listBookingsForUser());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load your bookings.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleRemoveCancelled(paymentRef: string) {
    setRemovingRef(paymentRef);
    setRemoveError(null);
    try {
      await db.dismissCancelledBookings(paymentRef);
      setGroups((prev) =>
        prev
          .map((g) => (g.payment_ref === paymentRef ? { ...g, bookings: g.bookings.filter((b) => b.status !== 'cancelled') } : g))
          .filter((g) => g.bookings.length > 0),
      );
    } catch (err) {
      setRemoveError(err instanceof Error ? err.message : 'Could not remove these bookings. Please try again.');
    } finally {
      setRemovingRef(null);
    }
  }

  async function handleDeleteBooking(paymentRef: string) {
    setRemovingRef(paymentRef);
    setRemoveError(null);
    try {
      await db.deleteBookings(paymentRef);
      setGroups((prev) => prev.filter((g) => g.payment_ref !== paymentRef));
    } catch (err) {
      setRemoveError(err instanceof Error ? err.message : 'Could not delete this booking. Please try again.');
    } finally {
      setRemovingRef(null);
    }
  }

  const now = Date.now();
  const upcoming = useMemo(
    () => groups.filter((g) => departureTimestamp(g) >= now).sort((a, b) => departureTimestamp(a) - departureTimestamp(b)),
    [groups, now],
  );
  const past = useMemo(
    () => groups.filter((g) => departureTimestamp(g) < now).sort((a, b) => departureTimestamp(b) - departureTimestamp(a)),
    [groups, now],
  );
  const visible = filter === 'upcoming' ? upcoming : past;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <button
        type="button"
        onClick={onBack}
        className="group mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition-colors hover:text-brand-700"
      >
        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" /> Back to booking
      </button>

      <div className="mb-8 animate-slide-up">
        <h1 className="text-3xl font-bold text-slate-900">My bookings</h1>
        <p className="mt-1 text-slate-600">Every trip you have booked, in one place.</p>
      </div>

      <div role="tablist" className="mb-8 inline-flex rounded-xl bg-slate-100 p-1">
        {(
          [
            { id: 'upcoming', label: 'Upcoming', count: upcoming.length },
            { id: 'past', label: 'Past', count: past.length },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={filter === tab.id}
            onClick={() => setFilter(tab.id)}
            className={[
              'inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all',
              filter === tab.id ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-500 hover:text-slate-700',
            ].join(' ')}
          >
            {tab.label}
            <span className="rounded-md bg-slate-200/70 px-1.5 text-xs text-slate-600">{tab.count}</span>
          </button>
        ))}
      </div>

      {loading && (
        <div className="flex justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
        </div>
      )}

      {!loading && error && (
        <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-red-700 animate-fade-in">
          <p>{error}</p>
          <button
            type="button"
            onClick={load}
            className="mt-4 rounded-xl border border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-700 transition-colors hover:bg-red-50"
          >
            Try again
          </button>
        </div>
      )}

      {!loading && !error && visible.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white/60 px-6 py-16 text-center animate-fade-in">
          <span className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
            <Ticket className="h-7 w-7" />
          </span>
          <p className="mt-4 font-semibold text-slate-800">
            {filter === 'upcoming' ? 'No upcoming trips yet' : 'No past trips'}
          </p>
          <p className="mt-1 text-sm text-slate-500">
            {filter === 'upcoming' ? 'Book a seat and it will show up here.' : 'Completed trips will appear here.'}
          </p>
        </div>
      )}

      {removeError && (
        <p role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{removeError}</p>
      )}

      {!loading && !error && visible.length > 0 && (
        <ul className="space-y-4">
          {visible.map((group, idx) => {
            const confirmed = group.bookings.filter((b) => b.status !== 'cancelled');
            const cancelled = group.bookings.filter((b) => b.status === 'cancelled');
            const seats = confirmed.length;
            const total = group.departure.fare * seats;
            const fullyCancelled = seats === 0;
            return (
              <li
                key={group.payment_ref}
                style={{ animationDelay: `${idx * 0.06}s` }}
                className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm transition-shadow hover:shadow-lg animate-slide-up"
              >
                <div className="flex flex-col gap-4 border-b border-dashed border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="flex flex-wrap items-center gap-2 text-base font-bold text-slate-900">
                      <span className="inline-flex items-center gap-1"><MapPin className="h-4 w-4 text-brand-600" />{group.route.origin}</span>
                      <ArrowRight className="h-4 w-4 text-slate-400" />
                      <span className="inline-flex items-center gap-1"><MapPin className="h-4 w-4 text-rose-500" />{group.route.destination}</span>
                    </p>
                    <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-600">
                      <span className="inline-flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" />{formatDate(group.departure.departure_date)}</span>
                      <span className="inline-flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" />{formatTime(group.departure.departure_time)}</span>
                      <span className="inline-flex items-center gap-1.5"><Bus className="h-3.5 w-3.5" />{group.departure.vehicle_name} · {group.departure.plate_number}</span>
                    </p>
                  </div>
                  {fullyCancelled ? (
                    <span className="inline-flex w-fit flex-shrink-0 rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700 ring-1 ring-red-200">
                      Cancelled
                    </span>
                  ) : (
                    <span
                      className={[
                        'inline-flex w-fit flex-shrink-0 rounded-full px-3 py-1 text-xs font-semibold ring-1',
                        filter === 'upcoming' ? 'bg-brand-50 text-brand-700 ring-brand-200' : 'bg-slate-100 text-slate-600 ring-slate-200',
                      ].join(' ')}
                    >
                      {filter === 'upcoming' ? 'Upcoming' : 'Completed'}
                    </span>
                  )}
                </div>

                <div className="grid gap-4 p-5 sm:grid-cols-[1fr_auto] sm:items-end">
                  <div className="space-y-3">
                    {confirmed.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Armchair className="mr-1 h-4 w-4 text-slate-400" />
                        {confirmed.map((b) => (
                          <span key={b.id} className="inline-flex h-6 min-w-6 items-center justify-center rounded-md bg-brand-100 px-1.5 text-xs font-bold text-brand-700">
                            {b.seat_number}
                          </span>
                        ))}
                      </div>
                    )}
                    {cancelled.length > 0 && (
                      <ul className="space-y-2">
                        {cancelled.map((b) => (
                          <li key={b.id} className="rounded-xl border border-red-200 bg-red-50/60 p-3">
                            <div className="flex flex-wrap items-center gap-2 text-xs">
                              <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-md bg-white px-1.5 font-bold text-red-700 line-through ring-1 ring-red-200">
                                {b.seat_number}
                              </span>
                              <span className="rounded-full bg-red-100 px-2 py-0.5 font-semibold text-red-700">Cancelled</span>
                              <span className="rounded-full bg-white px-2 py-0.5 font-semibold text-slate-700 ring-1 ring-slate-200">{refundStatusLabel(b.refund_status)}</span>
                            </div>
                            <p className="mt-2 text-sm text-slate-700">
                              <span className="font-semibold">Reason:</span> {b.cancellation_reason ?? 'Not specified'}
                            </p>
                            {b.cancelled_at && (
                              <p className="mt-1 text-xs text-slate-500">Cancelled on {formatDateTime(b.cancelled_at)}</p>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                    {cancelled.length > 0 && (
                      <button
                        type="button"
                        disabled={removingRef === group.payment_ref}
                        onClick={() => handleRemoveCancelled(group.payment_ref)}
                        className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-600 ring-1 ring-slate-200 transition-colors hover:bg-white hover:text-red-600 disabled:opacity-50"
                      >
                        {removingRef === group.payment_ref ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                        {removingRef === group.payment_ref ? 'Removing...' : 'Remove cancelled seats'}
                      </button>
                    )}
                    {(fullyCancelled || filter === 'past') && (
                      <button
                        type="button"
                        disabled={removingRef === group.payment_ref}
                        onClick={() => handleDeleteBooking(group.payment_ref)}
                        className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-red-600 ring-1 ring-red-200 transition-colors hover:bg-red-50 disabled:opacity-50"
                      >
                        {removingRef === group.payment_ref ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                        {removingRef === group.payment_ref ? 'Deleting...' : fullyCancelled ? 'Delete booking' : 'Delete past trip'}
                      </button>
                    )}
                    <p className="text-xs text-slate-500">
                      Receipt <span className="font-mono font-semibold text-slate-700">{group.payment_ref}</span> · Booked {formatDateTime(group.created_at)}
                    </p>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="text-xs text-slate-500">{seats} {seats === 1 ? 'seat' : 'seats'} paid</p>
                    <p className="text-lg font-bold text-brand-700">{formatKes(total)}</p>
                    <button
                      type="button"
                      onClick={() => setOpenGroup(group)}
                      className="mt-3 inline-flex items-center gap-1 rounded-lg border border-brand-200 bg-brand-50 px-3 py-2 text-sm font-semibold text-brand-700 transition-all hover:bg-brand-100"
                    >
                      View details <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {openGroup && <BookingDetailDialog group={openGroup} onClose={() => setOpenGroup(null)} />}
    </div>
  );
}
