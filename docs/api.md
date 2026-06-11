# Lexos API 草案

## API 设计原则

- 内部后台接口要求已登录用户。
- 客户大屏接口不要求 Supabase 登录，但必须校验安全 token、手机号验证码和访问状态。
- 所有写操作在服务端进行角色和组织权限检查。
- 金额字段统一使用 cents，比例字段统一使用 basis_points。
- 列表接口默认分页，避免无边界查询。
- 关键写操作写入 audit_logs。
- 浏览器端不直接访问 Supabase 内部表，业务数据统一通过 `/api/*` 访问。

## 通用响应格式

成功响应：

```json
{
  "data": {},
  "message": "ok"
}
```

失败响应：

```json
{
  "error": {
    "code": "FORBIDDEN",
    "message": "无权执行该操作"
  }
}
```

## 通用错误码

- UNAUTHORIZED：未登录或会话失效
- FORBIDDEN：权限不足
- NOT_FOUND：资源不存在
- VALIDATION_ERROR：请求参数错误
- CONFLICT：业务状态冲突，例如任务已被抢单
- RATE_LIMITED：验证码或敏感操作请求过于频繁
- INTERNAL_ERROR：系统错误

## 健康检查接口

### GET /api/health

读取当前部署的 Preview 自检状态。

当前状态：已实现。

该接口不需要登录，用于部署前后确认 Vercel Preview 当前运行在内存 demo 模式还是真实 Supabase 模式。响应只返回模式、自检状态、缺失变量名、提示、commit、环境和时间戳，不返回任何密钥值。

响应示例：

```json
{
  "data": {
    "app": "lexos",
    "mode": "demo",
    "ok": true,
    "supabaseConfigured": false,
    "missingSupabaseEnvKeys": [],
    "warnings": [],
    "commit": "local",
    "timestamp": "2026-06-08T00:00:00.000Z",
    "vercelEnv": "local"
  },
  "message": "ok"
}
```

## 列表分页

当前列表接口支持服务端分页第一版。默认 `page=1`；`pageSize` 未显式传入时读取组织级系统参数 `default_page_size`，未保存参数时使用默认值 50，最大为 100。

列表排序第一版使用 `sort` 参数，并只接受每个接口定义内的白名单值；非法值会回退到默认排序，不会把任意字段名透传给数据库。

通用查询参数：

- `page`：页码，从 1 开始。
- `pageSize`：每页数量，最大 100。
- `search`：关键词搜索。兼容旧文档里的 `keyword` 参数。
- `sort`：排序 key。不同接口支持的 key 不同。

列表响应会带 `pagination`：

```json
{
  "data": {
    "items": [],
    "pagination": {
      "page": 1,
      "pageSize": 50,
      "total": 125,
      "totalPages": 3
    }
  },
  "message": "ok"
}
```

为了兼容当前前端，具体字段仍使用 `users`、`customers`、`tasks`、`settlements`、`transactions` 或 `logs`，并在同级返回 `pagination`。

## 认证接口

### POST /api/auth/login

用户名密码登录。

请求：

```json
{
  "username": "admin",
  "password": "111111"
}
```

响应：

```json
{
  "data": {
    "user": {
      "id": "uuid",
      "username": "admin",
      "displayName": "系统管理员",
      "role": "system_admin",
      "rankCode": null,
      "mustChangePassword": true,
      "status": "active"
    },
    "mustChangePassword": true,
    "defaultRoute": "/"
  },
  "message": "ok"
}
```

### GET /api/auth/me

读取当前登录用户的内部身份。

当前状态：已实现。

响应包含用户 ID、用户名、姓名、当前组织角色、当前职级编码和是否必须修改默认密码。

### POST /api/auth/logout

退出登录。

当前状态：已实现。

### POST /api/auth/change-password

修改当前用户密码。

请求：

```json
{
  "oldPassword": "111111",
  "newPassword": "new-password"
}
```

当前状态：已实现。

