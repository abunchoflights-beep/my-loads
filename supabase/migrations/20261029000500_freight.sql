-- =============================================================================
-- Mis Carguitas · 0500 · Freight (the DAT-style load board)
-- loads, load_bids, shipment_events, private.load_secrets + RPCs.
--
-- Loads are created only by respond_to_order() when an order with
-- transport_mode = 'platform' is accepted. Shipper = the buyer (pays freight).
-- Pickup and delivery are proven with 6-digit codes: the farmer reads the
-- pickup code to the carrier, the buyer reads the delivery code. Codes work
-- over a phone call, which matters on rural roads with no data signal.
-- =============================================================================

create table public.loads (
  id                            uuid primary key default gen_random_uuid(),
  order_id                      uuid not null unique references public.orders (id),
  shipper_id                    uuid not null references public.profiles (id),
  farmer_id                     uuid not null references public.profiles (id),
  product_id                    smallint not null references public.products (id),
  weight_kg                     numeric(12, 2) not null check (weight_kg > 0),
  required_body                 public.body_type,
  origin_farm_id                uuid not null references public.farms (id),
  origin_municipality_code      text not null check (origin_municipality_code ~ '^[0-9]{5}$'),
  destination_location_id       uuid not null references public.delivery_locations (id),
  destination_municipality_code text not null check (destination_municipality_code ~ '^[0-9]{5}$'),
  pickup_on                     date not null,
  deliver_by                    date not null,
  target_rate_cop               bigint check (target_rate_cop between 1 and 100000000),
  status                        public.load_status not null default 'posted',
  carrier_id                    uuid references public.profiles (id),
  vehicle_id                    uuid references public.vehicles (id),
  agreed_rate_cop               bigint check (agreed_rate_cop > 0),
  booked_at                     timestamptz,
  picked_up_at                  timestamptz,
  delivered_at                  timestamptz,
  cancelled_at                  timestamptz,
  created_at                    timestamptz not null default now(),
  updated_at                    timestamptz not null default now(),
  constraint loads_window check (deliver_by >= pickup_on),
  constraint loads_booking_consistent check (
    (status in ('posted', 'cancelled') and carrier_id is null and vehicle_id is null)
    or (status in ('booked', 'picked_up', 'delivered') and carrier_id is not null
        and vehicle_id is not null and agreed_rate_cop is not null)
    or (status = 'cancelled'))
);

create index loads_board_idx on public.loads (status, pickup_on, origin_municipality_code, destination_municipality_code)
  where status = 'posted';
create index loads_carrier_idx on public.loads (carrier_id, status);
create trigger loads_touch before update on public.loads
  for each row execute function private.touch_updated_at();

create table public.load_bids (
  id          uuid primary key default gen_random_uuid(),
  load_id     uuid not null references public.loads (id) on delete cascade,
  carrier_id  uuid not null references public.profiles (id),
  vehicle_id  uuid not null references public.vehicles (id),
  amount_cop  bigint not null check (amount_cop between 1 and 100000000),
  message     text check (char_length(message) <= 300),
  status      public.bid_status not null default 'active',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create unique index load_bids_one_active on public.load_bids (load_id, carrier_id) where status = 'active';
create index load_bids_load_idx on public.load_bids (load_id, status);
create trigger load_bids_touch before update on public.load_bids
  for each row execute function private.touch_updated_at();

create table public.shipment_events (
  id          bigint generated always as identity primary key,
  load_id     uuid not null references public.loads (id) on delete cascade,
  actor_id    uuid references public.profiles (id),
  event_type  public.shipment_event_type not null,
  lat         numeric(9, 6) check (lat between -4.3 and 13.5),
  lng         numeric(9, 6) check (lng between -82 and -66.8),
  note        text check (char_length(note) <= 500),
  created_at  timestamptz not null default now()
);
create index shipment_events_load_idx on public.shipment_events (load_id, created_at);

-- Never exposed to clients. Read only through get_my_load_code().
create table private.load_secrets (
  load_id         uuid primary key references public.loads (id) on delete cascade,
  pickup_code     text not null check (pickup_code ~ '^[0-9]{6}$'),
  delivery_code   text not null check (delivery_code ~ '^[0-9]{6}$'),
  failed_attempts smallint not null default 0
);
alter table private.load_secrets enable row level security;
revoke all on private.load_secrets from public, anon, authenticated;

-- -----------------------------------------------------------------------------
-- Privileges + RLS: reads only. Every write is an RPC.
-- -----------------------------------------------------------------------------
alter table public.loads enable row level security;
alter table public.load_bids enable row level security;
alter table public.shipment_events enable row level security;

revoke all on public.loads, public.load_bids, public.shipment_events from anon, authenticated;
grant select on public.loads, public.load_bids, public.shipment_events to authenticated;

create or replace function private.is_load_party(p_load_id uuid)
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.loads l
     where l.id = p_load_id
       and (select auth.uid()) in (l.shipper_id, l.farmer_id, l.carrier_id));
