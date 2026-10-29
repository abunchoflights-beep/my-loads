-- =============================================================================
-- Mis Carguitas · 0200 · Identity
-- profiles (public-safe), profile_private (PII), signup trigger, JWT hook,
-- role helpers used by every RLS policy, verification workflow.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- profiles: what other signed-in users may see about you.
-- -----------------------------------------------------------------------------
create table public.profiles (
  id                  uuid primary key references auth.users (id) on delete cascade,
  role                public.app_role not null,
  display_name        text not null check (char_length(display_name) between 2 and 80),
  business_name       text check (char_length(business_name) <= 120),
  country_code        char(2) not null default 'CO',
  -- DANE municipality code (5 digits) while we are Colombia-only.
  municipality_code   text check (municipality_code ~ '^[0-9]{5}$'),
  verification_status public.verification_status not null default 'unverified',
  rating_avg          numeric(3, 2) not null default 0 check (rating_avg between 0 and 5),
  rating_count        integer not null default 0 check (rating_count >= 0),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index profiles_role_idx on public.profiles (role);

create trigger profiles_touch before update on public.profiles
  for each row execute function private.touch_updated_at();

-- -----------------------------------------------------------------------------
-- profile_private: PII. Only the owner and an MFA-verified admin can read it.
-- Counterparties get a phone number only through get_order_contacts().
-- -----------------------------------------------------------------------------
create table public.profile_private (
  user_id         uuid primary key references public.profiles (id) on delete cascade,
  legal_name      text check (char_length(legal_name) <= 160),
  document_type   public.document_type,
  document_number text check (document_number ~ '^[0-9A-Za-z-]{4,20}$'),
  -- E.164, e.g. +573001234567
  phone           text check (phone ~ '^\+[1-9][0-9]{7,14}$'),
  review_note     text,
  submitted_at    timestamptz,
  reviewed_at     timestamptz,
  reviewed_by     uuid references public.profiles (id),
  updated_at      timestamptz not null default now()
);

create unique index profile_private_document_uq
  on public.profile_private (document_type, document_number)
  where document_number is not null;

create trigger profile_private_touch before update on public.profile_private
  for each row execute function private.touch_updated_at();

-- -----------------------------------------------------------------------------
-- Role helpers. SECURITY DEFINER so policies can read profiles without
-- recursing into profiles' own RLS. Always search_path = '' and qualified names.
-- The JWT `user_role` claim is for routing/UX only; these helpers read the DB,
-- so a stale token can never grant more than the database says today.
-- -----------------------------------------------------------------------------
create or replace function private.my_role()
returns public.app_role
language sql stable security definer
set search_path = ''
as $$
  select p.role from public.profiles p where p.id = (select auth.uid());
$$;

create or replace function private.is_verified()
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select coalesce(
    (select p.verification_status = 'verified' from public.profiles p where p.id = (select auth.uid())),
    false);
$$;

-- Admin powers require role = admin AND a second factor in this session (aal2).
create or replace function private.is_admin()
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select coalesce(private.my_role() = 'admin', false)
     and coalesce((select auth.jwt()) ->> 'aal', 'aal1') = 'aal2';
$$;

grant execute on function private.my_role(), private.is_verified(), private.is_admin()
  to authenticated, service_role;

-- -----------------------------------------------------------------------------
-- Signup: one profile per auth user. Role comes from signUp options.data.role
-- and may only be farmer | buyer | carrier. Admins are promoted by hand
-- (scripts/make-admin.sql), never through signup metadata.
-- -----------------------------------------------------------------------------
create or replace function private.handle_new_user()
returns trigger
language plpgsql security definer
set search_path = ''
as $$
declare
  v_role text := new.raw_user_meta_data ->> 'role';
  v_name text := btrim(coalesce(new.raw_user_meta_data ->> 'display_name', ''));
begin
  if v_role is null or v_role not in ('farmer', 'buyer', 'carrier') then
    raise exception 'SIGNUP_ROLE_INVALID' using errcode = '22023';
  end if;

  if char_length(v_name) < 2 then
    v_name := split_part(coalesce(new.email, 'usuario'), '@', 1);
  end if;

  insert into public.profiles (id, role, display_name)
  values (new.id, v_role::public.app_role, left(v_name, 80));

  insert into public.profile_private (user_id) values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

-- Defense in depth: even if a grant is widened by mistake, a client session
-- can never change its own role, verification or rating.
create or replace function private.guard_profile_columns()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if current_user in ('authenticated', 'anon') and (
       new.role is distinct from old.role
    or new.verification_status is distinct from old.verification_status
    or new.rating_avg is distinct from old.rating_avg
    or new.rating_count is distinct from old.rating_count) then
    raise exception 'PROFILE_PROTECTED_COLUMN' using errcode = '42501';
  end if;
  return new;
end;
$$;

create trigger profiles_guard before update on public.profiles
  for each row execute function private.guard_profile_columns();

-- -----------------------------------------------------------------------------
-- Custom access token hook: adds user_role + verification to the JWT.
-- Wired in supabase/config.toml [auth.hook.custom_access_token].
-- -----------------------------------------------------------------------------
create or replace function public.custom_access_token_hook(event jsonb)
returns jsonb
language plpgsql stable
set search_path = ''
as $$
declare
  v_claims jsonb := event -> 'claims';
  v_role   public.app_role;
  v_status public.verification_status;
begin
  select p.role, p.verification_status into v_role, v_status
  from public.profiles p
  where p.id = (event ->> 'user_id')::uuid;

  v_claims := jsonb_set(v_claims, '{user_role}', coalesce(to_jsonb(v_role), 'null'::jsonb));
  v_claims := jsonb_set(v_claims, '{verification}', coalesce(to_jsonb(v_status), 'null'::jsonb));
  return jsonb_set(event, '{claims}', v_claims);
end;
$$;

grant usage on schema public to supabase_auth_admin;
grant execute on function public.custom_access_token_hook(jsonb) to supabase_auth_admin;
revoke execute on function public.custom_access_token_hook(jsonb) from public, anon, authenticated;

-- -----------------------------------------------------------------------------
-- Privileges + RLS
-- -----------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.profile_private enable row level security;

revoke all on public.profiles, public.profile_private from anon, authenticated;

grant select on public.profiles to authenticated;
grant update (display_name, business_name, municipality_code) on public.profiles to authenticated;
grant select on public.profiles to supabase_auth_admin;

grant select on public.profile_private to authenticated;
grant update (legal_name, document_type, document_number, phone) on public.profile_private to authenticated;

create policy profiles_read_signed_in on public.profiles
  for select to authenticated using (true);

create policy profiles_update_self on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

create policy profiles_read_auth_hook on public.profiles
  for select to supabase_auth_admin using (true);

create policy profile_private_read_self_or_admin on public.profile_private
  for select to authenticated
  using (user_id = (select auth.uid()) or (select private.is_admin()));

-- PII is frozen while a review is pending or after approval; changing it
-- means asking support (so a verified identity can't be swapped later).
create policy profile_private_update_self on public.profile_private
  for update to authenticated
  using (
    user_id = (select auth.uid())
    and (select p.verification_status from public.profiles p where p.id = (select auth.uid()))
        in ('unverified', 'rejected'))
  with check (user_id = (select auth.uid()));

-- -----------------------------------------------------------------------------
-- Verification workflow RPCs
-- -----------------------------------------------------------------------------
create or replace function public.submit_verification()
returns public.verification_status
language plpgsql security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_pp  public.profile_private;
begin
  if v_uid is null then raise exception 'AUTH_REQUIRED' using errcode = '42501'; end if;

  select * into v_pp from public.profile_private where user_id = v_uid;
  if v_pp.legal_name is null or v_pp.document_type is null
     or v_pp.document_number is null or v_pp.phone is null then
    raise exception 'VERIFICATION_INCOMPLETE' using errcode = '22023';
  end if;

  update public.profiles
     set verification_status = 'pending'
   where id = v_uid and verification_status in ('unverified', 'rejected');
  if not found then raise exception 'VERIFICATION_NOT_ALLOWED' using errcode = '22023'; end if;

  update public.profile_private set submitted_at = now(), review_note = null where user_id = v_uid;
  return 'pending';
end;
$$;

create or replace function public.admin_review_verification(
  p_user_id uuid, p_approve boolean, p_note text default null)
returns public.verification_status
language plpgsql security definer
set search_path = ''
as $$
declare
  v_next public.verification_status := case when p_approve then 'verified' else 'rejected' end;
begin
  if not private.is_admin() then raise exception 'ADMIN_MFA_REQUIRED' using errcode = '42501'; end if;
  if p_user_id = auth.uid() then raise exception 'SELF_REVIEW_FORBIDDEN' using errcode = '42501'; end if;
  if not p_approve and coalesce(btrim(p_note), '') = '' then
    raise exception 'REJECTION_NOTE_REQUIRED' using errcode = '22023';
  end if;

  update public.profiles set verification_status = v_next
   where id = p_user_id and verification_status = 'pending';
  if not found then raise exception 'VERIFICATION_NOT_PENDING' using errcode = '22023'; end if;

  update public.profile_private
     set reviewed_at = now(), reviewed_by = auth.uid(), review_note = p_note
   where user_id = p_user_id;
  return v_next;
end;
$$;

create or replace function public.admin_set_suspended(p_user_id uuid, p_suspended boolean, p_note text)
returns public.verification_status
language plpgsql security definer
set search_path = ''
as $$
declare
  v_next public.verification_status := case when p_suspended then 'suspended' else 'verified' end;
begin
  if not private.is_admin() then raise exception 'ADMIN_MFA_REQUIRED' using errcode = '42501'; end if;
  if coalesce(btrim(p_note), '') = '' then raise exception 'NOTE_REQUIRED' using errcode = '22023'; end if;

  update public.profiles set verification_status = v_next
   where id = p_user_id
     and verification_status = case when p_suspended then 'verified'::public.verification_status
                                    else 'suspended'::public.verification_status end;
  if not found then raise exception 'INVALID_TRANSITION' using errcode = '22023'; end if;

  update public.profile_private set review_note = p_note, reviewed_at = now(), reviewed_by = auth.uid()
   where user_id = p_user_id;
  return v_next;
end;
$$;

grant execute on function public.submit_verification() to authenticated;
grant execute on function public.admin_review_verification(uuid, boolean, text) to authenticated;
grant execute on function public.admin_set_suspended(uuid, boolean, text) to authenticated;
