-- Promote an existing account to admin. Run as the database owner
-- (Supabase SQL editor or `psql` against the local stack), never from the app.
--   psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" -v email=ops@example.com -f scripts/make-admin.sql
-- The admin must then enroll TOTP at /account/security: admin powers need aal2.
update public.profiles p
   set role = 'admin', verification_status = 'verified'
  from auth.users u
 where u.id = p.id
   and u.email = :'email'
returning p.id, p.display_name, p.role;
