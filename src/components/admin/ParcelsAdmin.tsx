import { useMemo, useState } from 'react';
import { Package, Search, Trash2, Loader as Loader2, MapPin, Phone, User as UserIcon, Weight, Tag, Route as RouteIcon, X, Calendar, Clock } from 'lucide-react';
import type { AdminData, AdminParcel } from '@/lib/adminApi';
import type { ParcelStatus } from '@/lib/db';
import { adminApi, errorText } from '@/lib/adminApi';
import { DeleteButton, Field, FormError, FormModal, inputClass } from '@/components/admin/AdminShared';
import { formatKes, formatDate, formatDateTime, formatTime } from '@/lib/format';

type Props = {
  data: AdminData;
  onChanged: () => Promise<void>;
};

const STATUS_OPTIONS: { id: ParcelStatus; label: string }[] = [
  { id: 'pending', label: 'Pending' },
  { id: 'in_transit', label: 'In transit' },
  { id: 'delivered', label: 'Delivered' },
  { id: 'cancelled', label: 'Cancelled' },
];

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700 ring-amber-200',
  in_transit: 'bg-brand-50 text-brand-700 ring-brand-200',
  delivered: 'bg-brand-50 text-brand-700 ring-brand-200',
  cancelled: 'bg-red-50 text-red-700 ring-red-200',
};

const PARCEL_TYPE_LABELS: Record<string, string> = {
  document: 'Documents',
  electronics: 'Electronics',
  clothing: 'Clothing',
  food: 'Food / Groceries',
  other: 'Other',
};

