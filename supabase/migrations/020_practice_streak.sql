begin;

-- Per-user practice streak (local calendar dates). Clients may cache offline;
-- writes go through merge_practice_streak so two devices union safely.

create table if not exists public.practice_streaks (
  user_id uuid primary key references auth.users (id) on delete cascade,
  practice_dates date[] not null default '{}'::date[],
  celebrated_dates date[] not null default '{}'::date[],
  updated_at timestamptz not null default now()
);

drop trigger if exists practice_streaks_set_updated_at on public.practice_streaks;
create trigger practice_streaks_set_updated_at
before update on public.practice_streaks
for each row execute function public.set_updated_at();

alter table public.practice_streaks enable row level security;

drop policy if exists "practice_streaks_select_own" on public.practice_streaks;
create policy "practice_streaks_select_own"
on public.practice_streaks for select
to authenticated
using (auth.uid() = user_id);

-- No direct client inserts/updates. Merge through RPC only.

create or replace function public.get_practice_streak()
returns public.practice_streaks
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_row public.practice_streaks;
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  select * into v_row
  from public.practice_streaks
  where user_id = v_uid;

  if not found then
    v_row.user_id := v_uid;
    v_row.practice_dates := '{}'::date[];
    v_row.celebrated_dates := '{}'::date[];
    v_row.updated_at := timezone('utc', now());
  end if;

  return v_row;
end;
$$;

create or replace function public.merge_practice_streak(
  p_practice_dates date[],
  p_celebrated_dates date[]
)
returns public.practice_streaks
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_existing public.practice_streaks;
  v_practice date[];
  v_celebrated date[];
  v_row public.practice_streaks;
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  select * into v_existing
  from public.practice_streaks
  where user_id = v_uid;

  select coalesce(array_agg(d order by d), '{}'::date[])
  into v_practice
  from (
    select d
    from (
      select unnest(coalesce(v_existing.practice_dates, '{}'::date[])) as d
      union
      select unnest(coalesce(p_practice_dates, '{}'::date[])) as d
    ) unioned
    where d is not null
      and d <= ((timezone('utc', now()))::date + 1)
    order by d desc
    limit 400
  ) trimmed;

  select coalesce(array_agg(d order by d), '{}'::date[])
  into v_celebrated
  from (
    select d
    from (
      select unnest(coalesce(v_existing.celebrated_dates, '{}'::date[])) as d
      union
      select unnest(coalesce(p_celebrated_dates, '{}'::date[])) as d
    ) unioned
    where d is not null
      and d <= ((timezone('utc', now()))::date + 1)
    order by d desc
    limit 400
  ) trimmed;

  insert into public.practice_streaks (user_id, practice_dates, celebrated_dates)
  values (v_uid, v_practice, v_celebrated)
  on conflict (user_id) do update
  set
    practice_dates = excluded.practice_dates,
    celebrated_dates = excluded.celebrated_dates
  returning * into v_row;

  return v_row;
end;
$$;

revoke all on function public.get_practice_streak() from public, anon;
grant execute on function public.get_practice_streak() to authenticated;

revoke all on function public.merge_practice_streak(date[], date[]) from public, anon;
grant execute on function public.merge_practice_streak(date[], date[]) to authenticated;

commit;