$$;
grant execute on function private.is_load_party(uuid) to authenticated;

-- Verified carriers browse the board. Origin/destination are municipality
-- codes only; the exact stops come from get_load_stops() after booking.
create policy loads_read on public.loads for select to authenticated
  using (
       (select auth.uid()) in (shipper_id, farmer_id, carrier_id)
    or (status = 'posted' and (select private.my_role()) = 'carrier' and (select private.is_verified()))
    or (select private.is_admin()));

create policy load_bids_read on public.load_bids for select to authenticated
  using (
       carrier_id = (select auth.uid())
    or exists (select 1 from public.loads l where l.id = load_id and l.shipper_id = (select auth.uid()))
    or (select private.is_admin()));

create policy shipment_events_read on public.shipment_events for select to authenticated
  using ((select private.is_load_party(load_id)) or (select private.is_admin()));

-- -----------------------------------------------------------------------------
-- RPCs
-- -----------------------------------------------------------------------------
create or replace function public.set_load_target_rate(p_load_id uuid, p_rate_cop bigint)
returns void
language plpgsql security definer
set search_path = ''
as $$
begin
  update public.loads set target_rate_cop = p_rate_cop
   where id = p_load_id and shipper_id = auth.uid() and status = 'posted';
  if not found then raise exception 'LOAD_NOT_EDITABLE' using errcode = '22023'; end if;
end;
$$;

-- Carrier offers to haul. One active bid per carrier per load; bidding again
-- replaces the amount.
create or replace function public.place_bid(
  p_load_id uuid, p_vehicle_id uuid, p_amount_cop bigint, p_message text default null)
returns uuid
language plpgsql security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_load public.loads;
  v_vehicle public.vehicles;
  v_bid_id uuid;
begin
  if private.my_role() is distinct from 'carrier' then raise exception 'ROLE_CARRIER_REQUIRED' using errcode = '42501'; end if;
  if not private.is_verified() then raise exception 'VERIFICATION_REQUIRED' using errcode = '42501'; end if;

  select * into v_load from public.loads where id = p_load_id;
  if not found or v_load.status <> 'posted' or v_load.pickup_on < current_date then
    raise exception 'LOAD_NOT_OPEN' using errcode = '22023';
  end if;

  select * into v_vehicle from public.vehicles where id = p_vehicle_id and carrier_id = v_uid;
  if not found or not v_vehicle.active or v_vehicle.verification_status <> 'verified' then
    raise exception 'VEHICLE_NOT_ELIGIBLE' using errcode = '22023';
  end if;
  if v_vehicle.soat_expires_on < v_load.deliver_by then
    raise exception 'VEHICLE_SOAT_EXPIRES' using errcode = '22023';
  end if;
  if v_vehicle.capacity_kg < v_load.weight_kg then
    raise exception 'VEHICLE_CAPACITY_LOW' using errcode = '22023';
  end if;
  if v_load.required_body is not null and v_vehicle.body_type <> v_load.required_body then
    raise exception 'VEHICLE_BODY_MISMATCH' using errcode = '22023';
  end if;

  update public.load_bids
     set amount_cop = p_amount_cop, vehicle_id = p_vehicle_id, message = nullif(btrim(p_message), '')
   where load_id = p_load_id and carrier_id = v_uid and status = 'active'
  returning id into v_bid_id;

  if v_bid_id is null then
    insert into public.load_bids (load_id, carrier_id, vehicle_id, amount_cop, message)
    values (p_load_id, v_uid, p_vehicle_id, p_amount_cop, nullif(btrim(p_message), ''))
    returning id into v_bid_id;
  end if;
  return v_bid_id;
end;
$$;

create or replace function public.withdraw_bid(p_bid_id uuid)
returns void
language plpgsql security definer
set search_path = ''
as $$
begin
  update public.load_bids set status = 'withdrawn'
   where id = p_bid_id and carrier_id = auth.uid() and status = 'active';
  if not found then raise exception 'BID_NOT_ACTIVE' using errcode = '22023'; end if;
end;
$$;

