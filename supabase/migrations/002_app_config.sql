-- Remote feature flags / app config (read-only for clients)
begin;

create table if not exists public.app_config (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

drop trigger if exists app_config_set_updated_at on public.app_config;
create trigger app_config_set_updated_at
before update on public.app_config
for each row execute function public.set_updated_at();

alter table public.app_config enable row level security;

drop policy if exists "app_config_select_all" on public.app_config;
create policy "app_config_select_all"
on public.app_config for select
to authenticated, anon
using (true);

commit;
