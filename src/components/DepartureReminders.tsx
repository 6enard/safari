import { useEffect, useState } from 'react';
import { Bell, Clock, X } from 'lucide-react';
import { db } from '@/lib/db';
import { computeDueReminders, loadSentReminderIds, markRemindersSent, type DueReminder } from '@/lib/departureReminders';
import { formatDate, formatTime } from '@/lib/format';

const CHECK_INTERVAL_MS = 60_000;

export function DepartureReminders() {
  const [alerts, setAlerts] = useState<DueReminder[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function check() {
      try {
        const groups = await db.listBookingsForUser();
        if (cancelled) return;
        const sent = loadSentReminderIds();
        const due = computeDueReminders(groups, new Date(), sent);
        if (due.length === 0) return;
        markRemindersSent(due, sent);
        setAlerts((prev) => [...prev, ...due]);
      } catch {
        // Background check; the next interval tick retries.
      }
    }

    check();
    const timer = window.setInterval(check, CHECK_INTERVAL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, []);

  function dismiss(id: string) {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  }

  if (alerts.length === 0) return null;

  return (
    <div aria-live="polite" className="pointer-events-none fixed inset-x-3 bottom-3 z-50 flex flex-col items-end gap-3 sm:inset-x-auto sm:bottom-6 sm:right-6 sm:w-96">
      {alerts.map((alert) => {
        const urgent = alert.lead === 5;
        return (
          <div
            key={alert.id}
            role="alert"
            className="pointer-events-auto w-full overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-2xl shadow-slate-900/15 animate-slide-up"
          >
            <div className="flex items-start gap-3 p-4">
              <span className={`inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${urgent ? 'bg-amber-100 text-amber-700' : 'bg-brand-50 text-brand-700'}`}>
                {urgent ? <Clock className="h-5 w-5" /> : <Bell className="h-5 w-5" />}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-slate-900">
                  {urgent ? 'Your trip leaves in 5 minutes' : 'Your trip leaves in 30 minutes'}
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  {alert.origin} to {alert.destination}, {formatDate(alert.departureDate)} at {formatTime(alert.departureTime)}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Seat{alert.seats.length > 1 ? 's' : ''} {alert.seats.join(', ')}
                </p>
              </div>
              <button
                type="button"
                onClick={() => dismiss(alert.id)}
                aria-label="Dismiss reminder"
                className="-m-1 rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
