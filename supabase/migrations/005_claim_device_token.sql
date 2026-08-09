-- Claim FCM token for the current auth user (deactivate other owners of the same token).
-- Required for account-switch ownership under RLS (clients cannot update other users' rows).

begin;

create or replace function public.claim_device_token(p_token text, p_platform text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;
  if p_token is null or length(trim(p_token)) = 0 then
    raise exception 'Token required';
  end if;
  if p_platform not in ('ios', 'android') then
    raise exception 'Invalid platform';
  end if;

  update public.user_devices
  set is_active = false,
      updated_at = now()
  where fcm_token = p_token
    and user_id is distinct from v_uid
    and is_active = true;

  insert into public.user_devices (user_id, fcm_token, platform, is_active)
  values (v_uid, p_token, p_platform, true)
  on conflict (user_id, fcm_token)
  do update set
    is_active = true,
    platform = excluded.platform,
    updated_at = now();
end;
$$;

revoke all on function public.claim_device_token(text, text) from public;
grant execute on function public.claim_device_token(text, text) to authenticated;

commit;
