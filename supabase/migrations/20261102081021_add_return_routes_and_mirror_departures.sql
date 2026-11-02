/*
# Add return routes and mirror departures

1. Purpose
   Every existing one-way route now gets a return counterpart so users can
   book travel in both directions (e.g. Nairobi -> Mombasa AND Mombasa -> Nairobi).
2. New Routes (return versions of existing routes)
   - Kisumu -> Kericho  (return of Kericho -> Kisumu)
   - Mombasa -> Nairobi (return of Nairobi -> Mombasa)
   - Nairobi -> Nakuru  (return of Nakuru -> Nairobi)
   - Bomet -> Nakuru    (return of Nakuru -> Bomet)
   Same distance, duration and base fare as the original direction.
3. New Departures
   For every departure currently on an original route, create an equivalent
   departure on the new return route with the same date, time, vehicle,
   fare, seats and amenities.
4. Security
   No new tables. New routes inherit existing public RLS policies on routes.
   New departures inherit existing public RLS policies on departures.
*/

-- 1. Insert return routes (idempotent: skip if a route with the same
--    origin/destination already exists)
INSERT INTO routes (origin, destination, distance_km, duration_hours, base_fare, popular)
SELECT
  r.destination,
  r.origin,
  r.distance_km,
  r.duration_hours,
  r.base_fare,
  r.popular
FROM routes r
WHERE NOT EXISTS (
  SELECT 1 FROM routes r2
  WHERE r2.origin = r.destination AND r2.destination = r.origin
)
  AND NOT EXISTS (
    SELECT 1 FROM routes r3 WHERE r3.origin = r3.destination
  );

-- 2. Mirror departures onto the new return routes.
--    We join each original departure to the return route (where
--    return_route.origin = original_route.destination), and insert a copy
--    only if a departure with that exact (route_id, departure_date, departure_time)
--    does not already exist on the return route.
INSERT INTO departures (
  route_id, departure_date, departure_time, vehicle_name, plate_number,
  total_seats, fare, amenities, vehicle_id
)
SELECT
  ret.id,
  d.departure_date,
  d.departure_time,
  d.vehicle_name,
  d.plate_number,
  d.total_seats,
  d.fare,
  d.amenities,
  d.vehicle_id
FROM departures d
JOIN routes orig ON orig.id = d.route_id
JOIN routes ret  ON ret.origin = orig.destination AND ret.destination = orig.origin
WHERE NOT EXISTS (
  SELECT 1
  FROM departures existing
  WHERE existing.route_id = ret.id
    AND existing.departure_date = d.departure_date
    AND existing.departure_time = d.departure_time
);
