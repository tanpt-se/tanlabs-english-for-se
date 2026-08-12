begin;

-- PH2 Grammar content + private learning history.
create table if not exists public.grammar_topics (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text not null,
  sort_order integer not null check (sort_order > 0),
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.grammar_lessons (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid not null references public.grammar_topics (id) on delete cascade,
  slug text not null,
  title text not null,
  description text not null,
  level text not null check (level in ('A2', 'B1', 'B2', 'C1')),
  content jsonb not null,
  content_schema_version integer not null check (content_schema_version >= 1),
  content_revision integer not null check (content_revision >= 1),
  sort_order integer not null check (sort_order > 0),
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (topic_id, slug)
);

create table if not exists public.grammar_exercises (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid not null references public.grammar_topics (id) on delete cascade,
  lesson_id uuid not null references public.grammar_lessons (id) on delete cascade,
  exercise_key text not null,
  type text not null check (type in ('multiple_choice', 'fill_blank', 'sentence_order')),
  prompt text not null,
  payload jsonb not null,
  answer jsonb not null,
  explanation text not null,
  content_schema_version integer not null check (content_schema_version >= 1),
  sort_order integer not null check (sort_order > 0),
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (lesson_id, exercise_key)
);

create table if not exists public.user_grammar_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  topic_id uuid not null references public.grammar_topics (id) on delete cascade,
  lesson_id uuid not null references public.grammar_lessons (id) on delete cascade,
  status text not null check (status in ('not_started', 'in_progress', 'completed')),
  best_score integer not null default 0 check (best_score between 0 and 100),
  last_score integer not null default 0 check (last_score between 0 and 100),
  last_activity_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, lesson_id)
);

create table if not exists public.grammar_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  client_attempt_id uuid not null,
  topic_id uuid not null references public.grammar_topics (id) on delete cascade,
  lesson_id uuid not null references public.grammar_lessons (id) on delete cascade,
  content_revision integer not null check (content_revision >= 1),
  correct_count integer not null check (correct_count >= 0),
  total_count integer not null check (total_count > 0),
  score integer not null check (score between 0 and 100),
  answers jsonb not null,
  started_at timestamptz not null,
  completed_at timestamptz not null,
  created_at timestamptz not null default now(),
  unique (user_id, client_attempt_id)
);

create index if not exists grammar_topics_published_order_idx
  on public.grammar_topics (published, sort_order);
create index if not exists grammar_lessons_topic_published_order_idx
  on public.grammar_lessons (topic_id, published, sort_order);
create index if not exists grammar_exercises_lesson_published_order_idx
  on public.grammar_exercises (lesson_id, published, sort_order);
create index if not exists user_grammar_progress_user_activity_idx
  on public.user_grammar_progress (user_id, last_activity_at desc nulls last);
create index if not exists grammar_attempts_user_completed_idx
  on public.grammar_attempts (user_id, completed_at desc);

drop trigger if exists grammar_topics_set_updated_at on public.grammar_topics;
create trigger grammar_topics_set_updated_at
before update on public.grammar_topics
for each row execute function public.set_updated_at();

drop trigger if exists grammar_lessons_set_updated_at on public.grammar_lessons;
create trigger grammar_lessons_set_updated_at
before update on public.grammar_lessons
for each row execute function public.set_updated_at();

drop trigger if exists grammar_exercises_set_updated_at on public.grammar_exercises;
create trigger grammar_exercises_set_updated_at
before update on public.grammar_exercises
for each row execute function public.set_updated_at();

drop trigger if exists user_grammar_progress_set_updated_at on public.user_grammar_progress;
create trigger user_grammar_progress_set_updated_at
before update on public.user_grammar_progress
for each row execute function public.set_updated_at();

alter table public.grammar_topics enable row level security;
alter table public.grammar_lessons enable row level security;
alter table public.grammar_exercises enable row level security;
alter table public.user_grammar_progress enable row level security;
alter table public.grammar_attempts enable row level security;

drop policy if exists "grammar_topics_select_published" on public.grammar_topics;
create policy "grammar_topics_select_published"
on public.grammar_topics for select
to authenticated
using (published = true);

