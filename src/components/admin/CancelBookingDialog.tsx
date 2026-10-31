import { useState, type FormEvent } from 'react';
import { Ban, Loader as Loader2 } from 'lucide-react';
import { adminApi, errorText, type AdminBooking } from '@/lib/adminApi';
import type { RefundStatus } from '@/lib/db';
import { Field, FormError, FormModal, inputClass } from '@/components/admin/AdminShared';
import { refundStatusLabel } from '@/lib/format';

type Props = {
  booking: AdminBooking;
  onClose: () => void;
  onCancelled: () => Promise<void>;
};

const REFUND_OPTIONS: RefundStatus[] = ['pending', 'refunded', 'not_refunded'];

export function CancelBookingDialog({ booking, onClose, onCancelled }: Props) {
  const [reason, setReason] = useState('');
  const [refundStatus, setRefundStatus] = useState<RefundStatus>('pending');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmed = reason.trim();
    if (trimmed.length < 3) {
      setError('Please give a reason with at least 3 characters.');
      return;
    }
    if (trimmed.length > 500) {
      setError('The reason must be 500 characters or fewer.');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await adminApi.cancelBooking(booking.id, trimmed, refundStatus);
      await onCancelled();
    } catch (err) {
      setError(errorText(err));
      setSubmitting(false);
    }
  }

  return (
    <FormModal title={`Cancel seat ${booking.seat_number} for ${booking.passenger_name}`} onClose={submitting ? () => {} : onClose}>
      <form onSubmit={handleSubmit} className="space-y-4 px-5 py-5 sm:px-6">
        <FormError message={error} />
        <Field label="Reason for cancellation">
          <textarea
            className={`${inputClass} min-h-[96px] resize-y`}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            maxLength={500}
            required
            placeholder="e.g. Passenger requested cancellation, matatu breakdown"
          />
        </Field>
        <div>
          <span className="mb-1 block text-sm font-medium text-slate-700">Refund status</span>
          <div className="grid gap-2 sm:grid-cols-3">
            {REFUND_OPTIONS.map((option) => {
              const selected = refundStatus === option;
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => setRefundStatus(option)}
                  aria-pressed={selected}
                  className={[
                    'rounded-xl border px-3 py-2.5 text-sm font-semibold transition-all',
                    selected
                      ? 'border-brand-500 bg-brand-50 text-brand-700 ring-2 ring-brand-200'
                      : 'border-slate-300 bg-white text-slate-600 hover:border-brand-300 hover:bg-slate-50',
                  ].join(' ')}
                >
                  {refundStatusLabel(option)}
                </button>
              );
            })}
          </div>
        </div>
        <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-all hover:bg-slate-50 disabled:opacity-50"
          >
            Keep booking
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Ban className="h-4 w-4" />}
            {submitting ? 'Cancelling...' : 'Confirm cancellation'}
          </button>
        </div>
      </form>
    </FormModal>
  );
}
