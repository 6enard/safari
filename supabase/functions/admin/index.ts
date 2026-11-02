import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

const FIREBASE_API_KEY = 'AIzaSyB1QbZLaB7WbYlFwYaaA9Q7sbwisbuCBhA';
const ADMIN_EMAIL = '6enard@gmail.com';
const REFUND_STATUSES = ['pending', 'refunded', 'not_refunded'];
const PHOTO_TYPES = new Map([['image/jpeg', 'jpg'], ['image/png', 'png'], ['image/webp', 'webp']]);
const MAX_PHOTO_BASE64 = 2_800_000;
const PARCEL_STATUSES = ['pending', 'in_transit', 'delivered', 'cancelled'];

const TABLE_FIELDS: Record<string, string[]> = {
  routes: ['origin', 'destination', 'distance_km', 'duration_hours', 'base_fare', 'popular'],
  departures: ['route_id', 'departure_date', 'departure_time', 'vehicle_id', 'fare', 'amenities'],
  vehicles: ['plate_number', 'vehicle_name', 'driver_id'],
  drivers: ['full_name', 'phone', 'email', 'license_number'],
  pickup_points: ['route_id', 'name', 'address', 'latitude', 'longitude', 'sort_order'],
};

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

async function verifyAdmin(req: Request): Promise<{ ok: true } | { ok: false; status: number; error: string }> {
  const header = req.headers.get('Authorization') ?? '';
  const idToken = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!idToken) return { ok: false, status: 401, error: 'Please sign in.' };

  const res = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${FIREBASE_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken }),
  });
  if (!res.ok) return { ok: false, status: 401, error: 'Your session has expired. Please sign in again.' };

  const body = await res.json();
  const user = body.users?.[0];
  const email = String(user?.email ?? '').toLowerCase();
  if (email !== ADMIN_EMAIL) return { ok: false, status: 403, error: 'You do not have access to this page.' };
  if (!user?.emailVerified) {
    return { ok: false, status: 403, error: 'Verify your email address to unlock the admin page.' };
  }
  return { ok: true };
}

