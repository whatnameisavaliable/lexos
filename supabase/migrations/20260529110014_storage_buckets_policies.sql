-- M0-B B14: Storage buckets and path-based RLS (database.md §5.1–§5.3)
-- Bucket names align with STORAGE_BUCKET_MEDIA / STORAGE_BUCKET_EXPORTS env vars (default: media, exports).

INSERT INTO storage.buckets (id, name, public)
VALUES
  ('media', 'media', false),
  ('exports', 'exports', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY media_select_path_owner ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'media'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY media_insert_path_owner ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'media'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY media_delete_path_owner ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'media'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY exports_select_path_owner ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'exports'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY exports_insert_path_owner ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'exports'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY exports_delete_path_owner ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'exports'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
