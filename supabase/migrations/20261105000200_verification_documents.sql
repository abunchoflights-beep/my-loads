-- =============================================================================
-- Mis Carguitas · 20261105000200 · Verification documents (S1-02)
-- submit_verification() now requires the supporting files in the kyc bucket,
-- and kyc uploads follow a fixed naming scheme and freeze with the PII.
--
-- Files: kyc/{uid}/{kind}-{uuid}.{pdf|jpg|png}
--   document  identity document (everyone, required)
--   license   driver's license (carriers, required)
--   rut       tax registration (farmers, optional)
-- =============================================================================

-- True while the caller may still edit their verification data and files.
create or replace function private.can_edit_verification()
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select coalesce(
    (select p.verification_status in ('unverified', 'rejected')
       from public.profiles p where p.id = (select auth.uid())),
    false);
$$;

grant execute on function private.can_edit_verification() to authenticated, service_role;

-- Does the caller have a file of this kind in their kyc folder?
create or replace function private.has_kyc_file(p_user_id uuid, p_kind text)
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1 from storage.objects o
     where o.bucket_id = 'kyc'
       and o.name like p_user_id::text || '/' || p_kind || '-%');
$$;

-- -----------------------------------------------------------------------------
-- submit_verification(): every missing field is reported at once in DETAIL
-- (comma-separated field names, never values), so the form can highlight them.
-- -----------------------------------------------------------------------------
create or replace function public.submit_verification()
returns public.verification_status
language plpgsql security definer
set search_path = ''
as $$
declare
  v_uid     uuid := auth.uid();
  v_role    public.app_role;
  v_pp      public.profile_private;
  v_missing text[] := array[]::text[];
begin
  if v_uid is null then raise exception 'AUTH_REQUIRED' using errcode = '42501'; end if;

  select p.role into v_role from public.profiles p where p.id = v_uid;
  select * into v_pp from public.profile_private where user_id = v_uid;

  if v_pp.legal_name is null then v_missing := array_append(v_missing, 'legal_name'); end if;
  if v_pp.document_type is null then v_missing := array_append(v_missing, 'document_type'); end if;
  if v_pp.document_number is null then v_missing := array_append(v_missing, 'document_number'); end if;
  if v_pp.phone is null then v_missing := array_append(v_missing, 'phone'); end if;
  if not private.has_kyc_file(v_uid, 'document') then v_missing := array_append(v_missing, 'document_file'); end if;
  if v_role = 'carrier' and not private.has_kyc_file(v_uid, 'license') then
    v_missing := array_append(v_missing, 'license_file');
  end if;

  if cardinality(v_missing) > 0 then
    raise exception 'VERIFICATION_INCOMPLETE'
      using errcode = '22023', detail = array_to_string(v_missing, ',');
  end if;

  update public.profiles
     set verification_status = 'pending'
   where id = v_uid and verification_status in ('unverified', 'rejected');
  if not found then raise exception 'VERIFICATION_NOT_ALLOWED' using errcode = '22023'; end if;

  update public.profile_private set submitted_at = now(), review_note = null where user_id = v_uid;
  return 'pending';
end;
$$;

grant execute on function public.submit_verification() to authenticated;

-- -----------------------------------------------------------------------------
-- kyc bucket: uploads only into your own folder, only with the expected file
-- names, and only while your verification is editable. Same for deletes, so a
-- wrong file can be replaced before submitting.
-- -----------------------------------------------------------------------------
drop policy if exists "kyc: owner uploads" on storage.objects;

create policy "kyc: owner uploads while editable" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'kyc'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and storage.filename(name) ~ '^(document|license|rut)-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(pdf|jpg|png)$'
    and (select private.can_edit_verification()));

create policy "kyc: owner deletes while editable" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'kyc'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and (select private.can_edit_verification()));
