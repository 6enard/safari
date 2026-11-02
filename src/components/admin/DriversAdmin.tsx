import { useState, type ChangeEvent, type FormEvent } from 'react';
import { Pencil, Plus, Phone, Mail, IdCard, ImagePlus, UserRound, Loader as Loader2 } from 'lucide-react';
import { adminApi, errorText, type AdminData, type AdminDriver } from '@/lib/adminApi';
import { DeleteButton, Field, FormError, FormModal, SubmitRow, inputClass } from '@/components/admin/AdminShared';

type Props = {
  data: AdminData;
  onChanged: () => Promise<void>;
};

type Draft = { full_name: string; phone: string; email: string; license_number: string };

const emptyDraft: Draft = { full_name: '', phone: '', email: '', license_number: '' };
const MAX_PHOTO_BYTES = 2 * 1024 * 1024;

function readAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1] ?? '');
    reader.onerror = () => reject(new Error('Could not read that photo. Try another image.'));
    reader.readAsDataURL(file);
  });
}

export function DriversAdmin({ data, onChanged }: Props) {
  const [editing, setEditing] = useState<AdminDriver | 'new' | null>(null);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pageError, setPageError] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  function openNew() {
    setDraft(emptyDraft);
    setError(null);
    setEditing('new');
  }

  function openEdit(d: AdminDriver) {
    setDraft({
      full_name: d.full_name,
      phone: d.phone,
      email: d.email ?? '',
      license_number: d.license_number,
    });
    setError(null);
    setEditing(d);
  }

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    const row = {
      full_name: draft.full_name.trim(),
      phone: draft.phone.trim(),
      email: draft.email.trim() || null,
      license_number: draft.license_number.trim(),
    };
    if (row.full_name.length < 2) return setError('Enter the driver’s full name.');
    if (row.phone.length < 10) return setError('Enter a valid phone number.');
    if (!row.license_number) return setError('Enter the driving licence number.');

    setSaving(true);
    setError(null);
    try {
      await adminApi.save('drivers', row, editing && editing !== 'new' ? editing.id : undefined);
      setEditing(null);
      await onChanged();
    } catch (err) {
      setError(errorText(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(d: AdminDriver) {
    setPageError(null);
    try {
      await adminApi.remove('drivers', d.id);
      await onChanged();
    } catch (err) {
      setPageError(errorText(err));
    }
  }

  async function handlePhoto(driver: AdminDriver, file: File | undefined) {
    if (!file) return;
    setError(null);
    if (file.size > MAX_PHOTO_BYTES) {
      setError('The photo must be smaller than 2 MB.');
      return;
    }
    setUploadingPhoto(true);
    try {
      const data = await readAsBase64(file);
      await adminApi.uploadDriverPhoto(driver.id, file.type, data);
      await onChanged();
    } catch (err) {
      setError(errorText(err));
    } finally {
      setUploadingPhoto(false);
    }
  }

  const set = (key: keyof Draft) => (e: ChangeEvent<HTMLInputElement>) =>
    setDraft((d) => ({ ...d, [key]: e.target.value }));

  return (
    <section>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-600">{data.drivers.length} drivers on record.</p>
        <button
          type="button"
          onClick={openNew}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-500 to-brand-700 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-brand-500/25 transition-all hover:brightness-110 active:scale-[0.98]"
        >
          <Plus className="h-4 w-4" /> Add driver
        </button>
      </div>

      {pageError && <div className="mb-4"><FormError message={pageError} /></div>}

      <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
        {data.drivers.map((d) => (
          <article key={d.id} className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5">
            <div className="flex items-center gap-3">
              {d.photo_url ? (
                <img src={d.photo_url} alt={`Photo of ${d.full_name}`} loading="lazy" className="h-10 w-10 rounded-full object-cover ring-1 ring-brand-100" />
              ) : (
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-brand-50 text-brand-700">
                  <UserRound className="h-5 w-5" />
                </span>
              )}
              <p className="font-bold text-slate-900">{d.full_name}</p>
            </div>
            <div className="mt-4 space-y-2 text-sm text-slate-600">
              <p className="flex items-center gap-2"><Phone className="h-3.5 w-3.5" /> {d.phone}</p>
              {d.email && <p className="flex items-center gap-2"><Mail className="h-3.5 w-3.5" /> {d.email}</p>}
              <p className="flex items-center gap-2"><IdCard className="h-3.5 w-3.5" /> {d.license_number}</p>
            </div>
            <div className="mt-4 flex justify-end gap-1 border-t border-slate-100 pt-3">
              <button
                type="button"
                onClick={() => openEdit(d)}
                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold text-brand-700 transition-colors hover:bg-brand-50"
              >
                <Pencil className="h-3.5 w-3.5" /> Edit
              </button>
              <DeleteButton onConfirm={() => handleDelete(d)} />
            </div>
          </article>
        ))}
      </div>

      {editing && (
        <FormModal title={editing === 'new' ? 'Add a driver' : 'Edit driver'} onClose={() => setEditing(null)}>
          <form onSubmit={handleSave} className="space-y-4 p-5 sm:p-6">
            {editing !== 'new' && (
              <div>
                <span className="mb-1 block text-sm font-medium text-slate-700">Driver photo</span>
                <div className="flex items-center gap-4">
                  {(data.drivers.find((d) => d.id === editing.id) ?? editing).photo_url ? (
                    <img
                      src={(data.drivers.find((d) => d.id === editing.id) ?? editing).photo_url ?? ''}
                      alt="Current driver photo"
                      className="h-16 w-16 rounded-xl object-cover ring-1 ring-brand-100"
                    />
                  ) : (
                    <span className="inline-flex h-16 w-16 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
                      <UserRound className="h-7 w-7" />
                    </span>
                  )}
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-brand-200 bg-brand-50 px-4 py-2.5 text-sm font-semibold text-brand-700 transition-all hover:bg-brand-100">
                    {uploadingPhoto ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
                    {uploadingPhoto ? 'Uploading...' : 'Upload photo'}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="sr-only"
                      disabled={uploadingPhoto}
                      onChange={(e) => handlePhoto(editing, e.target.files?.[0])}
                    />
                  </label>
                </div>
                <p className="mt-1 text-xs text-slate-500">JPG, PNG or WebP, up to 2 MB. The photo saves as soon as it uploads.</p>
              </div>
            )}
            <Field label="Full name">
              <input className={inputClass} value={draft.full_name} onChange={set('full_name')} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Phone number">
                <input className={inputClass} type="tel" value={draft.phone} onChange={set('phone')} placeholder="e.g. 0712 345 678" />
              </Field>
              <Field label="Email (optional)">
                <input className={inputClass} type="email" value={draft.email} onChange={set('email')} />
              </Field>
            </div>
            <Field label="Driving licence number">
              <input className={inputClass} value={draft.license_number} onChange={set('license_number')} />
            </Field>
            <FormError message={error} />
            <SubmitRow saving={saving} onCancel={() => setEditing(null)} label={editing === 'new' ? 'Add driver' : 'Save changes'} />
          </form>
        </FormModal>
      )}
    </section>
  );
}
