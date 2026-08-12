-- Grammar topics are tense-shared; CEFR level lives on lessons.
-- Idempotent for DBs that already applied older 007/009 (topic.level) and for
-- fresh installs where 007 already defines lesson.level without topic.level.

alter table public.grammar_lessons
  add column if not exists level text;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'grammar_topics'
      and column_name = 'level'
  ) then
    update public.grammar_lessons l
    set level = t.level
    from public.grammar_topics t
    where l.topic_id = t.id
      and l.level is null
      and t.level is not null;
  end if;
end $$;

update public.grammar_lessons
set level = 'A2'
where level is null;

alter table public.grammar_lessons
  alter column level set not null;

alter table public.grammar_lessons
  drop constraint if exists grammar_lessons_level_check;

alter table public.grammar_lessons
  add constraint grammar_lessons_level_check
  check (level in ('A2', 'B1', 'B2', 'C1'));

alter table public.grammar_topics
  drop constraint if exists grammar_topics_level_check;

alter table public.grammar_topics
  drop column if exists level;
