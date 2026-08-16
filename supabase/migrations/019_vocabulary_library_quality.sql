begin;

-- Rank the 2500-term library (cores first, then phrase/collocation quality).
-- Insert missing core practice items so situation sessions can stay on the core list.
-- Forward-only. Does not rewrite 014.

alter table public.vocabulary_items
  add column if not exists library_rank integer;

update public.vocabulary_items
set library_rank = case
  when is_core then coalesce(core_order, 0)
  else
    10000
    + case type
        when 'expression' then 0
        when 'phrase' then 1000
        else 2000
      end
    + case
        when jsonb_typeof(coalesce(content->'examples', '[]'::jsonb)) = 'array'
         and jsonb_array_length(coalesce(content->'examples', '[]'::jsonb)) > 0
        then 0 else 400
      end
    + case
        when jsonb_typeof(coalesce(content->'patterns', '[]'::jsonb)) = 'array'
         and jsonb_array_length(coalesce(content->'patterns', '[]'::jsonb)) > 0
        then 0 else 200
      end
    + least(greatest(sort_order, 0), 999)
end;

alter table public.vocabulary_items
  alter column library_rank set default 12200;

alter table public.vocabulary_items
  alter column library_rank set not null;

create index if not exists vocabulary_items_library_rank_idx
  on public.vocabulary_items (published, is_core desc, library_rank, sort_order);

insert into public.vocabulary_exercises (
  situation_id,
  item_id,
  exercise_key,
  type,
  prompt,
  payload,
  feedback,
  content_schema_version,
  sort_order,
  published
)
select
  i.situation_id,
  i.id,
  'core-' || i.item_key || '-ce',
  'choose_expression',
  i.meaning,
  jsonb_build_object(
    'options', jsonb_build_array(
      jsonb_build_object('id', 'opt_a', 'text', i.term),
      jsonb_build_object('id', 'opt_b', 'text', coalesce(d.t1, 'ship')),
      jsonb_build_object('id', 'opt_c', 'text', coalesce(d.t2, 'blocker')),
      jsonb_build_object('id', 'opt_d', 'text', coalesce(d.t3, 'hotfix'))
    ),
    'correctOptionId', 'opt_a'
  ),
  jsonb_build_object(
    'expression', i.term,
    'meaning', i.meaning,
    'context', i.context,
    'explanation', 'Choose the core expression that fits this workplace update.'
  ),
  1,
  1,
  true
from public.vocabulary_items i
left join lateral (
  select
    max(case when x.ord = 1 then x.term end) as t1,
    max(case when x.ord = 2 then x.term end) as t2,
    max(case when x.ord = 3 then x.term end) as t3
  from (
    select d.term, row_number() over (order by d.core_order nulls last, d.id) as ord
    from public.vocabulary_items d
    where d.situation_id = i.situation_id
      and d.is_core = true
      and d.published = true
      and d.id <> i.id
    limit 3
  ) x
) d on true
where i.is_core = true
  and i.published = true
  and not exists (
    select 1
    from public.vocabulary_exercises e
    where e.item_id = i.id
      and e.type = 'choose_expression'
  )
on conflict (situation_id, exercise_key) do nothing;

insert into public.vocabulary_exercises (
  situation_id,
  item_id,
  exercise_key,
  type,
  prompt,
  payload,
  feedback,
  content_schema_version,
  sort_order,
  published
)
select
  i.situation_id,
  i.id,
  'core-' || i.item_key || '-fb',
  'fill_blank',
  'Fill in the blank: ' || case
    when coalesce(content->'examples'->0->>1, '') like '%' || i.term || '%'
      then replace(content->'examples'->0->>1, i.term, '___')
    else '___ — ' || i.meaning
  end,
  jsonb_build_object('accepted', jsonb_build_array(i.term)),
  jsonb_build_object(
    'expression', i.term,
    'meaning', i.meaning,
    'context', i.context,
    'explanation', '“' || i.term || '” fits this workplace context.'
  ),
  1,
  2,
  true
from public.vocabulary_items i
where i.is_core = true
  and i.published = true
  and not exists (
    select 1
    from public.vocabulary_exercises e
    where e.item_id = i.id
      and e.type = 'fill_blank'
  )
on conflict (situation_id, exercise_key) do nothing;

commit;