## 用户与权限接口

### GET /api/users

查询本组织用户列表。

权限：系统管理员、律所管理员。

查询参数：

- page
- pageSize
- role
- status
- search / keyword
- sort：`createdAtDesc`、`createdAtAsc`、`roleAsc`、`statusAsc`

### POST /api/users

创建用户。

权限：系统管理员、律所管理员。

请求：

```json
{
  "username": "lawyer01",
  "displayName": "张律师",
  "phone": "13800000000",
  "roleCode": "handling_lawyer",
  "rankId": "uuid"
}
```

### PATCH /api/users/:id

更新用户状态、角色或职级。

当前状态：已实现第一版。

权限：系统管理员、律所管理员。

请求：

```json
{
  "roleCode": "handling_lawyer",
  "rankId": "uuid",
  "status": "active"
}
```

规则：

- `status` 支持 `active` 和 `disabled`。
- 办案律师必须绑定有效职级。
- 非办案律师会清空职级。
- 管理员不能停用或变更当前登录账号的角色，避免误锁定自己。
- 更新会同步写入 `profiles.status` 和 `organization_members.status`，并记录审计日志。

## 职级接口

### GET /api/ranks

查询本组织职级。

### PATCH /api/ranks/:id

更新职级名称、排序或结算比例。

权限：系统管理员、律所管理员。

## 客户接口

### GET /api/customers

查询客户列表。

权限：系统管理员、律所管理员、案源律师。

查询参数：

- page
- pageSize
- search / keyword
- status
- sort：`createdAtDesc`、`createdAtAsc`、`nameAsc`、`sourceAsc`、`statusAsc`

### POST /api/customers

创建客户。

权限：案源律师、系统管理员、律所管理员。

请求：

```json
{
  "name": "某某科技有限公司",
  "contactName": "王总",
  "phone": "13800000000",
  "source": "案源律师录入"
}
```

当前状态：已实现。

## 任务接口

### GET /api/tasks

查询任务列表。

当前状态：已实现。

查询参数：

- page
- pageSize
- search / keyword
- status
- minRankId
- scope：当前支持 `assigned`，办案律师在“我的任务”中只查询自己已接任务。
- sort：`createdAtDesc`、`createdAtAsc`、`dueAtAsc`、`amountDesc`、`statusAsc`

角色差异：

- 案源律师：只看自己发布的任务。
- 办案律师：看开放任务和自己已接任务。
- 财务：看与结算相关的任务摘要。
- 管理员：看本组织任务。

### POST /api/tasks

创建任务，并自动生成客户大屏安全 token。

当前状态：已实现。

请求：

```json
{
  "customerId": "uuid",
  "title": "民商事一审代理",
  "description": "准备起诉材料",
  "taskType": "诉讼任务",
  "amountYuan": "12000.50",
  "minRankId": "uuid",
  "dueAt": "2026-07-01"
}
```

响应会返回 `portalToken`。数据库只保存 token hash，不保存明文 token。

### POST /api/tasks/:id/claim

办案律师抢单。

当前状态：已实现。

规则：

- 当前用户必须是办案律师。
- 任务必须是 `open`。
- 办案律师职级必须满足任务最低职级。
- 当前办案律师已承办任务上不能存在未办结的三级严重或四级重大风控工单；否则返回 `409 CONFLICT`，提示先处理风控工单。

### POST /api/tasks/:id/submit

办案律师提交文字成果。

当前状态：已实现。

请求：

```json
{
  "title": "阶段成果提交",
  "content": "已完成材料整理。",
  "externalUrl": "https://example.com/deliverable"
}
```

该接口保留用于无附件成果提交，会写入 `task_deliverables` 并推进任务到 `submitted`。

### POST /api/tasks/:id/deliverables

办案律师提交带附件的交付成果。

当前状态：已实现第一版。

请求类型：`multipart/form-data`

字段：

