import type { BookingGroup } from '@/lib/db';
import { departureDateTime } from '@/lib/format';

export type ReminderLead = 5 | 30;

export type DueReminder = {
  id: string;
  paymentRef: string;
  lead: ReminderLead;
  origin: string;
  destination: string;
  departureDate: string;
  departureTime: string;
  seats: number[];
};

const SENT_KEY = 'srs-sent-departure-reminders';
const MAX_STORED = 300;
const LEADS: ReminderLead[] = [5, 30];

function reminderId(paymentRef: string, lead: ReminderLead): string {
  return `${paymentRef}:${lead}`;
}

export function loadSentReminderIds(): Set<string> {
  try {
    const raw = localStorage.getItem(SENT_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === 'string') : []);
  } catch {
    return new Set();
  }
}

function saveSentReminderIds(ids: Set<string>) {
  const list = [...ids].slice(-MAX_STORED);
  localStorage.setItem(SENT_KEY, JSON.stringify(list));
}

export function computeDueReminders(groups: BookingGroup[], now: Date, sent: Set<string>): DueReminder[] {
  const due: DueReminder[] = [];
  for (const group of groups) {
    const seats = group.bookings.filter((b) => b.status === 'confirmed').map((b) => b.seat_number);
    if (seats.length === 0) continue;

    const minutesLeft = (departureDateTime(group.departure.departure_date, group.departure.departure_time).getTime() - now.getTime()) / 60000;
    if (minutesLeft <= 0) continue;

    const lead: ReminderLead | null = minutesLeft <= 5 ? 5 : minutesLeft <= 30 ? 30 : null;
    if (lead === null || sent.has(reminderId(group.payment_ref, lead))) continue;

    due.push({
      id: reminderId(group.payment_ref, lead),
      paymentRef: group.payment_ref,
      lead,
      origin: group.route.origin,
      destination: group.route.destination,
      departureDate: group.departure.departure_date,
      departureTime: group.departure.departure_time,
      seats: seats.sort((a, b) => a - b),
    });
  }
  return due;
}

export function markRemindersSent(reminders: DueReminder[], sent: Set<string>) {
  for (const reminder of reminders) {
    for (const lead of LEADS) sent.add(reminderId(reminder.paymentRef, lead));
  }
  saveSentReminderIds(sent);
}
