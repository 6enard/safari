import { callFunction } from '@/lib/functionsClient';
import type { Route, Departure } from '@/lib/db';

export const ADMIN_EMAIL = '6enard@gmail.com';

export function isAdminEmail(email: string | null | undefined): boolean {
  return (email ?? '').toLowerCase() === ADMIN_EMAIL;
}

export type AdminDeparture = {
  id: string;
  route_id: string;
  departure_date: string;
  departure_time: string;
  vehicle_id: string | null;
  fare: number;
  amenities: string[];
};

export type AdminVehicle = {
  id: string;
  plate_number: string;
  vehicle_name: string;
  driver_id: string | null;
};

export type AdminDriver = {
  id: string;
  full_name: string;
  phone: string;
  email: string | null;
  license_number: string;
};

export type AdminBooking = {
  id: string;
  user_id: string;
  departure_id: string;
  seat_number: number;
  passenger_name: string;
  passenger_phone: string;
  payment_method: string;
  payment_ref: string;
  status: string;
  created_at: string;
  departures: AdminDeparture & {
    routes: Route;
    vehicles: { plate_number: string; vehicle_name: string } | null;
  };
};

export type AdminData = {
  routes: Route[];
  departures: AdminDeparture[];
  vehicles: AdminVehicle[];
  drivers: AdminDriver[];
  bookings: AdminBooking[];
};

export type AdminTable = 'routes' | 'departures' | 'vehicles' | 'drivers';

export function errorText(err: unknown): string {
  return err instanceof Error ? err.message : 'Something went wrong. Please try again.';
}

export const adminApi = {
  load: () => callFunction<AdminData>('admin', { action: 'load' }, true),
  save: (table: AdminTable, row: Record<string, unknown>, id?: string) =>
    callFunction<{ row: unknown }>('admin', { action: 'save', table, id, row }, true),
  remove: (table: AdminTable, id: string) =>
    callFunction<{ ok: true }>('admin', { action: 'delete', table, id }, true),
  cancelBooking: (bookingId: string) =>
    callFunction<{ ok: true }>('admin', { action: 'cancelBooking', bookingId }, true),
};