- `title`：成果标题，必填。
- `content`：成果说明，可选。
- `externalUrl`：外部链接，可选。
- `file`：交付附件，必填，支持 PDF、Word、Excel、PNG/JPG 和 ZIP，单文件上限 6MB。

规则：

- 当前用户必须是任务的办案律师。
- 任务必须是 `claimed`。
- 浏览器不直接访问 Supabase Storage，文件由 Next.js API 使用 service role 写入私有 bucket `lexos-deliverables`。
- 成功后写入 `task_deliverables` 文件元数据，并记录 `tasks.submit_file` 审计日志。

### GET /api/tasks/:id/deliverables/:deliverableId/download

下载内部交付附件。

当前状态：已实现第一版。

规则：

- 系统管理员、律所管理员、任务案源律师和任务办案律师可下载。
- 接口会生成 5 分钟有效的 Supabase Storage signed URL 并重定向。
- 下载动作会写入 `deliverables.download` 审计日志。

### POST /api/tasks/:id/approve

案源律师验收任务。

当前状态：已实现。

规则：

- 任务必须是 `submitted`。
- 案源律师只能验收自己发布的任务。

### POST /api/tasks/auto-confirm-overdue

处理客户逾期未确认任务，视为交付并生成待结算记录。

当前状态：已实现第一版。

权限：系统管理员、律所管理员。

规则：

- 读取组织级系统参数 `customer_auto_confirm_days`，默认 7 天，设置为 0 时停用。
- 只处理本组织内 `approved` 状态、已超过确认期、尚未客户确认且已绑定办案律师的任务。
- 如果任务已经存在结算记录，会跳过，避免重复生成资金记录。
- 符合条件的任务会生成 `pending` 结算记录，任务状态推进到 `settlement_pending`，并写入 `tasks.auto_confirm_overdue` 审计日志。
- 第一版由管理员手动触发，不发送短信、不做客户通知、不内置定时器；后续可复用服务函数接 Vercel Cron 或私有化定时任务。

响应示例：

```json
{
  "data": {
    "autoConfirmDays": 7,
    "cutoffAt": "2026-06-02T00:00:00.000Z",
    "processedCount": 2,
    "settlementIds": ["uuid"],
    "skippedCount": 0,
    "taskIds": ["uuid"]
  },
  "message": "ok"
}
```

## 客户大屏接口

### POST /api/customer-portal/:token/verify-code

校验客户访问验证码。

当前状态：已实现。

默认演示验证码为 `111111`。如果本组织在系统参数中保存了 `customer_portal_demo_code`，验证码校验会读取该参数值。

### GET /api/customer-portal/:token

获取客户大屏数据。

当前状态：已实现。

规则：

- token 必须存在且 active。
- 必须先通过验证码校验。
- 如果任务已由案源律师验收，响应中的交付附件会包含客户侧下载地址；任务未验收时只返回附件元数据，不开放下载。

### GET /api/customer-portal/:token/deliverables/:deliverableId/download

客户下载已验收任务的交付附件。

当前状态：已实现第一版。

规则：

- token 必须存在且 active。
- 必须先通过手机号验证码校验。
- 任务必须已进入 `approved`、`customer_confirmed`、`settlement_pending` 或 `settled` 状态。
- 接口会生成 5 分钟有效的 Supabase Storage signed URL 并重定向。
- 下载动作会写入 `customer_portal.deliverable_download` 审计日志。

### POST /api/customer-portal/:token/feedback

客户确认接收并提交评分，系统同时生成待结算记录。

当前状态：已实现。

请求：

```json
{
  "score": 9,
  "comment": "交付清晰，响应及时。"
}
```

规则：

- 评分必须是 0 到 10 的整数。
- 任务必须已由案源律师验收。
- 系统按“任务金额 × 办案律师职级比例”生成结算。

## 结算接口

### GET /api/settlements

查询结算列表。

当前状态：已实现。

查询参数：

