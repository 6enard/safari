/*
# Tighten grants on drivers and vehicles

1. Security changes
- `drivers`: revoke ALL privileges from anon and authenticated. Only the service_role (edge functions) should access this table. RLS is already enabled with no policies, so anon/authenticated cannot read any rows even with grants — but removing the grants makes the lock explicit and silences the advisor warning about over-permissive grants.
- `vehicles`: revoke INSERT, UPDATE, DELETE from anon and authenticated so the public can only read. The service_role retains full access for admin writes.
2. No data changes
- No rows are deleted, columns are unchanged, no tables are renamed.
*/

REVOKE ALL ON drivers FROM anon, authenticated;
GRANT ALL ON drivers TO service_role;

REVOKE INSERT, UPDATE, DELETE ON vehicles FROM anon, authenticated;
GRANT SELECT ON vehicles TO anon, authenticated;
GRANT ALL ON vehicles TO service_role;
