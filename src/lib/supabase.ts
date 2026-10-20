import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
  route?: Route;
};

export type Booking = {
  id: string;
  departure_id: string;
  seat_number: number;
  passenger_name: string;
  passenger_phone: string;
  payment_method: string;
  payment_ref: string;
  status: string;
  created_at: string;
  departure?: Departure;
};

export const SEAT_LAYOUT = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;