- page
- pageSize
- search / keyword
- status
- sort：`generatedAtDesc`、`generatedAtAsc`、`amountDesc`、`statusAsc`

角色差异：

- 办案律师：只看自己的结算。
- 财务和管理员：看本组织结算。

响应补充：

- 每条结算会返回原始结算金额 `settlement_amount_cents` 和当前律师实付金额 `payable_amount_cents`。没有扣罚锁定时两者相同。
- 如果结算已经锁定扣罚资金流向，还会返回 `risk_deduction_case_id`、`risk_deduction_basis_points`、`risk_deduction_amount_cents`、`risk_penalty_destination`、`risk_deduction_note` 和 `risk_deduction_locked_at`。
- 每条结算会返回 `risk_freeze` 摘要，包含 `frozen`、`active_case_count`、`highest_severity`、`risk_case_ids`、`risk_case_titles` 和 `summary`。
- 当关联任务存在 `open` 或 `in_review` 风控工单时，`risk_freeze.frozen=true`，前端应展示“风控冻结”并禁止确认。
- `risk_freeze` 还会返回建议扣减字段：`deduction_basis_points`、`suggested_deduction_cents` 和 `suggested_payable_cents`。这些字段按最高未办结风控级别和系统参数计算，只作为风控建议，不会自动修改结算记录金额。
- 如果关联任务存在委员会扣减裁决，`risk_freeze.deduction_lock_candidate` 会返回可锁定的风控工单 ID、扣减比例和标题，供结算页展示“待锁定扣罚”操作。

### POST /api/settlements/:id/risk-deduction

锁定扣罚资金流向。

当前状态：已实现第一版。

权限：系统管理员、律所管理员、财务。

请求：

```json
{
  "riskCaseId": "uuid",
  "destination": "risk_reserve",
  "note": "按委员会裁决扣减并转入公共风险储备金。"
}
```

`destination` 支持：

- `risk_reserve`：公共风险储备金。
- `quality_fund`：质量督导基金。
- `client_refund`：客户退费。
- `firm_retained`：律所留存。

规则：

- 结算必须是 `pending`。
- 关联风控工单必须属于同一任务、同一组织，且委员会裁决为 `deduction`。
- 扣减裁决必须有大于 0 的 `committee_deduction_basis_points`。
- 接口按原始结算金额计算扣减金额和律师实付金额，写入 `settlements.payable_amount_cents`、`risk_deduction_amount_cents`、`risk_penalty_destination` 等字段。
- 锁定成功后，对应风控工单会办结为 `resolved`，结算可继续进入确认流程；如果同一任务仍有其他未办结风控工单，结算仍会保持冻结。
- 操作会写入 `settlements.lock_risk_deduction` 审计日志。

### POST /api/settlements/:id/confirm

财务确认结算。

当前状态：已实现。

规则：

- 当前用户必须是财务或管理员。
- 结算状态必须是 `pending`。
- 确认后任务状态进入 `settled`。
- 如果关联任务存在未办结风控工单，结算金额冻结，所有角色都不能确认；需要先在风控页办结工单。
- 如果本组织显式保存了 `settlement_lock_days`，财务和律所管理员只能在锁定期结束后确认结算；系统管理员可应急越过锁定。

### POST /api/settlements/bulk-confirm

批量确认结算。

当前状态：已实现第一版。

权限：系统管理员、律所管理员、财务。

请求：

```json
{
  "settlementIds": ["uuid-1", "uuid-2"]
}
```

规则：

- 一次最多确认 100 条结算记录。
- 所选结算必须全部属于当前组织且状态均为 `pending`。
- 与单笔确认共用任务金额冻结、锁定期规则、任务状态推进和审计日志。
- 任一记录不满足条件时，本次批量确认会返回错误，前端应刷新后重试。

### GET /api/settlements/export

导出结算记录 CSV。

当前状态：已实现。

权限：系统管理员、律所管理员、财务、办案律师。

角色差异：