-- Shipper (buyer) picks a carrier. Locks the load so two acceptances can't race.
create or replace function public.accept_bid(p_bid_id uuid)
returns uuid
language plpgsql security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_bid public.load_bids;
  v_load public.loads;
begin
  select * into v_bid from public.load_bids where id = p_bid_id;
  if not found then raise exception 'BID_NOT_FOUND' using errcode = 'P0002'; end if;

  select * into v_load from public.loads where id = v_bid.load_id for update;
  if v_load.shipper_id is distinct from v_uid then raise exception 'BID_NOT_FOUND' using errcode = 'P0002'; end if;
  if v_load.status <> 'posted' or v_bid.status <> 'active' then
    raise exception 'BID_NOT_ACCEPTABLE' using errcode = '22023';
  end if;
  if not exists (select 1 from public.vehicles v
                  where v.id = v_bid.vehicle_id and v.active and v.verification_status = 'verified')
     or (select p.verification_status from public.profiles p where p.id = v_bid.carrier_id) <> 'verified' then
    raise exception 'CARRIER_NO_LONGER_ELIGIBLE' using errcode = '22023';
  end if;

  update public.loads
     set status = 'booked', carrier_id = v_bid.carrier_id, vehicle_id = v_bid.vehicle_id,
         agreed_rate_cop = v_bid.amount_cop, booked_at = now()
   where id = v_load.id;
  update public.load_bids set status = 'accepted' where id = p_bid_id;
  update public.load_bids set status = 'rejected' where load_id = v_load.id and id <> p_bid_id and status = 'active';
  insert into public.shipment_events (load_id, actor_id, event_type) values (v_load.id, v_uid, 'booked');
  return v_load.id;
end;
$$;

-- Carrier backs out before pickup: the load goes back on the board.
create or replace function public.carrier_unbook(p_load_id uuid, p_reason text)
returns void
language plpgsql security definer
set search_path = ''
as $$
declare v_uid uuid := auth.uid();
begin
  if coalesce(btrim(p_reason), '') = '' then raise exception 'REASON_REQUIRED' using errcode = '22023'; end if;
  update public.loads
     set status = 'posted', carrier_id = null, vehicle_id = null, agreed_rate_cop = null, booked_at = null
   where id = p_load_id and carrier_id = v_uid and status = 'booked';
  if not found then raise exception 'LOAD_NOT_BOOKED_BY_YOU' using errcode = '22023'; end if;
  update public.load_bids set status = 'withdrawn'
   where load_id = p_load_id and carrier_id = v_uid and status = 'accepted';
  -- New codes so whoever knew the old ones can't use them.
  update private.load_secrets
     set pickup_code = private.random_code6(), delivery_code = private.random_code6(), failed_attempts = 0
   where load_id = p_load_id;
  insert into public.shipment_events (load_id, actor_id, event_type, note) values (p_load_id, v_uid, 'unbooked', p_reason);
end;
$$;

-- Farmer sees the pickup code, buyer sees the delivery code. Nobody else.
create or replace function public.get_my_load_code(p_load_id uuid)
returns text
language plpgsql stable security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_load public.loads;
  v_secret private.load_secrets;
begin
  select * into v_load from public.loads where id = p_load_id;
  select * into v_secret from private.load_secrets where load_id = p_load_id;
  if v_load.status = 'booked' and v_uid = v_load.farmer_id then return v_secret.pickup_code; end if;
  if v_load.status in ('booked', 'picked_up') and v_uid = v_load.shipper_id then return v_secret.delivery_code; end if;
  raise exception 'CODE_NOT_AVAILABLE' using errcode = '42501';
end;
$$;

-- Shared code check. Returns false on a wrong code WITHOUT raising, so the
-- failed-attempt counter is committed. After 5 misses the load locks and an
-- admin has to step in (anti brute force: 5 tries in 1,000,000).
create or replace function private.check_load_code(p_load_id uuid, p_kind text, p_code text)
returns boolean
language plpgsql security definer
set search_path = ''
as $$
declare v_secret private.load_secrets;
begin
  select * into v_secret from private.load_secrets where load_id = p_load_id for update;
  if v_secret.failed_attempts >= 5 then raise exception 'CODE_LOCKED' using errcode = '42501'; end if;
  if (p_kind = 'pickup' and p_code = v_secret.pickup_code)
     or (p_kind = 'delivery' and p_code = v_secret.delivery_code) then
    update private.load_secrets set failed_attempts = 0 where load_id = p_load_id;
    return true;
  end if;
  update private.load_secrets set failed_attempts = failed_attempts + 1 where load_id = p_load_id;
  insert into public.shipment_events (load_id, actor_id, event_type, note)
  values (p_load_id, auth.uid(), 'code_failed', p_kind);
  return false;
