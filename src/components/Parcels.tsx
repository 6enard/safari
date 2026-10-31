import { useEffect, useState } from 'react';
import { ArrowLeft, Package, Plus, Trash2, Loader as Loader2, MapPin, Phone, User as UserIcon, Clock, Calendar, PackageCheck, PackageOpen, Truck, X, CircleCheck as CheckCircle2, Weight, Tag, Route as RouteIcon } from 'lucide-react';
import { db, type Parcel, type ParcelType, type Route } from '@/lib/db';
import { useAuth } from '@/lib/authContext';
import { formatKes, formatDate, formatDateTime, formatTime } from '@/lib/format';

type Props = {
  onBack: () => void;
};

type Tab = 'list' | 'send';

const PARCEL_TYPES: { id: ParcelType; label: string }[] = [
  { id: 'document', label: 'Documents' },
  { id: 'electronics', label: 'Electronics' },
  { id: 'clothing', label: 'Clothing' },
  { id: 'food', label: 'Food / Groceries' },
  { id: 'other', label: 'Other' },
];

const STATUS_CONFIG: Record<string, { label: string; icon: typeof Package; color: string; bg: string; ring: string }> = {
  pending: { label: 'Pending', icon: PackageOpen, color: 'text-amber-700', bg: 'bg-amber-50', ring: 'ring-amber-200' },
  in_transit: { label: 'In transit', icon: Truck, color: 'text-brand-700', bg: 'bg-brand-50', ring: 'ring-brand-200' },
  delivered: { label: 'Delivered', icon: PackageCheck, color: 'text-teal-700', bg: 'bg-teal-50', ring: 'ring-teal-200' },
  cancelled: { label: 'Cancelled', icon: X, color: 'text-red-700', bg: 'bg-red-50', ring: 'ring-red-200' },
};

const inputClass =
  'w-full rounded-xl border border-slate-300 bg-slate-50/50 px-4 py-2.5 text-sm outline-none transition-all focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-200';

