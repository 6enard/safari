import { LocalNotifications, type LocalNotificationSchema } from '@capacitor/local-notifications';
import type { BookingGroup } from '@/lib/db';
import { departureDateTime, formatTime } from '@/lib/format';
import { isNative } from '@/lib/native';

const CHANNEL_ID = 'trip-reminders';
const MAX_SCHEDULED = 60; // iOS allows at most 64 pending local notifications

const LEADS = [
  { minutes: 24 * 60, title: 'Your trip is tomorrow' },
  { minutes: 120, title: 'Your trip leaves in 2 hours' },
  { minutes: 30, title: 'Your trip leaves in 30 minutes' },
];

let lastSignature = '';

function notificationId(key: string): number {
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (Math.imul(31, h) + key.charCodeAt(i)) | 0;
  return (Math.abs(h) % 2_000_000_000) + 1;
}

async function ensurePermission(): Promise<boolean> {
  let { display } = await LocalNotifications.checkPermissions();
  if (display === 'prompt' || display === 'prompt-with-rationale') {
    ({ display } = await LocalNotifications.requestPermissions());
  }
  return display === 'granted';
}

/**
 * Schedules phone notifications (24 h, 2 h and 30 min before departure) for every
 * confirmed upcoming booking, so reminders arrive even when the app is closed.
 * Safe to call repeatedly: it replaces what is scheduled with the current bookings.
 * Does nothing in a browser.
 */
export async function syncTripNotifications(groups: BookingGroup[]) {
  if (!isNative) return;
  try {
    const now = Date.now();
    const wanted: Array<{ at: number; notification: LocalNotificationSchema }> = [];

    for (const group of groups) {
      const seats = group.bookings
        .filter((b) => b.status === 'confirmed')
        .map((b) => b.seat_number)
        .sort((a, b) => a - b);
      if (seats.length === 0) continue;

      const departure = departureDateTime(group.departure.departure_date, group.departure.departure_time).getTime();
      for (const lead of LEADS) {
        const at = departure - lead.minutes * 60_000;
        if (at <= now + 10_000) continue;
        wanted.push({
          at,
          notification: {
            id: notificationId(`${group.payment_ref}:${lead.minutes}`),
            title: lead.title,
            body: `${group.route.origin} to ${group.route.destination} at ${formatTime(group.departure.departure_time)}. Seat${seats.length > 1 ? 's' : ''} ${seats.join(', ')}.`,
            schedule: { at: new Date(at), allowWhileIdle: true },
            channelId: CHANNEL_ID,
            extra: { view: 'bookings' },
          },
        });
      }
    }

    wanted.sort((a, b) => a.at - b.at);
    const batch = wanted.slice(0, MAX_SCHEDULED);

    const signature = batch.map((n) => `${n.notification.id}@${n.at}`).join('|');
    if (signature === lastSignature) return;

    // Remove reminders for bookings that were cancelled, moved or already past.
    const { notifications: pending } = await LocalNotifications.getPending();
    const wantedIds = new Set(batch.map((n) => n.notification.id));
    const stale = pending.filter((n) => !wantedIds.has(n.id));
    if (stale.length > 0) await LocalNotifications.cancel({ notifications: stale.map((n) => ({ id: n.id })) });

    if (batch.length > 0) {
      if (!(await ensurePermission())) return;
      try {
        await LocalNotifications.createChannel({
          id: CHANNEL_ID,
          name: 'Trip reminders',
          description: 'Reminders before your shuttle departs',
          importance: 4,
          visibility: 1,
          vibration: true,
        });
      } catch {
        /* channels only exist on Android */
      }
      await LocalNotifications.schedule({
        notifications: batch.map((n) => n.notification),
      });
    }
    lastSignature = signature;
  } catch {
    // Reminders are best-effort; the next check retries.
  }
}

/** Remove every scheduled reminder (used when the user signs out). */
export async function clearTripNotifications() {
  if (!isNative) return;
  try {
    const { notifications } = await LocalNotifications.getPending();
    if (notifications.length > 0) await LocalNotifications.cancel({ notifications });
    lastSignature = '';
  } catch {
    /* ignore */
  }
}
