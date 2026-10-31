import { callFunction } from '@/lib/functionsClient';
import type { Route } from '@/lib/db';

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

export type AdminData = {
  routes: Route[];
  departures: AdminDeparture[];
  vehicles: AdminVehicle[];
  drivers: AdminDriver[];
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
};
