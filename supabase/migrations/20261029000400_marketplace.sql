-- =============================================================================
-- Mis Carguitas · 0400 · Marketplace
-- listings (farmer offers a lot of product) and orders (buyer buys part or all).
--
-- Orders have NO client INSERT/UPDATE/DELETE grants. Every state change goes
-- through a SECURITY DEFINER RPC below, which is the single place where the
-- order state machine (docs/specs/STATE_MACHINES.md) is enforced.
-- Money is integer COP (bigint). Weights are kg numeric(12,2).
-- =============================================================================

create table public.listings (
  id                 uuid primary key default gen_random_uuid(),
  farmer_id          uuid not null references public.profiles (id) on delete cascade,
  farm_id            uuid not null references public.farms (id),
  product_id         smallint not null references public.products (id),
  variety            text check (char_length(variety) <= 60),
  quality_grade      public.quality_grade not null default 'primera',
  quantity_kg        numeric(12, 2) not null check (quantity_kg > 0 and quantity_kg <= 1000000),
  available_kg       numeric(12, 2) not null check (available_kg >= 0),
  min_order_kg       numeric(12, 2) not null check (min_order_kg > 0),
  price_cop_per_kg   bigint not null check (price_cop_per_kg between 1 and 10000000),
  harvest_on         date,
  available_from     date not null default current_date,
  available_until    date not null,
  -- Copied from the farm so the market can filter without seeing the farm.
  municipality_code  text not null check (municipality_code ~ '^[0-9]{5}$'),
  description        text check (char_length(description) <= 1000),
  -- Storage object paths in bucket listing-photos: "{farmer_id}/{uuid}.webp"
  photo_paths        text[] not null default '{}' check (cardinality(photo_paths) <= 6),
  status             public.listing_status not null default 'draft',
  published_at       timestamptz,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  constraint listings_available_le_quantity check (available_kg <= quantity_kg),
  constraint listings_min_le_quantity check (min_order_kg <= quantity_kg),
  constraint listings_window check (available_until >= available_from)
);

create index listings_market_idx on public.listings (status, product_id, municipality_code)
  where status = 'published';
create index listings_farmer_idx on public.listings (farmer_id, status);

create table public.orders (
  id                     uuid primary key default gen_random_uuid(),
  listing_id             uuid not null references public.listings (id),
  buyer_id               uuid not null references public.profiles (id),
  farmer_id              uuid not null references public.profiles (id),
  quantity_kg            numeric(12, 2) not null check (quantity_kg > 0),
  -- Price is snapshotted when the order is placed; later listing edits never change it.
  price_cop_per_kg       bigint not null check (price_cop_per_kg > 0),
  subtotal_cop           bigint not null check (subtotal_cop > 0),
  transport_mode         public.transport_mode not null,
  delivery_location_id   uuid references public.delivery_locations (id),
  requested_delivery_on  date,
  notes                  text check (char_length(notes) <= 500),
  status                 public.order_status not null default 'pending',
  status_reason          text check (char_length(status_reason) <= 500),
  expires_at             timestamptz not null default (now() + interval '24 hours'),
  accepted_at            timestamptz,
  delivered_at           timestamptz,
  completed_at           timestamptz,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now(),
  constraint orders_parties_differ check (buyer_id <> farmer_id),
  constraint orders_platform_needs_destination
    check (transport_mode = 'buyer_arranged' or delivery_location_id is not null)
);

create index orders_buyer_idx on public.orders (buyer_id, status);
create index orders_farmer_idx on public.orders (farmer_id, status);
create index orders_listing_idx on public.orders (listing_id);
create unique index orders_one_pending_per_buyer_listing
  on public.orders (listing_id, buyer_id) where status = 'pending';

create trigger listings_touch before update on public.listings
  for each row execute function private.touch_updated_at();
create trigger orders_touch before update on public.orders
  for each row execute function private.touch_updated_at();

