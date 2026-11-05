-- S1-05 invariants: the access token carries mfa_enrolled for routing, and
-- admin data still requires aal2 in Postgres whatever the UI does.
-- Run with: npm run db:test   (supabase test db, pgTAP)
begin;
select plan(8);

create schema tests;
create function tests.login(p_id uuid, p_aal text) returns void
language plpgsql as $$
begin
  perform set_config('request.jwt.claims',
    json_build_object('sub', p_id, 'role', 'authenticated', 'aal', p_aal)::text, true);
  perform set_config('role', 'authenticated', true);
end $$;
create function tests.claims(p_id uuid) returns jsonb
language sql as $$
  select public.custom_access_token_hook(
    jsonb_build_object('user_id', p_id, 'claims', jsonb_build_object('sub', p_id))) -> 'claims'
$$;
create function tests.add_factor(p_user uuid, p_status text) returns void
language sql as $$
  insert into auth.mfa_factors (id, user_id, friendly_name, factor_type, status, created_at, updated_at)
  values (gen_random_uuid(), p_user, 'Teléfono ' || p_status, 'totp', p_status::auth.factor_status, now(), now())
$$;
grant usage on schema tests to authenticated;
grant execute on all functions in schema tests to authenticated;

insert into auth.users (id, email, raw_user_meta_data) values
  ('e1000000-0000-0000-0000-000000000001', 'rosa@test.co', '{"role":"farmer","display_name":"Rosa"}'),
  ('e1000000-0000-0000-0000-000000000002', 'jairo@test.co', '{"role":"carrier","display_name":"Jairo"}'),
  ('e1000000-0000-0000-0000-000000000003', 'ops@test.co', '{"role":"buyer","display_name":"Ops"}');
update public.profiles set role = 'admin' where id = 'e1000000-0000-0000-0000-000000000003';

-- ---------------------------------------------------------------------------
-- mfa_enrolled claim
-- ---------------------------------------------------------------------------
select is(tests.claims('e1000000-0000-0000-0000-000000000001') -> 'mfa_enrolled', 'false'::jsonb,
  'no factor: mfa_enrolled is false');

select tests.add_factor('e1000000-0000-0000-0000-000000000001', 'unverified');
select is(tests.claims('e1000000-0000-0000-0000-000000000001') -> 'mfa_enrolled', 'false'::jsonb,
  'an unverified (abandoned) factor does not count');

select tests.add_factor('e1000000-0000-0000-0000-000000000001', 'verified');
select is(tests.claims('e1000000-0000-0000-0000-000000000001') -> 'mfa_enrolled', 'true'::jsonb,
  'a verified factor sets mfa_enrolled');

select is(tests.claims('e1000000-0000-0000-0000-000000000002') -> 'mfa_enrolled', 'false'::jsonb,
  'another user''s factor does not count');

select is(
  (tests.claims('e1000000-0000-0000-0000-000000000001') ->> 'user_role')
    || '/' || (tests.claims('e1000000-0000-0000-0000-000000000001') ->> 'verification'),
  'farmer/unverified', 'the role and verification claims are still there');

-- ---------------------------------------------------------------------------
-- admin data requires aal2, regardless of UI
-- ---------------------------------------------------------------------------
select tests.login('e1000000-0000-0000-0000-000000000003', 'aal1');
select is((select count(*) from public.profile_private where user_id <> 'e1000000-0000-0000-0000-000000000003'),
  0::bigint, 'an admin at aal1 cannot read other users'' PII');

reset role;
select tests.login('e1000000-0000-0000-0000-000000000003', 'aal2');
select is((select count(*) from public.profile_private where user_id <> 'e1000000-0000-0000-0000-000000000003'),
  2::bigint, 'an admin at aal2 can');

reset role;
select tests.login('e1000000-0000-0000-0000-000000000001', 'aal2');
select is((select count(*) from public.profile_private where user_id <> 'e1000000-0000-0000-0000-000000000001'),
  0::bigint, 'aal2 alone grants nothing to a non-admin');

select * from finish();
rollback;
