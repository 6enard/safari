import { useMemo, useState } from 'react';
import { Bus, Calendar, Clock, MapPin, Phone, Ticket, User as UserIcon } from 'lucide-react';
import type { AdminBooking, AdminData } from '@/lib/adminApi';
import { inputClass } from '@/components/admin/AdminShared';
import { formatDate, formatDateTime, formatTime, refundStatusLabel } from '@/lib/format';
import type { RefundStatus } from '@/lib/db';

type Props = {
  data: AdminData;
};

type RefundFilter = 'all' | RefundStatus | 'unset';

const REFUND_STYLES: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700 ring-amber-200',
  refunded: 'bg-brand-50 text-brand-700 ring-brand-200',
  not_refunded: 'bg-red-50 text-red-700 ring-red-200',
};

export function CancellationsAdmin({ data }: Props) {
  const [filter, setFilter] = useState<RefundFilter>('all');
  const [search, setSearch] = useState('');

  const cancelled = useMemo(
    () =>
      data.bookings
        .filter((b) => b.status === 'cancelled')
        .sort((a, b) => (b.cancelled_at ?? b.created_at).localeCompare(a.cancelled_at ?? a.created_at)),
    [data.bookings],
  );

  const counts = useMemo(() => {
    const result = { pending: 0, refunded: 0, not_refunded: 0 };
    for (const b of cancelled) {
      if (b.refund_status) result[b.refund_status] += 1;
    }
    return result;
  }, [cancelled]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return cancelled.filter((b) => {
      if (filter === 'unset' && b.refund_status !== null) return false;
      if (filter !== 'all' && filter !== 'unset' && b.refund_status !== filter) return false;
      if (!q) return true;
      return (
        b.passenger_name.toLowerCase().includes(q) ||
        b.passenger_phone.toLowerCase().includes(q) ||
        b.payment_ref.toLowerCase().includes(q)
      );
    });
  }, [cancelled, filter, search]);

  if (cancelled.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white/60 p-10 text-center text-slate-500">
        <Ticket className="mx-auto mb-3 h-8 w-8 opacity-50" />
        <p className="font-medium text-slate-700">No cancelled bookings</p>
        <p className="mt-1 text-sm">Cancelled seats appear here with their reason and refund status.</p>
      </div>
    );
  }

  return (
    <section className="space-y-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <SummaryCard label="Cancelled" value={cancelled.length} />
        <SummaryCard label="Refund pending" value={counts.pending} />
        <SummaryCard label="Refunded" value={counts.refunded} />
        <SummaryCard label="No refund" value={counts.not_refunded} />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          className={`${inputClass} sm:flex-1`}
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by passenger name, phone or receipt number..."
        />
        <select
          className={`${inputClass} sm:w-56`}
          value={filter}
          onChange={(e) => setFilter(e.target.value as RefundFilter)}
          aria-label="Filter by refund status"
        >
          <option value="all">All refund statuses</option>
          <option value="pending">Refund pending</option>
          <option value="refunded">Refunded</option>
          <option value="not_refunded">No refund</option>
          <option value="unset">Refund not set</option>
        </select>
      </div>

      {visible.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-white/60 p-6 text-center text-sm text-slate-400">
          No cancellations match these filters.
        </div>
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {visible.map((b) => (
            <CancellationCard key={b.id} booking={b} />
          ))}
        </ul>
      )}
    </section>
  );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
    </div>
  );
}

function CancellationCard({ booking: b }: { booking: AdminBooking }) {
  const dep = b.departures;
  const route = dep?.routes;
  const vehicle = dep?.vehicles;
  const refundStyle = b.refund_status ? REFUND_STYLES[b.refund_status] : 'bg-slate-100 text-slate-600 ring-slate-200';

  return (
    <li className="min-w-0 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <p className="flex min-w-0 flex-wrap items-center gap-2 font-bold text-slate-900">
          <UserIcon className="h-4 w-4 flex-shrink-0 text-brand-600" />
          <span className="truncate">{b.passenger_name}</span>
          <span className="rounded-md bg-red-100 px-1.5 text-xs text-red-700">Seat {b.seat_number}</span>
        </p>
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${refundStyle}`}>
          {refundStatusLabel(b.refund_status)}
        </span>
      </div>

      <div className="mt-3 rounded-xl bg-slate-50 p-3 text-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Reason</p>
        <p className="mt-1 whitespace-pre-line text-slate-800">{b.cancellation_reason ?? 'No reason recorded'}</p>
      </div>

      <dl className="mt-3 grid gap-2 text-xs text-slate-600 sm:grid-cols-2">
        <div className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 flex-shrink-0" /><span className="truncate">{route ? `${route.origin} - ${route.destination}` : '—'}</span></div>
        <div className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5 flex-shrink-0" />{dep ? `${formatDate(dep.departure_date)} · ${formatTime(dep.departure_time)}` : '—'}</div>
        <div className="flex items-center gap-1.5"><Bus className="h-3.5 w-3.5 flex-shrink-0" /><span className="truncate">{vehicle ? `${vehicle.vehicle_name} · ${vehicle.plate_number}` : '—'}</span></div>
        <div className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5 flex-shrink-0" />{b.passenger_phone}</div>
        <div className="flex items-center gap-1.5"><Ticket className="h-3.5 w-3.5 flex-shrink-0" /><span className="font-mono">{b.payment_ref}</span></div>
        <div className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5 flex-shrink-0" />Cancelled {b.cancelled_at ? formatDateTime(b.cancelled_at) : '—'}</div>
      </dl>
    </li>
  );
}
