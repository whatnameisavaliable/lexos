create extension if not exists pgcrypto;

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique,
  status text not null default 'active' check (status in ('active', 'disabled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles add column if not exists username text;
alter table public.profiles add column if not exists display_name text;
alter table public.profiles add column if not exists phone text;
alter table public.profiles add column if not exists auth_email text;
alter table public.profiles add column if not exists status text not null default 'active';
alter table public.profiles add column if not exists must_change_password boolean not null default true;

update public.profiles
set display_name = coalesce(display_name, full_name, '用户')
where display_name is null;

create unique index if not exists profiles_username_key on public.profiles (username);
create unique index if not exists profiles_auth_email_key on public.profiles (auth_email);

create table if not exists public.roles (
  code text primary key,
  name text not null,
  description text,
  is_system boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.ranks (
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

create table if not exists public.organization_members (
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

create table if not exists public.customers (
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

create table if not exists public.matters (
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

create table if not exists public.tasks (
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

create table if not exists public.task_claims (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  task_id uuid not null references public.tasks(id) on delete cascade,
  lawyer_id uuid not null references public.profiles(id),
  status text not null default 'accepted' check (status in ('accepted', 'rejected', 'cancelled')),
  claimed_at timestamptz not null default now()
);

create table if not exists public.task_milestones (
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

create table if not exists public.task_deliverables (
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

create table if not exists public.customer_portal_links (
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

create table if not exists public.customer_verification_codes (
  id uuid primary key default gen_random_uuid(),
  portal_link_id uuid not null references public.customer_portal_links(id) on delete cascade,
  code_hash text not null,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  attempts integer not null default 0 check (attempts >= 0),
  created_at timestamptz not null default now()
);

create table if not exists public.customer_feedback (
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

create table if not exists public.settlements (
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

alter table public.audit_logs add column if not exists organization_id uuid references public.organizations(id) on delete set null;
alter table public.audit_logs add column if not exists actor_user_id uuid references public.profiles(id) on delete set null;
alter table public.audit_logs add column if not exists action text;
alter table public.audit_logs add column if not exists entity_type text;
alter table public.audit_logs add column if not exists entity_id uuid;
alter table public.audit_logs add column if not exists metadata jsonb;
alter table public.audit_logs add column if not exists ip_address text;
alter table public.audit_logs add column if not exists user_agent text;
alter table public.audit_logs alter column action_type set default 'lexos_event';

create table if not exists public.system_settings (
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

create index if not exists idx_members_org_user on public.organization_members (organization_id, user_id);
create index if not exists idx_members_user_role on public.organization_members (user_id, role_code);
create index if not exists idx_ranks_org_sort on public.ranks (organization_id, sort_order);
create index if not exists idx_customers_org_created_by on public.customers (organization_id, created_by);
create index if not exists idx_customers_phone on public.customers (phone);
create index if not exists idx_matters_org_customer on public.matters (organization_id, customer_id);
create index if not exists idx_tasks_org_status on public.tasks (organization_id, status);
create index if not exists idx_tasks_source on public.tasks (source_lawyer_id);
create index if not exists idx_tasks_assigned on public.tasks (assigned_lawyer_id);
create index if not exists idx_task_claims_task on public.task_claims (task_id);
create index if not exists idx_deliverables_task on public.task_deliverables (task_id);
create index if not exists idx_portal_token_hash on public.customer_portal_links (token_hash);
create index if not exists idx_settlements_org_status on public.settlements (organization_id, status);
create index if not exists idx_settlements_lawyer on public.settlements (lawyer_id);
create index if not exists idx_audit_logs_org_created_at on public.audit_logs (organization_id, created_at desc);
create index if not exists idx_system_settings_org_key on public.system_settings (organization_id, key);

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
to authenticated, service_role;

notify pgrst, 'reload schema';
