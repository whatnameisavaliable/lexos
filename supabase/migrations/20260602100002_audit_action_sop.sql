-- M10: SOP audit_action extensions (prd.md appendix · database.md §3.16.7)

ALTER TYPE public.audit_action ADD VALUE IF NOT EXISTS 'sop.template.publish';
ALTER TYPE public.audit_action ADD VALUE IF NOT EXISTS 'sop.prompt.update';
ALTER TYPE public.audit_action ADD VALUE IF NOT EXISTS 'sop.artifact.export_pdf';
ALTER TYPE public.audit_action ADD VALUE IF NOT EXISTS 'sop.artifact.verify';
