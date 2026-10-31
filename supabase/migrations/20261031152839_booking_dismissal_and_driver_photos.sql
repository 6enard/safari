/*
# Hide cancelled bookings from users and add driver photos

1. Modified Tables
- `bookings`: new column `dismissed_by_user` (boolean, default false). When a passenger removes a cancelled booking from their list, only this flag is set. The row is kept so admins still have proof of cancellation and refund status.
- `drivers`: new column `photo_url` (text, optional) holding the public link to the driver's photo.

2. Storage
- New public bucket `driver-photos` for driver photos. Only the server (service role) uploads to it; anyone can view the images through their link.

3. Security
- No policies or grants change. Passengers and admins reach these tables only through the server functions.
*/

ALTER TABLE bookings ADD COLUMN IF NOT EXISTS dismissed_by_user boolean NOT NULL DEFAULT false;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS photo_url text;

INSERT INTO storage.buckets (id, name, public)
VALUES ('driver-photos', 'driver-photos', true)
ON CONFLICT (id) DO NOTHING;
