/*
# Drivers, vehicles and shared booking data

1. New Tables
- `drivers`: full_name, phone, email (optional), license_number, created_at. Private: only the server can read or write.
- `vehicles`: plate_number (unique), vehicle_name, driver_id (links to a driver), created_at. Public read.

2. Modified Tables
- `departures`: new `vehicle_id` linking each scheduled trip to a vehicle. The old free-text vehicle_name and plate_number columns become optional so new schedules can be saved without them.
- `bookings`: new `user_id` column recording which signed-in account made the booking. Bookings are now private to that account.

3. Security
- `routes` and `departures`: public can read; only the server can create, change or delete them.
- `vehicles`: public can read; only the server can change them.
- `drivers`: no public access at all.
- `bookings`: no public access. Booking is done through a server function that checks the signed-in user and seat availability.

4. Seed data
- Four popular routes, three vehicles with placeholder drivers (replace them in the admin page), and 30 days of schedules, inserted only when those tables are empty.

5. Important notes
- No rows are deleted or renamed. Existing columns are kept.
- Every statement is safe to run again.
*/

CREATE TABLE IF NOT EXISTS drivers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  phone text NOT NULL,
  email text,
  license_number text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
GRANT ALL ON drivers TO service_role;

CREATE TABLE IF NOT EXISTS vehicles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plate_number text NOT NULL UNIQUE,
  vehicle_name text NOT NULL,
  driver_id uuid REFERENCES drivers(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON vehicles TO anon, authenticated;
GRANT ALL ON vehicles TO service_role;

DROP POLICY IF EXISTS "public_select_vehicles" ON vehicles;
CREATE POLICY "public_select_vehicles" ON vehicles FOR SELECT
  TO anon, authenticated USING (true);

ALTER TABLE routes ENABLE ROW LEVEL SECURITY;
REVOKE INSERT, UPDATE, DELETE ON routes FROM anon, authenticated;
GRANT SELECT ON routes TO anon, authenticated;
GRANT ALL ON routes TO service_role;
DROP POLICY IF EXISTS "anon_insert_routes" ON routes;
DROP POLICY IF EXISTS "anon_update_routes" ON routes;
DROP POLICY IF EXISTS "anon_delete_routes" ON routes;

ALTER TABLE departures ALTER COLUMN vehicle_name DROP NOT NULL;
ALTER TABLE departures ALTER COLUMN plate_number DROP NOT NULL;
ALTER TABLE departures ADD COLUMN IF NOT EXISTS vehicle_id uuid REFERENCES vehicles(id) ON DELETE RESTRICT;
CREATE INDEX IF NOT EXISTS idx_departures_vehicle ON departures(vehicle_id);
ALTER TABLE departures ENABLE ROW LEVEL SECURITY;
REVOKE INSERT, UPDATE, DELETE ON departures FROM anon, authenticated;
GRANT SELECT ON departures TO anon, authenticated;
GRANT ALL ON departures TO service_role;
DROP POLICY IF EXISTS "anon_insert_departures" ON departures;
DROP POLICY IF EXISTS "anon_update_departures" ON departures;
DROP POLICY IF EXISTS "anon_delete_departures" ON departures;

ALTER TABLE bookings ADD COLUMN IF NOT EXISTS user_id text;
ALTER TABLE bookings ALTER COLUMN user_id SET NOT NULL;
CREATE INDEX IF NOT EXISTS idx_bookings_user ON bookings(user_id);
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON bookings FROM anon, authenticated;
GRANT ALL ON bookings TO service_role;
DROP POLICY IF EXISTS "anon_select_bookings" ON bookings;
DROP POLICY IF EXISTS "anon_insert_bookings" ON bookings;
DROP POLICY IF EXISTS "anon_update_bookings" ON bookings;
DROP POLICY IF EXISTS "anon_delete_bookings" ON bookings;

INSERT INTO routes (origin, destination, distance_km, duration_hours, base_fare, popular)
SELECT v.origin, v.destination, v.distance_km, v.duration_hours, v.base_fare, v.popular
FROM (VALUES
  ('Nairobi', 'Mombasa', 485, 8.0, 1500, true),
  ('Nakuru', 'Nairobi', 160, 3.0, 700, true),
  ('Nakuru', 'Bomet', 135, 2.5, 600, false),
  ('Kericho', 'Kisumu', 115, 2.0, 500, false)
) AS v(origin, destination, distance_km, duration_hours, base_fare, popular)
WHERE NOT EXISTS (SELECT 1 FROM routes);

INSERT INTO drivers (full_name, phone, email, license_number)
SELECT v.full_name, v.phone, v.email, v.license_number
FROM (VALUES
  ('Sample Driver 1', '+254 700 000 001', 'driver1@example.com', 'DL-SAMPLE-001'),
  ('Sample Driver 2', '+254 700 000 002', 'driver2@example.com', 'DL-SAMPLE-002'),
  ('Sample Driver 3', '+254 700 000 003', 'driver3@example.com', 'DL-SAMPLE-003')
) AS v(full_name, phone, email, license_number)
WHERE NOT EXISTS (SELECT 1 FROM drivers);

INSERT INTO vehicles (plate_number, vehicle_name, driver_id)
SELECT v.plate_number, v.vehicle_name, d.id
FROM (VALUES
  ('KDA 100A', 'Safari Express', 'Sample Driver 1'),
  ('KDB 220B', 'Safari Express', 'Sample Driver 2'),
  ('KDC 330C', 'Safari Express', 'Sample Driver 3')
) AS v(plate_number, vehicle_name, driver_name)
JOIN drivers d ON d.full_name = v.driver_name
WHERE NOT EXISTS (SELECT 1 FROM vehicles);

DO $$
DECLARE
  r record;
  v_ids uuid[];
  d int;
  t int;
  times text[] := ARRAY['07:30', '14:00', '18:30'];
  adjust int[] := ARRAY[0, -100, 150];
  amen text[];
BEGIN
  IF EXISTS (SELECT 1 FROM departures) THEN
    RETURN;
  END IF;
  SELECT array_agg(id ORDER BY plate_number) INTO v_ids FROM vehicles;
  FOR r IN SELECT id, base_fare FROM routes LOOP
    FOR d IN 0..29 LOOP
      FOR t IN 1..3 LOOP
        amen := CASE t
          WHEN 1 THEN ARRAY['WiFi', 'AC', 'Charging']
          WHEN 2 THEN ARRAY['AC']
          ELSE ARRAY['WiFi', 'AC', 'Charging', 'Snacks']
        END;
        INSERT INTO departures (route_id, departure_date, departure_time, fare, amenities, vehicle_id)
        VALUES (r.id, CURRENT_DATE + d, times[t]::time, r.base_fare + adjust[t], amen, v_ids[t]);
      END LOOP;
    END LOOP;
  END LOOP;
END $$;
