# Lexos 架构草案

## 架构目标

Lexos 第一版要服务 demo 验证，同时为后续私有化部署和复杂业务规则留出扩展空间。架构设计的重点不是一次性做大，而是把权限、组织隔离、任务流转、结算、客户访问安全这些核心边界先放对。

## 技术选型

- 应用框架：Next.js + TypeScript
- UI：Tailwind CSS + shadcn/ui + lucide-react
- 数据与认证：Supabase Auth + Supabase Postgres + RLS
- 图表：Recharts
- 表单校验：React Hook Form + Zod
- 测试：Vitest + Playwright
- Demo 部署：Vercel
- 私有化方向：后续支持 Node.js 运行时和容器化部署

## 代码组织建议

```text
app/
  (auth)/
    login/
    change-password/
  (workspace)/
    dashboard/
    users/
    ranks/
    customers/
    tasks/
    settlements/
    audit-logs/
    settings/
  portal/
    [token]/
  api/
    auth/
    users/
    ranks/
    customers/
    tasks/
    customer-portal/
    settlements/
    audit-logs/
src/
  features/
    auth/
    users/
    ranks/
    customers/
    tasks/
    portal/
    settlements/
    audit-logs/
    settings/
  lib/
    supabase/
    auth/
    permissions/
    money/
    audit/
    validation/
  components/
    layout/
    navigation/
    data-table/
    status-badge/
    charts/
  types/
supabase/
  migrations/
  seed.sql
docs/
```

## 模块边界

### auth

负责内部用户登录、登出、改密、会话读取和首次改密判断。

### users

负责用户创建、禁用、角色分配、组织成员关系和律师职级绑定。

### ranks

负责 L1A 至 L3C 的职级配置和结算比例维护。

### customers

负责客户基础信息，第一版只保存必要联系信息和客户名称。

### tasks

负责任务发布、任务大厅、承接、提交成果、验收和状态流转。

### portal

负责客户安全访问链接、验证码校验、客户确认页、确认接收和评分。

### settlements

负责结算记录生成、结算状态流转和财务确认。

### audit-logs

负责关键操作留痕。

### settings

负责系统参数，例如默认验证码模式、任务状态枚举、演示开关等。

## 登录与账号策略

Supabase Auth 原生更偏向邮箱或手机号登录。Lexos 业务希望使用“用户名 + 密码”。建议第一版采用以下方案：

1. 用户在界面输入用户名和密码。
2. 服务端根据 profiles.username 找到内部映射的认证邮箱。
3. 服务端调用 Supabase Auth 完成密码登录。
4. 前端和业务界面始终展示 username，不要求用户知道内部认证邮箱。

默认管理员用于 demo 初始化。生产环境必须强制首次改密。

## 客户确认页访问策略

客户第一版不作为 Supabase Auth 用户。客户通过安全访问链接进入大屏：

1. 系统生成随机 token，只存 token_hash。
2. 客户打开链接后输入手机号验证码。
3. 服务端校验 token、手机号、验证码、过期时间和访问状态。
4. 校验通过后返回该任务的有限字段。
5. 客户确认接收和评分都由服务端写入。

客户确认页相关数据不直接暴露给 Supabase anon Data API。

## 权限策略

- 业务权限以 organization_id 和 organization_members 为基础。
- 客户端只负责展示，不能作为权限判断来源。
- 服务端所有写操作都要检查当前用户的组织成员身份和角色。
- Supabase RLS 作为数据库层防线，不能只依赖前端菜单隐藏。
- 不使用用户可编辑的 user_metadata 做权限判断。
- service role 只允许在服务端受控逻辑中使用，绝不暴露给浏览器。

## 状态流转

### 任务状态

```text
draft -> open -> claimed -> submitted -> approved -> customer_confirmed -> settlement_pending -> settled
```

第一版可以简化为：

```text
open -> claimed -> submitted -> approved -> customer_confirmed -> settled
```

### 结算状态

```text
pending -> confirmed -> paid
```

第一版先做到 pending 和 confirmed，paid 可预留。

## UI 设计方向

- 管理端第一屏是工作台，不做营销首页。
- 视觉风格：白色底、深墨色文本、低饱和深青或暖金强调色。
- 页面结构：左侧导航、顶部用户操作区、主内容表格和统计指标。
- 表格要支持状态标签、筛选、搜索、分页和清晰操作按钮。
- 客户确认页要比内部后台更“交付感”，突出项目状态、里程碑、确认接收和评分。

## 可扩展性原则

- 金额统一用最小货币单位保存，例如人民币分。
- 比例统一用 basis points 保存，例如 60% 保存为 6000。
- 状态统一用受控枚举或受控文本。
- 任务流转集中在 tasks 服务层，避免散落到多个页面。
- 结算计算集中在 settlements 服务层，后续便于接入基金、补贴、扣罚和退费。
- 审计日志由统一工具写入，避免每个模块各自拼日志。

## 第一版风险

- 用户名登录需要对 Supabase Auth 做一层业务映射。
- 客户验证码如果不接真实短信，只能作为 demo 安全体验，不能代表生产安全。
- 内部交付文件上传已走私有 Storage + 服务端 signed URL；后续客户侧下载、病毒扫描和文件生命周期仍需单独设计。
- 结算规则先简化，后续引入投诉扣罚时需要重新扩展结算流水模型。
