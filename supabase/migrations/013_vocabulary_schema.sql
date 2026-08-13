begin;

-- PH3 Vocabulary content + private per-item progress / attempts.
-- Migration head after PH2: 012_grammar_score_validation.sql → 013_vocabulary_schema.sql

create table if not exists public.vocabulary_situations (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text not null,
  sort_order integer not null check (sort_order > 0),
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.vocabulary_items (
  id uuid primary key default gen_random_uuid(),
  situation_id uuid not null references public.vocabulary_situations (id) on delete cascade,
  item_key text not null,
  type text not null check (type in ('word', 'phrase', 'expression')),
  term text not null,
  meaning text not null,
  context text not null,
  level text not null check (level in ('A2', 'B1', 'B2', 'C1')),
  pos text,
  content jsonb not null default '{}'::jsonb,
  content_schema_version integer not null check (content_schema_version >= 1),
  content_revision integer not null check (content_revision >= 1),
  sort_order integer not null check (sort_order > 0),
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (situation_id, item_key)
);

create table if not exists public.vocabulary_exercises (
  id uuid primary key default gen_random_uuid(),
  situation_id uuid not null references public.vocabulary_situations (id) on delete cascade,
  item_id uuid references public.vocabulary_items (id) on delete cascade,
  exercise_key text not null,
  type text not null check (type in ('choose_expression', 'fill_blank', 'sentence_order')),
  prompt text not null,
  payload jsonb not null,
  feedback jsonb not null,
  content_schema_version integer not null check (content_schema_version >= 1),
  sort_order integer not null check (sort_order > 0),
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (situation_id, exercise_key)
);

create table if not exists public.user_vocabulary_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  situation_id uuid not null references public.vocabulary_situations (id) on delete cascade,
  item_id uuid not null references public.vocabulary_items (id) on delete cascade,
  correct_count integer not null default 0 check (correct_count >= 0),
  incorrect_count integer not null default 0 check (incorrect_count >= 0),
  last_result boolean,
  last_seen_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, item_id)
);

create table if not exists public.vocabulary_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  client_attempt_id uuid not null,
  situation_id uuid not null references public.vocabulary_situations (id) on delete cascade,
  content_revision integer not null check (content_revision >= 1),
  correct_count integer not null check (correct_count >= 0),
  total_count integer not null check (total_count > 0),
  score integer not null check (score between 0 and 100),
  item_results jsonb not null,
  started_at timestamptz not null,
  completed_at timestamptz not null,
  created_at timestamptz not null default now(),
  unique (user_id, client_attempt_id)
);

create index if not exists vocabulary_situations_published_order_idx
  on public.vocabulary_situations (published, sort_order);
create index if not exists vocabulary_items_situation_published_order_idx
  on public.vocabulary_items (situation_id, published, sort_order);
create index if not exists vocabulary_exercises_situation_published_order_idx
  on public.vocabulary_exercises (situation_id, published, sort_order);
create index if not exists vocabulary_exercises_item_published_order_idx
  on public.vocabulary_exercises (item_id, published, sort_order);
create index if not exists user_vocabulary_progress_user_weak_idx
  on public.user_vocabulary_progress (
    user_id,
    last_seen_at asc nulls first,
    situation_id,
    item_id
  );
create index if not exists vocabulary_attempts_user_completed_idx
  on public.vocabulary_attempts (user_id, completed_at desc);

drop trigger if exists vocabulary_situations_set_updated_at on public.vocabulary_situations;
create trigger vocabulary_situations_set_updated_at
before update on public.vocabulary_situations
for each row execute function public.set_updated_at();

drop trigger if exists vocabulary_items_set_updated_at on public.vocabulary_items;
create trigger vocabulary_items_set_updated_at
before update on public.vocabulary_items
for each row execute function public.set_updated_at();

drop trigger if exists vocabulary_exercises_set_updated_at on public.vocabulary_exercises;
create trigger vocabulary_exercises_set_updated_at
before update on public.vocabulary_exercises
for each row execute function public.set_updated_at();

drop trigger if exists user_vocabulary_progress_set_updated_at on public.user_vocabulary_progress;
create trigger user_vocabulary_progress_set_updated_at
before update on public.user_vocabulary_progress
for each row execute function public.set_updated_at();

alter table public.vocabulary_situations enable row level security;
alter table public.vocabulary_items enable row level security;
alter table public.vocabulary_exercises enable row level security;
alter table public.user_vocabulary_progress enable row level security;
alter table public.vocabulary_attempts enable row level security;

drop policy if exists "vocabulary_situations_select_published" on public.vocabulary_situations;
create policy "vocabulary_situations_select_published"
on public.vocabulary_situations for select
to authenticated
using (published = true);

drop policy if exists "vocabulary_items_select_published" on public.vocabulary_items;
create policy "vocabulary_items_select_published"
on public.vocabulary_items for select
to authenticated
using (published = true);

drop policy if exists "vocabulary_exercises_select_published" on public.vocabulary_exercises;
create policy "vocabulary_exercises_select_published"
on public.vocabulary_exercises for select
to authenticated
using (published = true);

