import { useState, type FormEvent } from 'react';
import { Pencil, Plus, Star, ArrowRight } from 'lucide-react';
import { adminApi, errorText, type AdminData } from '@/lib/adminApi';
import type { Route } from '@/lib/db';
import { formatKes } from '@/lib/format';
import { DeleteButton, Field, FormError, FormModal, SubmitRow, inputClass } from '@/components/admin/AdminShared';

type Props = {
  data: AdminData;
  onChanged: () => Promise<void>;
};

type Draft = {
  origin: string;
  destination: string;
  distance_km: string;
  duration_hours: string;
  base_fare: string;
  popular: boolean;
};

const emptyDraft: Draft = { origin: '', destination: '', distance_km: '', duration_hours: '', base_fare: '', popular: false };

function toDraft(r: Route): Draft {
  return {
    origin: r.origin,
    destination: r.destination,
    distance_km: String(r.distance_km),
    duration_hours: String(r.duration_hours),
    base_fare: String(r.base_fare),
    popular: r.popular,
  };
}

export function RoutesAdmin({ data, onChanged }: Props) {
  const [editing, setEditing] = useState<Route | 'new' | null>(null);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pageError, setPageError] = useState<string | null>(null);

  function openNew() {
    setDraft(emptyDraft);
    setError(null);
    setEditing('new');
  }

  function openEdit(r: Route) {
    setDraft(toDraft(r));
    setError(null);
    setEditing(r);
  }

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    const row = {
      origin: draft.origin.trim(),
      destination: draft.destination.trim(),
      distance_km: Number(draft.distance_km),
      duration_hours: Number(draft.duration_hours),
      base_fare: Number(draft.base_fare),
      popular: draft.popular,
    };
    if (!row.origin || !row.destination) return setError('Enter both towns.');
    if (!(row.distance_km > 0) || !(row.duration_hours > 0)) return setError('Distance and duration must be above zero.');
    if (!(row.base_fare > 0)) return setError('The base fare must be above zero.');

    setSaving(true);
    setError(null);
    try {
      await adminApi.save('routes', row, editing && editing !== 'new' ? editing.id : undefined);
      setEditing(null);
      await onChanged();
    } catch (err) {
      setError(errorText(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(r: Route) {
    setPageError(null);
    try {
      await adminApi.remove('routes', r.id);
      await onChanged();
    } catch (err) {
      setPageError(errorText(err));
    }
  }

  const set = (key: keyof Draft) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setDraft((d) => ({ ...d, [key]: key === 'popular' ? e.target.checked : e.target.value }));

  return (
    <section>
      <div className="mb-5 flex items-center justify-between gap-3">
        <p className="text-sm text-slate-600">{data.routes.length} routes. Changes appear for passengers straight away.</p>
        <button
          type="button"
          onClick={openNew}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-500 to-teal-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-brand-500/25 transition-all hover:brightness-110 active:scale-[0.98]"
        >
          <Plus className="h-4 w-4" /> Add route
        </button>
      </div>

      {pageError && <div role="alert" className="mb-4"><FormError message={pageError} /></div>}

      <div className="grid gap-4 md:grid-cols-2">
        {data.routes.map((r) => (
          <article key={r.id} className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <p className="flex items-center gap-2 text-base font-bold text-slate-900">
                {r.origin} <ArrowRight className="h-4 w-4 text-slate-400" /> {r.destination}
              </p>
              {r.popular && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 ring-1 ring-amber-200">
                  <Star className="h-3 w-3" /> Popular
                </span>
              )}
            </div>
            <dl className="mt-4 grid grid-cols-3 gap-3 text-sm">
              <div>
                <dt className="text-slate-500">Distance</dt>
                <dd className="font-semibold text-slate-800">{r.distance_km} km</dd>
              </div>
              <div>
                <dt className="text-slate-500">Duration</dt>
                <dd className="font-semibold text-slate-800">{r.duration_hours} h</dd>
              </div>
              <div>
                <dt className="text-slate-500">Base fare</dt>
                <dd className="font-bold text-brand-700">{formatKes(r.base_fare)}</dd>
              </div>
            </dl>
            <div className="mt-4 flex justify-end gap-1 border-t border-slate-100 pt-3">
              <button
                type="button"
                onClick={() => openEdit(r)}
                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold text-brand-700 transition-colors hover:bg-brand-50"
              >
                <Pencil className="h-3.5 w-3.5" /> Edit
              </button>
              <DeleteButton onConfirm={() => handleDelete(r)} />
            </div>
          </article>
        ))}
      </div>

      {editing && (
        <FormModal title={editing === 'new' ? 'Add a route' : 'Edit route'} onClose={() => setEditing(null)}>
          <form onSubmit={handleSave} className="space-y-4 p-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="From">
                <input className={inputClass} value={draft.origin} onChange={set('origin')} placeholder="e.g. Nairobi" />
              </Field>
              <Field label="To">
                <input className={inputClass} value={draft.destination} onChange={set('destination')} placeholder="e.g. Mombasa" />
              </Field>
              <Field label="Distance (km)">
                <input className={inputClass} type="number" min="1" value={draft.distance_km} onChange={set('distance_km')} />
              </Field>
              <Field label="Travel time (hours)">
                <input className={inputClass} type="number" step="0.5" min="0.5" value={draft.duration_hours} onChange={set('duration_hours')} />
              </Field>
              <Field label="Base fare (KES)">
                <input className={inputClass} type="number" min="1" value={draft.base_fare} onChange={set('base_fare')} />
              </Field>
              <label className="flex items-center gap-3 self-end rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-medium text-slate-700">
                <input type="checkbox" checked={draft.popular} onChange={set('popular')} className="h-4 w-4 accent-brand-600" />
                Show as popular
              </label>
            </div>
            <FormError message={error} />
            <SubmitRow saving={saving} onCancel={() => setEditing(null)} label={editing === 'new' ? 'Add route' : 'Save changes'} />
          </form>
        </FormModal>
      )}
    </section>
  );
}
