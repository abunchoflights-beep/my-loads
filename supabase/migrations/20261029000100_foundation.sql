-- =============================================================================
-- Mis Carguitas · 0100 · Foundation
-- Default-deny privileges, private helper schema, enums, shared triggers.
-- See docs/SECURITY.md for the rules every later migration must follow.
-- =============================================================================

-- Functions created from now on are NOT executable by anon/authenticated unless
-- a migration grants it explicitly. Tables are revoked table-by-table below.
alter default privileges in schema public revoke execute on functions from public, anon, authenticated;

-- Helpers that RLS policies call. Not exposed through PostgREST (not in
-- api.schemas), so clients can never call them directly.
create schema if not exists private;
alter default privileges in schema private revoke execute on functions from public;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated, service_role, supabase_auth_admin;

-- -----------------------------------------------------------------------------
-- Enums
-- -----------------------------------------------------------------------------
create type public.app_role as enum ('farmer', 'buyer', 'carrier', 'admin');

create type public.verification_status as enum
  ('unverified', 'pending', 'verified', 'rejected', 'suspended');

-- CC cédula, CE cédula de extranjería, NIT empresa, PPT permiso por protección temporal.
create type public.document_type as enum ('CC', 'CE', 'NIT', 'PPT', 'PASSPORT');

create type public.quality_grade as enum ('extra', 'primera', 'segunda', 'industrial');

create type public.listing_status as enum
  ('draft', 'published', 'sold_out', 'expired', 'withdrawn');

create type public.transport_mode as enum
  ('platform',        -- posted on the load board, a carrier is booked through us
   'buyer_arranged',  -- buyer picks up with their own truck
   'farmer_delivers');-- farmer brings it to the buyer

create type public.order_status as enum
  ('pending', 'accepted', 'rejected', 'cancelled', 'expired',
   'in_transit', 'delivered', 'completed', 'disputed');

create type public.vehicle_class as enum
  ('camioneta', 'turbo', 'sencillo', 'doble_troque', 'minimula', 'tractomula');

create type public.body_type as enum ('estacas', 'furgon', 'refrigerado', 'plataforma');

create type public.load_status as enum
  ('posted', 'booked', 'picked_up', 'delivered', 'cancelled');

create type public.bid_status as enum ('active', 'accepted', 'rejected', 'withdrawn');

create type public.shipment_event_type as enum
  ('posted', 'booked', 'unbooked', 'picked_up', 'location', 'incident',
   'delivered', 'cancelled', 'code_failed');

-- -----------------------------------------------------------------------------
-- Shared triggers
-- -----------------------------------------------------------------------------
create or replace function private.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- 6-digit code from a CSPRNG (gen_random_uuid uses the strong RNG; the first
-- 8 hex chars of a v4 UUID are fully random). Used for pickup/delivery codes.
create or replace function private.random_code6()
returns text
language sql
volatile
set search_path = ''
as $$
  select lpad(
    ((('x' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 8))::bit(32)::bigint) % 1000000)::text,
    6, '0');
$$;
