-- =============================================================================
-- Mis Carguitas · 20261105000300 · MFA claim (S1-05)
-- The access token now says whether the user has a verified second factor, so
-- the proxy can send an aal1 session to the code challenge on any route.
-- Routing only: RLS and RPCs still read aal from the token and roles from the
-- database (docs/SECURITY.md §2.5).
-- =============================================================================

create or replace function public.custom_access_token_hook(event jsonb)
returns jsonb
language plpgsql stable
set search_path = ''
as $$
declare
  v_claims  jsonb := event -> 'claims';
  v_user_id uuid  := (event ->> 'user_id')::uuid;
  v_role    public.app_role;
  v_status  public.verification_status;
  v_mfa     boolean;
begin
  select p.role, p.verification_status into v_role, v_status
  from public.profiles p
  where p.id = v_user_id;

  select exists (
    select 1 from auth.mfa_factors f
     where f.user_id = v_user_id and f.status = 'verified')
  into v_mfa;

  v_claims := jsonb_set(v_claims, '{user_role}', coalesce(to_jsonb(v_role), 'null'::jsonb));
  v_claims := jsonb_set(v_claims, '{verification}', coalesce(to_jsonb(v_status), 'null'::jsonb));
  v_claims := jsonb_set(v_claims, '{mfa_enrolled}', to_jsonb(coalesce(v_mfa, false)));
  return jsonb_set(event, '{claims}', v_claims);
end;
$$;

grant execute on function public.custom_access_token_hook(jsonb) to supabase_auth_admin;
revoke execute on function public.custom_access_token_hook(jsonb) from public, anon, authenticated;
