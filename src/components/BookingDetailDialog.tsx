import { useEffect, useState, type ReactNode } from 'react';
import { Armchair, Bus, Calendar, ChevronRight, Clock, MapPin, Phone, Ticket, User as UserIcon, X } from 'lucide-react';
import type { BookingGroup } from '@/lib/db';
import { formatDate, formatDateTime, formatKes, formatTime, refundStatusLabel } from '@/lib/format';

type Props = {
  group: BookingGroup;
  onClose: () => void;
};

export function BookingDetailDialog({ group, onClose }: Props) {
  const [showDriver, setShowDriver] = useState(false);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const confirmed = group.bookings.filter((b) => b.status !== 'cancelled');
  const cancelled = group.bookings.filter((b) => b.status === 'cancelled');
  const first = group.bookings[0];
  const paid = group.departure.fare * confirmed.length;
  const fullyCancelled = confirmed.length === 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 p-0 backdrop-blur-sm animate-fade-in sm:items-center sm:p-4"
      onMouseDown={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Booking details"
        className="flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl animate-slide-up sm:rounded-2xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Booking details</p>
            <p className="mt-0.5 truncate text-base font-bold text-slate-900">
              {group.route.origin} → {group.route.destination}
            </p>
          </div>
          <div className="flex flex-shrink-0 items-center gap-2">
            <span
              className={[
                'rounded-full px-2.5 py-1 text-xs font-semibold ring-1',
                fullyCancelled ? 'bg-red-50 text-red-700 ring-red-200' : 'bg-brand-50 text-brand-700 ring-brand-200',
              ].join(' ')}
            >
              {fullyCancelled ? 'Cancelled' : 'Confirmed'}
            </span>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="space-y-5 overflow-y-auto px-5 py-5">
          <Section title="Driver">
            {group.driver ? (
              <>
                <button
                  type="button"
                  onClick={() => setShowDriver((open) => !open)}
                  aria-expanded={showDriver}
                  className="flex w-full items-center gap-3 rounded-lg p-1 text-left transition-colors hover:bg-slate-50"
                >
                  <DriverAvatar name={group.driver.full_name} photoUrl={group.driver.photo_url} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-900">{group.driver.full_name}</p>
                    <p className="text-xs text-slate-500">Tap to view driver profile</p>
                  </div>
                  <ChevronRight className={`h-4 w-4 flex-shrink-0 text-slate-400 transition-transform ${showDriver ? 'rotate-90' : ''}`} />
                </button>
                {showDriver && (
                  <div className="mt-3 overflow-hidden rounded-xl border border-brand-100 bg-brand-50/40 animate-fade-in">
                    <DriverAvatar name={group.driver.full_name} photoUrl={group.driver.photo_url} size="lg" />
                    <div className="space-y-3 p-4">
                      <div>
                        <p className="text-lg font-bold text-slate-900">{group.driver.full_name}</p>
                        <p className="text-xs text-slate-500">
                          Driving {group.departure.vehicle_name} · {group.departure.plate_number}
                        </p>
                      </div>
                      {group.driver.phone && (
                        <a
                          href={`tel:${group.driver.phone.replace(/\s+/g, '')}`}
                          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-500 to-brand-700 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-brand-500/25 transition-all hover:brightness-110"
                        >
                          <Phone className="h-4 w-4" /> Call {group.driver.phone}
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <p className="text-sm text-slate-500">A driver has not been assigned to this matatu yet.</p>
            )}
          </Section>

          <Section title="Trip">
            <Row icon={<Calendar className="h-4 w-4" />} label="Date" value={formatDate(group.departure.departure_date)} />
            <Row icon={<Clock className="h-4 w-4" />} label="Departure" value={formatTime(group.departure.departure_time)} />
            <Row icon={<Bus className="h-4 w-4" />} label="Matatu" value={`${group.departure.vehicle_name} · ${group.departure.plate_number}`} />
            <Row icon={<MapPin className="h-4 w-4" />} label="Route" value={`${group.route.origin} - ${group.route.destination}`} />
          </Section>

          <Section title="Passenger and seats">
            <Row icon={<UserIcon className="h-4 w-4" />} label="Passenger" value={first.passenger_name} />
            <Row icon={<Phone className="h-4 w-4" />} label="Phone" value={first.passenger_phone} />
            <Row
              icon={<Armchair className="h-4 w-4" />}
              label="Seats"
              value={confirmed.length > 0 ? confirmed.map((b) => b.seat_number).join(', ') : 'None active'}
            />
          </Section>

          <Section title="Payment">
            <Row icon={<Ticket className="h-4 w-4" />} label="Receipt no." value={group.payment_ref} mono />
            <Row icon={<Ticket className="h-4 w-4" />} label="Method" value={first.payment_method} />
            <Row icon={<Ticket className="h-4 w-4" />} label="Amount paid" value={formatKes(paid)} />
            <Row icon={<Clock className="h-4 w-4" />} label="Booked on" value={formatDateTime(group.created_at)} />
          </Section>

          {cancelled.length > 0 && (
            <Section title="Cancelled seats">
              <ul className="space-y-2">
                {cancelled.map((b) => (
                  <li key={b.id} className="rounded-xl border border-red-200 bg-red-50/60 p-3 text-sm">
                    <p className="font-semibold text-slate-900">Seat {b.seat_number} · {refundStatusLabel(b.refund_status)}</p>
                    <p className="mt-1 text-slate-700">{b.cancellation_reason ?? 'No reason recorded'}</p>
                    {b.cancelled_at && <p className="mt-1 text-xs text-slate-500">Cancelled on {formatDateTime(b.cancelled_at)}</p>}
                  </li>
                ))}
              </ul>
            </Section>
          )}
        </div>
      </div>
    </div>
  );
}

function DriverAvatar({ name, photoUrl, size }: { name: string; photoUrl: string | null; size: 'sm' | 'lg' }) {
  if (photoUrl) {
    return (
      <img
        src={photoUrl}
        alt={`Photo of ${name}`}
        loading="lazy"
        className={size === 'lg' ? 'h-48 w-full object-cover' : 'h-10 w-10 flex-shrink-0 rounded-full object-cover ring-1 ring-brand-100'}
      />
    );
  }
  return (
    <span
      className={
        size === 'lg'
          ? 'flex h-40 w-full items-center justify-center bg-brand-50 text-brand-500'
          : 'inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600'
      }
      aria-label={`No photo for ${name}`}
    >
      <UserIcon className={size === 'lg' ? 'h-14 w-14' : 'h-5 w-5'} />
    </span>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</h3>
      <div className="space-y-2.5 rounded-xl border border-slate-200 bg-white p-4">{children}</div>
    </section>
  );
}

function Row({ icon, label, value, mono }: { icon: ReactNode; label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="inline-flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-500">{icon}</span>
      <span className="w-24 flex-shrink-0 text-slate-500">{label}</span>
      <span className={`min-w-0 flex-1 truncate font-medium text-slate-800 ${mono ? 'font-mono' : ''}`}>{value}</span>
    </div>
  );
}
