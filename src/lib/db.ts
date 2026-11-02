import { createClient } from '@supabase/supabase-js';
import { callFunction } from '@/lib/functionsClient';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/lib/supabaseEnv';

export type Route = {
  id: string;
  origin: string;
  destination: string;
  distance_km: number;
  duration_hours: number;
  base_fare: number;
  popular: boolean;
  created_at: string;
};

export type Departure = {
  id: string;
  route_id: string;
  departure_date: string;
  departure_time: string;
  vehicle_name: string;
  plate_number: string;
  total_seats: number;
  fare: number;
  amenities: string[];
  created_at: string;
};

export type PickupPoint = {
  id: string;
  route_id: string;
  name: string;
  address: string | null;
  latitude: number;
  longitude: number;
  sort_order: number;
};

export type RefundStatus = 'pending' | 'refunded' | 'not_refunded';

export type Booking = {
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
};

export type BookingGroup = {
  payment_ref: string;
  bookings: Booking[];
  departure: Departure;
  route: Route;
  driver: DriverInfo | null;
  created_at: string;
};

export type ParcelStatus = 'pending' | 'in_transit' | 'delivered' | 'cancelled';
export type ParcelType = 'document' | 'electronics' | 'clothing' | 'food' | 'other';

export type Parcel = {
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
  parcel_type: ParcelType;
  status: ParcelStatus;
  tracking_number: string;
  fee: number;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
  routes: { id: string; origin: string; destination: string } | null;
  departures: { id: string; departure_date: string; departure_time: string; vehicles: { plate_number: string; vehicle_name: string } | null } | null;
};

export type PassengerReview = {
  id: string;
  passenger_name: string;
  route_label: string;
  rating: number;
  comment: string;
  travelled_on: string;
};

export type ParcelInput = {
  routeId: string | null;
  departureId: string | null;
  senderName: string;
  senderPhone: string;
  recipientName: string;
  recipientPhone: string;
  pickupLocation: string;
  dropoffLocation: string;
  description: string;
  weightKg: number;
  parcelType: ParcelType;
};

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

type DepartureRow = Omit<Departure, 'vehicle_name' | 'plate_number'> & {
  vehicles: { plate_number: string; vehicle_name: string } | null;
};

export type DriverInfo = { full_name: string; phone: string; photo_url: string | null };

type BookingRow = Booking & {
  departures: Omit<DepartureRow, 'vehicles'> & {
    routes: Route;
    vehicles: { plate_number: string; vehicle_name: string; drivers: DriverInfo | null } | null;
  };
};

function toDeparture(row: DepartureRow): Departure {
  const { vehicles, ...rest } = row;
  return {
    ...rest,
    vehicle_name: vehicles?.vehicle_name ?? 'Matatu',
    plate_number: vehicles?.plate_number ?? '',
  };
}

function groupBookings(rows: BookingRow[]): BookingGroup[] {
  const byRef = new Map<string, BookingGroup>();
  for (const row of rows) {
    const { departures, ...booking } = row;
    const existing = byRef.get(row.payment_ref);
    if (existing) {
      existing.bookings.push(booking);
      continue;
    }
    byRef.set(row.payment_ref, {
      payment_ref: row.payment_ref,
      bookings: [booking],
      departure: toDeparture(departures),
      route: departures.routes,
      driver: departures.vehicles?.drivers ?? null,
      created_at: row.created_at,
    });
  }
  return [...byRef.values()].sort((a, b) =>
    `${a.departure.departure_date}T${a.departure.departure_time}`.localeCompare(
      `${b.departure.departure_date}T${b.departure.departure_time}`,
    ),
  );
}

function callBookings<T>(body: Record<string, unknown>, needsSignIn: boolean): Promise<T> {
  return callFunction<T>('bookings', body, needsSignIn);
}

