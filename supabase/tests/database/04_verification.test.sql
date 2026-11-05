-- S1-02 invariants: verification submission, supporting files, frozen PII,
-- one account per document, KYC files private, no PII in the audit log.
-- Run with: npm run db:test   (supabase test db, pgTAP)
begin;
select plan(23);

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
create function tests.kyc(p_owner uuid, p_kind text) returns text
language sql as $$ select p_owner::text || '/' || p_kind || '-' || gen_random_uuid()::text || '.pdf' $$;
-- Returns the DETAIL of the error a statement raises (the form relies on it).
create function tests.error_detail(p_sql text) returns text
language plpgsql as $$
declare v_detail text;
begin
  execute p_sql;
  return null;
exception when others then
  get stacked diagnostics v_detail = pg_exception_detail;
  return v_detail;
end $$;
grant usage on schema tests to authenticated;
grant execute on all functions in schema tests to authenticated;

-- C carrier, F farmer, B buyer (shares C's document later), A admin
select tests.new_user('c1000000-0000-0000-0000-000000000001', 'carrier', 'Don Jairo');
select tests.new_user('f1000000-0000-0000-0000-000000000001', 'farmer', 'Doña Rosa');
select tests.new_user('b1000000-0000-0000-0000-000000000001', 'buyer', 'Fruver');
select tests.new_user('a1000000-0000-0000-0000-000000000001', 'buyer', 'Operaciones');
update public.profiles set role = 'admin' where id = 'a1000000-0000-0000-0000-000000000001';

-- ---------------------------------------------------------------------------
-- missing fields are reported, never guessed
-- ---------------------------------------------------------------------------
select tests.login('c1000000-0000-0000-0000-000000000001');
select throws_ok($$ select public.submit_verification() $$, '22023', 'VERIFICATION_INCOMPLETE',
  'submitting an empty form fails with VERIFICATION_INCOMPLETE');

select is(tests.error_detail('select public.submit_verification()'),
  'legal_name,document_type,document_number,phone,document_file,license_file',
  'DETAIL lists every missing field, so the form can highlight them');

update public.profile_private
   set legal_name = 'Jairo Restrepo', document_type = 'CC', document_number = '71222333', phone = '+573005556677'
 where user_id = 'c1000000-0000-0000-0000-000000000001';

select throws_ok($$ select public.submit_verification() $$, '22023', 'VERIFICATION_INCOMPLETE',
  'PII without the supporting document is incomplete');

-- ---------------------------------------------------------------------------
-- file rules
-- ---------------------------------------------------------------------------
select lives_ok(
  $$ insert into storage.objects (bucket_id, name)
     values ('kyc', tests.kyc('c1000000-0000-0000-0000-000000000001', 'document')) $$,
  'the owner uploads a document into their own folder');

select throws_ok(
  $$ insert into storage.objects (bucket_id, name)
     values ('kyc', 'c1000000-0000-0000-0000-000000000001/selfie.pdf') $$,
  '42501', null, 'file names outside the scheme are refused');

select throws_ok(
  $$ insert into storage.objects (bucket_id, name)
     values ('kyc', tests.kyc('f1000000-0000-0000-0000-000000000001', 'document')) $$,
  '42501', null, 'nobody uploads into someone else''s folder');

select throws_ok($$ select public.submit_verification() $$, '22023', 'VERIFICATION_INCOMPLETE',
  'a carrier also needs the driver''s license');

insert into storage.objects (bucket_id, name)
values ('kyc', tests.kyc('c1000000-0000-0000-0000-000000000001', 'license'));

select is(public.submit_verification()::text, 'pending', 'carrier with document and license submits');

-- ---------------------------------------------------------------------------
-- frozen after submit
-- ---------------------------------------------------------------------------
update public.profile_private set legal_name = 'Otro Nombre'
 where user_id = 'c1000000-0000-0000-0000-000000000001';
select is(
  (select legal_name from public.profile_private where user_id = 'c1000000-0000-0000-0000-000000000001'),
  'Jairo Restrepo', 'PII cannot change while the review is pending');

select throws_ok(
  $$ insert into storage.objects (bucket_id, name)
     values ('kyc', tests.kyc('c1000000-0000-0000-0000-000000000001', 'document')) $$,
  '42501', null, 'files cannot be added while the review is pending');

delete from storage.objects where bucket_id = 'kyc'
   and name like 'c1000000-0000-0000-0000-000000000001/%';
reset role;
select is(
  (select count(*) from storage.objects where bucket_id = 'kyc'
      and name like 'c1000000-0000-0000-0000-000000000001/%'),
  2::bigint, 'files cannot be deleted while the review is pending');

-- ---------------------------------------------------------------------------
-- farmer: the RUT is optional
-- ---------------------------------------------------------------------------
select tests.login('f1000000-0000-0000-0000-000000000001');
update public.profile_private
   set legal_name = 'Rosa Úsuga', document_type = 'CC', document_number = '43111222', phone = '+573104445566'
 where user_id = 'f1000000-0000-0000-0000-000000000001';
insert into storage.objects (bucket_id, name)
values ('kyc', tests.kyc('f1000000-0000-0000-0000-000000000001', 'document'));
select is(public.submit_verification()::text, 'pending', 'farmer submits without a RUT');

-- ---------------------------------------------------------------------------
-- one account per document
-- ---------------------------------------------------------------------------
reset role;
select tests.login('b1000000-0000-0000-0000-000000000001');
select throws_ok(
  $$ update public.profile_private set document_type = 'CC', document_number = '71222333'
      where user_id = 'b1000000-0000-0000-0000-000000000001' $$,
  '23505', null, 'a document already used by another account is rejected');

select lives_ok(
  $$ update public.profile_private set document_type = 'CE', document_number = '71222333'
      where user_id = 'b1000000-0000-0000-0000-000000000001' $$,
  'the same number with another document type is a different document');

-- ---------------------------------------------------------------------------
-- KYC files are private
-- ---------------------------------------------------------------------------
select is(
  (select count(*) from storage.objects where bucket_id = 'kyc'
      and name like 'c1000000-0000-0000-0000-000000000001/%'),
  0::bigint, 'another user cannot list the carrier''s KYC files');

reset role;
select tests.login('a1000000-0000-0000-0000-000000000001', 'aal1');
select is(
  (select count(*) from storage.objects where bucket_id = 'kyc'
      and name like 'c1000000-0000-0000-0000-000000000001/%'),
  0::bigint, 'an admin without MFA cannot read KYC files');

reset role;
select tests.login('a1000000-0000-0000-0000-000000000001', 'aal2');
select is(
  (select count(*) from storage.objects where bucket_id = 'kyc'
      and name like 'c1000000-0000-0000-0000-000000000001/%'),
  2::bigint, 'an admin with MFA reads KYC files');

-- ---------------------------------------------------------------------------
-- rejected: fix and resubmit
-- ---------------------------------------------------------------------------
select is(
  public.admin_review_verification('c1000000-0000-0000-0000-000000000001', false, 'La cédula no se lee')::text,
  'rejected', 'admin rejects with a note');

reset role;
select tests.login('c1000000-0000-0000-0000-000000000001');
select is(
  (select review_note from public.profile_private where user_id = 'c1000000-0000-0000-0000-000000000001'),
  'La cédula no se lee', 'the user sees the admin''s note');

select lives_ok(
  $$ delete from storage.objects where bucket_id = 'kyc'
       and name like 'c1000000-0000-0000-0000-000000000001/document-%' $$,
  'after a rejection the user can remove the unreadable file');

insert into storage.objects (bucket_id, name)
values ('kyc', tests.kyc('c1000000-0000-0000-0000-000000000001', 'document'));
select is(public.submit_verification()::text, 'pending', 'the user resubmits after fixing it');

select is(
  (select review_note from public.profile_private where user_id = 'c1000000-0000-0000-0000-000000000001'),
  null, 'resubmitting clears the old note');

-- ---------------------------------------------------------------------------
-- audit log never stores PII
-- ---------------------------------------------------------------------------
reset role;
select ok(
  not exists (
    select 1 from public.audit_log
     where table_name = 'profile_private'
       and (coalesce(new_row, '{}') ?| array['legal_name', 'document_number', 'phone']
         or coalesce(old_row, '{}') ?| array['legal_name', 'document_number', 'phone'])),
  'audit rows for profile_private carry no PII');

select * from finish();
rollback;
