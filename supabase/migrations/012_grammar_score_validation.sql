-- Enforce score = round(correct / total * 100) on grammar attempt submit (PH2 hardening).

begin;

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
  v_expected_score integer;
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
