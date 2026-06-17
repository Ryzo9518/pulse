-- ════════════════════════════════════════════════════════════════════════════
-- Production auth.uid() — applied FIRST in production (before 001/002/003/004).
-- This is the REAL Supabase definition: auth.uid() reads the verified JWT claim
-- `sub` that PostgREST/GoTrue inject per request (request.jwt.claims). With no
-- request context (a direct psql connection) it returns NULL, so RLS default-
-- denies — safe. When the Supabase API layer (PostgREST + GoTrue + M365 Entra)
-- is wired in B1, this resolves the signed-in user automatically.
--
-- NOTE: the local test harness (database/test/000_auth_shim.sql) defines a
-- DIFFERENT auth.uid() that reads a session GUC so tests can impersonate roles.
-- Do NOT apply that shim in production; apply THIS file instead.
-- ════════════════════════════════════════════════════════════════════════════
create schema if not exists auth;

create or replace function auth.uid() returns uuid
  language sql stable
as $$
  select nullif(current_setting('request.jwt.claims', true)::jsonb ->> 'sub', '')::uuid
$$;

grant usage on schema auth to public;
