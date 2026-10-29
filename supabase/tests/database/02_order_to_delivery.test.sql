-- End-to-end invariants: listing -> order -> load -> bid -> pickup -> delivery.
-- Run with: npm run db:test   (supabase test db, pgTAP)
begin;
select plan(30);

create schema tests;
create function tests.new_user(p_id uuid, p_role text, p_name text, p_verified boolean default true) returns uuid
language plpgsql as $$
begin
  insert into auth.users (id, email, raw_user_meta_data)
  values (p_id, p_name || '@test.co', jsonb_build_object('role', p_role, 'display_name', p_name));
  update public.profiles set verification_status = case when p_verified then 'verified' else 'unverified' end::public.verification_status
   where id = p_id;
  update public.profile_private set phone = '+57300' || lpad((abs(hashtext(p_id::text)) % 10000000)::text, 7, '0') where user_id = p_id;
  return p_id;
end $$;
create function tests.login(p_id uuid) returns void
language plpgsql as $$
begin
  perform set_config('request.jwt.claims',
    json_build_object('sub', p_id, 'role', 'authenticated', 'aal', 'aal1')::text, true);
  perform set_config('role', 'authenticated', true);
end $$;
grant usage on schema tests to authenticated;
grant execute on all functions in schema tests to authenticated;

-- Cast: F farmer, F2 unverified farmer, B buyer, C carrier, C2 unverified carrier, C3 other carrier
select tests.new_user('f0000000-0000-0000-0000-000000000001', 'farmer',  'Finca Rosa');
select tests.new_user('f0000000-0000-0000-0000-000000000002', 'farmer',  'Nuevo', false);
select tests.new_user('b0000000-0000-0000-0000-000000000001', 'buyer',   'Fruver Chapinero');
select tests.new_user('c0000000-0000-0000-0000-000000000001', 'carrier', 'Don Jairo');
select tests.new_user('c0000000-0000-0000-0000-000000000002', 'carrier', 'Sin verificar', false);
select tests.new_user('c0000000-0000-0000-0000-000000000003', 'carrier', 'Otro camionero');

insert into public.farms (id, owner_id, name, municipality_code, lat, lng) values
  ('fa000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000001', 'La Esperanza', '05045', 7.88, -76.63),
  ('fa000000-0000-0000-0000-000000000002', 'f0000000-0000-0000-0000-000000000002', 'El Recreo', '05045', 7.80, -76.60);
