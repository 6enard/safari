export function formatKes(amount: number): string {
  return `KES ${amount.toLocaleString('en-KE')}`;
}

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-KE', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

export function formatTime(timeStr: string): string {
  const [h, m] = timeStr.split(':').map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d.toLocaleTimeString('en-KE', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export function toISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString('en-KE', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

const REFUND_LABELS: Record<string, string> = {
  pending: 'Refund pending',
  refunded: 'Refunded',
  not_refunded: 'No refund',
};

export function refundStatusLabel(status: string | null): string {
  return (status && REFUND_LABELS[status]) || 'Refund not set';
}

export function genPaymentRef(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ0123456789';
  let ref = '';
  for (let i = 0; i < 8; i++) {
    ref += chars[Math.floor(Math.random() * chars.length)];
  }
  return `MPX${ref}`;
}