drop policy if exists "grammar_lessons_select_published" on public.grammar_lessons;
create policy "grammar_lessons_select_published"
on public.grammar_lessons for select
to authenticated
using (published = true);

drop policy if exists "grammar_exercises_select_published" on public.grammar_exercises;
create policy "grammar_exercises_select_published"
on public.grammar_exercises for select
to authenticated
using (published = true);

drop policy if exists "user_grammar_progress_select_own" on public.user_grammar_progress;
create policy "user_grammar_progress_select_own"
on public.user_grammar_progress for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "grammar_attempts_select_own" on public.grammar_attempts;
create policy "grammar_attempts_select_own"
on public.grammar_attempts for select
to authenticated
using (auth.uid() = user_id);

-- No direct client writes on content or learning history tables.
-- Completions go through complete_grammar_attempt only.

create or replace function public.complete_grammar_attempt(
  p_client_attempt_id uuid,
  p_topic_id uuid,
  p_lesson_id uuid,
  p_content_revision integer,
  p_correct_count integer,
  p_total_count integer,
  p_score integer,
  p_answers jsonb,
  p_started_at timestamptz,
  p_completed_at timestamptz
)
returns public.grammar_attempts
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_existing public.grammar_attempts;
  v_completed boolean;
  v_progress public.user_grammar_progress;
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
  if p_answers is null or jsonb_typeof(p_answers) <> 'array' then
    raise exception 'Invalid answers';
  end if;
  if p_started_at is null or p_completed_at is null or p_completed_at < p_started_at then
    raise exception 'Invalid timestamps';
  end if;

  if not exists (
    select 1
    from public.grammar_topics t
    join public.grammar_lessons l on l.topic_id = t.id
    where t.id = p_topic_id
      and l.id = p_lesson_id
      and t.published = true
      and l.published = true
  ) then
    raise exception 'Unknown or unpublished lesson';
  end if;

  select * into v_existing
  from public.grammar_attempts
  where user_id = v_uid
    and client_attempt_id = p_client_attempt_id;

  if found then
    return v_existing;
  end if;

  insert into public.grammar_attempts (
    user_id,
    client_attempt_id,
    topic_id,
    lesson_id,
    content_revision,
    correct_count,
    total_count,
    score,
    answers,
    started_at,
    completed_at
  )
  values (
    v_uid,
    p_client_attempt_id,
    p_topic_id,
    p_lesson_id,
    p_content_revision,
    p_correct_count,
    p_total_count,
    p_score,
    p_answers,
    p_started_at,
    p_completed_at
  )
  returning * into v_existing;

  v_completed := p_score >= 70;

  select * into v_progress
  from public.user_grammar_progress
  where user_id = v_uid
    and lesson_id = p_lesson_id
  for update;

  if found then
    update public.user_grammar_progress
    set
      topic_id = p_topic_id,
      last_score = p_score,
      best_score = greatest(best_score, p_score),
      status = case
        when status = 'completed' or v_completed then 'completed'
        else 'in_progress'
      end,
      completed_at = case
        when completed_at is not null then completed_at
        when v_completed then p_completed_at
        else null
      end,
      last_activity_at = p_completed_at,
      updated_at = now()
    where id = v_progress.id;
  else
    insert into public.user_grammar_progress (
      user_id,
      topic_id,
      lesson_id,
      status,
      best_score,
      last_score,
      last_activity_at,
      completed_at
    )
    values (
      v_uid,
      p_topic_id,
      p_lesson_id,
      case when v_completed then 'completed' else 'in_progress' end,
      p_score,
      p_score,
      p_completed_at,
      case when v_completed then p_completed_at else null end
    );
  end if;

  return v_existing;
end;
$$;

revoke all on function public.complete_grammar_attempt(
  uuid, uuid, uuid, integer, integer, integer, integer, jsonb, timestamptz, timestamptz
) from public;
grant execute on function public.complete_grammar_attempt(
  uuid, uuid, uuid, integer, integer, integer, integer, jsonb, timestamptz, timestamptz
) to authenticated;

commit;