insert into public.delivery_locations (id, owner_id, label, address, municipality_code) values
  ('d0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'Local Chapinero', 'Cl 57 #9-20', '11001');
insert into public.vehicles (id, carrier_id, plate, vehicle_class, body_type, capacity_kg, soat_expires_on, verification_status) values
  ('ae000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'TKR482', 'sencillo', 'estacas', 9000, current_date + 200, 'verified'),
  ('ae000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000003', 'SXT901', 'turbo', 'estacas', 4500, current_date + 200, 'verified');

-- ---------------------------------------------------------------------------
-- listings
-- ---------------------------------------------------------------------------
select tests.login('f0000000-0000-0000-0000-000000000002');
select throws_ok($$
  insert into public.listings (farmer_id, farm_id, product_id, quantity_kg, available_kg, min_order_kg, price_cop_per_kg, available_until, municipality_code, status)
  values ('f0000000-0000-0000-0000-000000000002', 'fa000000-0000-0000-0000-000000000002', 1, 500, 0, 50, 2000, current_date + 7, '00000', 'published') $$,
  '42501', 'VERIFICATION_REQUIRED', 'unverified farmer cannot publish');

select throws_ok($$
  insert into public.listings (farmer_id, farm_id, product_id, quantity_kg, available_kg, min_order_kg, price_cop_per_kg, available_until, municipality_code)
  values ('f0000000-0000-0000-0000-000000000002', 'fa000000-0000-0000-0000-000000000001', 1, 500, 0, 50, 2000, current_date + 7, '00000') $$,
  '42501', 'FARM_NOT_OWNED', 'a farmer cannot list from someone else''s farm');

reset role;
select tests.login('f0000000-0000-0000-0000-000000000001');
insert into public.listings (id, farmer_id, farm_id, product_id, quantity_kg, available_kg, min_order_kg, price_cop_per_kg, available_until, municipality_code, status)
values ('1a000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000001', 'fa000000-0000-0000-0000-000000000001',
        1, 1000, 999999, 100, 2500, current_date + 7, '00000', 'published');

select is((select available_kg from public.listings where id = '1a000000-0000-0000-0000-000000000001'),
  1000.00::numeric(12,2), 'available_kg is forced to quantity on insert, whatever the client sent');
select is((select municipality_code from public.listings where id = '1a000000-0000-0000-0000-000000000001'),
  '05045', 'municipality is copied from the farm, not trusted from the client');

-- ---------------------------------------------------------------------------
-- orders
-- ---------------------------------------------------------------------------
reset role;
select tests.login('b0000000-0000-0000-0000-000000000001');
select is((select count(*) from public.listings), 1::bigint, 'buyer sees the published lot');

select throws_ok($$
  insert into public.orders (listing_id, buyer_id, farmer_id, quantity_kg, price_cop_per_kg, subtotal_cop, transport_mode, delivery_location_id)
  values ('1a000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000001', 300, 1, 300, 'platform', 'd0000000-0000-0000-0000-000000000001') $$,
  '42501', null, 'orders cannot be inserted directly (price tampering)');

select throws_ok($$ select public.place_order('1a000000-0000-0000-0000-000000000001', 50, 'platform', 'd0000000-0000-0000-0000-000000000001') $$,
  '22023', 'QUANTITY_OUT_OF_RANGE', 'order below the minimum is rejected');

create temp table t (k text primary key, v uuid);
grant all on t to authenticated;
insert into t select 'order1', public.place_order('1a000000-0000-0000-0000-000000000001', 300, 'platform', 'd0000000-0000-0000-0000-000000000001');

select is((select subtotal_cop from public.orders where id = (select v from t where k = 'order1')),
  750000::bigint, 'subtotal = 300 kg x 2,500 COP, priced by the server');

select throws_ok($$ select public.place_order('1a000000-0000-0000-0000-000000000001', 200, 'platform', 'd0000000-0000-0000-0000-000000000001') $$,
  '23505', 'ORDER_ALREADY_PENDING', 'one pending order per buyer per lot');

-- ---------------------------------------------------------------------------
-- farmer accepts -> stock reserved, load posted
-- ---------------------------------------------------------------------------
reset role;
select tests.login('f0000000-0000-0000-0000-000000000001');
select throws_ok($$ select public.respond_to_order((select v from t where k = 'order1'), true) $$,
  '22023', 'PICKUP_DATE_REQUIRED', 'platform orders need a pickup date');

select is(public.respond_to_order((select v from t where k = 'order1'), true, null, current_date + 1)::text,
  'accepted', 'farmer accepts');
select is((select available_kg from public.listings where id = '1a000000-0000-0000-0000-000000000001'),
  700.00::numeric(12,2), 'acceptance reserves stock atomically');

select throws_ok($$ update public.listings set quantity_kg = 200 where id = '1a000000-0000-0000-0000-000000000001' $$,
  '22023', 'LISTING_QUANTITY_BELOW_SOLD', 'cannot shrink a lot below what is already sold');

reset role;
insert into t select 'load1', id from public.loads where order_id = (select v from t where k = 'order1');

-- ---------------------------------------------------------------------------
-- load board visibility
-- ---------------------------------------------------------------------------
select tests.login('c0000000-0000-0000-0000-000000000002');
select is((select count(*) from public.loads), 0::bigint, 'unverified carriers do not see the board');

reset role;
select tests.login('c0000000-0000-0000-0000-000000000001');
select is((select count(*) from public.loads), 1::bigint, 'verified carrier sees the posted load');
select is((select count(*) from public.farms), 0::bigint, 'carrier cannot read farm coordinates');
select throws_ok($$ select * from public.get_load_stops((select v from t where k = 'load1')) $$,
  '42501', 'STOPS_NOT_AVAILABLE', 'exact stops are hidden before booking');

-- ---------------------------------------------------------------------------
-- bidding and booking
-- ---------------------------------------------------------------------------
insert into t select 'bid1', public.place_bid((select v from t where k = 'load1'), 'ae000000-0000-0000-0000-000000000001', 850000, 'Salgo temprano');

reset role;
select tests.login('c0000000-0000-0000-0000-000000000003');
insert into t select 'bid3', public.place_bid((select v from t where k = 'load1'), 'ae000000-0000-0000-0000-000000000003', 800000);
select is((select count(*) from public.load_bids), 1::bigint, 'carriers only see their own bids');

reset role;
select tests.login('f0000000-0000-0000-0000-000000000001');
select throws_ok($$ select public.accept_bid((select v from t where k = 'bid1')) $$,
  'P0002', 'BID_NOT_FOUND', 'only the shipper (buyer) can accept a bid');

reset role;
select tests.login('b0000000-0000-0000-0000-000000000001');
select is((select count(*) from public.load_bids), 2::bigint, 'shipper sees all bids on their load');
select lives_ok($$ select public.accept_bid((select v from t where k = 'bid1')) $$, 'shipper books Don Jairo');

reset role;
select is((select status::text from public.load_bids where id = (select v from t where k = 'bid3')),
  'rejected', 'losing bids are closed when one is accepted');

select tests.login('c0000000-0000-0000-0000-000000000001');
select is((select count(*) from public.get_load_stops((select v from t where k = 'load1'))), 2::bigint,
  'booked carrier gets pickup and drop-off');
select throws_ok($$ select public.get_my_load_code((select v from t where k = 'load1')) $$,
  '42501', 'CODE_NOT_AVAILABLE', 'carrier never sees the codes');

-- ---------------------------------------------------------------------------
-- pickup with code
-- ---------------------------------------------------------------------------
reset role;
select tests.login('f0000000-0000-0000-0000-000000000001');
create temp table codes (k text primary key, c text);
grant all on codes to authenticated;
insert into codes values ('pickup', public.get_my_load_code((select v from t where k = 'load1')));

reset role;
select tests.login('c0000000-0000-0000-0000-000000000001');
select is(public.confirm_pickup((select v from t where k = 'load1'), 'nope00'), false, 'wrong pickup code is refused');
select is(public.confirm_pickup((select v from t where k = 'load1'), (select c from codes where k = 'pickup')), true,
  'right pickup code moves the load');

reset role;
select is((select status::text from public.orders where id = (select v from t where k = 'order1')),
  'in_transit', 'order follows the load into transit');

select tests.login('c0000000-0000-0000-0000-000000000003');
select throws_ok($$ select * from public.get_order_contacts((select v from t where k = 'order1')) $$,
  '42501', 'CONTACTS_NOT_AVAILABLE', 'a losing carrier gets no phone numbers');

-- ---------------------------------------------------------------------------
-- delivery with code, then receipt
-- ---------------------------------------------------------------------------
reset role;
select tests.login('b0000000-0000-0000-0000-000000000001');
insert into codes values ('delivery', public.get_my_load_code((select v from t where k = 'load1')));

reset role;
select tests.login('c0000000-0000-0000-0000-000000000001');
select is(public.confirm_delivery((select v from t where k = 'load1'), (select c from codes where k = 'delivery')), true,
  'right delivery code completes the trip');

reset role;
select tests.login('b0000000-0000-0000-0000-000000000001');
select is(public.confirm_receipt((select v from t where k = 'order1'))::text, 'completed', 'buyer confirms receipt');

select * from finish();
rollback;
