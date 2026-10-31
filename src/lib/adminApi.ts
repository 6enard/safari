import { callFunction } from '@/lib/functionsClient';
import type { Route, Departure, RefundStatus, ParcelStatus } from '@/lib/db';

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
  photo_url: string | null;
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
  cancellation_reason: string | null;
  refund_status: RefundStatus | null;
  cancelled_at: string | null;
  departures: AdminDeparture & {
    routes: Route;
    vehicles: { plate_number: string; vehicle_name: string } | null;
  };
};

export type AdminParcel = {
  id: string;
  user_id: string;
  route_id: string | null;
  departure_id: string | null;
  sender_name: string;
  sender_phone: string;
  recipient_name: string;
  recipient_phone: string;
  pickup_location: string;
  dropoff_location: string;
  description: string;
  weight_kg: number;
  parcel_type: string;
  status: ParcelStatus;
  tracking_number: string;
  fee: number;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
  routes: { id: string; origin: string; destination: string } | null;
  departures: { id: string; departure_date: string; departure_time: string; vehicles: { plate_number: string; vehicle_name: string } | null } | null;
};

export type AdminData = {
  routes: Route[];
  departures: AdminDeparture[];
  vehicles: AdminVehicle[];
  drivers: AdminDriver[];
  bookings: AdminBooking[];
  parcels: AdminParcel[];
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
  cancelBooking: (bookingId: string, reason: string, refundStatus: RefundStatus) =>
    callFunction<{ ok: true }>('admin', { action: 'cancelBooking', bookingId, reason, refundStatus }, true),
  uploadDriverPhoto: (driverId: string, contentType: string, data: string) =>
    callFunction<{ photo_url: string }>('admin', { action: 'uploadDriverPhoto', driverId, contentType, data }, true),
  updateParcel: (parcelId: string, update: { status?: ParcelStatus; adminNotes?: string; fee?: number }) =>
    callFunction<{ ok: true }>('admin', { action: 'updateParcel', parcelId, ...update }, true),
  deleteParcel: (parcelId: string) =>
    callFunction<{ ok: true }>('admin', { action: 'deleteParcel', parcelId }, true),
};
