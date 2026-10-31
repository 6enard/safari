import { useMemo, useState, type FormEvent } from 'react';
import { Pencil, Plus, Bus, Phone, Mail, IdCard } from 'lucide-react';
import { adminApi, errorText, type AdminData, type AdminVehicle } from '@/lib/adminApi';
import { DeleteButton, Field, FormError, FormModal, SubmitRow, inputClass } from '@/components/admin/AdminShared';

type Props = {
  data: AdminData;
  onChanged: () => Promise<void>;
};

type Draft = { plate_number: string; vehicle_name: string; driver_id: string };

export function VehiclesAdmin({ data, onChanged }: Props) {
  const [editing, setEditing] = useState<AdminVehicle | 'new' | null>(null);
  const [draft, setDraft] = useState<Draft>({ plate_number: '', vehicle_name: '', driver_id: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pageError, setPageError] = useState<string | null>(null);

  const driverById = useMemo(() => new Map(data.drivers.map((d) => [d.id, d])), [data.drivers]);

  function openNew() {
    setDraft({ plate_number: '', vehicle_name: '', driver_id: '' });
    setError(null);
    setEditing('new');
  }

  function openEdit(v: AdminVehicle) {
    setDraft({ plate_number: v.plate_number, vehicle_name: v.vehicle_name, driver_id: v.driver_id ?? '' });
    setError(null);
    setEditing(v);
  }

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    const row = {
      plate_number: draft.plate_number.trim().toUpperCase(),
      vehicle_name: draft.vehicle_name.trim(),
      driver_id: draft.driver_id || null,
    };
    if (!row.plate_number || !row.vehicle_name) return setError('Enter the plate number and matatu name.');

    setSaving(true);
    setError(null);
    try {
      await adminApi.save('vehicles', row, editing && editing !== 'new' ? editing.id : undefined);
      setEditing(null);
      await onChanged();
    } catch (err) {
      setError(errorText(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(v: AdminVehicle) {
    setPageError(null);
    try {
      await adminApi.remove('vehicles', v.id);
      await onChanged();
    } catch (err) {
      setPageError(errorText(err));
    }
  }

  return (
    <section>
      <div className="mb-5 flex items-center justify-between gap-3">
        <p className="text-sm text-slate-600">{data.vehicles.length} matatus in the fleet.</p>
        <button
          type="button"
          onClick={openNew}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-500 to-teal-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-brand-500/25 transition-all hover:brightness-110 active:scale-[0.98]"
        >
          <Plus className="h-4 w-4" /> Add matatu
        </button>
      </div>

      {pageError && <div className="mb-4"><FormError message={pageError} /></div>}

      <div className="grid gap-4 md:grid-cols-2">
        {data.vehicles.map((v) => {
          const driver = driverById.get(v.driver_id ?? '');
          return (
            <article key={v.id} className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                  <Bus className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <p className="truncate font-bold text-slate-900">{v.vehicle_name}</p>
                  <p className="font-mono text-sm tracking-wide text-slate-500">{v.plate_number}</p>
                </div>
              </div>
              <div className="mt-4 space-y-2 rounded-xl bg-slate-50 p-4 text-sm">
                {driver ? (
                  <>
                    <p className="font-semibold text-slate-800">{driver.full_name}</p>
                    <p className="flex items-center gap-2 text-slate-600"><Phone className="h-3.5 w-3.5" /> {driver.phone}</p>
                    {driver.email && <p className="flex items-center gap-2 text-slate-600"><Mail className="h-3.5 w-3.5" /> {driver.email}</p>}
                    <p className="flex items-center gap-2 text-slate-600"><IdCard className="h-3.5 w-3.5" /> {driver.license_number}</p>
                  </>
                ) : (
                  <p className="text-amber-700">No driver assigned yet.</p>
                )}
              </div>
              <div className="mt-4 flex justify-end gap-1 border-t border-slate-100 pt-3">
                <button
                  type="button"
                  onClick={() => openEdit(v)}
                  className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold text-brand-700 transition-colors hover:bg-brand-50"
                >
                  <Pencil className="h-3.5 w-3.5" /> Edit
                </button>
                <DeleteButton onConfirm={() => handleDelete(v)} />
              </div>
            </article>
          );
        })}
      </div>

      {editing && (
        <FormModal title={editing === 'new' ? 'Add a matatu' : 'Edit matatu'} onClose={() => setEditing(null)}>
          <form onSubmit={handleSave} className="space-y-4 p-6">
            <Field label="Matatu name">
              <input
                className={inputClass}
                value={draft.vehicle_name}
                onChange={(e) => setDraft((d) => ({ ...d, vehicle_name: e.target.value }))}
                placeholder="e.g. Safari Express"
              />
            </Field>
            <Field label="Number plate">
              <input
                className={`${inputClass} font-mono uppercase`}
                value={draft.plate_number}
                onChange={(e) => setDraft((d) => ({ ...d, plate_number: e.target.value }))}
                placeholder="e.g. KDA 100A"
              />
            </Field>
            <Field label="Driver">
              <select
                className={inputClass}
                value={draft.driver_id}
                onChange={(e) => setDraft((d) => ({ ...d, driver_id: e.target.value }))}
              >
                <option value="">No driver yet</option>
                {data.drivers.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.full_name}
                  </option>
                ))}
              </select>
            </Field>
            {data.drivers.length === 0 && (
              <p className="text-sm text-slate-500">Add a driver in the Drivers tab to assign one here.</p>
            )}
            <FormError message={error} />
            <SubmitRow saving={saving} onCancel={() => setEditing(null)} label={editing === 'new' ? 'Add matatu' : 'Save changes'} />
          </form>
        </FormModal>
      )}
    </section>
  );
}
