-- LOCAL-ONLY auth.uid() shim for RLS verification on a plain Postgres.
-- Supabase provides the real auth.uid() in production — DO NOT apply this there.
-- Reads the current persona from a session GUC set by the test harness.
create schema if not exists auth;
create or replace function auth.uid() returns uuid
  language sql stable as $$
  select nullif(current_setting('app.auth_uid', true), '')::uuid
$$;
grant usage on schema auth to public;
