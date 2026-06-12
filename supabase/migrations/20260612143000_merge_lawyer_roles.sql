-- Merge the historical source/handling lawyer business roles into one lawyer role.
-- Task columns such as source_lawyer_id remain relationship fields, not role codes.

insert into public.roles (code, name, description, is_system)
values ('lawyer', '律师', '统一律师角色：可以维护客户、提供案源、发起任务、承接任务、提交成果并查看个人结算与风控。', true)
on conflict (code) do update
set
  name = excluded.name,
  description = excluded.description,
  is_system = excluded.is_system;

with ranked_legacy_members as (
  select
    organization_id,
    user_id,
    rank_id,
    status,
    bool_or(status = 'active') over (partition by organization_id, user_id) as has_active_membership,
    row_number() over (
      partition by organization_id, user_id
      order by
        case when status = 'active' then 0 else 1 end,
        case when rank_id is null then 1 else 0 end,
        joined_at asc nulls last,
        created_at asc nulls last
    ) as row_number
  from public.organization_members
  where role_code in ('source_lawyer', 'handling_lawyer')
),
merged_legacy_members as (
  select
    organization_id,
    user_id,
    'lawyer'::text as role_code,
    rank_id,
    case when has_active_membership then 'active' else status end as status
  from ranked_legacy_members
  where row_number = 1
)
insert into public.organization_members (organization_id, user_id, role_code, rank_id, status)
select organization_id, user_id, role_code, rank_id, status
from merged_legacy_members
on conflict (organization_id, user_id, role_code) do update
set
  rank_id = coalesce(excluded.rank_id, public.organization_members.rank_id),
  status = case
    when public.organization_members.status = 'active' or excluded.status = 'active' then 'active'
    else excluded.status
  end,
  updated_at = now();

delete from public.organization_members
where role_code in ('source_lawyer', 'handling_lawyer');

delete from public.roles
where code in ('source_lawyer', 'handling_lawyer');

drop policy if exists "source lawyers can insert customers" on public.customers;
drop policy if exists "lawyers can insert customers" on public.customers;
drop policy if exists "source lawyers can manage own customers" on public.customers;
drop policy if exists "lawyers can manage own customers" on public.customers;
drop policy if exists "source lawyers can insert matters" on public.matters;
drop policy if exists "lawyers can insert matters" on public.matters;
drop policy if exists "source lawyers can insert tasks" on public.tasks;
drop policy if exists "lawyers can insert tasks" on public.tasks;
drop policy if exists "members can read relevant tasks" on public.tasks;
drop policy if exists "source and assigned lawyers can update relevant tasks" on public.tasks;
drop policy if exists "lawyers can update relevant tasks" on public.tasks;
drop policy if exists "handling lawyers can insert own claims" on public.task_claims;
drop policy if exists "lawyers can insert own claims" on public.task_claims;

create policy "lawyers can insert customers"
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
      and om.role_code in ('system_admin', 'firm_admin', 'lawyer')
      and om.status = 'active'
  )
);

create policy "lawyers can manage own customers"
on public.customers
for update
to authenticated
using (created_by = (select auth.uid()))
with check (created_by = (select auth.uid()));

create policy "lawyers can insert matters"
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
      and om.role_code in ('system_admin', 'firm_admin', 'lawyer')
      and om.status = 'active'
  )
);

create policy "lawyers can insert tasks"
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
      and om.role_code in ('system_admin', 'firm_admin', 'lawyer')
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
        and om.role_code in ('system_admin', 'firm_admin', 'lawyer')
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

create policy "lawyers can update relevant tasks"
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

create policy "lawyers can insert own claims"
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
      and om.role_code = 'lawyer'
      and om.status = 'active'
  )
);

notify pgrst, 'reload schema';