- 办案律师：只能导出自己的结算记录。
- 财务和管理员：可以导出本组织结算记录。

查询参数：

- search / keyword
- status

当前最多导出 1000 条，按生成时间倒序排列。导出字段包括结算 ID、任务、办案律师、用户名、职级、任务金额、结算比例、原结算金额、扣减金额、律师实付金额、扣罚去向、扣罚锁定时间、状态、生成时间和确认时间。金额按元保留两位小数，便于财务在表格中汇总。

## 资金台账接口

### GET /api/funds

查询资金账户摘要和资金流水。

当前状态：已实现第一版。

权限：系统管理员、律所管理员、财务。

查询参数：

- page
- pageSize
- search / keyword
- accountType：`risk_reserve`、`quality_fund`、`client_refund`、`firm_retained`，或 `all`
- sort：`createdAtDesc`、`createdAtAsc`、`amountDesc`、`accountTypeAsc`

响应会返回：

- `summary`：四类账户摘要，包含账户类型、账户名称、余额、入账金额、支出金额、已入账笔数和最近入账时间。
- `transactions`：分页资金流水，包含账户类型、关联结算、关联风控工单、关联任务、金额、方向、流水类型、状态、说明、经办人和创建时间。
- `pagination`：分页元数据。

规则：

- 当前资金账户包括公共风险储备金、质量督导基金、客户退费和律所留存。
- `POST /api/settlements/:id/risk-deduction` 锁定扣罚资金流向后，数据库触发器会自动写入一条 `risk_deduction` 入账流水。
- 第一版只做内部资金台账，不做真实付款、银行流水、客户退款打款、基金审批或财务凭证。
- 办案律师不能访问该接口，也不能查看全所资金池。

## 投诉与风控接口

### GET /api/risk-cases

查询风控工单列表。

当前状态：已实现第一版。

权限：系统管理员、律所管理员、主任、案源律师、办案律师。

角色差异：

- 办案律师：只能查看自己承办任务关联的风控工单，并用于提交 48 小时答辩。
- 案源律师：只能查看自己登记的风控工单。

查询参数：

- page
- pageSize
- search / keyword
- status：`open`、`in_review`、`resolved`
- severity：`low`、`medium`、`high`、`critical`
- source：`customer_complaint`、`low_score`、`manual`
- sort：`createdAtDesc`、`createdAtAsc`、`severityAsc`、`statusAsc`

响应：

```json
{
  "data": {
    "riskCases": [
      {
        "id": "uuid",
        "task_id": "uuid",
        "customer_id": "uuid",
        "source": "customer_complaint",
        "severity": "high",
        "status": "open",
        "title": "客户投诉：交付说明异议",
        "description": "客户对交付材料提出异议",
        "resolution_note": null,
        "defense_statement": null,
        "defended_at": null,
        "committee_decision": null,
        "committee_decision_note": null,
        "committee_deduction_basis_points": null,
        "committee_decided_by": null,
        "committee_decided_at": null,
        "resolved_at": null,
        "updated_at": "2026-06-09T09:18:25.000Z",
        "created_at": "2026-06-09T09:18:25.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 50,
      "total": 1,
      "totalPages": 1
    }
  },
  "message": "ok"
}
```

### POST /api/risk-cases

创建风控工单。

当前状态：已实现第一版。

权限：系统管理员、律所管理员、主任、案源律师。

请求：

```json
{
  "taskId": "uuid",
  "source": "customer_complaint",
  "severity": "high",
  "title": "客户投诉：交付说明异议",
  "description": "客户对交付材料提出异议"
}
```

规则：

- `source` 支持 `customer_complaint`、`low_score`、`manual`。
- `severity` 支持 `low`、`medium`、`high`、`critical`。
- 第一版新建工单默认为 `open`。
- 关联任务和客户必须属于当前组织。
- 案源律师只能登记自己任务相关的工单。
- 创建会写入 `risk_cases.create` 审计日志。
- 客户评分、案源评分或案件结果评分低于等于 6 分时，会自动写入 `risk_cases.auto_create` 审计日志。

