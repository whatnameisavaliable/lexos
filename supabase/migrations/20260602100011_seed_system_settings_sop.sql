-- M10: SOP system_settings seed (database.md §3.12 · PRD-SOP-41)

INSERT INTO public.system_settings (key, value)
VALUES ('sop.deep_research_enabled', 'true'::jsonb)
ON CONFLICT (key) DO UPDATE
  SET value = EXCLUDED.value,
      updated_at = now();
