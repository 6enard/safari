import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

const FIREBASE_API_KEY = 'AIzaSyB1QbZLaB7WbYlFwYaaA9Q7sbwisbuCBhA';
const AVATAR_BUCKET = 'avatars';
const MAX_AVATAR_BYTES = 400 * 1024;

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

function decodeJpegDataUrl(dataUrl: unknown): Uint8Array | null {
  if (typeof dataUrl !== 'string') return null;
  const match = /^data:image\/jpeg;base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl);
  if (!match) return null;
  const binary = atob(match[1]);
  if (binary.length === 0 || binary.length > MAX_AVATAR_BYTES) return null;
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const userId = await verifyUserId(req);
    if (!userId) return jsonResponse({ error: 'Please sign in to continue.' }, 401);

    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const body = await req.json();
    const { action } = body;

    if (action === 'getProfile') {
      const { data, error } = await supabase
        .from('profiles')
        .select('avatar_url')
        .eq('user_id', userId)
        .maybeSingle();
      if (error) return jsonResponse({ error: error.message }, 500);
      return jsonResponse({ avatarUrl: data?.avatar_url ?? null });
    }

    if (action === 'updateAvatar') {
      const bytes = decodeJpegDataUrl(body.imageDataUrl);
      if (!bytes) return jsonResponse({ error: 'Please choose a JPG image under 400 KB.' }, 400);

      const path = `${userId}.jpg`;
      const { error: uploadError } = await supabase.storage
        .from(AVATAR_BUCKET)
        .upload(path, bytes, { contentType: 'image/jpeg', upsert: true });
      if (uploadError) return jsonResponse({ error: 'Could not upload your photo. Please try again.' }, 500);

      const { data: publicData } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(path);
      const avatarUrl = `${publicData.publicUrl}?v=${Date.now()}`;

      const { error: saveError } = await supabase
        .from('profiles')
        .upsert({ user_id: userId, avatar_url: avatarUrl, updated_at: new Date().toISOString() });
      if (saveError) return jsonResponse({ error: saveError.message }, 500);

      return jsonResponse({ avatarUrl });
    }

    return jsonResponse({ error: 'Unknown request.' }, 400);
  } catch {
    return jsonResponse({ error: 'Something went wrong. Please try again.' }, 500);
  }
});
