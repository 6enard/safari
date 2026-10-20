/*
# Matatu Transport Booking Schema (single-tenant, no auth)

1. New Tables
- `routes` — a named route between two towns in Kenya (e.g. Nairobi - Mombasa).
  - id, origin, destination, distance_km, duration_hours, base_fare, popular, created_at
- `departures` — a concrete scheduled bus/matatu trip on a route.
  - id, route_id FK, departure_date, departure_time, vehicle_name, plate_number,
    total_seats (default 10), fare, amenities text[], created_at
- `bookings` — a seat booking made by a passenger.
  - id, departure_id FK, seat_number, passenger_name, passenger_phone,
    payment_method, payment_ref, status, created_at
2. Security
- No sign-in; single-tenant, intentionally public/shared.
- RLS enabled on all tables; anon + authenticated full CRUD with USING (true).
3. Notes
- UNIQUE(departure_id, seat_number) prevents double-booking the same seat.
- Indexes on departures(route_id, departure_date) and bookings(departure_id).
*/

CREATE TABLE IF NOT EXISTS routes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  origin text NOT NULL,
  destination text NOT NULL,
  distance_km int NOT NULL,
  duration_hours numeric(4,1) NOT NULL,
  base_fare int NOT NULL,
  popular boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE routes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_routes" ON routes;
CREATE POLICY "anon_select_routes" ON routes FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_routes" ON routes;
CREATE POLICY "anon_insert_routes" ON routes FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_routes" ON routes;
CREATE POLICY "anon_update_routes" ON routes FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_routes" ON routes;
CREATE POLICY "anon_delete_routes" ON routes FOR DELETE
  TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS departures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  route_id uuid NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
  departure_date date NOT NULL,
  departure_time time NOT NULL,
  vehicle_name text NOT NULL,
  plate_number text NOT NULL,
  total_seats int NOT NULL DEFAULT 10,
  fare int NOT NULL,
  amenities text[] NOT NULL DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE departures ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_departures" ON departures;
CREATE POLICY "anon_select_departures" ON departures FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_departures" ON departures;
CREATE POLICY "anon_insert_departures" ON departures FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_departures" ON departures;
CREATE POLICY "anon_update_departures" ON departures FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_departures" ON departures;
CREATE POLICY "anon_delete_departures" ON departures FOR DELETE
  TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_departures_route_date
  ON departures(route_id, departure_date);

CREATE TABLE IF NOT EXISTS bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  departure_id uuid NOT NULL REFERENCES departures(id) ON DELETE CASCADE,
  seat_number int NOT NULL,
  passenger_name text NOT NULL,
  passenger_phone text NOT NULL,
  payment_method text NOT NULL DEFAULT 'M-Pesa',
  payment_ref text NOT NULL,
  status text NOT NULL DEFAULT 'confirmed',
  created_at timestamptz DEFAULT now(),
  UNIQUE (departure_id, seat_number)
);

ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_bookings" ON bookings;
CREATE POLICY "anon_select_bookings" ON bookings FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_bookings" ON bookings;
CREATE POLICY "anon_insert_bookings" ON bookings FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_bookings" ON bookings;
CREATE POLICY "anon_update_bookings" ON bookings FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_bookings" ON bookings;
CREATE POLICY "anon_delete_bookings" ON bookings FOR DELETE
  TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_bookings_departure ON bookings(departure_id);