function pickFields(table: string, input: Record<string, unknown>): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  for (const key of TABLE_FIELDS[table]) {
    if (input[key] !== undefined) row[key] = input[key];
  }
  return row;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const authResult = await verifyAdmin(req);
    if (!authResult.ok) return jsonResponse({ error: authResult.error }, authResult.status);

    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const body = await req.json();
    const { action, table, id, row } = body;

    if (action === 'load') {
      const [routes, departures, vehicles, drivers, pickupPoints, bookings, parcels] = await Promise.all([
        supabase.from('routes').select('*').order('origin'),
        supabase.from('departures').select('*').order('departure_date').order('departure_time'),
        supabase.from('vehicles').select('*').order('plate_number'),
        supabase.from('drivers').select('*').order('full_name'),
        supabase.from('pickup_points').select('*').order('sort_order').order('name'),
        supabase
          .from('bookings')
          .select('*, departures(*, routes(*), vehicles(plate_number, vehicle_name))')
          .order('created_at', { ascending: false }),
        supabase
          .from('parcels')
          .select('*, routes(id, origin, destination), departures(id, departure_date, departure_time, vehicles(plate_number, vehicle_name))')
          .order('created_at', { ascending: false }),
      ]);
      const failed = [routes, departures, vehicles, drivers, pickupPoints, bookings, parcels].find((r) => r.error);
      if (failed?.error) return jsonResponse({ error: failed.error.message }, 500);
      return jsonResponse({
        routes: routes.data,
        departures: departures.data,
        vehicles: vehicles.data,
        drivers: drivers.data,
        pickup_points: pickupPoints.data,
        bookings: bookings.data,
        parcels: parcels.data,
      });
    }

    if (action === 'cancelBooking') {
      const bookingId = body.bookingId;
      if (typeof bookingId !== 'string') return jsonResponse({ error: 'Missing booking id.' }, 400);
      const reason = typeof body.reason === 'string' ? body.reason.trim() : '';
      if (reason.length < 3 || reason.length > 500) {
        return jsonResponse({ error: 'Enter a reason for the cancellation (3 to 500 characters).' }, 400);
      }
      if (!REFUND_STATUSES.includes(body.refundStatus)) {
        return jsonResponse({ error: 'Choose a refund status.' }, 400);
      }
      const { error } = await supabase
        .from('bookings')
        .update({
          status: 'cancelled',
          cancellation_reason: reason,
          refund_status: body.refundStatus,
          cancelled_at: new Date().toISOString(),
        })
        .eq('id', bookingId)
        .eq('status', 'confirmed');
      if (error) return jsonResponse({ error: error.message }, 400);
      return jsonResponse({ ok: true });
    }

    if (action === 'updateParcel') {
      const { parcelId, status: pStatus, adminNotes, fee } = body;
      if (typeof parcelId !== 'string') return jsonResponse({ error: 'Missing parcel.' }, 400);
      const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (pStatus !== undefined) {
        if (!PARCEL_STATUSES.includes(pStatus)) return jsonResponse({ error: 'Choose a valid parcel status.' }, 400);
        update.status = pStatus;
      }
      if (adminNotes !== undefined) {
        const notes = typeof adminNotes === 'string' ? adminNotes.trim() : '';
        if (notes.length > 1000) return jsonResponse({ error: 'Notes must be 1000 characters or fewer.' }, 400);
        update.admin_notes = notes || null;
      }
      if (fee !== undefined) {
        const feeNum = Number(fee);
        if (!Number.isFinite(feeNum) || feeNum < 0) return jsonResponse({ error: 'Enter a valid fee.' }, 400);
        update.fee = Math.round(feeNum);
      }
      const { error } = await supabase.from('parcels').update(update).eq('id', parcelId);
      if (error) return jsonResponse({ error: error.message }, 400);
      return jsonResponse({ ok: true });
    }

    if (action === 'deleteParcel') {
      const { parcelId } = body;
      if (typeof parcelId !== 'string') return jsonResponse({ error: 'Missing parcel.' }, 400);
      const { error } = await supabase.from('parcels').delete().eq('id', parcelId);
      if (error) return jsonResponse({ error: error.message }, 400);
      return jsonResponse({ ok: true });
    }

    if (action === 'uploadDriverPhoto') {
      const { driverId, contentType, data } = body;
      if (typeof driverId !== 'string') return jsonResponse({ error: 'Missing driver.' }, 400);
      const extension = PHOTO_TYPES.get(contentType);
      if (!extension) return jsonResponse({ error: 'Use a JPG, PNG or WebP image.' }, 400);
      if (typeof data !== 'string' || data.length === 0 || data.length > MAX_PHOTO_BASE64) {
        return jsonResponse({ error: 'The photo must be smaller than 2 MB.' }, 400);
      }
      const bytes = Uint8Array.from(atob(data), (c) => c.charCodeAt(0));
      const path = `drivers/${driverId}-${Date.now()}.${extension}`;
      const { error: uploadError } = await supabase.storage
        .from('driver-photos')
        .upload(path, bytes, { contentType, upsert: false });
      if (uploadError) return jsonResponse({ error: uploadError.message }, 500);
      const photoUrl = supabase.storage.from('driver-photos').getPublicUrl(path).data.publicUrl;
      const { error } = await supabase.from('drivers').update({ photo_url: photoUrl }).eq('id', driverId);
      if (error) return jsonResponse({ error: error.message }, 400);
      return jsonResponse({ photo_url: photoUrl });
    }

    if (typeof table !== 'string' || !(table in TABLE_FIELDS)) {
      return jsonResponse({ error: 'Unknown table.' }, 400);
    }

    if (action === 'save') {
      if (!row || typeof row !== 'object') return jsonResponse({ error: 'Missing details.' }, 400);
      const values = pickFields(table, row as Record<string, unknown>);
      if (id) values.id = id;
      const { data, error } = await supabase.from(table).upsert(values).select().single();
      if (error) return jsonResponse({ error: error.message }, 400);
      return jsonResponse({ row: data });
    }

    if (action === 'delete') {
      if (typeof id !== 'string') return jsonResponse({ error: 'Missing id.' }, 400);

      if (table === 'departures' || table === 'routes') {
        let departureIds = [id];
        if (table === 'routes') {
          const { data: deps, error: depError } = await supabase.from('departures').select('id').eq('route_id', id);
          if (depError) return jsonResponse({ error: depError.message }, 500);
          departureIds = (deps ?? []).map((d) => d.id);
        }
        if (departureIds.length > 0) {
          const { count, error: countError } = await supabase
            .from('bookings')
            .select('id', { count: 'exact', head: true })
            .in('departure_id', departureIds);
          if (countError) return jsonResponse({ error: countError.message }, 500);
          if ((count ?? 0) > 0) {
            return jsonResponse(
              { error: 'Passengers have already booked this. Remove the bookings first, or leave it in place.' },
              409,
            );
          }
        }
      }

      const { error } = await supabase.from(table).delete().eq('id', id);
      if (error) return jsonResponse({ error: error.message }, 400);
      return jsonResponse({ ok: true });
    }

    return jsonResponse({ error: 'Unknown action.' }, 400);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Something went wrong.';
    return jsonResponse({ error: message }, 500);
  }
});
