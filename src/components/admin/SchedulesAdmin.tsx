import { useMemo, useState, type FormEvent } from 'react';
import { Pencil, Plus } from 'lucide-react';
import { adminApi, errorText, type AdminData, type AdminDeparture } from '@/lib/adminApi';
import { formatDate, formatKes, formatTime } from '@/lib/format';
import { DeleteButton, Field, FormError, FormModal, SubmitRow, inputClass } from '@/components/admin/AdminShared';

type Props = {
  data: AdminData;
  onChanged: () => Promise<void>;
};

const AMENITIES = ['WiFi', 'AC', 'Charging', 'Snacks'];

type Draft = {
  route_id: string;
  departure_date: string;
  departure_time: string;
  vehicle_id: string;
  fare: string;
  amenities: string[];
};

function emptyDraft(routeId: string): Draft {
  return { route_id: routeId, departure_date: '', departure_time: '', vehicle_id: '', fare: '', amenities: [] };
}

export function SchedulesAdmin({ data, onChanged }: Props) {
  const [routeFilter, setRouteFilter] = useState(data.routes[0]?.id ?? '');
  const [editing, setEditing] = useState<AdminDeparture | 'new' | null>(null);
  const [draft, setDraft] = useState<Draft>(emptyDraft(routeFilter));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pageError, setPageError] = useState<string | null>(null);

  const routeById = useMemo(() => new Map(data.routes.map((r) => [r.id, r])), [data.routes]);
  const vehicleById = useMemo(() => new Map(data.vehicles.map((v) => [v.id, v])), [data.vehicles]);

  const rows = useMemo(
    () =>
      data.departures
        .filter((d) => d.route_id === routeFilter)
        .sort((a, b) => `${a.departure_date}${a.departure_time}`.localeCompare(`${b.departure_date}${b.departure_time}`)),
    [data.departures, routeFilter],
  );

  function openNew() {
    setDraft(emptyDraft(routeFilter));
    setError(null);
    setEditing('new');
  }

  function openEdit(d: AdminDeparture) {
    setDraft({
      route_id: d.route_id,
      departure_date: d.departure_date,
      departure_time: d.departure_time.slice(0, 5),
      vehicle_id: d.vehicle_id ?? '',
      fare: String(d.fare),
      amenities: d.amenities,
    });
    setError(null);
    setEditing(d);
  }

  function toggleAmenity(name: string) {
    setDraft((d) => ({
      ...d,
      amenities: d.amenities.includes(name) ? d.amenities.filter((a) => a !== name) : [...d.amenities, name],
    }));
  }

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    if (!draft.route_id || !draft.departure_date || !draft.departure_time) return setError('Choose a route, date and time.');
    if (!draft.vehicle_id) return setError('Choose the matatu for this trip.');
    if (!(Number(draft.fare) > 0)) return setError('The fare must be above zero.');

    setSaving(true);
    setError(null);
    try {
      await adminApi.save(
        'departures',
        {
          route_id: draft.route_id,
          departure_date: draft.departure_date,
          departure_time: draft.departure_time,
          vehicle_id: draft.vehicle_id,
          fare: Number(draft.fare),
          amenities: draft.amenities,
        },
        editing && editing !== 'new' ? editing.id : undefined,
      );
      setEditing(null);
      await onChanged();
    } catch (err) {
      setError(errorText(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(d: AdminDeparture) {
    setPageError(null);
    try {
      await adminApi.remove('departures', d.id);
      await onChanged();
    } catch (err) {
      setPageError(errorText(err));
    }
  }

  return (
    <section>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <Field label="Route">
          <select className={`${inputClass} sm:w-80`} value={routeFilter} onChange={(e) => setRouteFilter(e.target.value)}>
            {data.routes.map((r) => (
              <option key={r.id} value={r.id}>
                {r.origin} - {r.destination}
              </option>
            ))}
          </select>
        </Field>
        <button
          type="button"
          onClick={openNew}
          disabled={data.routes.length === 0 || data.vehicles.length === 0}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-500 to-brand-700 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-brand-500/25 transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-60"
        >
          <Plus className="h-4 w-4" /> Add trip
        </button>
      </div>

      {pageError && <div className="mb-4"><FormError message={pageError} /></div>}

      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        {rows.length === 0 ? (
          <p className="p-8 text-center text-sm text-slate-500">No trips scheduled on this route yet.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {rows.map((d) => {
              const vehicle = vehicleById.get(d.vehicle_id ?? '');
              const route = routeById.get(d.route_id);
              return (
                <li key={d.id} className="flex flex-col gap-3 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-5 sm:py-4">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900">
                      {formatDate(d.departure_date)} · {formatTime(d.departure_time)}
                    </p>
                    <p className="truncate text-xs text-slate-500">
                      {vehicle ? `${vehicle.vehicle_name} · ${vehicle.plate_number}` : 'No matatu assigned'}
                      {route ? ` · ${route.origin} - ${route.destination}` : ''}
                    </p>
                  </div>
                  <div className="flex items-center justify-between gap-3 sm:justify-end">
                    <span className="text-sm font-bold text-brand-700">{formatKes(d.fare)}</span>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => openEdit(d)}
                        className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold text-brand-700 transition-colors hover:bg-brand-50"
                      >
                        <Pencil className="h-3.5 w-3.5" /> Edit
                      </button>
                      <DeleteButton onConfirm={() => handleDelete(d)} />
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {editing && (
        <FormModal title={editing === 'new' ? 'Add a trip' : 'Edit trip'} onClose={() => setEditing(null)}>
          <form onSubmit={handleSave} className="space-y-4 p-5 sm:p-6">
            <Field label="Route">
              <select
                className={inputClass}
                value={draft.route_id}
                onChange={(e) => setDraft((d) => ({ ...d, route_id: e.target.value }))}
              >
                {data.routes.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.origin} - {r.destination}
                  </option>
                ))}
              </select>
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Date">
                <input
                  className={inputClass}
                  type="date"
                  value={draft.departure_date}
                  onChange={(e) => setDraft((d) => ({ ...d, departure_date: e.target.value }))}
                />
              </Field>
              <Field label="Departure time">
                <input
                  className={inputClass}
                  type="time"
                  value={draft.departure_time}
                  onChange={(e) => setDraft((d) => ({ ...d, departure_time: e.target.value }))}
                />
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Matatu">
                <select
                  className={inputClass}
                  value={draft.vehicle_id}
                  onChange={(e) => setDraft((d) => ({ ...d, vehicle_id: e.target.value }))}
                >
                  <option value="">Choose a matatu</option>
                  {data.vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.vehicle_name} · {v.plate_number}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Fare per seat (KES)">
                <input
                  className={inputClass}
                  type="number"
                  min="1"
                  value={draft.fare}
                  onChange={(e) => setDraft((d) => ({ ...d, fare: e.target.value }))}
                />
              </Field>
            </div>
            <fieldset>
              <legend className="mb-2 text-sm font-medium text-slate-700">Amenities</legend>
              <div className="flex flex-wrap gap-2">
                {AMENITIES.map((a) => {
                  const on = draft.amenities.includes(a);
                  return (
                    <button
                      key={a}
                      type="button"
                      aria-pressed={on}
                      onClick={() => toggleAmenity(a)}
                      className={[
                        'rounded-full px-3 py-1.5 text-xs font-semibold ring-1 transition-all',
                        on ? 'bg-brand-600 text-white ring-brand-600' : 'bg-white text-slate-600 ring-slate-300 hover:ring-brand-400',
                      ].join(' ')}
                    >
                      {a}
                    </button>
                  );
                })}
              </div>
            </fieldset>
            <FormError message={error} />
            <SubmitRow saving={saving} onCancel={() => setEditing(null)} label={editing === 'new' ? 'Add trip' : 'Save changes'} />
          </form>
        </FormModal>
      )}
    </section>
  );
}
