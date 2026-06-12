# Lexos 数据库草案

## 设计原则

- 所有业务表预留 organization_id，方便私有化部署和未来多律所扩展。
- public schema 中的业务表全部启用 RLS。
- 权限判断基于组织成员关系和角色，不使用用户可编辑的 user_metadata。
- 金额使用 amount_cents 这类整数字段保存，避免浮点误差。
- 比例使用 basis_points 保存，例如 60% 保存为 6000。
- 所有关键表保留 created_at、updated_at，关键业务表保留 created_by。
- 客户确认页采用服务端校验 token 和验证码，不直接让客户访问 Supabase 表。

## 枚举与受控值

### 角色代码

- system_admin
- firm_admin
- director
- lawyer
- finance
- customer
- channel_partner

第一版实际启用：

- system_admin
- lawyer
- finance

### 任务状态

- open：待承接
- claimed：已承接
- submitted：已提交
- approved：已验收
- customer_confirmed：客户已确认
- settlement_pending：待结算
- settled：已结算
- cancelled：已取消

### 结算状态

- pending：待确认
- confirmed：已确认
- paid：已付款，第一版预留
- cancelled：已取消

### 资金账户类型

- risk_reserve：公共风险储备金
- quality_fund：质量督导基金
- client_refund：客户退费
- firm_retained：律所留存

## MVP 表结构

### organizations

律所或组织。

- id uuid primary key
- name text not null
- slug text unique
- status text not null default 'active'
- created_at timestamptz not null
- updated_at timestamptz not null

### profiles

内部用户资料，与 auth.users 一对一。

- id uuid primary key references auth.users(id)
- username text not null unique
- display_name text not null
- phone text
- auth_email text not null unique
- status text not null default 'active'
- must_change_password boolean not null default true
- created_at timestamptz not null
- updated_at timestamptz not null

### roles

角色定义。

- code text primary key
- name text not null
- description text
- is_system boolean not null default false
- created_at timestamptz not null

### ranks

律师职级与结算比例。

- id uuid primary key
- organization_id uuid not null references organizations(id)
- code text not null
- name text not null
- settlement_basis_points integer not null
- sort_order integer not null
- is_active boolean not null default true
- created_at timestamptz not null
- updated_at timestamptz not null

约束建议：

- 同一 organization 内 code 唯一。
- settlement_basis_points 范围为 0 到 10000。

### organization_members

组织成员、角色和职级绑定。

- id uuid primary key
- organization_id uuid not null references organizations(id)
- user_id uuid not null references profiles(id)
- role_code text not null references roles(code)
- rank_id uuid references ranks(id)
- status text not null default 'active'
- joined_at timestamptz
- created_at timestamptz not null
- updated_at timestamptz not null

约束建议：

- organization_id、user_id、role_code 联合唯一。

### customers

客户基础信息。

- id uuid primary key
- organization_id uuid not null references organizations(id)
- name text not null
- contact_name text
- phone text
- source text
- created_by uuid not null references profiles(id)
- status text not null default 'active'
- created_at timestamptz not null
- updated_at timestamptz not null

### matters

案件或项目。第一版可作为任务的上层容器。

- id uuid primary key
- organization_id uuid not null references organizations(id)
- customer_id uuid not null references customers(id)
- title text not null
- matter_type text not null
- description text
- source_lawyer_id uuid not null references profiles(id)
- status text not null default 'active'
- created_at timestamptz not null
- updated_at timestamptz not null

### tasks

任务主表。

- id uuid primary key
- organization_id uuid not null references organizations(id)
- matter_id uuid references matters(id)
- customer_id uuid not null references customers(id)
- title text not null
- description text
- task_type text not null
- amount_cents bigint not null
- min_rank_id uuid references ranks(id)
- source_lawyer_id uuid not null references profiles(id)
- assigned_lawyer_id uuid references profiles(id)
- status text not null default 'open'
- due_at timestamptz
- submitted_at timestamptz
- approved_at timestamptz
- customer_confirmed_at timestamptz
- settlement_generated_at timestamptz
- created_at timestamptz not null
- updated_at timestamptz not null

### task_claims

承接记录。第一版一个任务最终只接受一名承办律师，但保留承接历史。

- id uuid primary key
- organization_id uuid not null references organizations(id)
- task_id uuid not null references tasks(id)
- lawyer_id uuid not null references profiles(id)
- status text not null default 'accepted'
- claimed_at timestamptz not null

### task_milestones

任务里程碑。第一版可以只用一个默认里程碑，也可用于客户确认页展示。

- id uuid primary key
- organization_id uuid not null references organizations(id)
- task_id uuid not null references tasks(id)
- title text not null
- description text
- status text not null default 'pending'
- sort_order integer not null default 0
- completed_at timestamptz
- created_at timestamptz not null
- updated_at timestamptz not null

