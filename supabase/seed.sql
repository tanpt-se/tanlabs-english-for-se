-- Default feature flags (all off in PH1)
begin;

insert into public.app_config (key, value)
values
  ('feature_grammar', 'false'::jsonb),
  ('feature_vocabulary', 'false'::jsonb),
  ('feature_interview', 'false'::jsonb),
  ('feature_ai', 'false'::jsonb)
on conflict (key) do update set value = excluded.value;

commit;
