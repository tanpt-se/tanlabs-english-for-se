begin;

-- Lean Grammar v2: category grouping + curriculum isolation.
-- v1 rows stay in place (progress/attempts keep their FKs) but are unpublished.

alter table public.grammar_topics
  add column if not exists category_slug text;

alter table public.grammar_topics
  add column if not exists curriculum_version integer;

alter table public.grammar_topics
  add column if not exists is_optional boolean;

update public.grammar_topics
set
  curriculum_version = coalesce(curriculum_version, 1),
  is_optional = coalesce(is_optional, false),
  category_slug = coalesce(category_slug, 'legacy-v1')
where curriculum_version is null
   or category_slug is null
   or is_optional is null;

alter table public.grammar_topics
  alter column curriculum_version set default 1;

alter table public.grammar_topics
  alter column curriculum_version set not null;

alter table public.grammar_topics
  alter column is_optional set default false;

alter table public.grammar_topics
  alter column is_optional set not null;

alter table public.grammar_topics
  drop constraint if exists grammar_topics_curriculum_version_check;

alter table public.grammar_topics
  add constraint grammar_topics_curriculum_version_check
  check (curriculum_version >= 1);

alter table public.grammar_topics
  drop constraint if exists grammar_topics_category_slug_check;

alter table public.grammar_topics
  add constraint grammar_topics_category_slug_check
  check (
    category_slug in (
      'core-tenses',
      'timeline-planning',
      'sentence-structure',
      'workplace-communication',
      'legacy-v1'
    )
  );

-- Free v1 slugs so v2 can reuse product slugs. Idempotent: skip already-renamed rows.
update public.grammar_topics
set
  published = false,
  slug = slug || '-v1',
  category_slug = 'legacy-v1',
  curriculum_version = 1,
  is_optional = false,
  updated_at = now()
where curriculum_version = 1
  and slug not like '%-v1';

update public.grammar_topics
set published = false, updated_at = now()
where curriculum_version = 1
  and published = true;

update public.grammar_lessons as l
set published = false, updated_at = now()
from public.grammar_topics as t
where l.topic_id = t.id
  and t.curriculum_version = 1
  and l.published = true;

update public.grammar_exercises as e
set published = false, updated_at = now()
from public.grammar_topics as t
where e.topic_id = t.id
  and t.curriculum_version = 1
  and e.published = true;

create index if not exists grammar_topics_curriculum_published_order_idx
  on public.grammar_topics (curriculum_version, published, sort_order);

create index if not exists grammar_topics_category_published_order_idx
  on public.grammar_topics (category_slug, published, sort_order);

commit;
