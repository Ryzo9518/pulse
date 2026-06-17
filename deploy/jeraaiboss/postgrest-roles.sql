-- PostgREST / Supabase API roles (B1). Apply to the live `pulse` DB.
-- anon        = unauthenticated requests. Intentionally NO table grants -> RLS
--               default-deny: an anonymous caller sees nothing.
-- authenticated = already created + granted in 002_rls.sql (valid-JWT callers).
-- authenticator = the login role PostgREST connects as; switches to anon /
--                 authenticated per request based on the JWT's `role` claim.
do $$ begin
  if not exists (select from pg_roles where rolname = 'anon') then
    create role anon nologin;
  end if;
  if not exists (select from pg_roles where rolname = 'authenticator') then
    create role authenticator login noinherit;
  end if;
end $$;

grant anon to authenticator;
grant authenticated to authenticator;
grant usage on schema public to anon;
-- (no table privileges to anon — unauthenticated = no rows)
