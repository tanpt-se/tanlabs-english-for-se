begin;

alter table public.profiles
drop constraint if exists profiles_display_name_length;

alter table public.profiles
add constraint profiles_display_name_length
check (char_length(btrim(display_name)) between 2 and 40);

alter table public.user_devices
drop constraint if exists user_devices_fcm_token_length;

alter table public.user_devices
add constraint user_devices_fcm_token_length
check (char_length(btrim(fcm_token)) between 1 and 4096);

create or replace function public.claim_device_token(p_token text, p_platform text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;
  if p_token is null or length(trim(p_token)) = 0 or length(p_token) > 4096 then
    raise exception 'Invalid token';
  end if;
  if p_platform not in ('ios', 'android') then
    raise exception 'Invalid platform';
  end if;
  if not exists (
    select 1
    from public.notification_settings
    where user_id = v_uid
      and enabled = true
  ) then
    raise exception 'Notifications disabled';
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

drop policy if exists "user_devices_insert_own" on public.user_devices;
create policy "user_devices_insert_own"
on public.user_devices for insert
to authenticated
with check (
  auth.uid() = user_id
  and (
    is_active = false
    or exists (
      select 1
      from public.notification_settings
      where notification_settings.user_id = auth.uid()
        and notification_settings.enabled = true
    )
  )
);

drop policy if exists "user_devices_update_own" on public.user_devices;
create policy "user_devices_update_own"
on public.user_devices for update
to authenticated
using (auth.uid() = user_id)
with check (
  auth.uid() = user_id
  and (
    is_active = false
    or exists (
      select 1
      from public.notification_settings
      where notification_settings.user_id = auth.uid()
        and notification_settings.enabled = true
    )
  )
);

create or replace function public.deactivate_devices_when_notifications_disabled()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.enabled = false then
    update public.user_devices
    set is_active = false,
        updated_at = now()
    where user_id = new.user_id
      and is_active = true;
  end if;
  return new;
end;
$$;

drop trigger if exists notification_settings_deactivate_devices
on public.notification_settings;
create trigger notification_settings_deactivate_devices
after insert or update of enabled on public.notification_settings
for each row execute function public.deactivate_devices_when_notifications_disabled();

revoke all on function public.deactivate_devices_when_notifications_disabled() from public;

commit;
