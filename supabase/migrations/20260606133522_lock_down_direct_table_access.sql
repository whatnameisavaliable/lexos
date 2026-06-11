-- Lexos uses Next.js API routes as the business boundary.
-- Browser clients must not access internal public tables directly with anon/authenticated keys.
revoke usage on schema public from anon, authenticated;
grant usage on schema public to service_role;

revoke all on all tables in schema public from anon;
revoke all on all tables in schema public from authenticated;
revoke all on all sequences in schema public from anon;
revoke all on all sequences in schema public from authenticated;

alter default privileges in schema public revoke all on tables from anon;
alter default privileges in schema public revoke all on tables from authenticated;
alter default privileges in schema public revoke all on sequences from anon;
alter default privileges in schema public revoke all on sequences from authenticated;

grant select, insert, update, delete on table
  public.organizations,
  public.profiles,
  public.roles,
  public.ranks,
  public.organization_members,
  public.customers,
  public.matters,
  public.tasks,
  public.task_claims,
  public.task_milestones,
  public.task_deliverables,
  public.customer_portal_links,
  public.customer_verification_codes,
  public.customer_feedback,
  public.settlements,
  public.audit_logs,
  public.system_settings
to service_role;

grant usage, select on all sequences in schema public to service_role;

notify pgrst, 'reload schema';
