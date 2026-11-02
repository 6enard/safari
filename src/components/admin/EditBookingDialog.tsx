import { useState, type FormEvent } from 'react';
import { Armchair, Loader as Loader2, UserRound } from 'lucide-react';
import type { AdminBooking } from '@/lib/adminApi';
import { adminApi, errorText } from '@/lib/adminApi';
import { Field, FormError, FormModal, inputClass } from '@/components/admin/AdminShared';

type Props = {
  booking: AdminBooking;
  occupiedSeats: Set<number>;
  onClose: () => void;
  onSaved: () => Promise<void>;
};

export function EditBookingDialog({ booking, occupiedSeats, onClose, onSaved }: Props) {
  const [name, setName] = useState(booking.passenger_name);
  const [phone, setPhone] = useState(booking.passenger_phone);
  const [seat, setSeat] = useState(String(booking.seat_number));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmedName = name.trim();
    const trimmedPhone = phone.trim();
    const seatNumber = Number(seat);
    if (trimmedName.length < 2 || trimmedName.length > 100) {
      setError('Enter a passenger name between 2 and 100 characters.');
      return;
    }
    if (trimmedPhone.length < 10 || trimmedPhone.length > 20) {
      setError('Enter a valid phone number.');
      return;
    }
    if (!Number.isInteger(seatNumber) || seatNumber < 1 || seatNumber > 10) {
      setError('Choose a valid seat from 1 to 10.');
      return;
    }
    if (seatNumber !== booking.seat_number && occupiedSeats.has(seatNumber)) {
      setError('That seat is already assigned on this trip.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await adminApi.updateBooking(booking.id, {
        passengerName: trimmedName,
        passengerPhone: trimmedPhone,
        seatNumber,
      });
      await onSaved();
    } catch (err) {
      setError(errorText(err));
      setSaving(false);
    }
  }

  return (
    <FormModal title={`Edit booking · Seat ${booking.seat_number}`} onClose={saving ? () => {} : onClose}>
      <form onSubmit={handleSubmit} className="space-y-4 p-5 sm:p-6">
        <div className="rounded-xl border border-brand-100 bg-brand-50/70 p-3 text-sm text-brand-900">
          <p className="font-semibold">{booking.departures.routes.origin} → {booking.departures.routes.destination}</p>
          <p className="mt-1 text-xs text-brand-700">Receipt {booking.payment_ref} · Payment records stay unchanged.</p>
        </div>
        <Field label="Passenger name">
          <div className="relative">
            <UserRound className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input className={`${inputClass} pl-10`} value={name} onChange={(e) => setName(e.target.value)} autoFocus />
          </div>
        </Field>
        <Field label="Phone number">
          <input className={inputClass} type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </Field>
        <Field label="Seat assignment">
          <div className="relative">
            <Armchair className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <select className={`${inputClass} pl-10`} value={seat} onChange={(e) => setSeat(e.target.value)}>
              {Array.from({ length: 10 }, (_, index) => index + 1).map((number) => (
                <option key={number} value={number} disabled={number !== booking.seat_number && occupiedSeats.has(number)}>
                  Seat {number}{number === booking.seat_number ? ' · current' : occupiedSeats.has(number) ? ' · assigned' : ''}
                </option>
              ))}
            </select>
          </div>
          <span className="mt-1 block text-xs text-slate-500">Assigned seats are unavailable for this trip.</span>
        </Field>
        <FormError message={error} />
        <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose} disabled={saving} className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-all hover:bg-slate-50 disabled:opacity-50">Cancel</button>
          <button type="submit" disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-500 to-brand-700 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-brand-500/25 transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60">
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {saving ? 'Saving...' : 'Save booking'}
          </button>
        </div>
      </form>
    </FormModal>
  );
}