### PATCH /api/risk-cases/:id

更新风控工单处理状态。

当前状态：已实现第一版。

权限：系统管理员、律所管理员、主任、案源律师。

请求：

```json
{
  "action": "resolve",
  "resolutionNote": "已复核交付材料并完成客户说明。"
}
```

动作：

- `start_review`：待处理 `open` 进入处理中 `in_review`。
- `resolve`：待处理或处理中进入已处理 `resolved`，必须填写 `resolutionNote`。
- `reopen`：已处理重新打开为处理中 `in_review`，保留原处理意见，可选补充新说明。

规则：

- 案源律师只能处理自己登记的风控工单。
- 更新会写入 `risk_cases.update_status` 审计日志。
- 接口会更新负责人、状态、更新时间；办结时记录处理意见和办结时间，重新打开时清空办结时间。

### POST /api/risk-cases/:id/defense

办案律师提交风控答辩。

当前状态：已实现第一版。

权限：办案律师。

请求：

```json
{
  "defenseStatement": "已补充测算依据、客户沟通记录和后续整改说明。"
}
```

规则：

- 只有关联任务的风控工单可以提交答辩。
- 当前办案律师必须是关联任务的承办律师。
- 答辩期限为风控工单 `created_at` 后 48 小时。
- 已办结、已答辩或超过 48 小时的风控工单不能再次提交答辩。
- 提交会写入 `defense_statement`、`defended_at` 和 `updated_at`，并写入 `risk_cases.submit_defense` 审计日志。
- 当前第一版只记录答辩事实，不自动推进风控状态，也不触发裁决或扣罚。

### POST /api/risk-cases/:id/decision

提交风控委员会裁决。

当前状态：已实现第一版。

权限：系统管理员、律所管理员、主任。

请求：

```json
{
  "decision": "warning",
  "deductionBasisPoints": 0,
  "note": "采纳办案律师答辩，记录警示并办结。"
}
```

裁决类型：

- `no_fault`：无过错，工单进入已处理。
- `warning`：警示记录，工单进入已处理。
- `deduction`：扣减裁决，必须填写 1 到 10000 之间的 `deductionBasisPoints`，工单保持处理中，等待后续资金流向锁定。
- `escalation`：升级处理，工单保持处理中。

规则：

- 工单已有委员会裁决时不能重复提交。
- 已办结工单不能提交委员会裁决。
- 办案律师已提交答辩，或 48 小时答辩期已到期后，才允许提交裁决。
- 提交会写入 `committee_decision`、`committee_decision_note`、`committee_deduction_basis_points`、`committee_decided_by`、`committee_decided_at` 和 `updated_at`。
- 无过错和警示会同步写入 `resolution_note`、`resolved_at` 并把工单状态推进为 `resolved`。
- 扣减裁决和升级处理不会自动修改结算金额，也不会解冻结算；后续需要“扣罚资金流向锁定”继续处理。
- 提交会写入 `risk_cases.committee_decide` 审计日志。

## 审计日志接口

### GET /api/audit-logs

查询审计日志。

当前状态：已实现。

权限：系统管理员、律所管理员。

当前按服务端分页返回本组织审计记录，默认每页 50 条，按创建时间倒序排列。响应中会带上操作者的用户名和姓名，前端审计页已接入该接口。

查询参数：

- page
- pageSize
- search / keyword
- action
- entityType
- startDate
- endDate
- sort：`createdAtDesc`、`createdAtAsc`、`actionAsc`、`entityTypeAsc`

响应：

```json
{
  "data": {
    "logs": [
      {
        "id": "uuid",
        "actor_user_id": "uuid",
        "action": "tasks.claim",
        "entity_type": "tasks",
        "entity_id": "uuid",
        "metadata": {
          "rankId": "uuid"
        },
        "created_at": "2026-06-06T10:00:00.000Z",
        "actor": {
          "id": "uuid",
          "username": "lawyer01",
          "display_name": "办案律师"
        }
      }
    ]
  },
  "message": "ok"
}
```

