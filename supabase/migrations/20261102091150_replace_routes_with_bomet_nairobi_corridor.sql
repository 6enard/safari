INSERT INTO routes (origin, destination, distance_km, duration_hours, base_fare, popular)
SELECT v.origin, v.destination, v.distance_km, v.duration_hours, v.base_fare, false
FROM (VALUES
  ('Bomet', 'Kaplong', 30, 0.75, 200),
  ('Kaplong', 'Bomet', 30, 0.75, 200),
  ('Kaplong', 'Litein', 25, 0.5, 150),
  ('Litein', 'Kaplong', 25, 0.5, 150),
  ('Litein', 'Kericho', 25, 0.5, 150),
  ('Kericho', 'Litein', 25, 0.5, 150),
  ('Kericho', 'Nakuru', 115, 2.0, 500),
  ('Nakuru', 'Kericho', 115, 2.0, 500)
) AS v(origin, destination, distance_km, duration_hours, base_fare)
WHERE NOT EXISTS (
  SELECT 1 FROM routes r WHERE r.origin = v.origin AND r.destination = v.destination
);

DELETE FROM routes r
WHERE NOT EXISTS (
  SELECT 1 FROM (VALUES
    ('Bomet', 'Kaplong'), ('Kaplong', 'Bomet'),
    ('Kaplong', 'Litein'), ('Litein', 'Kaplong'),
    ('Litein', 'Kericho'), ('Kericho', 'Litein'),
    ('Kericho', 'Nakuru'), ('Nakuru', 'Kericho'),
    ('Nakuru', 'Nairobi'), ('Nairobi', 'Nakuru')
  ) AS keep(origin, destination)
  WHERE keep.origin = r.origin AND keep.destination = r.destination
);

INSERT INTO departures (route_id, departure_date, departure_time, vehicle_name, plate_number, total_seats, fare, amenities, vehicle_id)
SELECT ret.id, d.departure_date, d.departure_time, d.vehicle_name, d.plate_number, d.total_seats, ret.base_fare, d.amenities, d.vehicle_id
FROM departures d
JOIN routes src ON src.id = d.route_id AND src.origin = 'Nakuru' AND src.destination = 'Nairobi'
JOIN routes ret ON (ret.origin, ret.destination) IN (
  ('Bomet', 'Kaplong'), ('Kaplong', 'Bomet'),
  ('Kaplong', 'Litein'), ('Litein', 'Kaplong'),
  ('Litein', 'Kericho'), ('Kericho', 'Litein'),
  ('Kericho', 'Nakuru'), ('Nakuru', 'Kericho')
)
WHERE NOT EXISTS (
  SELECT 1 FROM departures existing
  WHERE existing.route_id = ret.id
    AND existing.departure_date = d.departure_date
    AND existing.departure_time = d.departure_time
);
