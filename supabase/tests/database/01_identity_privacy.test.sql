-- RLS + privilege tests for identity and location privacy.
-- Run with: npm run db:test   (supabase test db, pgTAP)
begin;
select plan(18);

-- ---------------------------------------------------------------------------
-- helpers (rolled back with the transaction)
-- ---------------------------------------------------------------------------
create schema tests;
create function tests.new_user(p_id uuid, p_role text, p_name text) returns uuid
language sql as $$
  insert into auth.users (id, email, raw_user_meta_data)
  values (p_id, p_name || '@test.co', jsonb_build_object('role', p_role, 'display_name', p_name))
  returning id
$$;
create function tests.login(p_id uuid, p_aal text default 'aal1') returns void
language plpgsql as $$
begin
  perform set_config('request.jwt.claims',
    json_build_object('sub', p_id, 'role', 'authenticated', 'aal', p_aal)::text, true);
  perform set_config('role', 'authenticated', true);
end $$;
grant usage on schema tests to authenticated;
grant execute on all functions in schema tests to authenticated;

-- ---------------------------------------------------------------------------
-- signup
-- ---------------------------------------------------------------------------
select throws_ok(
  $$ select tests.new_user('00000000-0000-0000-0000-0000000000a0', 'admin', 'sneaky') $$,
  '22023', 'SIGNUP_ROLE_INVALID', 'signup cannot self-assign admin');

select throws_ok(
  $$ insert into auth.users (id, email) values ('00000000-0000-0000-0000-0000000000a1', 'norole@test.co') $$,
  '22023', 'SIGNUP_ROLE_INVALID', 'signup without a role is rejected');

select tests.new_user('11111111-1111-1111-1111-111111111111', 'farmer', 'Doña Rosa');
select tests.new_user('22222222-2222-2222-2222-222222222222', 'buyer', 'Corabastos Bodega 12');
select tests.new_user('33333333-3333-3333-3333-333333333333', 'buyer', 'Admin');
update public.profiles set role = 'admin' where id = '33333333-3333-3333-3333-333333333333';

select is(
  (select role::text || '/' || verification_status::text from public.profiles where id = '11111111-1111-1111-1111-111111111111'),
  'farmer/unverified', 'signup creates an unverified profile with the chosen role');

insert into public.farms (owner_id, name, municipality_code, lat, lng)
values ('11111111-1111-1111-1111-111111111111', 'Finca La Esperanza', '05045', 7.88, -76.63);
insert into public.delivery_locations (owner_id, label, address, municipality_code)
values ('22222222-2222-2222-2222-222222222222', 'Bodega 12', 'Cra 80 #2-51 Corabastos', '11001');
update public.profile_private set phone = '+573001112233', document_type = 'CC', document_number = '1020304050'
 where user_id = '22222222-2222-2222-2222-222222222222';

-- ---------------------------------------------------------------------------
-- privilege escalation
-- ---------------------------------------------------------------------------
select tests.login('11111111-1111-1111-1111-111111111111');

select throws_ok(
  $$ update public.profiles set role = 'admin' where id = '11111111-1111-1111-1111-111111111111' $$,
  '42501', null, 'a user cannot change their own role');

select throws_ok(
  $$ update public.profiles set verification_status = 'verified' where id = '11111111-1111-1111-1111-111111111111' $$,
  '42501', null, 'a user cannot verify themselves');

select lives_ok(
  $$ update public.profiles set display_name = 'Rosa Úsuga' where id = '11111111-1111-1111-1111-111111111111' $$,
  'a user can edit their display name');

select throws_ok(
  $$ insert into public.profiles (id, role, display_name) values (gen_random_uuid(), 'admin', 'x') $$,
  '42501', null, 'clients cannot insert profiles');

select throws_ok(
  $$ select public.custom_access_token_hook('{"user_id":"11111111-1111-1111-1111-111111111111","claims":{}}') $$,
  '42501', null, 'clients cannot call the JWT hook');

-- ---------------------------------------------------------------------------
-- PII and location privacy
-- ---------------------------------------------------------------------------
select is((select count(*) from public.profile_private where user_id = '22222222-2222-2222-2222-222222222222'),
  0::bigint, 'farmer cannot read the buyer''s PII');

select is((select count(*) from public.delivery_locations), 0::bigint,
  'farmer cannot read the buyer''s delivery address');

select is((select count(*) from public.profiles), 3::bigint,
  'public-safe profile fields are readable by signed-in users');

reset role;
select tests.login('22222222-2222-2222-2222-222222222222');
select is((select count(*) from public.farms), 0::bigint,
  'buyer cannot see farm coordinates');

reset role;
select set_config('request.jwt.claims', '{}', true);
set local role anon;
select throws_ok($$ select count(*) from public.profiles $$, '42501', null, 'anon cannot read profiles');

-- ---------------------------------------------------------------------------
-- admin requires MFA (aal2)
-- ---------------------------------------------------------------------------
reset role;
update public.profile_private set legal_name = 'Rosa Úsuga', document_type = 'CC',
       document_number = '43111222', phone = '+573104445566'
 where user_id = '11111111-1111-1111-1111-111111111111';
select tests.login('11111111-1111-1111-1111-111111111111');
select is(public.submit_verification()::text, 'pending', 'farmer submits verification');

reset role;
select tests.login('33333333-3333-3333-3333-333333333333', 'aal1');
select throws_ok(
  $$ select public.admin_review_verification('11111111-1111-1111-1111-111111111111', true) $$,
  '42501', 'ADMIN_MFA_REQUIRED', 'admin without MFA cannot approve');

reset role;
select tests.login('33333333-3333-3333-3333-333333333333', 'aal2');
select is(public.admin_review_verification('11111111-1111-1111-1111-111111111111', true)::text,
  'verified', 'admin with MFA approves');

-- ---------------------------------------------------------------------------
-- audit log
-- ---------------------------------------------------------------------------
select ok((select count(*) from public.audit_log where table_name = 'profiles') >= 2,
  'verification changes are audited');

reset role;
select throws_ok($$ delete from public.audit_log $$, '42501', 'AUDIT_LOG_IMMUTABLE',
  'audit log is append-only, even for the owner');

select * from finish();
rollback;
