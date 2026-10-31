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
  created_at: string;
};

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

type DepartureRow = Omit<Departure, 'vehicle_name' | 'plate_number'> & {
  vehicles: { plate_number: string; vehicle_name: string } | null;
};

type BookingRow = Booking & {
  departures: DepartureRow & { routes: Route };
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

  async listBookingsForUser(): Promise<BookingGroup[]> {
    const { bookings } = await callBookings<{ bookings: BookingRow[] }>({ action: 'mine' }, true);
    return groupBookings(bookings);
  },

  async getBookingsByRef(paymentRef: string): Promise<{ bookings: Booking[]; departure: Departure; route: Route } | null> {
    const { bookings } = await callBookings<{ bookings: BookingRow[] }>({ action: 'receipt', paymentRef }, true);
    const [group] = groupBookings(bookings);
    if (!group) return null;
    return { bookings: group.bookings, departure: group.departure, route: group.route };
  },
};
