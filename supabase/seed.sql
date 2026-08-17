-- Default feature flags (Grammar + Vocabulary on after lean v2 sign-off)
begin;

insert into public.app_config (key, value)
values
  ('feature_grammar', 'true'::jsonb),
  ('feature_vocabulary', 'true'::jsonb),
  ('feature_interview', 'false'::jsonb),
  ('feature_ai', 'false'::jsonb)
on conflict (key) do update set value = excluded.value;

commit;
