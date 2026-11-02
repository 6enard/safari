/*
# Create route pickup points

1. New Tables
- `pickup_points`: boarding stops for each route.
  - `id` (uuid, primary key)
  - `route_id` (uuid, references routes, deleted together with its route)
  - `name` (text, e.g. "Bomet Main Stage")
  - `address` (text, optional description for passengers)
  - `latitude` / `longitude` (numeric, used to place the stop on the map)
  - `sort_order` (integer, controls the order stops are listed in)
  - `created_at` (timestamptz)

2. Seed data
- Each existing route gets one starting pickup point at its origin town, with approximate map coordinates. Admins can refine names and positions in the admin console.

3. Security
- Row level security enabled.
- Anyone using the app (anon and authenticated) can read pickup points so the map shows on the booking flow.
- No client-side write policies: changes are made by the admin server function, which uses the service role.

4. Notes
- Pickup points are linked to a route, so deleting a route also removes its pickup points.
*/

CREATE TABLE IF NOT EXISTS pickup_points (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  route_id uuid NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
  name text NOT NULL,
  address text,
  latitude numeric NOT NULL,
  longitude numeric NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS pickup_points_route_id_idx ON pickup_points (route_id);

ALTER TABLE pickup_points ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON pickup_points TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON pickup_points TO service_role;

DROP POLICY IF EXISTS "Anyone can view pickup points" ON pickup_points;
CREATE POLICY "Anyone can view pickup points"
ON pickup_points FOR SELECT
TO anon, authenticated
USING (true);

INSERT INTO pickup_points (route_id, name, address, latitude, longitude, sort_order)
SELECT r.id, t.name, t.address, t.latitude, t.longitude, 0
FROM routes r
JOIN (VALUES
  ('Bomet', 'Bomet Main Stage', 'Main matatu stage, Bomet town', -0.7817, 35.3420),
  ('Kaplong', 'Kaplong Main Stage', 'Main matatu stage, Kaplong town', -0.6950, 35.2800),
  ('Litein', 'Litein Main Stage', 'Main matatu stage, Litein town', -0.4900, 35.3000),
  ('Kericho', 'Kericho Main Stage', 'Main matatu stage, Kericho town', -0.3686, 35.2863),
  ('Nakuru', 'Nakuru Main Stage', 'Main matatu stage, Nakuru town', -0.3031, 36.0800),
  ('Nairobi', 'Nairobi CBD Stage', 'Main matatu stage, Nairobi CBD', -1.2864, 36.8172)
) AS t(town, name, address, latitude, longitude) ON r.origin = t.town
WHERE NOT EXISTS (
  SELECT 1 FROM pickup_points p WHERE p.route_id = r.id
);
