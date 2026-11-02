/*
# Create profiles table and public avatars bucket

1. New Tables
- `profiles`
  - `user_id` (text, primary key): the signed-in user's Firebase user ID.
  - `avatar_url` (text, nullable): public web address of the user's profile photo.
  - `updated_at` (timestamptz): when the profile was last changed.

2. Storage
- New public storage bucket `avatars` where profile photos are stored.

3. Security
- Row level security is enabled on `profiles` with no policies, so the browser can never read or write it directly.
- Only the server-side service role is granted access; the profile edge function is the single gatekeeper that verifies the signed-in user before changing anything.
- Avatar files are public to view (needed to show them on the page) and can only be written by the server.

4. Important notes
- This migration is safe to re-run: all statements are idempotent.
- No existing data is changed or removed.
*/

CREATE TABLE IF NOT EXISTS profiles (
  user_id text PRIMARY KEY,
  avatar_url text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON profiles FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON profiles TO service_role;

INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO UPDATE SET public = true;
