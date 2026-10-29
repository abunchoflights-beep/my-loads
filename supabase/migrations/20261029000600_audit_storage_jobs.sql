-- =============================================================================
-- Mis Carguitas · 0600 · Audit log, storage buckets, housekeeping, catalog
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Audit log: append-only, admin-readable, written by trigger only.
-- -----------------------------------------------------------------------------
create table public.audit_log (
  id          bigint generated always as identity primary key,
  actor_id    uuid,
  actor_role  text not null,
  action      text not null,
  table_name  text not null,
  record_id   text not null,
  old_row     jsonb,
  new_row     jsonb,
  created_at  timestamptz not null default now()
);
create index audit_log_record_idx on public.audit_log (table_name, record_id, created_at desc);

alter table public.audit_log enable row level security;
revoke all on public.audit_log from anon, authenticated;
grant select on public.audit_log to authenticated;
create policy audit_admin_read on public.audit_log for select to authenticated
  using ((select private.is_admin()));

create or replace function private.audit_row()
returns trigger
language plpgsql security definer
set search_path = ''
as $$
declare
  v_old jsonb := case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) end;
  v_new jsonb := case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) end;
begin
  -- PII never lands in the audit log.
  v_old := v_old - 'document_number' - 'phone' - 'legal_name';
  v_new := v_new - 'document_number' - 'phone' - 'legal_name';
  insert into public.audit_log (actor_id, actor_role, action, table_name, record_id, old_row, new_row)
  values (auth.uid(), coalesce(auth.jwt() ->> 'user_role', 'system'), lower(tg_op), tg_table_name,
          coalesce(v_new ->> 'id', v_old ->> 'id', v_new ->> 'user_id', v_old ->> 'user_id'),
          v_old, v_new);
  return null;
end;
$$;

-- Block UPDATE/DELETE on the log for everyone, owner included.
create or replace function private.audit_immutable()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'AUDIT_LOG_IMMUTABLE' using errcode = '42501';
end;
$$;
create trigger audit_log_immutable before update or delete on public.audit_log
  for each row execute function private.audit_immutable();

create trigger audit_profiles after update of role, verification_status on public.profiles
  for each row execute function private.audit_row();
create trigger audit_profile_private after update on public.profile_private
  for each row execute function private.audit_row();
create trigger audit_vehicles after insert or update on public.vehicles
  for each row execute function private.audit_row();
create trigger audit_listings after insert or update or delete on public.listings
  for each row execute function private.audit_row();
create trigger audit_orders after insert or update on public.orders
  for each row execute function private.audit_row();
create trigger audit_loads after insert or update on public.loads
  for each row execute function private.audit_row();
create trigger audit_bids after insert or update on public.load_bids
  for each row execute function private.audit_row();

-- -----------------------------------------------------------------------------
-- Storage. All buckets private; files live under "{owner_uid}/..." except
-- proof-of-delivery which lives under "{load_id}/...".
-- -----------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('listing-photos', 'listing-photos', false, 5242880,  array['image/jpeg', 'image/png', 'image/webp']),
  ('kyc',            'kyc',            false, 10485760, array['image/jpeg', 'image/png', 'application/pdf']),
  ('pod',            'pod',            false, 5242880,  array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "listing photos: farmer writes own folder" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'listing-photos'
              and (storage.foldername(name))[1] = (select auth.uid())::text
              and (select private.my_role()) = 'farmer');
create policy "listing photos: farmer deletes own" on storage.objects
  for delete to authenticated
  using (bucket_id = 'listing-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "listing photos: signed-in read" on storage.objects
  for select to authenticated
  using (bucket_id = 'listing-photos');

create policy "kyc: owner uploads" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'kyc' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "kyc: owner or admin reads" on storage.objects
  for select to authenticated
  using (bucket_id = 'kyc'
         and ((storage.foldername(name))[1] = (select auth.uid())::text or (select private.is_admin())));

create policy "pod: carrier uploads while moving" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'pod' and exists (
    select 1 from public.loads l
     where l.id::text = (storage.foldername(name))[1]
       and l.carrier_id = (select auth.uid())
       and l.status in ('picked_up', 'delivered')));
create policy "pod: load parties read" on storage.objects
  for select to authenticated
  using (bucket_id = 'pod' and (
    (select private.is_admin()) or exists (
      select 1 from public.loads l
       where l.id::text = (storage.foldername(name))[1]
         and (select auth.uid()) in (l.shipper_id, l.farmer_id, l.carrier_id))));

-- -----------------------------------------------------------------------------
-- Housekeeping. Scheduled with pg_cron in issue S3-05 (every 15 min).
-- -----------------------------------------------------------------------------
create or replace function private.expire_stale()
returns void
language plpgsql security definer
set search_path = ''
as $$
begin
  update public.orders set status = 'expired' where status = 'pending' and expires_at <= now();
  update public.listings set status = 'expired'
   where status = 'published' and available_until < current_date;
end;
$$;

-- -----------------------------------------------------------------------------
-- Product catalog (reference data, needed in every environment).
-- -----------------------------------------------------------------------------
insert into public.products (slug, name_es, name_en, category, perishable, suggested_body) values
  ('banano',          'Banano',               'Banana',             'fruta',      true,  'estacas'),
  ('platano',         'Plátano',              'Plantain',           'fruta',      true,  'estacas'),
  ('aguacate-hass',   'Aguacate Hass',        'Hass avocado',       'fruta',      true,  'refrigerado'),
  ('aguacate-papelillo','Aguacate papelillo', 'Papelillo avocado',  'fruta',      true,  'estacas'),
  ('mango',           'Mango',                'Mango',              'fruta',      true,  'estacas'),
  ('pina',            'Piña',                 'Pineapple',          'fruta',      true,  'estacas'),
  ('maracuya',        'Maracuyá',             'Passion fruit',      'fruta',      true,  'estacas'),
  ('limon-tahiti',    'Limón Tahití',         'Tahiti lime',        'fruta',      true,  'estacas'),
  ('mora',            'Mora',                 'Andean blackberry',  'fruta',      true,  'refrigerado'),
  ('uchuva',          'Uchuva',               'Goldenberry',        'fruta',      true,  'refrigerado'),
  ('tomate',          'Tomate',               'Tomato',             'verdura',    true,  'estacas'),
  ('cebolla-cabezona','Cebolla cabezona',     'Onion',              'verdura',    true,  'estacas'),
  ('papa',            'Papa',                 'Potato',             'tuberculo',  true,  'estacas'),
  ('yuca',            'Yuca',                 'Cassava',            'tuberculo',  true,  'estacas'),
  ('cafe-pergamino',  'Café pergamino seco',  'Parchment coffee',   'cafe_cacao', false, 'furgon'),
  ('cacao',           'Cacao en grano',       'Cocoa beans',        'cafe_cacao', false, 'furgon'),
  ('maiz',            'Maíz',                 'Corn',               'grano',      false, 'estacas'),
  ('frijol',          'Fríjol',               'Beans',              'grano',      false, 'furgon')
on conflict (slug) do nothing;