### task_deliverables

任务交付记录。当前支持文字说明、外部文件链接和内部私有附件元数据。

- id uuid primary key
- organization_id uuid not null references organizations(id)
- task_id uuid not null references tasks(id)
- milestone_id uuid references task_milestones(id)
- submitted_by uuid not null references profiles(id)
- title text not null
- content text
- external_url text
- storage_bucket text
- storage_path text
- file_name text
- file_size_bytes bigint
- file_mime_type text
- submitted_at timestamptz not null
- created_at timestamptz not null

附件文件存放在私有 Supabase Storage bucket `lexos-deliverables`。浏览器不直连 Storage，上传和下载都经过 Next.js API；下载时服务端生成短期 signed URL。

### customer_portal_links

客户确认页安全链接。

- id uuid primary key
- organization_id uuid not null references organizations(id)
- task_id uuid not null references tasks(id)
- customer_id uuid not null references customers(id)
- token_hash text not null unique
- phone text not null
- status text not null default 'active'
- expires_at timestamptz
- last_verified_at timestamptz
- created_at timestamptz not null

### customer_verification_codes

客户访问验证码。

- id uuid primary key
- portal_link_id uuid not null references customer_portal_links(id)
- code_hash text not null
- expires_at timestamptz not null
- consumed_at timestamptz
- attempts integer not null default 0
- created_at timestamptz not null

### customer_feedback

客户确认接收和评分。

- id uuid primary key
- organization_id uuid not null references organizations(id)
- task_id uuid not null references tasks(id)
- customer_id uuid not null references customers(id)
- portal_link_id uuid not null references customer_portal_links(id)
- confirmed_at timestamptz
- score integer
- comment text
- submitted_at timestamptz
- created_at timestamptz not null

约束建议：

- score 范围为 0 到 10。
- 同一 task_id 第一版只允许一条最终反馈。

### settlements

结算记录。

- id uuid primary key
- organization_id uuid not null references organizations(id)
- task_id uuid not null references tasks(id)
- lawyer_id uuid not null references profiles(id)
- rank_id uuid not null references ranks(id)
- task_amount_cents bigint not null
- settlement_basis_points integer not null
- settlement_amount_cents bigint not null
- payable_amount_cents bigint not null
- risk_deduction_case_id uuid references risk_cases(id)
- risk_deduction_basis_points integer
- risk_deduction_amount_cents bigint
- risk_penalty_destination text
- risk_deduction_note text
- risk_deduction_locked_by uuid references profiles(id)
- risk_deduction_locked_at timestamptz
- status text not null default 'pending'
- generated_at timestamptz not null
- confirmed_by uuid references profiles(id)
- confirmed_at timestamptz
- created_at timestamptz not null
- updated_at timestamptz not null

约束建议：

- `settlement_amount_cents` 保存按任务金额和职级比例生成的原始结算金额。
- `payable_amount_cents` 保存当前律师实付金额；未扣罚时等于 `settlement_amount_cents`。
- `risk_deduction_basis_points` 范围为 0 到 10000。
- `risk_penalty_destination` 范围为 `risk_reserve`、`quality_fund`、`client_refund`、`firm_retained`。
- 扣罚锁定会把资金去向和扣减结果固化到结算记录，并通过 `fund_transactions` 生成扣罚入账流水。

### fund_transactions

资金账户流水。第一版用于沉淀扣罚资金流向锁定后的内部资金台账，不代表真实银行付款或退款已执行。

- id uuid primary key
- organization_id uuid not null references organizations(id)
- account_type text not null
- settlement_id uuid references settlements(id)
- risk_case_id uuid references risk_cases(id)
- task_id uuid references tasks(id)
- amount_cents bigint not null
- direction text not null default 'inflow'
- transaction_type text not null default 'risk_deduction'
- status text not null default 'posted'
- note text
- created_by uuid references profiles(id)
- created_at timestamptz not null

约束建议：

- account_type 范围为 `risk_reserve`、`quality_fund`、`client_refund`、`firm_retained`。
- direction 范围为 `inflow`、`outflow`。
- transaction_type 范围为 `risk_deduction`、`manual_adjustment`、`client_refund`。
- status 范围为 `posted`、`void`。
- 同一组织、同一结算、同一 `risk_deduction` 类型的已入账流水保持唯一，避免重复入账。
- 迁移 `20260609165248_add_fund_transactions.sql` 通过触发器在结算扣罚锁定时自动写入扣罚入账流水。

### risk_cases

客户投诉、低分触发和人工风控工单。

