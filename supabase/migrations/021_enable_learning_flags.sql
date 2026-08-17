begin;

-- Intentionally expose Grammar + Vocabulary in production after lean v2 sign-off.
insert into public.app_config (key, value)
values
  ('feature_grammar', 'true'::jsonb),
  ('feature_vocabulary', 'true'::jsonb)
on conflict (key) do update
set value = excluded.value;

commit;
