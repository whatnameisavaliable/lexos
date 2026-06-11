create extension if not exists pgcrypto;

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique,
  status text not null default 'active' check (status in ('active', 'disabled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique,
  display_name text not null,
  phone text,
  auth_email text not null unique,
  status text not null default 'active' check (status in ('active', 'disabled')),
  must_change_password boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.roles (
  code text primary key,
  name text not null,
  description text,
  is_system boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.ranks (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  code text not null,
  name text not null,
  settlement_basis_points integer not null check (settlement_basis_points between 0 and 10000),
  sort_order integer not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, code)
);

create table public.organization_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role_code text not null references public.roles(code),
  rank_id uuid references public.ranks(id),
  status text not null default 'active' check (status in ('active', 'disabled')),
  joined_at timestamptz default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, user_id, role_code)
);

create table public.customers (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  contact_name text,
  phone text,
  source text,
  created_by uuid not null references public.profiles(id),
  status text not null default 'active' check (status in ('active', 'disabled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.matters (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete cascade,
  title text not null,
  matter_type text not null,
  description text,
  source_lawyer_id uuid not null references public.profiles(id),
  status text not null default 'active' check (status in ('active', 'closed', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  matter_id uuid references public.matters(id) on delete set null,
  customer_id uuid not null references public.customers(id),
  title text not null,
  description text,
  task_type text not null,
  amount_cents bigint not null check (amount_cents >= 0),
  min_rank_id uuid references public.ranks(id),
  source_lawyer_id uuid not null references public.profiles(id),
  assigned_lawyer_id uuid references public.profiles(id),
  status text not null default 'open' check (
    status in (
      'open',
      'claimed',
      'submitted',
      'approved',
      'customer_confirmed',
      'settlement_pending',
      'settled',
      'cancelled'
    )
  ),
  due_at timestamptz,
  submitted_at timestamptz,
  approved_at timestamptz,
  customer_confirmed_at timestamptz,
  settlement_generated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.task_claims (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  task_id uuid not null references public.tasks(id) on delete cascade,
  lawyer_id uuid not null references public.profiles(id),
  status text not null default 'accepted' check (status in ('accepted', 'rejected', 'cancelled')),
  claimed_at timestamptz not null default now()
);

create table public.task_milestones (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  task_id uuid not null references public.tasks(id) on delete cascade,
  title text not null,
  description text,
  status text not null default 'pending' check (status in ('pending', 'completed', 'cancelled')),
  sort_order integer not null default 0,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.task_deliverables (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  task_id uuid not null references public.tasks(id) on delete cascade,
  milestone_id uuid references public.task_milestones(id) on delete set null,
  submitted_by uuid not null references public.profiles(id),
  title text not null,
  content text,
  external_url text,
  submitted_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table public.customer_portal_links (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  task_id uuid not null references public.tasks(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete cascade,
  token_hash text not null unique,
  phone text not null,
  status text not null default 'active' check (status in ('active', 'expired', 'revoked')),
  expires_at timestamptz,
  last_verified_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.customer_verification_codes (
  id uuid primary key default gen_random_uuid(),
  portal_link_id uuid not null references public.customer_portal_links(id) on delete cascade,
  code_hash text not null,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  attempts integer not null default 0 check (attempts >= 0),
  created_at timestamptz not null default now()
);

create table public.customer_feedback (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  task_id uuid not null references public.tasks(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete cascade,
  portal_link_id uuid not null references public.customer_portal_links(id) on delete cascade,
  confirmed_at timestamptz,
  score integer check (score between 0 and 10),
  comment text,
  submitted_at timestamptz,
  created_at timestamptz not null default now(),
  unique (task_id)
);

create table public.settlements (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  task_id uuid not null references public.tasks(id) on delete cascade,
  lawyer_id uuid not null references public.profiles(id),
  rank_id uuid not null references public.ranks(id),
  task_amount_cents bigint not null check (task_amount_cents >= 0),
  settlement_basis_points integer not null check (settlement_basis_points between 0 and 10000),
  settlement_amount_cents bigint not null check (settlement_amount_cents >= 0),
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'paid', 'cancelled')),
  generated_at timestamptz not null default now(),
  confirmed_by uuid references public.profiles(id),
  confirmed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (task_id, lawyer_id)
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete set null,
  actor_user_id uuid references public.profiles(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz not null default now()
);

create table public.system_settings (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  key text not null,
  value jsonb not null,
  description text,
  updated_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, key)
);

create index idx_members_org_user on public.organization_members (organization_id, user_id);
create index idx_members_user_role on public.organization_members (user_id, role_code);
create index idx_ranks_org_sort on public.ranks (organization_id, sort_order);
create index idx_customers_org_created_by on public.customers (organization_id, created_by);
create index idx_customers_phone on public.customers (phone);
create index idx_matters_org_customer on public.matters (organization_id, customer_id);
create index idx_tasks_org_status on public.tasks (organization_id, status);
create index idx_tasks_source on public.tasks (source_lawyer_id);
create index idx_tasks_assigned on public.tasks (assigned_lawyer_id);
create index idx_task_claims_task on public.task_claims (task_id);
create index idx_deliverables_task on public.task_deliverables (task_id);
create index idx_portal_token_hash on public.customer_portal_links (token_hash);
create index idx_settlements_org_status on public.settlements (organization_id, status);
create index idx_settlements_lawyer on public.settlements (lawyer_id);
create index idx_audit_logs_org_created_at on public.audit_logs (organization_id, created_at desc);
create index idx_system_settings_org_key on public.system_settings (organization_id, key);

insert into public.roles (code, name, description, is_system)
values
  ('system_admin', '系统管理员', '系统初始化、账号、权限、审计和运维配置', true),
  ('firm_admin', '律所管理员', '律所内部用户、角色、职级和基础数据管理', true),
  ('director', '主任', '查看经营数据并参与关键审批', true),
  ('source_lawyer', '案源律师', '录入客户、发布任务和验收成果', true),
  ('handling_lawyer', '办案律师', '查看任务大厅、抢单和提交成果', true),
  ('finance', '财务', '查看和确认结算记录', true),
  ('customer', '客户', '通过客户大屏查看交付和评分', true),
  ('channel_partner', '渠道商', '后续提交线索和查看渠道数据', true)
on conflict (code) do nothing;

insert into public.organizations (id, name, slug)
values ('00000000-0000-0000-0000-000000000001', 'Lexos Demo 律所', 'lexos-demo')
on conflict (id) do nothing;

insert into public.ranks (organization_id, code, name, settlement_basis_points, sort_order)
values
  ('00000000-0000-0000-0000-000000000001', 'L1A', 'L1A 初级 A', 6000, 1),
  ('00000000-0000-0000-0000-000000000001', 'L1B', 'L1B 初级 B', 6500, 2),
  ('00000000-0000-0000-0000-000000000001', 'L1C', 'L1C 初级 C', 7000, 3),
  ('00000000-0000-0000-0000-000000000001', 'L2A', 'L2A 中级 A', 7500, 4),
  ('00000000-0000-0000-0000-000000000001', 'L2B', 'L2B 中级 B', 8000, 5),
  ('00000000-0000-0000-0000-000000000001', 'L2C', 'L2C 中级 C', 8500, 6),
  ('00000000-0000-0000-0000-000000000001', 'L3A', 'L3A 高级 A', 9000, 7),
  ('00000000-0000-0000-0000-000000000001', 'L3B', 'L3B 高级 B', 9500, 8),
  ('00000000-0000-0000-0000-000000000001', 'L3C', 'L3C 高级 C', 10000, 9)
on conflict (organization_id, code) do nothing;

alter table public.organizations enable row level security;
alter table public.profiles enable row level security;
alter table public.roles enable row level security;
alter table public.ranks enable row level security;
alter table public.organization_members enable row level security;
alter table public.customers enable row level security;
alter table public.matters enable row level security;
alter table public.tasks enable row level security;
alter table public.task_claims enable row level security;
alter table public.task_milestones enable row level security;
alter table public.task_deliverables enable row level security;
alter table public.customer_portal_links enable row level security;
alter table public.customer_verification_codes enable row level security;
alter table public.customer_feedback enable row level security;
alter table public.settlements enable row level security;
alter table public.audit_logs enable row level security;
alter table public.system_settings enable row level security;

revoke all on all tables in schema public from anon;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant select, insert, update, delete on all tables in schema public to service_role;

create policy "members can read their organizations"
on public.organizations
for select
to authenticated
using (
  exists (
    select 1
    from public.organization_members om
    where om.organization_id = organizations.id
      and om.user_id = (select auth.uid())
      and om.status = 'active'
  )
);

create policy "users can read own profile"
on public.profiles
for select
to authenticated
using (id = (select auth.uid()));

create policy "users can update own forced password flag profile fields"
on public.profiles
for update
to authenticated
using (id = (select auth.uid()))
with check (id = (select auth.uid()));

create policy "authenticated users can read role definitions"
on public.roles
for select
to authenticated
using (true);

create policy "users can read own memberships"
on public.organization_members
for select
to authenticated
using (user_id = (select auth.uid()));

create policy "members can read organization ranks"
on public.ranks
for select
to authenticated
using (
  exists (
    select 1
    from public.organization_members om
    where om.organization_id = ranks.organization_id
      and om.user_id = (select auth.uid())
      and om.status = 'active'
  )
);

create policy "source lawyers can insert customers"
on public.customers
for insert
to authenticated
with check (
  created_by = (select auth.uid())
  and exists (
    select 1
    from public.organization_members om
    where om.organization_id = customers.organization_id
      and om.user_id = (select auth.uid())
      and om.role_code in ('system_admin', 'firm_admin', 'source_lawyer')
      and om.status = 'active'
  )
);

create policy "members can read scoped customers"
on public.customers
for select
to authenticated
using (
  created_by = (select auth.uid())
  or exists (
    select 1
    from public.organization_members om
    where om.organization_id = customers.organization_id
      and om.user_id = (select auth.uid())
      and om.role_code in ('system_admin', 'firm_admin')
      and om.status = 'active'
  )
);

create policy "source lawyers can manage own customers"
on public.customers
for update
to authenticated
using (created_by = (select auth.uid()))
with check (created_by = (select auth.uid()));

create policy "source lawyers can insert matters"
on public.matters
for insert
to authenticated
with check (
  source_lawyer_id = (select auth.uid())
  and exists (
    select 1
    from public.organization_members om
    where om.organization_id = matters.organization_id
      and om.user_id = (select auth.uid())
      and om.role_code in ('system_admin', 'firm_admin', 'source_lawyer')
      and om.status = 'active'
  )
);

create policy "members can read scoped matters"
on public.matters
for select
to authenticated
using (
  source_lawyer_id = (select auth.uid())
  or exists (
    select 1
    from public.organization_members om
    where om.organization_id = matters.organization_id
      and om.user_id = (select auth.uid())
      and om.role_code in ('system_admin', 'firm_admin')
      and om.status = 'active'
  )
);

create policy "source lawyers can insert tasks"
on public.tasks
for insert
to authenticated
with check (
  source_lawyer_id = (select auth.uid())
  and status = 'open'
  and exists (
    select 1
    from public.organization_members om
    where om.organization_id = tasks.organization_id
      and om.user_id = (select auth.uid())
      and om.role_code in ('system_admin', 'firm_admin', 'source_lawyer')
      and om.status = 'active'
  )
);

create policy "members can read relevant tasks"
on public.tasks
for select
to authenticated
using (
  source_lawyer_id = (select auth.uid())
  or assigned_lawyer_id = (select auth.uid())
  or (
    status = 'open'
    and exists (
      select 1
      from public.organization_members om
      where om.organization_id = tasks.organization_id
        and om.user_id = (select auth.uid())
        and om.role_code in ('system_admin', 'firm_admin', 'handling_lawyer')
        and om.status = 'active'
    )
  )
  or exists (
    select 1
    from public.organization_members om
    where om.organization_id = tasks.organization_id
      and om.user_id = (select auth.uid())
      and om.role_code in ('finance')
      and om.status = 'active'
  )
);

create policy "source and assigned lawyers can update relevant tasks"
on public.tasks
for update
to authenticated
using (
  source_lawyer_id = (select auth.uid())
  or assigned_lawyer_id = (select auth.uid())
)
with check (
  source_lawyer_id = (select auth.uid())
  or assigned_lawyer_id = (select auth.uid())
);

create policy "handling lawyers can insert own claims"
on public.task_claims
for insert
to authenticated
with check (
  lawyer_id = (select auth.uid())
  and exists (
    select 1
    from public.organization_members om
    where om.organization_id = task_claims.organization_id
      and om.user_id = (select auth.uid())
      and om.role_code = 'handling_lawyer'
      and om.status = 'active'
  )
);

create policy "lawyers can read relevant claims"
on public.task_claims
for select
to authenticated
using (
  lawyer_id = (select auth.uid())
  or exists (
    select 1
    from public.tasks t
    where t.id = task_claims.task_id
      and t.source_lawyer_id = (select auth.uid())
  )
);

create policy "assigned lawyers can insert deliverables"
on public.task_deliverables
for insert
to authenticated
with check (
  submitted_by = (select auth.uid())
  and exists (
    select 1
    from public.tasks t
    where t.id = task_deliverables.task_id
      and t.assigned_lawyer_id = (select auth.uid())
  )
);

create policy "lawyers can read task deliverables"
on public.task_deliverables
for select
to authenticated
using (
  submitted_by = (select auth.uid())
  or exists (
    select 1
    from public.tasks t
    where t.id = task_deliverables.task_id
      and (
        t.source_lawyer_id = (select auth.uid())
        or t.assigned_lawyer_id = (select auth.uid())
      )
  )
);

create policy "members can read task milestones"
on public.task_milestones
for select
to authenticated
using (
  exists (
    select 1
    from public.tasks t
    where t.id = task_milestones.task_id
      and (
        t.source_lawyer_id = (select auth.uid())
        or t.assigned_lawyer_id = (select auth.uid())
      )
  )
);

create policy "customers portal links are service only"
on public.customer_portal_links
for all
to authenticated
using (false)
with check (false);

create policy "customer verification codes are service only"
on public.customer_verification_codes
for all
to authenticated
using (false)
with check (false);

create policy "customer feedback is service only"
on public.customer_feedback
for all
to authenticated
using (false)
with check (false);

create policy "lawyers and finance can read settlements"
on public.settlements
for select
to authenticated
using (
  lawyer_id = (select auth.uid())
  or exists (
    select 1
    from public.organization_members om
    where om.organization_id = settlements.organization_id
      and om.user_id = (select auth.uid())
      and om.role_code in ('system_admin', 'firm_admin', 'finance')
      and om.status = 'active'
  )
);

create policy "finance can update settlements"
on public.settlements
for update
to authenticated
using (
  exists (
    select 1
    from public.organization_members om
    where om.organization_id = settlements.organization_id
      and om.user_id = (select auth.uid())
      and om.role_code in ('system_admin', 'firm_admin', 'finance')
      and om.status = 'active'
  )
)
with check (
  exists (
    select 1
    from public.organization_members om
    where om.organization_id = settlements.organization_id
      and om.user_id = (select auth.uid())
      and om.role_code in ('system_admin', 'firm_admin', 'finance')
      and om.status = 'active'
  )
);

create policy "admins can read audit logs"
on public.audit_logs
for select
to authenticated
using (
  exists (
    select 1
    from public.organization_members om
    where om.organization_id = audit_logs.organization_id
      and om.user_id = (select auth.uid())
      and om.role_code in ('system_admin', 'firm_admin')
      and om.status = 'active'
  )
);

create policy "admins can read settings"
on public.system_settings
for select
to authenticated
using (
  exists (
    select 1
    from public.organization_members om
    where om.organization_id = system_settings.organization_id
      and om.user_id = (select auth.uid())
      and om.role_code in ('system_admin', 'firm_admin')
      and om.status = 'active'
  )
);

create policy "admins can update settings"
on public.system_settings
for update
to authenticated
using (
  exists (
    select 1
    from public.organization_members om
    where om.organization_id = system_settings.organization_id
      and om.user_id = (select auth.uid())
      and om.role_code in ('system_admin', 'firm_admin')
      and om.status = 'active'
  )
)
with check (
  exists (
    select 1
    from public.organization_members om
    where om.organization_id = system_settings.organization_id
      and om.user_id = (select auth.uid())
      and om.role_code in ('system_admin', 'firm_admin')
      and om.status = 'active'
  )
);
