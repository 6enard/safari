/*
# Create passenger reviews table with sample reviews

1. New Tables
- `passenger_reviews`
  - `id` (uuid, primary key)
  - `passenger_name` (text, required) - name shown with the review
  - `route_label` (text, required) - the trip the passenger took, e.g. "Nakuru - Nairobi"
  - `rating` (smallint, 1 to 5 stars)
  - `comment` (text, required) - the review text
  - `travelled_on` (date, required) - date of the trip
  - `created_at` (timestamptz, defaults to now)
2. Sample data
- Six sample passenger reviews are inserted only when the table is empty, so re-running this migration never duplicates them.
3. Security
- Row level security is enabled.
- Visitors (anon) and signed-in users can read reviews. This is intentionally public testimonial data.
- No client-side insert, update, or delete is granted. Reviews are managed by the team directly in the database.
4. Notes
- The table has no owner column because reviews are not written by app users.
*/

CREATE TABLE IF NOT EXISTS passenger_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  passenger_name text NOT NULL,
  route_label text NOT NULL,
  rating smallint NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment text NOT NULL,
  travelled_on date NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE passenger_reviews ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON passenger_reviews TO anon, authenticated;

DROP POLICY IF EXISTS "public_select_passenger_reviews" ON passenger_reviews;
CREATE POLICY "public_select_passenger_reviews" ON passenger_reviews
  FOR SELECT
  TO anon, authenticated
  USING (true);

INSERT INTO passenger_reviews (passenger_name, route_label, rating, comment, travelled_on)
SELECT v.passenger_name, v.route_label, v.rating, v.comment, v.travelled_on
FROM (VALUES
  ('Wanjiku Kamau', 'Nakuru - Nairobi', 5, 'Left Nakuru on time and reached Nairobi well before the traffic built up. The seats were clean and the driver was careful on the Mau stretch.', DATE '2026-09-14'),
  ('Kipchirchir Rono', 'Bomet - Kaplong', 5, 'Quick and comfortable ride. Booking my seat on my phone took less than a minute, and the matatu was waiting at the stage when I arrived.', DATE '2026-09-22'),
  ('Akinyi Otieno', 'Kericho - Nakuru', 4, 'Smooth trip with friendly staff. I would love a few more departures on weekday mornings, but overall it was a great experience.', DATE '2026-10-03'),
  ('Joseph Kiprop', 'Litein - Kericho', 5, 'Very reliable for a short hop. The conductor checked receipts politely and we set off exactly at the posted time.', DATE '2026-10-11'),
  ('Grace Chebet', 'Nairobi - Nakuru', 5, 'I send parcels with this company every week and they have never let me down. The tracking updates are a real help.', DATE '2026-10-19'),
  ('Brian Mwangi', 'Kaplong - Litein', 4, 'Clear pricing with no surprises at the stage. Arrive a little early as they suggest and boarding is very quick.', DATE '2026-10-27')
) AS v(passenger_name, route_label, rating, comment, travelled_on)
WHERE NOT EXISTS (SELECT 1 FROM passenger_reviews);
