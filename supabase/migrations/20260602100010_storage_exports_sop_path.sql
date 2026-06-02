-- M10: Storage exports SOP PDF path policy (database.md §3.16.8)
-- Path: {owner_id}/sops/{pipeline_id}/{artifact_id}.pdf

DROP POLICY IF EXISTS exports_insert_path_owner ON storage.objects;

CREATE POLICY exports_insert_path_owner ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'exports'
    AND (storage.foldername(name))[1] = auth.uid()::text
    AND (storage.foldername(name))[2] = 'sops'
  );
