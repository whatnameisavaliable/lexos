-- M0-B B7: drive_nodes + archive_folder_id FK (database.md §3.5)

CREATE TABLE public.drive_nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID NOT NULL REFERENCES public.profiles (id),
  parent_id UUID REFERENCES public.drive_nodes (id) ON DELETE RESTRICT,
  node_type public.drive_node_type NOT NULL,
  name VARCHAR(256) NOT NULL,
  storage_key TEXT,
  mime_type VARCHAR(128),
  size_bytes BIGINT,
  linked_task_id UUID REFERENCES public.transcription_tasks (id),
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT drive_nodes_file_requires_parent CHECK (
    node_type <> 'file' OR parent_id IS NOT NULL
  )
);

CREATE INDEX drive_nodes_created_by_parent_idx
  ON public.drive_nodes (created_by, parent_id)
  WHERE deleted_at IS NULL;

CREATE UNIQUE INDEX drive_nodes_created_by_parent_name_uidx
  ON public.drive_nodes (created_by, parent_id, name)
  WHERE deleted_at IS NULL;

CREATE TRIGGER drive_nodes_set_updated_at
  BEFORE UPDATE ON public.drive_nodes
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.transcription_tasks
  ADD CONSTRAINT transcription_tasks_archive_folder_id_fkey
  FOREIGN KEY (archive_folder_id) REFERENCES public.drive_nodes (id);