export function Parcels({ onBack }: Props) {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>('list');
  const [parcels, setParcels] = useState<Parcel[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Send form state
  const [senderName, setSenderName] = useState(user?.displayName ?? '');
  const [senderPhone, setSenderPhone] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [pickupLocation, setPickupLocation] = useState('');
  const [dropoffLocation, setDropoffLocation] = useState('');
  const [description, setDescription] = useState('');
  const [weightKg, setWeightKg] = useState('1');
  const [parcelType, setParcelType] = useState<ParcelType>('document');
  const [routeId, setRouteId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ tracking: string; fee: number } | null>(null);

  // Delete state
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [p, r] = await Promise.all([db.listMyParcels(), db.listRoutes()]);
      setParcels(p);
      setRoutes(r);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load parcels.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError(null);
    try {
      const result = await db.createParcel({
        routeId: routeId || null,
        departureId: null,
        senderName: senderName.trim(),
        senderPhone: senderPhone.trim(),
        recipientName: recipientName.trim(),
        recipientPhone: recipientPhone.trim(),
        pickupLocation: pickupLocation.trim(),
        dropoffLocation: dropoffLocation.trim(),
        description: description.trim(),
        weightKg: Number(weightKg),
        parcelType,
      });
      setSuccess({ tracking: result.tracking_number, fee: result.fee });
      setTab('list');
      await load();
      // Reset form
      setRecipientName('');
      setRecipientPhone('');
      setPickupLocation('');
      setDropoffLocation('');
      setDescription('');
      setWeightKg('1');
      setParcelType('document');
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Could not send parcel.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(parcelId: string) {
    setDeletingId(parcelId);
    try {
      await db.deleteParcel(parcelId);
      setParcels((prev) => prev.filter((p) => p.id !== parcelId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete parcel.');
    } finally {
      setDeletingId(null);
    }
  }

  const valid =
    senderName.trim().length >= 2 &&
    senderPhone.trim().length >= 10 &&
    recipientName.trim().length >= 2 &&
    recipientPhone.trim().length >= 10 &&
    pickupLocation.trim().length >= 2 &&
    dropoffLocation.trim().length >= 2 &&
    description.trim().length >= 3;

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
        <span className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-brand-700 ring-1 ring-brand-100">
          <Package className="h-3.5 w-3.5" /> Parcels
        </span>
        <h1 className="mt-3 text-3xl font-bold text-slate-900">Send a parcel</h1>
        <p className="mt-1 text-slate-600">Send packages across Kenya with South Rift Luxury Shuttle.</p>
      </div>

      {success && (
        <div role="status" className="mb-6 flex items-center gap-3 rounded-xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm font-medium text-brand-700 animate-fade-in">
          <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
          <span>Parcel sent! Tracking number <span className="font-mono font-bold">{success.tracking}</span> — fee {formatKes(success.fee)}.</span>
          <button type="button" onClick={() => setSuccess(null)} className="ml-auto text-brand-600 hover:text-brand-800">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div role="tablist" className="mb-8 inline-flex rounded-xl bg-slate-100 p-1">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'list'}
          onClick={() => setTab('list')}
          className={['inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all', tab === 'list' ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'].join(' ')}
        >
          <Package className="h-4 w-4" /> My parcels
          {parcels.length > 0 && <span className="rounded-md bg-slate-200/70 px-1.5 text-xs text-slate-600">{parcels.length}</span>}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'send'}
          onClick={() => setTab('send')}
          className={['inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all', tab === 'send' ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'].join(' ')}
        >
          <Plus className="h-4 w-4" /> Send new
        </button>
      </div>

      {error && (
        <div role="alert" className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 animate-fade-in">
          {error}
        </div>
      )}

      {tab === 'list' && (
        loading ? (
          <div className="flex justify-center py-24">
            <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
          </div>
        ) : parcels.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white/60 px-6 py-16 text-center animate-fade-in">
            <span className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
              <Package className="h-7 w-7" />
            </span>
            <p className="mt-4 font-semibold text-slate-800">No parcels yet</p>
            <p className="mt-1 text-sm text-slate-500">Send a parcel and it will show up here.</p>
            <button
              type="button"
              onClick={() => setTab('send')}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-500 to-teal-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-brand-500/25 transition-all hover:brightness-110"
            >
              <Plus className="h-4 w-4" /> Send a parcel
            </button>
          </div>
        ) : (
          <ul className="space-y-4">
            {parcels.map((p, idx) => {
              const status = STATUS_CONFIG[p.status] ?? STATUS_CONFIG.pending;
              const StatusIcon = status.icon;
              const canDelete = p.status === 'pending' || p.status === 'cancelled';
              return (
                <li
                  key={p.id}
                  style={{ animationDelay: `${idx * 0.06}s` }}
                  className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm transition-shadow hover:shadow-lg animate-slide-up"
                >
                  <div className="flex flex-col gap-4 border-b border-dashed border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="flex flex-wrap items-center gap-2 text-base font-bold text-slate-900">
                        <MapPin className="h-4 w-4 text-brand-600" />
                        {p.pickup_location}
                        <ArrowLeft className="h-4 w-4 rotate-180 text-slate-400" />
                        <MapPin className="h-4 w-4 text-rose-500" />
                        {p.dropoff_location}
                      </p>
                      <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-600">
                        <span className="inline-flex items-center gap-1.5 font-mono"><Package className="h-3.5 w-3.5" />{p.tracking_number}</span>
                        <span className="inline-flex items-center gap-1.5"><Tag className="h-3.5 w-3.5" />{p.parcel_type}</span>
                        <span className="inline-flex items-center gap-1.5"><Weight className="h-3.5 w-3.5" />{p.weight_kg} kg</span>
                        {p.routes && <span className="inline-flex items-center gap-1.5"><RouteIcon className="h-3.5 w-3.5" />{p.routes.origin} - {p.routes.destination}</span>}
                      </p>
                    </div>
                    <span className={`inline-flex w-fit flex-shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ring-1 ${status.bg} ${status.color} ${status.ring}`}>
                      <StatusIcon className="h-3.5 w-3.5" /> {status.label}
                    </span>
                  </div>

                  <div className="grid gap-4 p-5 sm:grid-cols-[1fr_auto] sm:items-end">
                    <div className="space-y-3">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="rounded-xl bg-slate-50 p-3">
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Sender</p>
                          <p className="mt-1 flex items-center gap-1.5 text-sm font-medium text-slate-800"><UserIcon className="h-3.5 w-3.5" />{p.sender_name}</p>
                          <p className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500"><Phone className="h-3 w-3" />{p.sender_phone}</p>
                        </div>
                        <div className="rounded-xl bg-slate-50 p-3">
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Recipient</p>
                          <p className="mt-1 flex items-center gap-1.5 text-sm font-medium text-slate-800"><UserIcon className="h-3.5 w-3.5" />{p.recipient_name}</p>
                          <p className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500"><Phone className="h-3 w-3" />{p.recipient_phone}</p>
                        </div>
                      </div>
                      <p className="text-sm text-slate-600"><span className="font-semibold">Description:</span> {p.description}</p>
                      {p.admin_notes && (
                        <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800 ring-1 ring-amber-200">
                          <span className="font-semibold">Admin note:</span> {p.admin_notes}
                        </p>
                      )}
                      <p className="text-xs text-slate-500">
                        Sent {formatDateTime(p.created_at)}
                        {p.departures && <> · Assigned to trip on {formatDate(p.departures.departure_date)} at {formatTime(p.departures.departure_time)}</>}
                      </p>
                    </div>
                    <div className="text-left sm:text-right">
                      <p className="text-xs text-slate-500">Delivery fee</p>
                      <p className="text-lg font-bold text-brand-700">{formatKes(p.fee)}</p>
                      {canDelete && (
                        <button
                          type="button"
                          disabled={deletingId === p.id}
                          onClick={() => handleDelete(p.id)}
                          className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-white hover:text-red-600 disabled:opacity-50"
                        >
                          {deletingId === p.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )
      )}

      {tab === 'send' && (
        <form onSubmit={handleSend} className="space-y-6 animate-fade-in">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
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

          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
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

          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">Pickup & drop-off</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Pickup location</label>
                <input className={inputClass} value={pickupLocation} onChange={(e) => setPickupLocation(e.target.value)} required placeholder="e.g. Nairobi CBD" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Drop-off location</label>
                <input className={inputClass} value={dropoffLocation} onChange={(e) => setDropoffLocation(e.target.value)} required placeholder="e.g. Mombasa town" />
              </div>
            </div>
            <div className="mt-4">
              <label className="mb-1 block text-sm font-medium text-slate-700">Route (optional)</label>
              <select className={inputClass} value={routeId} onChange={(e) => setRouteId(e.target.value)}>
                <option value="">No specific route</option>
                {routes.map((r) => (
                  <option key={r.id} value={r.id}>{r.origin} - {r.destination}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
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

          {submitError && (
            <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 animate-fade-in">
              {submitError}
            </div>
          )}

          <button
            type="submit"
            disabled={!valid || submitting}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-500 to-teal-600 px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-brand-500/25 transition-all hover:shadow-xl hover:shadow-brand-500/40 hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none"
          >
            {submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Sending parcel...</> : <><Package className="h-4 w-4" /> Send parcel</>}
          </button>
        </form>
      )}
    </div>
  );
}
