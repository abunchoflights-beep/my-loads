-- S1-06 invariants: DANE municipalities reference table, search, foreign keys.
-- Run with: npm run db:test   (supabase test db, pgTAP)
begin;
select plan(15);

create schema tests;
create function tests.login(p_id uuid) returns void
language plpgsql as $$
begin
  perform set_config('request.jwt.claims',
    json_build_object('sub', p_id, 'role', 'authenticated', 'aal', 'aal1')::text, true);
  perform set_config('role', 'authenticated', true);
end $$;
grant usage on schema tests to authenticated;
grant execute on all functions in schema tests to authenticated;

insert into auth.users (id, email, raw_user_meta_data) values
  ('a0000000-0000-0000-0000-000000000001', 'rosa@test.co', '{"role":"farmer","display_name":"Rosa"}');

-- ---------------------------------------------------------------------------
-- data
-- ---------------------------------------------------------------------------
select is((select count(*) from public.municipalities), 1122::bigint,
  'all 1,122 DIVIPOLA entries are loaded');

select is(
  (select name || ', ' || department_name from public.municipalities where code = '05045'),
  'Apartadó, Antioquia', 'codes resolve to the official name and department');

select is((select search_name from public.municipalities where code = '05045'), 'apartado',
  'search_name drops accents and case');

-- ---------------------------------------------------------------------------
-- search (as a signed-in user)
-- ---------------------------------------------------------------------------
select tests.login('a0000000-0000-0000-0000-000000000001');

select is((select code from public.search_municipalities('apar') limit 1), '05045',
  '"apar" finds Apartadó first');

select is((select code from public.search_municipalities('MEDELLÍN') limit 1), '05001',
  'search ignores case and accents');

select is((select code from public.search_municipalities('bogota') limit 1), '11001',
  'Bogotá, D.C. is found without accents or punctuation');

select is((select count(*) from public.search_municipalities('a')), 0::bigint,
  'a one-character query returns nothing');

select is((select count(*) from public.search_municipalities('%')), 0::bigint,
  'LIKE wildcards are stripped, not interpreted');

select is((select count(*) from public.search_municipalities('san', 500)), 50::bigint,
  'the result size is capped at 50');

select ok(
  (select bool_and(search_name like 'san%')
     from (select search_name from public.search_municipalities('san', 5)) s),
  'prefix matches rank before matches inside the name');

-- ---------------------------------------------------------------------------
-- privileges
-- ---------------------------------------------------------------------------
select throws_ok(
  $$ insert into public.municipalities (code, name, department_code, department_name, kind, centroid_lat, centroid_lng)
     values ('05999', 'Inventado', '05', 'Antioquia', 'municipio', 6, -75) $$,
  '42501', null, 'signed-in users cannot add municipalities');

select throws_ok($$ update public.municipalities set name = 'X' where code = '05045' $$,
  '42501', null, 'signed-in users cannot rename municipalities');

reset role;
select set_config('request.jwt.claims', '{}', true);
set local role anon;
select is((select count(*) from public.municipalities where code = '11001'), 1::bigint,
  'anonymous visitors can read the reference table');

select throws_ok($$ select * from public.search_municipalities('apar') $$,
  '42501', null, 'search is for signed-in users only');

-- ---------------------------------------------------------------------------
-- foreign keys
-- ---------------------------------------------------------------------------
reset role;
select throws_ok(
  $$ insert into public.farms (owner_id, name, municipality_code)
     values ('a0000000-0000-0000-0000-000000000001', 'Finca Fantasma', '99999') $$,
  '23503', null, 'a farm cannot point at a code that is not in DIVIPOLA');

select * from finish();
rollback;
