-- PRD-3.6-01: 归档目录名不截断；仅非法字符替换
ALTER TABLE public.drive_nodes
  ALTER COLUMN name TYPE TEXT;