- id uuid primary key
- organization_id uuid not null references organizations(id)
- task_id uuid references tasks(id)
- customer_id uuid references customers(id)
- reported_by_user_id uuid references profiles(id)
- owner_user_id uuid references profiles(id)
- source text not null
- severity text not null default 'medium'
- status text not null default 'open'
- title text not null
- description text
- resolution_note text
- defense_statement text
- defended_at timestamptz
- committee_decision text
- committee_decision_note text
- committee_deduction_basis_points integer
- committee_decided_by uuid references profiles(id)
- committee_decided_at timestamptz
- resolved_at timestamptz
- created_at timestamptz not null
- updated_at timestamptz not null

约束建议：

- source 范围为 `customer_complaint`、`low_score`、`manual`。
- severity 范围为 `low`、`medium`、`high`、`critical`。
- status 范围为 `open`、`in_review`、`resolved`。
- 承办律师答辩期限由 `created_at + 48 小时` 计算；第一版不单独持久化 deadline。
- committee_decision 范围为 `no_fault`、`warning`、`deduction`、`escalation`。
- committee_deduction_basis_points 范围为 0 到 10000；扣减裁决要求大于 0。

### audit_logs

审计日志。

- id uuid primary key
- organization_id uuid references organizations(id)
- actor_user_id uuid references profiles(id)
- action text not null
- entity_type text not null
- entity_id uuid
- metadata jsonb
- ip_address text
- user_agent text
- created_at timestamptz not null

### system_settings

系统参数。

- id uuid primary key
- organization_id uuid references organizations(id)
- key text not null
- value jsonb not null
- description text
- updated_by uuid references profiles(id)
- created_at timestamptz not null
- updated_at timestamptz not null

## 初始种子数据

### 默认角色

- system_admin：系统管理员
- lawyer：律师
- finance：财务

### 默认职级

- L1A：60%
- L1B：65%
- L1C：70%
- L2A：75%
- L2B：80%
- L2C：85%
- L3A：90%
- L3B：95%
- L3C：100%

### 默认管理员

- username：admin
- password：111111
- 要求首次登录强制修改密码

## RLS 与直接表访问策略

### 基础原则

- 所有 public 表启用 RLS。
- 当前 MVP 的浏览器端不直接访问 Supabase 表，统一通过 Next.js API 访问业务数据。
- 服务端 API 使用 service role 访问数据库，并在 API 层执行角色和组织权限校验。
- `anon` 和 `authenticated` 已撤销 public schema 和内部业务表的直接 Data API 权限，避免绕过后端读取内部数据。
- 客户确认页由服务端接口读取数据，不给客户发 Supabase 登录态。
- 现有 RLS policy 保留为防御层，后续若开放某些表给 authenticated 直连，需要重新逐表授予权限并补充权限测试。

### 当前线上验证

- 迁移：`20260606133522_lock_down_direct_table_access.sql`
- 验证脚本：`npm run verify:rls`
- 结果：新增资金流水表后，内部表清单应包含 19 张表；service role 可读，anon 和 authenticated 应全部被拒绝。

### 直接访问边界

- 允许：Next.js API 服务端使用 `SUPABASE_SERVICE_ROLE_KEY` 访问数据库。
- 拒绝：浏览器端使用 `NEXT_PUBLIC_SUPABASE_ANON_KEY` 直接读取 public 内部表。
- 拒绝：普通 Supabase 登录用户绕过 Next.js API 直接读取 public 内部表。

### profiles

- 当前通过 Next.js API 读取和管理 profile。
- 后续若开放直连，用户只能读取自己的 profile，管理员只能读取和管理本组织成员。

### organization_members

- 用户可以读取自己的成员关系。
- 管理员可以管理本组织成员关系。

### ranks

- 本组织成员可以读取本组织职级。
- 管理员可以管理本组织职级。

### customers

- 发起人可以创建客户。
- 发起人可以查看自己创建的客户。
- 管理员可以查看本组织所有客户。

### tasks

- 发起人可以创建任务。
- 发起人可以查看和更新自己发布的任务。
- 律师可以查看 open 状态且满足条件的任务。
- 律师可以查看和更新分配给自己的任务提交信息。
- 财务可以读取与结算相关的任务摘要。

### settlements

- 律师可以查看自己的结算。
- 财务可以查看和确认本组织结算。
- 管理员可以查看本组织结算。

### fund_transactions

- 当前通过 `/api/funds` 查询资金台账。
- 系统管理员、律所管理员和财务可以查看本组织资金账户摘要和流水。
- 普通用户、律师、客户和浏览器直连不读取资金流水表。

### audit_logs

- 当前通过 `/api/audit-logs` 查询审计日志。
- 管理员和律所管理员可以查看本组织最近审计日志。
- 普通用户和浏览器直连不读取审计日志。

## 需要在实现前再次确认

- 内部交付文件上传已完成第一版；后续需要确认客户侧验证码授权下载、文件版本、批量附件和病毒扫描策略。
- 验证码 demo 模式使用固定验证码还是日志验证码。
- 默认管理员初始化方式：seed 脚本、管理命令，还是 Supabase 控制台手工创建。