end;
$$;

create or replace function public.confirm_pickup(p_load_id uuid, p_code text)
returns boolean
language plpgsql security definer
set search_path = ''
as $$
declare v_uid uuid := auth.uid(); v_load public.loads;
begin
  select * into v_load from public.loads where id = p_load_id for update;
  if not found or v_load.carrier_id is distinct from v_uid or v_load.status <> 'booked' then
    raise exception 'LOAD_NOT_PICKABLE' using errcode = '22023';
  end if;
  if not private.check_load_code(p_load_id, 'pickup', p_code) then return false; end if;

  update public.loads set status = 'picked_up', picked_up_at = now() where id = p_load_id;
  update public.orders set status = 'in_transit' where id = v_load.order_id and status = 'accepted';
  insert into public.shipment_events (load_id, actor_id, event_type) values (p_load_id, v_uid, 'picked_up');
  return true;
end;
$$;

create or replace function public.confirm_delivery(p_load_id uuid, p_code text)
returns boolean
language plpgsql security definer
set search_path = ''
as $$
declare v_uid uuid := auth.uid(); v_load public.loads;
begin
  select * into v_load from public.loads where id = p_load_id for update;
  if not found or v_load.carrier_id is distinct from v_uid or v_load.status <> 'picked_up' then
    raise exception 'LOAD_NOT_DELIVERABLE' using errcode = '22023';
  end if;
  if not private.check_load_code(p_load_id, 'delivery', p_code) then return false; end if;

  update public.loads set status = 'delivered', delivered_at = now() where id = p_load_id;
  update public.orders set status = 'delivered', delivered_at = now()
   where id = v_load.order_id and status = 'in_transit';
  insert into public.shipment_events (load_id, actor_id, event_type) values (p_load_id, v_uid, 'delivered');
  return true;
end;
$$;

-- GPS breadcrumb while the load is moving. At most one per minute per load.
create or replace function public.post_location(p_load_id uuid, p_lat numeric, p_lng numeric)
returns void
language plpgsql security definer
set search_path = ''
as $$
declare v_uid uuid := auth.uid();
begin
  if not exists (select 1 from public.loads l where l.id = p_load_id and l.carrier_id = v_uid and l.status = 'picked_up') then
    raise exception 'LOAD_NOT_IN_TRANSIT' using errcode = '22023';
  end if;
  if exists (select 1 from public.shipment_events e
              where e.load_id = p_load_id and e.event_type = 'location'
                and e.created_at > now() - interval '60 seconds') then
    return;
  end if;
  insert into public.shipment_events (load_id, actor_id, event_type, lat, lng)
  values (p_load_id, v_uid, 'location', p_lat, p_lng);
end;
$$;

-- Exact stops. Shipper and farmer always; the carrier only while booked or moving.
create or replace function public.get_load_stops(p_load_id uuid)
returns table (
  stop text, name text, details text, municipality_code text, lat numeric, lng numeric)
language plpgsql stable security definer
set search_path = ''
as $$
declare v_uid uuid := auth.uid(); v_load public.loads;
begin
  select * into v_load from public.loads where id = p_load_id;
  if v_load.id is null or not (
       v_uid in (v_load.shipper_id, v_load.farmer_id)
    or (v_uid = v_load.carrier_id and v_load.status in ('booked', 'picked_up'))
    or private.is_admin()) then
    raise exception 'STOPS_NOT_AVAILABLE' using errcode = '42501';
  end if;

  return query
    select 'pickup'::text, f.name, concat_ws(' · ', f.vereda, f.directions), f.municipality_code, f.lat, f.lng
      from public.farms f where f.id = v_load.origin_farm_id
    union all
    select 'dropoff'::text, d.label, concat_ws(' · ', d.address, d.receiving_hours), d.municipality_code, d.lat, d.lng
      from public.delivery_locations d where d.id = v_load.destination_location_id;
end;
$$;

grant execute on function
  public.set_load_target_rate(uuid, bigint),
  public.place_bid(uuid, uuid, bigint, text),
  public.withdraw_bid(uuid),
  public.accept_bid(uuid),
  public.carrier_unbook(uuid, text),
  public.get_my_load_code(uuid),
  public.confirm_pickup(uuid, text),
  public.confirm_delivery(uuid, text),
  public.post_location(uuid, numeric, numeric),
  public.get_load_stops(uuid)
to authenticated;
