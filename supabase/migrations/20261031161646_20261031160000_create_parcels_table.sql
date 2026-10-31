/*
# Create parcels table

1. New Tables
- `parcels` — a package sent through the shuttle service.
  - id (uuid PK)
  - user_id (text, not null) — Firebase UID of the customer who created the parcel.
  - route_id (uuid, nullable, FK to routes) — optional route the parcel is associated with.
  - departure_id (uuid, nullable, FK to departures) — optional trip the parcel is assigned to.
  - sender_name (text, not null)
  - sender_phone (text, not null)
  - recipient_name (text, not null)
  - recipient_phone (text, not null)
  - pickup_location (text, not null)
  - dropoff_location (text, not null)
  - description (text, not null) — contents of the parcel.
  - weight_kg (numeric, not null) — weight in kilograms.
  - parcel_type (text, not null) — one of: document, electronics, clothing, food, other.
  - status (text, not null, default 'pending') — one of: pending, in_transit, delivered, cancelled.
  - tracking_number (text, unique, not null) — human-readable tracking code.
  - fee (integer, not null) — delivery fee in KES.
  - admin_notes (text, nullable) — internal notes for staff.
  - created_at (timestamptz, default now())
  - updated_at (timestamptz, default now())

2. Security
- RLS enabled on `parcels`.
- Grant full CRUD to `anon, authenticated` with USING (true), matching the existing pattern
  used by routes, departures, and bookings. Actual access control is enforced in the
  edge functions (`bookings` and `admin`) via Firebase token verification — the database
  policies are intentionally permissive because the frontend never touches these tables
  directly except through the edge functions.

3. Notes
- UNIQUE constraint on tracking_number prevents duplicate tracking codes.
- Index on user_id for fast "my parcels" queries.
- Index on status for admin filtering.
*/

CREATE TABLE IF NOT EXISTS parcels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  route_id uuid REFERENCES routes(id) ON DELETE SET NULL,
  departure_id uuid REFERENCES departures(id) ON DELETE SET NULL,
  sender_name text NOT NULL,
  sender_phone text NOT NULL,
  recipient_name text NOT NULL,
  recipient_phone text NOT NULL,
  pickup_location text NOT NULL,
  dropoff_location text NOT NULL,
  description text NOT NULL,
  weight_kg numeric(8,2) NOT NULL,
  parcel_type text NOT NULL CHECK (parcel_type IN ('document', 'electronics', 'clothing', 'food', 'other')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_transit', 'delivered', 'cancelled')),
  tracking_number text NOT NULL UNIQUE,
  fee integer NOT NULL DEFAULT 0,
  admin_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE parcels ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON parcels TO anon, authenticated;

DROP POLICY IF EXISTS "anon_select_parcels" ON parcels;
CREATE POLICY "anon_select_parcels" ON parcels FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_parcels" ON parcels;
CREATE POLICY "anon_insert_parcels" ON parcels FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_parcels" ON parcels;
CREATE POLICY "anon_update_parcels" ON parcels FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_parcels" ON parcels;
CREATE POLICY "anon_delete_parcels" ON parcels FOR DELETE
  TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_parcels_user_id ON parcels(user_id);
CREATE INDEX IF NOT EXISTS idx_parcels_status ON parcels(status);
