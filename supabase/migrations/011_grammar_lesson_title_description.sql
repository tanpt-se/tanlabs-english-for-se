-- Lessons use title + description (same shape as topics). Replaces summary.
-- Idempotent for fresh 007 (already title/description) and older DBs (summary).

alter table public.grammar_lessons
  add column if not exists title text;

alter table public.grammar_lessons
  add column if not exists description text;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'grammar_lessons'
      and column_name = 'summary'
  ) then
    update public.grammar_lessons
    set title = coalesce(nullif(title, ''), summary, slug)
    where title is null or title = '';
  else
    update public.grammar_lessons
    set title = coalesce(nullif(title, ''), slug)
    where title is null or title = '';
  end if;
end $$;

update public.grammar_lessons
set description = coalesce(
  nullif(description, ''),
  left(coalesce(content ->> 'usage', title, slug), 240)
)
where description is null or description = '';

alter table public.grammar_lessons
  alter column title set not null;

alter table public.grammar_lessons
  alter column description set not null;

alter table public.grammar_lessons
  drop column if exists summary;
