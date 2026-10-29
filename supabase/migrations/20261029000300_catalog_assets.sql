-- =============================================================================
-- Mis Carguitas · 0300 · Catalog and assets
-- products (public catalog), farms, delivery_locations, vehicles.
--
-- Location privacy rule: exact coordinates and addresses of farms and
-- delivery points are readable ONLY by their owner and an MFA admin.
-- Counterparties see municipality only, and the booked carrier gets the
-- exact stops through get_load_stops() while the trip is active. In rural
-- Colombia a public farm pin is an extortion risk, so this is non-negotiable.
-- =============================================================================

create table public.products (
  id                 smallint generated always as identity primary key,
  slug               text not null unique check (slug ~ '^[a-z0-9-]{2,40}$'),
  name_es            text not null,
  name_en            text not null,
  category           text not null check (category in ('fruta', 'verdura', 'tuberculo', 'grano', 'cafe_cacao', 'otro')),
  perishable         boolean not null default true,
  suggested_body     public.body_type not null default 'estacas',
  active             boolean not null default true
);

create table public.farms (
  id                 uuid primary key default gen_random_uuid(),
  owner_id           uuid not null references public.profiles (id) on delete cascade,
  name               text not null check (char_length(name) between 2 and 80),
  municipality_code  text not null check (municipality_code ~ '^[0-9]{5}$'),
  vereda             text check (char_length(vereda) <= 80),
  directions         text check (char_length(directions) <= 500),
  -- Rough Colombia bounding box; refine when we expand.
  lat                numeric(9, 6) check (lat between -4.3 and 13.5),
  lng                numeric(9, 6) check (lng between -82 and -66.8),
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create index farms_owner_idx on public.farms (owner_id);
create trigger farms_touch before update on public.farms
  for each row execute function private.touch_updated_at();

create table public.delivery_locations (
  id                 uuid primary key default gen_random_uuid(),
  owner_id           uuid not null references public.profiles (id) on delete cascade,
  label              text not null check (char_length(label) between 2 and 80),
  address            text not null check (char_length(address) between 5 and 200),
  municipality_code  text not null check (municipality_code ~ '^[0-9]{5}$'),
  receiving_hours    text check (char_length(receiving_hours) <= 120),
  lat                numeric(9, 6) check (lat between -4.3 and 13.5),
  lng                numeric(9, 6) check (lng between -82 and -66.8),
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create index delivery_locations_owner_idx on public.delivery_locations (owner_id);
create trigger delivery_locations_touch before update on public.delivery_locations
  for each row execute function private.touch_updated_at();

create table public.vehicles (
  id                       uuid primary key default gen_random_uuid(),
  carrier_id               uuid not null references public.profiles (id) on delete cascade,
  -- Colombian plate: ABC123 (trucks). Stored upper-case, no dash.
  plate                    text not null unique check (plate ~ '^[A-Z]{3}[0-9]{3}$'),
  vehicle_class            public.vehicle_class not null,
  body_type                public.body_type not null,
  capacity_kg              integer not null check (capacity_kg between 300 and 40000),
  soat_expires_on          date not null,
  tecnomecanica_expires_on date,
  verification_status      public.verification_status not null default 'pending',
  active                   boolean not null default true,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);
create index vehicles_carrier_idx on public.vehicles (carrier_id);
create trigger vehicles_touch before update on public.vehicles
  for each row execute function private.touch_updated_at();

-- Owner must have the right role for each asset type.
create or replace function private.assert_asset_owner_role()
returns trigger
language plpgsql security definer
set search_path = ''
as $$
declare
  v_required public.app_role := tg_argv[0]::public.app_role;
  v_owner uuid := (to_jsonb(new) ->> case tg_table_name when 'vehicles' then 'carrier_id' else 'owner_id' end)::uuid;
begin
  if (select p.role from public.profiles p where p.id = v_owner) is distinct from v_required then
    raise exception 'ROLE_MISMATCH' using errcode = '42501';
  end if;
  return new;
end;
$$;

create trigger farms_role before insert or update on public.farms
  for each row execute function private.assert_asset_owner_role('farmer');
create trigger delivery_locations_role before insert or update on public.delivery_locations
  for each row execute function private.assert_asset_owner_role('buyer');
create trigger vehicles_role before insert or update on public.vehicles
  for each row execute function private.assert_asset_owner_role('carrier');

-- A vehicle edited by its carrier goes back to review (unless only `active` changed).
create or replace function private.vehicle_needs_review()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if current_user = 'authenticated' then
    if tg_op = 'INSERT' then
      new.verification_status := 'pending';
    elsif (new.plate, new.vehicle_class, new.body_type, new.capacity_kg, new.soat_expires_on, new.tecnomecanica_expires_on)
          is distinct from
          (old.plate, old.vehicle_class, old.body_type, old.capacity_kg, old.soat_expires_on, old.tecnomecanica_expires_on) then
      new.verification_status := 'pending';
    else
      new.verification_status := old.verification_status;
    end if;
  end if;
  return new;
end;
$$;
create trigger vehicles_review before insert or update on public.vehicles
  for each row execute function private.vehicle_needs_review();

-- -----------------------------------------------------------------------------
-- Privileges + RLS
-- -----------------------------------------------------------------------------
alter table public.products enable row level security;
alter table public.farms enable row level security;
alter table public.delivery_locations enable row level security;
alter table public.vehicles enable row level security;

revoke all on public.products, public.farms, public.delivery_locations, public.vehicles from anon, authenticated;

-- Catalog is public (landing page, price index).
grant select on public.products to anon, authenticated;
create policy products_read_all on public.products for select to anon, authenticated using (active);

grant select, insert, delete on public.farms to authenticated;
grant update (name, municipality_code, vereda, directions, lat, lng) on public.farms to authenticated;
create policy farms_owner_or_admin_read on public.farms for select to authenticated
  using (owner_id = (select auth.uid()) or (select private.is_admin()));
create policy farms_owner_insert on public.farms for insert to authenticated
  with check (owner_id = (select auth.uid()));
create policy farms_owner_update on public.farms for update to authenticated
  using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
create policy farms_owner_delete on public.farms for delete to authenticated
  using (owner_id = (select auth.uid()));

grant select, insert, delete on public.delivery_locations to authenticated;
grant update (label, address, municipality_code, receiving_hours, lat, lng) on public.delivery_locations to authenticated;
create policy dl_owner_or_admin_read on public.delivery_locations for select to authenticated
  using (owner_id = (select auth.uid()) or (select private.is_admin()));
create policy dl_owner_insert on public.delivery_locations for insert to authenticated
  with check (owner_id = (select auth.uid()));
create policy dl_owner_update on public.delivery_locations for update to authenticated
  using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
create policy dl_owner_delete on public.delivery_locations for delete to authenticated
  using (owner_id = (select auth.uid()));

-- Vehicles: no client DELETE (trip history references them). Deactivate instead.
grant select, insert on public.vehicles to authenticated;
grant update (plate, vehicle_class, body_type, capacity_kg, soat_expires_on, tecnomecanica_expires_on, active)
  on public.vehicles to authenticated;
create policy vehicles_owner_or_admin_read on public.vehicles for select to authenticated
  using (carrier_id = (select auth.uid()) or (select private.is_admin()));
create policy vehicles_owner_insert on public.vehicles for insert to authenticated
  with check (carrier_id = (select auth.uid()));
create policy vehicles_owner_update on public.vehicles for update to authenticated
  using (carrier_id = (select auth.uid())) with check (carrier_id = (select auth.uid()));

create or replace function public.admin_review_vehicle(p_vehicle_id uuid, p_approve boolean)
returns public.verification_status
language plpgsql security definer
set search_path = ''
as $$
declare v_next public.verification_status := case when p_approve then 'verified' else 'rejected' end;
begin
  if not private.is_admin() then raise exception 'ADMIN_MFA_REQUIRED' using errcode = '42501'; end if;
  update public.vehicles set verification_status = v_next
   where id = p_vehicle_id and verification_status = 'pending';
  if not found then raise exception 'VEHICLE_NOT_PENDING' using errcode = '22023'; end if;
  return v_next;
end;
$$;
grant execute on function public.admin_review_vehicle(uuid, boolean) to authenticated;
