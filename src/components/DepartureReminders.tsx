import { useEffect, useState } from 'react';
import { Bell, Clock, X } from 'lucide-react';
import { db } from '@/lib/db';
import { computeDueReminders, loadSentReminderIds, markRemindersSent, type DueReminder } from '@/lib/departureReminders';
import { formatDate, formatTime } from '@/lib/format';
import { playReminderChime, unlockReminderSound } from '@/lib/reminderSound';

const CHECK_INTERVAL_MS = 60_000;

const ALERT_THEME = {
  30: {
    card: 'bg-gradient-to-r from-sky-600 via-cyan-600 to-teal-600 shadow-cyan-600/40',
    iconWrap: 'bg-white/20 ring-white/40',
    title: 'Your trip leaves in 30 minutes',
    Icon: Bell,
  },
  5: {
    card: 'bg-gradient-to-r from-rose-600 via-red-600 to-orange-600 shadow-rose-600/40',
    iconWrap: 'bg-white/25 ring-white/50 animate-pulse',
    title: 'Hurry, your trip leaves in 5 minutes',
    Icon: Clock,
  },
} as const;

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
        playReminderChime(due.some((d) => d.lead === 5));
      } catch {
        // Background check; the next interval tick retries.
      }
    }

    window.addEventListener('pointerdown', unlockReminderSound, { once: true });
    check();
    const timer = window.setInterval(check, CHECK_INTERVAL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
      window.removeEventListener('pointerdown', unlockReminderSound);
    };
  }, []);

  function dismiss(id: string) {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  }

  if (alerts.length === 0) return null;

  return (
    <div aria-live="assertive" className="pointer-events-none fixed inset-x-3 bottom-3 z-50 flex flex-col items-end gap-3 sm:inset-x-auto sm:bottom-6 sm:right-6 sm:w-96">
      {alerts.map((alert) => {
        const theme = ALERT_THEME[alert.lead];
        const { Icon } = theme;
        return (
          <div
            key={alert.id}
            role="alert"
            className={`pointer-events-auto w-full overflow-hidden rounded-2xl text-white shadow-2xl animate-slide-up ${theme.card}`}
          >
            <div className="flex items-start gap-3 p-4">
              <span className={`inline-flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl ring-1 ${theme.iconWrap}`}>
                <Icon className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold">{theme.title}</p>
                <p className="mt-1 text-sm text-white/95">
                  {alert.origin} to {alert.destination}, {formatDate(alert.departureDate)} at {formatTime(alert.departureTime)}
                </p>
                <p className="mt-1 text-xs font-medium text-white/85">
                  Seat{alert.seats.length > 1 ? 's' : ''} {alert.seats.join(', ')}
                </p>
              </div>
              <button
                type="button"
                onClick={() => dismiss(alert.id)}
                aria-label="Dismiss reminder"
                className="-m-1 rounded-lg p-1 text-white/80 transition-colors hover:bg-white/20 hover:text-white"
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