后续增强：

- actorUserId
- 更多安全事件分类

### GET /api/audit-logs/export

导出审计日志 CSV。

当前状态：已实现。

权限：系统管理员、律所管理员。

查询参数：

- search / keyword
- action
- entityType
- startDate
- endDate

当前最多导出 1000 条，按创建时间倒序排列。响应类型为 `text/csv; charset=utf-8`，文件名格式为 `lexos-audit-logs-YYYY-MM-DD.csv`。

## 需要记录审计日志的操作

当前已记录：

- 登录成功
- 已识别账号的登录失败
- 修改密码
- 创建用户
- 创建客户
- 创建任务
- 抢单
- 提交成果
- 提交交付附件
- 下载交付附件
- 客户下载交付附件
- 验收任务
- 客户确认接收与评分
- 客户逾期未确认视为交付
- 创建风控工单
- 低分自动生成风控工单
- 更新风控工单状态
- 生成结算
- 财务确认结算
- 批量确认结算
- 锁定扣罚资金流向
- 扣罚资金入账
- 更新用户状态、角色或职级

后续补充：

- 更完整的审计报表
- 更多安全事件分类

## 系统参数接口

### GET /api/system-settings

读取本组织系统参数。

当前状态：已实现。

权限：系统管理员、律所管理员。

响应会合并数据库值和默认值，当前参数包括：

- `customer_portal_demo_code`：客户大屏演示验证码。
- `settlement_lock_days`：财务确认结算的锁定天数；只有在数据库中显式保存该参数后才会阻断确认。
- `customer_auto_confirm_days`：客户逾期未确认后可视为交付的天数，默认 7 天，设置为 0 时停用。
- `risk_deduction_low_basis_points`：一级关注风控建议扣减比例，默认 0 基点。
- `risk_deduction_medium_basis_points`：二级一般风控建议扣减比例，默认 500 基点。
- `risk_deduction_high_basis_points`：三级严重风控建议扣减比例，默认 1500 基点。
- `risk_deduction_critical_basis_points`：四级重大风控建议扣减比例，默认 3000 基点。
- `default_page_size`：列表接口未传 `pageSize` 时使用的默认分页数量。
- `demo_mode_hint_enabled`：是否显示演示模式提示。

### PUT /api/system-settings

保存本组织系统参数。

当前状态：已实现。

权限：系统管理员、律所管理员。

请求：

```json
{
  "settings": [
    {
      "key": "default_page_size",
      "value": 50
    }
  ]
}
```

规则：

- 只能更新系统定义内的参数 key。
- 参数会按定义校验类型和范围。
- 更新会写入 `system_settings.update` 审计日志。
- `customer_portal_demo_code` 会影响客户大屏验证码校验。
- `default_page_size` 会影响用户、客户、任务、结算和审计日志列表接口的默认分页数量。
- `settlement_lock_days` 会影响结算确认接口；为兼容当前演示数据，未显式保存时不会阻断财务确认。
- `customer_auto_confirm_days` 会影响 `POST /api/tasks/auto-confirm-overdue` 的处理范围。
- 四级 `risk_deduction_*_basis_points` 会影响 `GET /api/settlements` 返回的风控建议扣减字段，以及前端风控页和结算页的建议扣减展示。实际修改结算实付金额需要先提交委员会扣减裁决，再通过 `POST /api/settlements/:id/risk-deduction` 锁定扣罚资金流向。

## 实现前注意事项

- service role 只能在服务端使用，不能暴露到浏览器。
- 客户 token 明文只在生成链接时短暂出现，数据库只保存 hash。
- 验证码只保存 hash，并设置过期时间和尝试次数。
- 所有列表接口必须分页。
- 所有金额计算必须在服务端完成。
