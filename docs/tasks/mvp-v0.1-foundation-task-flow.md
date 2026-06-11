# 任务：MVP v0.1 基础骨架与任务闭环

## 状态

- 状态：本地 demo 骨架已完成，真实 Supabase 接入待下一轮
- 负责人：Codex + 用户
- 创建日期：2026-06-06
- 更新日期：2026-06-06

## 用户场景

律所希望先用一个 demo 验证内部任务协作是否可行：案源律师可以发布任务，办案律师可以抢单并提交成果，客户可以通过安全链接查看交付并评分，财务可以看到系统自动生成的结算记录。

## 目标

完成 Lexos 第一条最小业务闭环：

管理员初始化用户和职级 -> 案源律师创建客户与任务 -> 办案律师抢单 -> 办案律师提交成果 -> 案源律师验收 -> 客户通过验证码链接确认接收并评分 -> 系统生成结算记录 -> 财务确认结算。

## 非目标

- 不实现动态 SKU 拖拽表单。
- 不实现完整常法套餐。
- 不实现虚拟团队复杂分成。
- 不实现投诉分级、扣罚、冻结和风控委员会流程。
- 不实现新兵引流池和律师滚动评分。
- 不接入真实短信服务商，除非用户明确要求。
- 不存储完整案卷材料和复杂证据矩阵。

## 角色与权限

- 系统管理员：创建用户、配置职级、查看审计日志、维护系统参数。
- 案源律师：创建客户、创建任务、验收任务、查看自己发布的任务。
- 办案律师：查看符合条件的任务、抢单、提交成果、查看自己的结算。
- 财务：查看结算记录、确认结算。
- 客户：通过安全链接和验证码访问指定任务大屏，确认接收并评分。

## 工作流

1. 系统有一个默认管理员账号，用于 demo 初始化。
2. 管理员登录后创建案源律师、办案律师和财务用户。
3. 管理员配置 L1A 至 L3C 的职级和结算比例。
4. 案源律师创建客户。
5. 案源律师创建任务，填写任务金额、任务说明、截止时间和最低职级条件。
6. 系统为任务生成客户大屏安全链接。
7. 办案律师进入任务大厅，查看符合条件的待抢任务。
8. 办案律师抢单后，任务进入处理中。
9. 办案律师提交成果说明或里程碑。
10. 案源律师验收任务。
11. 客户打开安全链接，输入验证码，查看任务交付信息。
12. 客户确认接收并提交 10 分制评分。
13. 系统按“任务金额 × 办案律师职级比例”生成待结算记录。
14. 财务确认结算。
15. 系统记录关键审计日志。

## 数据模型影响

### 新增表

- organizations
- profiles
- organization_members
- roles
- ranks
- customers
- matters
- tasks
- task_claims
- task_milestones
- task_deliverables
- customer_portal_links
- customer_verification_codes
- customer_feedback
- settlements
- audit_logs
- system_settings

### 关系

- 一个 organization 拥有多个用户、客户、任务和结算记录。
- 一个 profile 对应一个 Supabase Auth 用户。
- 一个 organization_member 绑定用户、组织、角色和律师职级。
- 一个 customer 可以关联多个 matter。
- 一个 matter 可以关联多个 task。
- 一个 task 可以有一条最终有效的 task_claim。
- 一个 task 可以有多个 milestone 和 deliverable。
- 一个 task 可以生成一个客户大屏链接。
- 一个 task 完成验收和客户确认后生成 settlement。

### RLS 策略

- 所有 public schema 下的业务表启用 RLS。
- 内部用户只能访问自己所属 organization 的数据。
- 办案律师只能看到可抢任务、自己的任务和自己的结算。
- 案源律师只能管理自己创建或被授权的客户、案件和任务。
- 财务只能处理本组织的结算数据。
- 客户大屏不直接开放 Supabase 表访问，由服务端校验安全链接和验证码后返回有限数据。

### 索引

- organization_id
- user_id
- role_code
- task status
- task source_lawyer_id
- task assigned_lawyer_id
- customer phone
- portal token hash
- settlement status
- created_at

## API 影响

### 新增接口

- POST /api/auth/login
- POST /api/auth/logout
- POST /api/auth/change-password
- GET /api/users
- POST /api/users
- PATCH /api/users/:id
- GET /api/ranks
- PATCH /api/ranks/:id
- GET /api/customers
- POST /api/customers
- GET /api/tasks
- POST /api/tasks
- GET /api/tasks/:id
- POST /api/tasks/:id/claim
- POST /api/tasks/:id/submit
- POST /api/tasks/:id/approve
- POST /api/customer-portal/:token/send-code
- POST /api/customer-portal/:token/verify-code
- GET /api/customer-portal/:token
- POST /api/customer-portal/:token/confirm
- POST /api/customer-portal/:token/feedback
- GET /api/settlements
- POST /api/settlements/:id/confirm
- GET /api/audit-logs

## UI 影响

### 页面

- 登录页
- 修改密码页
- 管理端概览大屏
- 用户管理页
- 律师职级配置页
- 客户管理页
- 任务发布页
- 任务大厅页
- 我的任务页
- 任务详情页
- 客户大屏页
- 结算管理页
- 审计日志页
- 系统参数页

### UI 风格

- 整体采用商务、克制、专业的法律行业风格。
- 以白色、深墨色、暖金或深青作为主视觉。
- 页面以工作台为第一屏，不做营销落地页。
- 管理端重视表格、筛选、状态标签、数字指标和操作效率。
- 客户大屏更强调交付可信度、进度清晰和确认动作。

## 验收标准

- [x] 管理员可以登录系统。
- [x] 管理员可以创建案源律师、办案律师和财务用户。
- [x] 管理员可以配置 L1A 至 L3C 职级和比例。
- [x] 案源律师可以创建客户和任务。
- [x] 系统可以为任务生成客户安全访问链接。
- [x] 办案律师可以在任务大厅看到符合条件的任务。
- [x] 办案律师可以抢单。
- [x] 办案律师可以提交成果说明。
- [x] 案源律师可以验收任务。
- [x] 客户可以通过验证码访问客户大屏。
- [x] 客户可以确认接收并提交评分。
- [x] 系统可以生成待结算记录。
- [x] 财务可以确认结算。
- [x] 关键操作写入审计日志。

## 测试计划

- 单元测试：结算金额计算、任务状态流转、角色权限判断、验证码校验。
- API/集成测试：登录、创建用户、创建任务、抢单、提交、验收、客户确认、生成结算。
- Supabase RLS 测试：不同角色只能访问授权范围内的数据。
- UI/浏览器检查：登录、任务大厅、任务详情、客户大屏、结算页主流程。
- 手工验收：用管理员、案源律师、办案律师、财务和客户五种身份跑完整闭环。

## 文档更新

- [x] 项目总览
- [x] 当前状态
- [x] Backlog
- [x] 架构草案
- [x] 数据库草案
- [x] API 草案
- [ ] 用户手册
- [ ] 管理员手册
- [ ] 部署文档
- [ ] 运维文档
- [x] Changelog

## 开放问题

- 真实 Supabase 项目中默认管理员账号由脚本创建，还是控制台创建后绑定业务 profile。
- 当前已接入真实 Supabase API，后续需要补 RLS 权限验证、审计日志筛选和系统参数管理。