-- -----------------------------------------------------------------------------
-- Listing guards (client writes only; RPCs run as the owner and skip them)
-- -----------------------------------------------------------------------------
-- SECURITY INVOKER on purpose: current_user is 'authenticated' for client
-- writes and the RPC owner for writes made inside SECURITY DEFINER RPCs.
create or replace function private.listing_before_write()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_farm public.farms;
begin
  if current_user <> 'authenticated' then
    return new;
  end if;

  select * into v_farm from public.farms where id = new.farm_id;
  if v_farm.owner_id is distinct from new.farmer_id then
    raise exception 'FARM_NOT_OWNED' using errcode = '42501';
  end if;
  new.municipality_code := v_farm.municipality_code;

  if tg_op = 'INSERT' then
    if new.status not in ('draft', 'published') then
      raise exception 'LISTING_STATUS_INVALID' using errcode = '22023';
    end if;
    new.available_kg := new.quantity_kg;
  else
    -- Allowed client transitions. sold_out / expired are system-only.
    if new.status is distinct from old.status and not (
         (old.status = 'draft'     and new.status in ('published', 'withdrawn'))
      or (old.status = 'published' and new.status in ('draft', 'withdrawn'))) then
      raise exception 'LISTING_TRANSITION_INVALID' using errcode = '22023';
    end if;
    if old.status not in ('draft', 'published') then
      raise exception 'LISTING_LOCKED' using errcode = '22023';
    end if;
    if new.farm_id is distinct from old.farm_id and old.status <> 'draft' then
      raise exception 'LISTING_FARM_LOCKED' using errcode = '22023';
    end if;
    -- Changing the total moves availability by the same delta; what is
    -- already sold can never be "un-sold" by editing the listing.
    new.available_kg := old.available_kg + (new.quantity_kg - old.quantity_kg);
    if new.available_kg < 0 then
      raise exception 'LISTING_QUANTITY_BELOW_SOLD' using errcode = '22023';
    end if;
  end if;

  if new.status = 'published' then
    if new.available_until < current_date then
      raise exception 'LISTING_WINDOW_PAST' using errcode = '22023';
    end if;
    if not private.is_verified() then
      raise exception 'VERIFICATION_REQUIRED' using errcode = '42501';
    end if;
    new.published_at := coalesce(new.published_at, now());
  end if;
  return new;
end;
$$;

create trigger listings_guard before insert or update on public.listings
  for each row execute function private.listing_before_write();

-- -----------------------------------------------------------------------------
-- Privileges + RLS
-- -----------------------------------------------------------------------------
alter table public.listings enable row level security;
alter table public.orders enable row level security;

revoke all on public.listings, public.orders from anon, authenticated;

grant select, insert on public.listings to authenticated;
grant update (farm_id, variety, quality_grade, quantity_kg, min_order_kg, price_cop_per_kg,
              harvest_on, available_from, available_until, description, photo_paths, status)
  on public.listings to authenticated;
grant delete on public.listings to authenticated;

-- Published lots are visible to every signed-in user (price transparency is
-- the point). Drafts and history are visible only to the owner and admins.
create policy listings_read on public.listings for select to authenticated
  using (
       farmer_id = (select auth.uid())
    or (status = 'published' and available_until >= current_date)
    or (select private.is_admin()));

create policy listings_insert_own on public.listings for insert to authenticated
  with check (
        farmer_id = (select auth.uid())
    and (select private.my_role()) = 'farmer');

create policy listings_update_own on public.listings for update to authenticated
  using (farmer_id = (select auth.uid()))
  with check (farmer_id = (select auth.uid()));

-- Only never-published drafts can be hard-deleted.
create policy listings_delete_draft on public.listings for delete to authenticated
  using (farmer_id = (select auth.uid()) and status = 'draft' and published_at is null);

grant select on public.orders to authenticated;
create policy orders_read_parties on public.orders for select to authenticated
  using (buyer_id = (select auth.uid()) or farmer_id = (select auth.uid()) or (select private.is_admin()));

-- -----------------------------------------------------------------------------
-- Order RPCs
-- -----------------------------------------------------------------------------
create or replace function public.place_order(
  p_listing_id uuid,
  p_quantity_kg numeric,
  p_transport_mode public.transport_mode,
  p_delivery_location_id uuid default null,
  p_requested_delivery_on date default null,
  p_notes text default null)
returns uuid
language plpgsql security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_listing public.listings;
  v_order_id uuid;
