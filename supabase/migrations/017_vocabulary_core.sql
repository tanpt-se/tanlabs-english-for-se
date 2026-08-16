begin;

-- Lean Vocabulary: core expressions + dictionary extras. Library rows stay published.

alter table public.vocabulary_items
  add column if not exists is_core boolean;

alter table public.vocabulary_items
  add column if not exists core_order integer;

alter table public.vocabulary_items
  add column if not exists pronunciation text;

alter table public.vocabulary_items
  add column if not exists countability text;

update public.vocabulary_items
set is_core = coalesce(is_core, false)
where is_core is null;

alter table public.vocabulary_items
  alter column is_core set default false;

alter table public.vocabulary_items
  alter column is_core set not null;

alter table public.vocabulary_items
  drop constraint if exists vocabulary_items_core_order_check;

alter table public.vocabulary_items
  add constraint vocabulary_items_core_order_check
  check (
    (is_core = false and core_order is null)
    or (is_core = true and core_order between 1 and 10)
  );

alter table public.vocabulary_items
  drop constraint if exists vocabulary_items_countability_check;

alter table public.vocabulary_items
  add constraint vocabulary_items_countability_check
  check (
    countability is null
    or countability in ('countable', 'uncountable', 'both', 'na')
  );

drop index if exists vocabulary_items_core_order_uniq;
create unique index vocabulary_items_core_order_uniq
  on public.vocabulary_items (situation_id, core_order)
  where is_core = true;

create index if not exists vocabulary_items_core_situation_idx
  on public.vocabulary_items (situation_id, is_core, core_order)
  where published = true;

create index if not exists vocabulary_items_library_search_idx
  on public.vocabulary_items (published, is_core desc, sort_order);

create index if not exists vocabulary_items_term_lower_idx
  on public.vocabulary_items (lower(term));

commit;
