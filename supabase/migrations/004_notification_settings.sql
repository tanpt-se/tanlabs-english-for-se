-- Per-user notification preference
begin;

create table if not exists public.notification_settings (
  user_id uuid primary key references auth.users (id) on delete cascade,
  enabled boolean not null default false,
  updated_at timestamptz not null default now()
);

drop trigger if exists notification_settings_set_updated_at on public.notification_settings;
create trigger notification_settings_set_updated_at
before update on public.notification_settings
for each row execute function public.set_updated_at();

alter table public.notification_settings enable row level security;

drop policy if exists "notification_settings_select_own" on public.notification_settings;
create policy "notification_settings_select_own"
on public.notification_settings for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "notification_settings_insert_own" on public.notification_settings;
create policy "notification_settings_insert_own"
on public.notification_settings for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "notification_settings_update_own" on public.notification_settings;
create policy "notification_settings_update_own"
on public.notification_settings for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "notification_settings_delete_own" on public.notification_settings;
create policy "notification_settings_delete_own"
on public.notification_settings for delete
to authenticated
using (auth.uid() = user_id);

commit;
