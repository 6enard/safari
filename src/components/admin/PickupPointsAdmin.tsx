import { useMemo, useState, type FormEvent } from 'react';
import { MapPin, Pencil, Plus } from 'lucide-react';
import { adminApi, errorText, type AdminData } from '@/lib/adminApi';
import type { PickupPoint, Route } from '@/lib/db';
import { DeleteButton, Field, FormError, FormModal, SubmitRow, inputClass } from '@/components/admin/AdminShared';
import { PickupMap, type MapMarker } from '@/components/PickupMap';

type Props = {
  data: AdminData;
  onChanged: () => Promise<void>;
};

type Draft = {
  name: string;
  address: string;
  latitude: string;
  longitude: string;
  sort_order: string;
};

function emptyDraft(nextOrder: number): Draft {
  return { name: '', address: '', latitude: '', longitude: '', sort_order: String(nextOrder) };
}

function toDraft(p: PickupPoint): Draft {
  return {
    name: p.name,
    address: p.address ?? '',
    latitude: String(p.latitude),
    longitude: String(p.longitude),
    sort_order: String(p.sort_order),
  };
}

function coordinate(value: string): number | null {
  if (value.trim() === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export function PickupPointsAdmin({ data, onChanged }: Props) {
  const [routeId, setRouteId] = useState<string | null>(data.routes[0]?.id ?? null);
  const [editing, setEditing] = useState<PickupPoint | 'new' | null>(null);
  const [draft, setDraft] = useState<Draft>(emptyDraft(0));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pageError, setPageError] = useState<string | null>(null);

  const route: Route | undefined = data.routes.find((r) => r.id === routeId);
  const points = useMemo(
    () =>
      data.pickup_points
        .filter((p) => p.route_id === routeId)
        .sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name)),
    [data.pickup_points, routeId],
  );

  const pageMarkers: MapMarker[] = useMemo(
    () => points.map((p) => ({ id: p.id, name: p.name, latitude: p.latitude, longitude: p.longitude })),
    [points],
  );

  const modalMarkers: MapMarker[] = useMemo(() => {
    const others: MapMarker[] = points
      .filter((p) => !(editing && editing !== 'new' && p.id === editing.id))
      .map((p) => ({ id: p.id, name: p.name, latitude: p.latitude, longitude: p.longitude }));
    const lat = coordinate(draft.latitude);
    const lng = coordinate(draft.longitude);
    if (lat !== null && lng !== null) {
      others.push({ id: 'draft', name: draft.name.trim() || 'New stop', latitude: lat, longitude: lng, highlighted: true });
    }
    return others;
  }, [points, editing, draft]);

  function openNew() {
    setDraft(emptyDraft(points.length + 1));
    setError(null);
    setEditing('new');
  }

  function openEdit(p: PickupPoint) {
    setDraft(toDraft(p));
    setError(null);
    setEditing(p);
  }

  function placeOnMap(lat: number, lng: number) {
    setDraft((d) => ({ ...d, latitude: lat.toFixed(6), longitude: lng.toFixed(6) }));
  }

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    if (!routeId) return;
    const latitude = coordinate(draft.latitude);
    const longitude = coordinate(draft.longitude);
    const sortOrder = coordinate(draft.sort_order);
    const name = draft.name.trim();
    if (!name) return setError('Enter a name for this pickup point.');
    if (latitude === null || latitude < -90 || latitude > 90) return setError('Enter a valid latitude, or click the map.');
    if (longitude === null || longitude < -180 || longitude > 180) return setError('Enter a valid longitude, or click the map.');
    if (sortOrder === null || !Number.isInteger(sortOrder) || sortOrder < 0) {
      return setError('The order must be a whole number, 0 or more.');
    }

    setSaving(true);
    setError(null);
    try {
      await adminApi.save(
        'pickup_points',
        {
          route_id: routeId,
          name,
          address: draft.address.trim() || null,
          latitude,
          longitude,
          sort_order: sortOrder,
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

  async function handleDelete(p: PickupPoint) {
    setPageError(null);
    try {
      await adminApi.remove('pickup_points', p.id);
      await onChanged();
    } catch (err) {
      setPageError(errorText(err));
    }
  }

  if (data.routes.length === 0) {
    return <p className="text-sm text-slate-600">Add a route first, then give it pickup points.</p>;
  }

  return (
    <section>
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <label className="block w-full sm:max-w-xs">
          <span className="mb-1 block text-sm font-medium text-slate-700">Route</span>
          <select className={inputClass} value={routeId ?? ''} onChange={(e) => setRouteId(e.target.value)}>
            {data.routes.map((r) => (
              <option key={r.id} value={r.id}>
                {r.origin} to {r.destination}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          onClick={openNew}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-500 to-brand-700 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-brand-500/25 transition-all hover:brightness-110 active:scale-[0.98]"
        >
          <Plus className="h-4 w-4" /> Add pickup point
        </button>
      </div>

      {pageError && <div className="mb-4"><FormError message={pageError} /></div>}

      <PickupMap
        markers={pageMarkers}
        fitKey={`${routeId}-${points.length}`}
        className="mb-5 h-72 w-full overflow-hidden rounded-2xl border border-slate-200/80 shadow-sm"
      />

      {points.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
          No pickup points for {route?.origin} yet. Add the first one so passengers can see where to board.
        </div>
      ) : (
        <ol className="grid gap-3 md:grid-cols-2">
          {points.map((p, idx) => (
            <li key={p.id} className="flex items-start gap-4 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
              <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-600 text-sm font-bold text-white">
                {idx + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-slate-900">{p.name}</p>
                {p.address && <p className="mt-0.5 text-sm text-slate-500">{p.address}</p>}
                <p className="mt-1.5 inline-flex items-center gap-1 font-mono text-xs text-slate-500">
                  <MapPin className="h-3 w-3" /> {p.latitude.toFixed(4)}, {p.longitude.toFixed(4)}
                </p>
              </div>
              <div className="flex shrink-0 gap-1">
                <button
                  type="button"
                  onClick={() => openEdit(p)}
                  className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold text-brand-700 transition-colors hover:bg-brand-50"
                >
                  <Pencil className="h-3.5 w-3.5" /> Edit
                </button>
                <DeleteButton onConfirm={() => handleDelete(p)} />
              </div>
            </li>
          ))}
        </ol>
      )}

      {editing && (
        <FormModal title={editing === 'new' ? 'Add a pickup point' : 'Edit pickup point'} onClose={() => setEditing(null)}>
          <form onSubmit={handleSave} className="space-y-4 p-6">
            <PickupMap
              markers={modalMarkers}
              fitKey={`modal-${routeId}-${editing === 'new' ? 'new' : editing.id}`}
              onMapClick={placeOnMap}
              className="h-56 w-full cursor-crosshair overflow-hidden rounded-xl border border-slate-200"
            />
            <p className="text-xs text-slate-500">Click the map to place this stop, or type the coordinates below.</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Name">
                <input
                  className={inputClass}
                  value={draft.name}
                  onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
                  placeholder="e.g. Bomet Main Stage"
                />
              </Field>
              <Field label="Order">
                <input
                  className={inputClass}
                  type="number"
                  min="0"
                  value={draft.sort_order}
                  onChange={(e) => setDraft((d) => ({ ...d, sort_order: e.target.value }))}
                />
              </Field>
              <div className="sm:col-span-2">
                <Field label="Address or landmark (optional)">
                  <input
                    className={inputClass}
                    value={draft.address}
                    onChange={(e) => setDraft((d) => ({ ...d, address: e.target.value }))}
                    placeholder="e.g. Opposite the petrol station"
                  />
                </Field>
              </div>
              <Field label="Latitude">
                <input
                  className={inputClass}
                  type="number"
                  step="any"
                  value={draft.latitude}
                  onChange={(e) => setDraft((d) => ({ ...d, latitude: e.target.value }))}
                />
              </Field>
              <Field label="Longitude">
                <input
                  className={inputClass}
                  type="number"
                  step="any"
                  value={draft.longitude}
                  onChange={(e) => setDraft((d) => ({ ...d, longitude: e.target.value }))}
                />
              </Field>
            </div>
            <FormError message={error} />
            <SubmitRow saving={saving} onCancel={() => setEditing(null)} label={editing === 'new' ? 'Add pickup point' : 'Save changes'} />
          </form>
        </FormModal>
      )}
    </section>
  );
}
