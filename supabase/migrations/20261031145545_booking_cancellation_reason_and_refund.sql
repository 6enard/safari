/*
# Booking cancellation reason and refund status

1. Modified table: bookings
- `cancellation_reason` (text, optional): why an admin cancelled the booking.
- `refund_status` (text, optional): one of 'pending', 'refunded', 'not_refunded'. Only set on cancelled bookings.
- `cancelled_at` (timestamptz, optional): when the booking was cancelled.

2. Seat locking
- The old unique rule on (departure, seat) also blocked cancelled seats from being rebooked.
- It is replaced by a partial unique index that only applies to confirmed bookings, so a cancelled seat becomes available again.

3. Security
- No new tables or policies. Existing access is unchanged; the edge functions continue to use the server role.

Notes
- Existing rows keep their current status. New columns are empty for them.
*/

ALTER TABLE bookings ADD COLUMN IF NOT EXISTS cancellation_reason text;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS refund_status text;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS cancelled_at timestamptz;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conrelid = 'public.bookings'::regclass AND conname = 'bookings_refund_status_check'
  ) THEN
    ALTER TABLE bookings ADD CONSTRAINT bookings_refund_status_check
      CHECK (refund_status IS NULL OR refund_status IN ('pending', 'refunded', 'not_refunded'));
  END IF;
END $$;

ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_departure_id_seat_number_key;

CREATE UNIQUE INDEX IF NOT EXISTS bookings_confirmed_seat_unique
  ON bookings (departure_id, seat_number)
  WHERE status = 'confirmed';
