import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

const FIREBASE_API_KEY = 'AIzaSyB1QbZLaB7WbYlFwYaaA9Q7sbwisbuCBhA';
const PAYMENT_METHODS = ['M-Pesa', 'Card', 'Cash'] as const;
const SEAT_COUNT = 10;

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

async function verifyUserId(req: Request): Promise<string | null> {
  const header = req.headers.get('Authorization') ?? '';
  const idToken = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!idToken) return null;

  const res = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${FIREBASE_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken }),
  });
  if (!res.ok) return null;
  const body = await res.json();
  return body.users?.[0]?.localId ?? null;
}

function isNonEmptyString(v: unknown, min: number, max: number): v is string {
  return typeof v === 'string' && v.trim().length >= min && v.trim().length <= max;
}

function validSeats(seats: unknown): seats is number[] {
  return (
    Array.isArray(seats) &&
    seats.length > 0 &&
    seats.length <= SEAT_COUNT &&
    new Set(seats).size === seats.length &&
    seats.every((s) => Number.isInteger(s) && s >= 1 && s <= SEAT_COUNT)
  );
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const body = await req.json();
    const { action } = body;

    if (action === 'bookedSeats') {
      const { departureId } = body;
      if (typeof departureId !== 'string') return jsonResponse({ error: 'Missing departure.' }, 400);
      const { data, error } = await supabase
        .from('bookings')
        .select('seat_number')
        .eq('departure_id', departureId)
        .eq('status', 'confirmed');
      if (error) return jsonResponse({ error: error.message }, 500);
      return jsonResponse({ seats: (data ?? []).map((b) => b.seat_number) });
    }

    const userId = await verifyUserId(req);
    if (!userId) return jsonResponse({ error: 'Please sign in to continue.' }, 401);

    if (action === 'create') {
      const { departureId, seats, passengerName, passengerPhone, paymentMethod, paymentRef } = body;
      if (typeof departureId !== 'string') return jsonResponse({ error: 'Missing departure.' }, 400);
      if (!validSeats(seats)) return jsonResponse({ error: 'Please pick between 1 and 10 valid seats.' }, 400);
      if (!isNonEmptyString(passengerName, 2, 100)) return jsonResponse({ error: 'Enter the passenger name.' }, 400);
      if (!isNonEmptyString(passengerPhone, 10, 20)) return jsonResponse({ error: 'Enter a valid phone number.' }, 400);
      if (!PAYMENT_METHODS.includes(paymentMethod)) return jsonResponse({ error: 'Choose a payment method.' }, 400);
      if (!isNonEmptyString(paymentRef, 4, 40)) return jsonResponse({ error: 'Missing payment reference.' }, 400);

      const { data: departure, error: depError } = await supabase
        .from('departures')
        .select('id')
        .eq('id', departureId)
        .maybeSingle();
      if (depError) return jsonResponse({ error: depError.message }, 500);
      if (!departure) return jsonResponse({ error: 'This matatu trip is no longer available.' }, 404);

      const now = new Date().toISOString();
      const rows = seats.map((seat: number) => ({
        user_id: userId,
        departure_id: departureId,
        seat_number: seat,
        passenger_name: passengerName.trim(),
        passenger_phone: passengerPhone.trim(),
        payment_method: paymentMethod,
        payment_ref: paymentRef,
        status: 'confirmed',
        created_at: now,
      }));
      const { data, error } = await supabase.from('bookings').insert(rows).select('id');
      if (error) {
        if (error.code === '23505') {
          return jsonResponse({ error: 'One of the seats was just booked by someone else. Please pick different seats.' }, 409);
        }
        return jsonResponse({ error: error.message }, 500);
      }
      return jsonResponse({ ids: (data ?? []).map((r) => r.id) });
    }

    if (action === 'dismissCancelled') {
      const { paymentRef } = body;
      if (!isNonEmptyString(paymentRef, 4, 40)) return jsonResponse({ error: 'Missing receipt number.' }, 400);
      const { error } = await supabase
        .from('bookings')
        .update({ dismissed_by_user: true })
        .eq('user_id', userId)
        .eq('payment_ref', paymentRef)
        .eq('status', 'cancelled');
      if (error) return jsonResponse({ error: error.message }, 500);
      return jsonResponse({ ok: true });
    }

    if (action === 'mine' || action === 'receipt') {
      let query = supabase
        .from('bookings')
        .select('*, departures(*, routes(*), vehicles(plate_number, vehicle_name, drivers(full_name, phone, photo_url)))')
        .eq('user_id', userId)
        .in('status', ['confirmed', 'cancelled'])
        .eq('dismissed_by_user', false);
      if (action === 'receipt') {
        const { paymentRef } = body;
        if (!isNonEmptyString(paymentRef, 4, 40)) return jsonResponse({ error: 'Missing receipt number.' }, 400);
        query = query.eq('payment_ref', paymentRef);
      }
      const { data, error } = await query.order('seat_number');
      if (error) return jsonResponse({ error: error.message }, 500);
      return jsonResponse({ bookings: data ?? [] });
    }

    return jsonResponse({ error: 'Unknown action.' }, 400);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Something went wrong.';
    return jsonResponse({ error: message }, 500);
  }
});