drop policy if exists "user_vocabulary_progress_select_own" on public.user_vocabulary_progress;
create policy "user_vocabulary_progress_select_own"
on public.user_vocabulary_progress for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "vocabulary_attempts_select_own" on public.vocabulary_attempts;
create policy "vocabulary_attempts_select_own"
on public.vocabulary_attempts for select
to authenticated
using (auth.uid() = user_id);

-- No direct client writes on content or learning history.
-- Completions go through complete_vocabulary_attempt only.

create or replace function public.complete_vocabulary_attempt(
  p_client_attempt_id uuid,
  p_situation_id uuid,
  p_content_revision integer,
  p_correct_count integer,
  p_total_count integer,
  p_score integer,
  p_item_results jsonb,
  p_started_at timestamptz,
  p_completed_at timestamptz
)
returns public.vocabulary_attempts
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_existing public.vocabulary_attempts;
  v_expected_score integer;
  v_item jsonb;
  v_item_id uuid;
  v_correct boolean;
  v_seen_ids uuid[] := array[]::uuid[];
  v_progress public.user_vocabulary_progress;
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;
  if p_client_attempt_id is null then
    raise exception 'Invalid client attempt id';
  end if;
  if p_content_revision is null or p_content_revision < 1 then
    raise exception 'Invalid content revision';
  end if;
  if p_correct_count is null or p_correct_count < 0 then
    raise exception 'Invalid correct count';
  end if;
  if p_total_count is null or p_total_count <= 0 or p_correct_count > p_total_count then
    raise exception 'Invalid total count';
  end if;
  if p_score is null or p_score < 0 or p_score > 100 then
    raise exception 'Invalid score';
  end if;
  v_expected_score := round((p_correct_count::numeric / p_total_count::numeric) * 100);
  if p_score <> v_expected_score then
    raise exception 'Score mismatch';
  end if;
  if p_item_results is null or jsonb_typeof(p_item_results) <> 'array' then
    raise exception 'Invalid item results';
  end if;
  if jsonb_array_length(p_item_results) = 0 then
    raise exception 'Item results required';
  end if;
  if p_started_at is null or p_completed_at is null or p_completed_at < p_started_at then
    raise exception 'Invalid timestamps';
  end if;

  if not exists (
    select 1
    from public.vocabulary_situations s
    where s.id = p_situation_id
      and s.published = true
  ) then
    raise exception 'Unknown or unpublished situation';
  end if;

  select * into v_existing
  from public.vocabulary_attempts
  where user_id = v_uid
    and client_attempt_id = p_client_attempt_id;

  if found then
    return v_existing;
  end if;

  for v_item in select * from jsonb_array_elements(p_item_results)
  loop
    begin
      v_item_id := (v_item ->> 'itemId')::uuid;
    exception
      when others then
        raise exception 'Invalid itemId';
    end;
    if v_item_id is null then
      raise exception 'Invalid itemId';
    end if;
    if v_item_id = any (v_seen_ids) then
      raise exception 'Duplicate itemId';
    end if;
    v_seen_ids := array_append(v_seen_ids, v_item_id);
    if jsonb_typeof(v_item -> 'correct') <> 'boolean' then
      raise exception 'Invalid item correct flag';
    end if;
    v_correct := (v_item ->> 'correct')::boolean;

    if not exists (
      select 1
      from public.vocabulary_items i
      where i.id = v_item_id
        and i.situation_id = p_situation_id
        and i.published = true
    ) then
      raise exception 'Unknown or unpublished item';
    end if;

    select * into v_progress
    from public.user_vocabulary_progress
    where user_id = v_uid
      and item_id = v_item_id
    for update;

    if found then
      update public.user_vocabulary_progress
      set
        situation_id = p_situation_id,
        correct_count = correct_count + case when v_correct then 1 else 0 end,
        incorrect_count = incorrect_count + case when v_correct then 0 else 1 end,
        last_result = v_correct,
        last_seen_at = p_completed_at,
        updated_at = now()
      where id = v_progress.id;
    else
      insert into public.user_vocabulary_progress (
        user_id,
        situation_id,
        item_id,
        correct_count,
        incorrect_count,
        last_result,
        last_seen_at
      )
      values (
        v_uid,
        p_situation_id,
        v_item_id,
        case when v_correct then 1 else 0 end,
        case when v_correct then 0 else 1 end,
        v_correct,
        p_completed_at
      );
    end if;
  end loop;

  insert into public.vocabulary_attempts (
    user_id,
    client_attempt_id,
    situation_id,
    content_revision,
    correct_count,
    total_count,
    score,
    item_results,
    started_at,
    completed_at
  )
  values (
    v_uid,
    p_client_attempt_id,
    p_situation_id,
    p_content_revision,
    p_correct_count,
    p_total_count,
    p_score,
    p_item_results,
    p_started_at,
    p_completed_at
  )
  returning * into v_existing;

  return v_existing;
end;
$$;

revoke all on function public.complete_vocabulary_attempt(
  uuid, uuid, integer, integer, integer, integer, jsonb, timestamptz, timestamptz
) from public;
grant execute on function public.complete_vocabulary_attempt(
  uuid, uuid, integer, integer, integer, integer, jsonb, timestamptz, timestamptz
) to authenticated;

commit;