begin
  if v_uid is null then raise exception 'AUTH_REQUIRED' using errcode = '42501'; end if;
  if private.my_role() is distinct from 'buyer' then raise exception 'ROLE_BUYER_REQUIRED' using errcode = '42501'; end if;
  if not private.is_verified() then raise exception 'VERIFICATION_REQUIRED' using errcode = '42501'; end if;

  select * into v_listing from public.listings where id = p_listing_id;
  if not found or v_listing.status <> 'published' or v_listing.available_until < current_date then
    raise exception 'LISTING_NOT_AVAILABLE' using errcode = '22023';
  end if;
  if p_quantity_kg is null or p_quantity_kg < v_listing.min_order_kg or p_quantity_kg > v_listing.available_kg then
    raise exception 'QUANTITY_OUT_OF_RANGE' using errcode = '22023';
  end if;
  if p_transport_mode <> 'buyer_arranged' and not exists (
       select 1 from public.delivery_locations d where d.id = p_delivery_location_id and d.owner_id = v_uid) then
    raise exception 'DELIVERY_LOCATION_INVALID' using errcode = '22023';
  end if;
  if p_requested_delivery_on is not null and p_requested_delivery_on < current_date then
    raise exception 'DELIVERY_DATE_PAST' using errcode = '22023';
  end if;

  insert into public.orders (listing_id, buyer_id, farmer_id, quantity_kg, price_cop_per_kg, subtotal_cop,
                             transport_mode, delivery_location_id, requested_delivery_on, notes)
  values (v_listing.id, v_uid, v_listing.farmer_id, p_quantity_kg, v_listing.price_cop_per_kg,
          round(p_quantity_kg * v_listing.price_cop_per_kg)::bigint,
          p_transport_mode,
          case when p_transport_mode = 'buyer_arranged' then null else p_delivery_location_id end,
          p_requested_delivery_on, nullif(btrim(p_notes), ''))
  returning id into v_order_id;

  return v_order_id;
exception
  when unique_violation then
    raise exception 'ORDER_ALREADY_PENDING' using errcode = '23505';
end;
$$;

-- Farmer accepts or rejects. Accepting reserves stock atomically and, for
-- transport_mode = platform, posts a load on the load board.
create or replace function public.respond_to_order(
  p_order_id uuid,
  p_accept boolean,
  p_reason text default null,
  p_pickup_on date default null)
returns public.order_status
language plpgsql security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_order public.orders;
  v_listing public.listings;
  v_load_id uuid;
begin
  select * into v_order from public.orders where id = p_order_id for update;
  if not found or v_order.farmer_id is distinct from v_uid then
    raise exception 'ORDER_NOT_FOUND' using errcode = 'P0002';
  end if;
  if v_order.status <> 'pending' then raise exception 'ORDER_NOT_PENDING' using errcode = '22023'; end if;
  if v_order.expires_at <= now() then
    update public.orders set status = 'expired' where id = p_order_id;
    return 'expired';
  end if;

  if not p_accept then
    if coalesce(btrim(p_reason), '') = '' then raise exception 'REASON_REQUIRED' using errcode = '22023'; end if;
    update public.orders set status = 'rejected', status_reason = p_reason where id = p_order_id;
    return 'rejected';
  end if;

  if v_order.transport_mode = 'platform' and (p_pickup_on is null or p_pickup_on < current_date) then
    raise exception 'PICKUP_DATE_REQUIRED' using errcode = '22023';
  end if;

  -- Row lock serializes concurrent acceptances against the same lot.
  select * into v_listing from public.listings where id = v_order.listing_id for update;
  if v_listing.status <> 'published' or v_listing.available_kg < v_order.quantity_kg then
    raise exception 'INSUFFICIENT_STOCK' using errcode = '22023';
  end if;

  update public.listings
     set available_kg = available_kg - v_order.quantity_kg,
         status = case when available_kg - v_order.quantity_kg < min_order_kg then 'sold_out'::public.listing_status
                       else status end
   where id = v_listing.id;

  update public.orders set status = 'accepted', accepted_at = now() where id = p_order_id;

  if v_order.transport_mode = 'platform' then
    insert into public.loads (order_id, shipper_id, farmer_id, product_id, weight_kg, required_body,
                              origin_farm_id, origin_municipality_code,
                              destination_location_id, destination_municipality_code,
                              pickup_on, deliver_by)
    select v_order.id, v_order.buyer_id, v_order.farmer_id, v_listing.product_id, v_order.quantity_kg,
           pr.suggested_body, v_listing.farm_id, v_listing.municipality_code,
           d.id, d.municipality_code, p_pickup_on,
           greatest(p_pickup_on, coalesce(v_order.requested_delivery_on, p_pickup_on + 2))
      from public.products pr, public.delivery_locations d
     where pr.id = v_listing.product_id and d.id = v_order.delivery_location_id
    returning id into v_load_id;

    insert into private.load_secrets (load_id, pickup_code, delivery_code)
    values (v_load_id, private.random_code6(), private.random_code6());

    insert into public.shipment_events (load_id, actor_id, event_type) values (v_load_id, v_uid, 'posted');
  end if;

  return 'accepted';
end;
$$;

create or replace function public.cancel_order(p_order_id uuid, p_reason text default null)
returns public.order_status
language plpgsql security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_order public.orders;
  v_load record; -- public.loads (declared as record: table is created in 0500)