export const db = {
  async listRoutes(): Promise<Route[]> {
    const { data, error } = await supabase
      .from('routes')
      .select('*')
      .order('popular', { ascending: false })
      .order('origin');
    if (error) throw new Error(error.message);
    return data as Route[];
  },

  async listPickupPoints(routeId: string): Promise<PickupPoint[]> {
    const { data, error } = await supabase
      .from('pickup_points')
      .select('id, route_id, name, address, latitude, longitude, sort_order')
      .eq('route_id', routeId)
      .order('sort_order')
      .order('name');
    if (error) throw new Error(error.message);
    return data as PickupPoint[];
  },

  async listAvailableDates(routeId: string): Promise<string[]> {
    const today = new Date().toISOString().slice(0, 10);
    const { data, error } = await supabase
      .from('departures')
      .select('departure_date')
      .eq('route_id', routeId)
      .gte('departure_date', today);
    if (error) throw new Error(error.message);
    return [...new Set((data ?? []).map((d) => d.departure_date as string))].sort();
  },

  async listDeparturesForDate(routeId: string, date: string): Promise<Departure[]> {
    const { data, error } = await supabase
      .from('departures')
      .select('*, vehicles(plate_number, vehicle_name)')
      .eq('route_id', routeId)
      .eq('departure_date', date)
      .order('departure_time');
    if (error) throw new Error(error.message);
    return (data as unknown as DepartureRow[]).map(toDeparture);
  },

  async listBookedSeats(departureId: string): Promise<number[]> {
    const { seats } = await callBookings<{ seats: number[] }>({ action: 'bookedSeats', departureId }, false);
    return seats;
  },

  async createBookings(input: {
    departure_id: string;
    seat_numbers: number[];
    passenger_name: string;
    passenger_phone: string;
    payment_method: string;
    payment_ref: string;
  }): Promise<{ ids: string[] }> {
    const { ids } = await callBookings<{ ids: string[] }>(
      {
        action: 'create',
        departureId: input.departure_id,
        seats: input.seat_numbers,
        passengerName: input.passenger_name,
        passengerPhone: input.passenger_phone,
        paymentMethod: input.payment_method,
        paymentRef: input.payment_ref,
      },
      true,
    );
    return { ids };
  },

  async dismissCancelledBookings(paymentRef: string): Promise<void> {
    await callBookings<{ ok: true }>({ action: 'dismissCancelled', paymentRef }, true);
  },

  async deleteBookings(paymentRef: string): Promise<void> {
    await callBookings<{ ok: true }>({ action: 'deleteBookings', paymentRef }, true);
  },

  async createParcel(input: ParcelInput): Promise<{ id: string; tracking_number: string; fee: number }> {
    const { parcel } = await callBookings<{ parcel: { id: string; tracking_number: string; fee: number } }>(
      {
        action: 'createParcel',
        routeId: input.routeId,
        departureId: input.departureId,
        senderName: input.senderName,
        senderPhone: input.senderPhone,
        recipientName: input.recipientName,
        recipientPhone: input.recipientPhone,
        pickupLocation: input.pickupLocation,
        dropoffLocation: input.dropoffLocation,
        description: input.description,
        weightKg: input.weightKg,
        parcelType: input.parcelType,
      },
      true,
    );
    return parcel;
  },

  async getParcel(parcelId: string): Promise<Parcel> {
    const { parcel } = await callBookings<{ parcel: Parcel }>({ action: 'getParcel', parcelId }, true);
    return parcel;
  },

  async listMyParcels(): Promise<Parcel[]> {
    const { parcels } = await callBookings<{ parcels: Parcel[] }>({ action: 'myParcels' }, true);
    return parcels;
  },

  async deleteParcel(parcelId: string): Promise<void> {
    await callBookings<{ ok: true }>({ action: 'deleteParcel', parcelId }, true);
  },

  async getAvatarUrl(): Promise<string | null> {
    const { avatarUrl } = await callFunction<{ avatarUrl: string | null }>('profile', { action: 'getProfile' }, true);
    return avatarUrl;
  },

  async updateAvatar(imageDataUrl: string): Promise<string> {
    const { avatarUrl } = await callFunction<{ avatarUrl: string }>('profile', { action: 'updateAvatar', imageDataUrl }, true);
    return avatarUrl;
  },

  async listBookingsForUser(): Promise<BookingGroup[]> {
    const { bookings } = await callBookings<{ bookings: BookingRow[] }>({ action: 'mine' }, true);
    return groupBookings(bookings);
  },

  async listPassengerReviews(): Promise<PassengerReview[]> {
    const { data, error } = await supabase
      .from('passenger_reviews')
      .select('id, passenger_name, route_label, rating, comment, travelled_on')
      .order('travelled_on', { ascending: false })
      .limit(12);
    if (error) throw new Error(error.message);
    return data as PassengerReview[];
  },

  async getBookingsByRef(paymentRef: string): Promise<{ bookings: Booking[]; departure: Departure; route: Route } | null> {
    const { bookings } = await callBookings<{ bookings: BookingRow[] }>({ action: 'receipt', paymentRef }, true);
    const [group] = groupBookings(bookings);
    if (!group) return null;
    return { bookings: group.bookings, departure: group.departure, route: group.route };
  },
};