export function ParcelsAdmin({ data, onChanged }: Props) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [editing, setEditing] = useState<AdminParcel | null>(null);
  const [pageError, setPageError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return data.parcels.filter((p) => {
      if (statusFilter !== 'all' && p.status !== statusFilter) return false;
      if (!q) return true;
      return (
        p.tracking_number.toLowerCase().includes(q) ||
        p.sender_name.toLowerCase().includes(q) ||
        p.recipient_name.toLowerCase().includes(q) ||
        p.sender_phone.toLowerCase().includes(q) ||
        p.recipient_phone.toLowerCase().includes(q) ||
        p.pickup_location.toLowerCase().includes(q) ||
        p.dropoff_location.toLowerCase().includes(q)
      );
    });
  }, [data.parcels, search, statusFilter]);

  const counts = useMemo(() => {
    const r: Record<string, number> = { pending: 0, in_transit: 0, delivered: 0, cancelled: 0 };
    for (const p of data.parcels) r[p.status] = (r[p.status] ?? 0) + 1;
    return r;
  }, [data.parcels]);

  async function handleDelete(p: AdminParcel) {
    setPageError(null);
    try {
      await adminApi.deleteParcel(p.id);
      await onChanged();
    } catch (err) {
      setPageError(errorText(err));
    }
  }

  if (data.parcels.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white/60 p-10 text-center text-slate-500">
        <Package className="mx-auto mb-3 h-8 w-8 opacity-50" />
        <p className="font-medium text-slate-700">No parcels yet</p>
        <p className="mt-1 text-sm">When customers send parcels, they will appear here.</p>
      </div>
    );
  }

  return (
    <section className="space-y-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <SummaryCard label="Pending" value={counts.pending ?? 0} />
        <SummaryCard label="In transit" value={counts.in_transit ?? 0} />
        <SummaryCard label="Delivered" value={counts.delivered ?? 0} />
        <SummaryCard label="Cancelled" value={counts.cancelled ?? 0} />
      </div>

      {pageError && <FormError message={pageError} />}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative sm:flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            className={`${inputClass} pl-10`}
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by tracking no., sender, recipient, phone, location..."
          />
        </div>
        <select
          className={`${inputClass} sm:w-48`}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          aria-label="Filter by status"
        >
          <option value="all">All statuses</option>
          <option value="pending">Pending</option>
          <option value="in_transit">In transit</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-white/60 p-6 text-center text-sm text-slate-400">
          No parcels match these filters.
        </div>
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {filtered.map((p) => (
            <ParcelCard key={p.id} parcel={p} onEdit={() => setEditing(p)} onDelete={() => handleDelete(p)} />
          ))}
        </ul>
      )}

      {editing && (
        <EditParcelDialog
          parcel={editing}
          onClose={() => setEditing(null)}
          onSaved={async () => {
            setEditing(null);
            await onChanged();
          }}
        />
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

function ParcelCard({ parcel: p, onEdit, onDelete }: { parcel: AdminParcel; onEdit: () => void; onDelete: () => Promise<void> }) {
  const style = STATUS_STYLES[p.status] ?? STATUS_STYLES.pending;
  const dep = p.departures;
  const route = p.routes;

  return (
    <li className="min-w-0 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <p className="flex min-w-0 flex-wrap items-center gap-2 font-bold text-slate-900">
          <Package className="h-4 w-4 flex-shrink-0 text-brand-600" />
          <span className="font-mono">{p.tracking_number}</span>
        </p>
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${style}`}>
          {p.status.replace('_', ' ')}
        </span>
      </div>

      <div className="mt-3 rounded-xl bg-slate-50 p-3 text-sm">
        <p className="flex items-center gap-2 font-semibold text-slate-900">
          <MapPin className="h-3.5 w-3.5 text-brand-600" />
          {p.pickup_location}
          <X className="h-3 w-3 rotate-45 text-slate-400" />
          <MapPin className="h-3.5 w-3.5 text-rose-500" />
          {p.dropoff_location}
        </p>
      </div>

      <dl className="mt-3 grid gap-2 text-xs text-slate-600 sm:grid-cols-2">
        <div className="flex items-center gap-1.5"><UserIcon className="h-3.5 w-3.5 flex-shrink-0" /><span className="truncate">From: {p.sender_name}</span></div>
        <div className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5 flex-shrink-0" />{p.sender_phone}</div>
        <div className="flex items-center gap-1.5"><UserIcon className="h-3.5 w-3.5 flex-shrink-0" /><span className="truncate">To: {p.recipient_name}</span></div>
        <div className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5 flex-shrink-0" />{p.recipient_phone}</div>
        <div className="flex items-center gap-1.5"><Tag className="h-3.5 w-3.5 flex-shrink-0" />{PARCEL_TYPE_LABELS[p.parcel_type] ?? p.parcel_type}</div>
        <div className="flex items-center gap-1.5"><Weight className="h-3.5 w-3.5 flex-shrink-0" />{p.weight_kg} kg</div>
        {route && <div className="flex items-center gap-1.5"><RouteIcon className="h-3.5 w-3.5 flex-shrink-0" /><span className="truncate">{route.origin} - {route.destination}</span></div>}
        {dep && <div className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5 flex-shrink-0" />{formatDate(dep.departure_date)} · {formatTime(dep.departure_time)}</div>}
      </dl>

      <p className="mt-2 text-sm text-slate-700"><span className="font-semibold">Contents:</span> {p.description}</p>
      {p.admin_notes && (
        <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800 ring-1 ring-amber-200">
          <span className="font-semibold">Admin note:</span> {p.admin_notes}
        </p>
      )}

      <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
        <div>
          <p className="text-xs text-slate-500">Fee</p>
          <p className="text-sm font-bold text-brand-700">{formatKes(p.fee)}</p>
        </div>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={onEdit}
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold text-brand-700 transition-colors hover:bg-brand-50"
          >
            Edit
          </button>
          <DeleteButton onConfirm={onDelete} />
        </div>
      </div>
    </li>
  );
}

function EditParcelDialog({ parcel, onClose, onSaved }: { parcel: AdminParcel; onClose: () => void; onSaved: () => Promise<void> }) {
  const [status, setStatus] = useState<ParcelStatus>(parcel.status);
  const [fee, setFee] = useState(String(parcel.fee));
  const [adminNotes, setAdminNotes] = useState(parcel.admin_notes ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const update: { status?: ParcelStatus; adminNotes?: string; fee?: number } = {};
      if (status !== parcel.status) update.status = status;
      if (adminNotes.trim() !== (parcel.admin_notes ?? '')) update.adminNotes = adminNotes.trim();
      const feeNum = Number(fee);
      if (feeNum !== parcel.fee) update.fee = feeNum;
      await adminApi.updateParcel(parcel.id, update);
      await onSaved();
    } catch (err) {
      setError(errorText(err));
      setSaving(false);
    }
  }

  return (
    <FormModal title={`Edit parcel ${parcel.tracking_number}`} onClose={onClose}>
      <form onSubmit={handleSave} className="space-y-4 p-5 sm:p-6">
        <Field label="Status">
          <div className="grid gap-2 sm:grid-cols-2">
            {STATUS_OPTIONS.map((opt) => {
              const selected = status === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setStatus(opt.id)}
                  aria-pressed={selected}
                  className={[
                    'rounded-xl border px-3 py-2.5 text-sm font-semibold transition-all',
                    selected ? 'border-brand-500 bg-brand-50 text-brand-700 ring-2 ring-brand-200' : 'border-slate-300 bg-white text-slate-600 hover:border-brand-300 hover:bg-slate-50',
                  ].join(' ')}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </Field>

        <Field label="Delivery fee (KES)">
          <input className={inputClass} type="number" min="0" value={fee} onChange={(e) => setFee(e.target.value)} />
        </Field>

        <Field label="Admin notes (internal)">
          <textarea className={`${inputClass} min-h-[80px] resize-y`} value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)} maxLength={1000} placeholder="Notes for staff — not visible to customers" />
        </Field>

        <div className="rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
          <p className="font-semibold uppercase tracking-wide text-slate-500 mb-2">Parcel details</p>
          <p>From: {parcel.sender_name} ({parcel.sender_phone})</p>
          <p>To: {parcel.recipient_name} ({parcel.recipient_phone})</p>
          <p>{parcel.pickup_location} → {parcel.dropoff_location}</p>
          <p className="mt-1">{PARCEL_TYPE_LABELS[parcel.parcel_type] ?? parcel.parcel_type} · {parcel.weight_kg} kg</p>
          <p className="mt-1">{parcel.description}</p>
          <p className="mt-2 text-slate-400">Sent {formatDateTime(parcel.created_at)}</p>
        </div>

        <FormError message={error} />

        <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose} className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-all hover:bg-slate-50">
            Cancel
          </button>
          <button type="submit" disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-500 to-brand-700 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-brand-500/25 transition-all hover:brightness-110 disabled:opacity-60">
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Save changes
          </button>
        </div>
      </form>
    </FormModal>
  );
}