begin
  select * into v_order from public.orders where id = p_order_id for update;
  if not found or v_uid not in (v_order.buyer_id, v_order.farmer_id) then
    raise exception 'ORDER_NOT_FOUND' using errcode = 'P0002';
  end if;

  if v_order.status = 'pending' then
    if v_uid <> v_order.buyer_id then raise exception 'ONLY_BUYER_WITHDRAWS_PENDING' using errcode = '42501'; end if;
    update public.orders set status = 'cancelled', status_reason = p_reason where id = p_order_id;
    return 'cancelled';
  end if;

  if v_order.status <> 'accepted' then raise exception 'ORDER_NOT_CANCELLABLE' using errcode = '22023'; end if;
  if coalesce(btrim(p_reason), '') = '' then raise exception 'REASON_REQUIRED' using errcode = '22023'; end if;

  select * into v_load from public.loads where order_id = p_order_id for update;
  if found then
    if v_load.status not in ('posted', 'booked') then
      raise exception 'LOAD_ALREADY_MOVING' using errcode = '22023';
    end if;
    update public.loads set status = 'cancelled', cancelled_at = now() where id = v_load.id;
    update public.load_bids set status = 'rejected' where load_id = v_load.id and status in ('active', 'accepted');
    insert into public.shipment_events (load_id, actor_id, event_type, note)
    values (v_load.id, v_uid, 'cancelled', p_reason);
  end if;

  -- Give the stock back. A sold_out lot still inside its window is re-published.
  update public.listings
     set available_kg = available_kg + v_order.quantity_kg,
         status = case when status = 'sold_out' and available_until >= current_date
                       then 'published'::public.listing_status else status end
   where id = v_order.listing_id;

  update public.orders set status = 'cancelled', status_reason = p_reason where id = p_order_id;
  return 'cancelled';
end;
$$;

-- Non-platform transport: farmer marks it dispatched / handed over.
create or replace function public.mark_order_dispatched(p_order_id uuid)
returns public.order_status
language plpgsql security definer
set search_path = ''
as $$
begin
  update public.orders set status = 'in_transit'
   where id = p_order_id and farmer_id = auth.uid()
     and status = 'accepted' and transport_mode <> 'platform';
  if not found then raise exception 'ORDER_NOT_DISPATCHABLE' using errcode = '22023'; end if;
  return 'in_transit';
end;
$$;

-- Buyer confirms they received the goods. Platform orders arrive here as
-- 'delivered' (carrier entered the delivery code); others as 'in_transit'.
create or replace function public.confirm_receipt(p_order_id uuid)
returns public.order_status
language plpgsql security definer
set search_path = ''
as $$
begin
  update public.orders
     set status = 'completed', completed_at = now(), delivered_at = coalesce(delivered_at, now())
   where id = p_order_id and buyer_id = auth.uid()
     and (status = 'delivered' or (status = 'in_transit' and transport_mode <> 'platform'));
  if not found then raise exception 'ORDER_NOT_CONFIRMABLE' using errcode = '22023'; end if;
  return 'completed';
end;
$$;

-- Phone numbers of the other parties, only while the deal is live.
create or replace function public.get_order_contacts(p_order_id uuid)
returns table (party text, display_name text, phone text)
language plpgsql stable security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_order public.orders;
  v_carrier uuid;
begin
  select * into v_order from public.orders where id = p_order_id;
  select l.carrier_id into v_carrier from public.loads l
   where l.order_id = p_order_id and l.status in ('booked', 'picked_up', 'delivered');

  if v_order.id is null
     or v_uid not in (v_order.buyer_id, v_order.farmer_id, coalesce(v_carrier, '00000000-0000-0000-0000-000000000000'::uuid))
     or v_order.status not in ('accepted', 'in_transit', 'delivered', 'disputed') then
    raise exception 'CONTACTS_NOT_AVAILABLE' using errcode = '42501';
  end if;

  return query
    select x.party, p.display_name, pp.phone
      from (values ('buyer', v_order.buyer_id), ('farmer', v_order.farmer_id), ('carrier', v_carrier)) as x(party, uid)
      join public.profiles p on p.id = x.uid
      join public.profile_private pp on pp.user_id = x.uid
     where x.uid is not null and x.uid <> v_uid;
end;
$$;

grant execute on function
  public.place_order(uuid, numeric, public.transport_mode, uuid, date, text),
  public.respond_to_order(uuid, boolean, text, date),
  public.cancel_order(uuid, text),
  public.mark_order_dispatched(uuid),
  public.confirm_receipt(uuid),
  public.get_order_contacts(uuid)
to authenticated;
