# 系统上下文与领域模型 (CONTEXT.md)

## 1. 领域模块 (Domain Modules)

### 模块新增：用户管理与 AI 基础模块

本领域模块覆盖律所协同平台的基础身份体系与 AI 能力底座，核心子域包括：

- **用户与权限**：`users` 实体及角色枚举（`ADMIN` / `LAWYER` / `CLIENT` / `CHANNEL` / `DIRECTOR`），含管理员默认账号与首次登录改密防腐约定。
- **AI 配置**：`ai_models` 与 `function_model_mappings`，支撑 ASR、向量、通用 LLM 等模型类型及功能码到模型的映射。
- **云盘与 AI 任务**：`user_cloud_files`、`ai_tool_tasks`，含强文件校验与 `asr_raw_text` 底层文本源保留策略。

详细字段映射、数据库约束及 RLS 策略见 **§2 数据字典**。

## 2. 数据字典 (Data Dictionary)

### 模块新增：用户管理与 AI 基础模块

#### 核心数据实体与字段映射

1. **身份与权限实体 (`users`)**
   - `id` (UUID, Primary Key)
   - `username` (VARCHAR, Unique): 用户登录凭证。
   - `password_hash` (VARCHAR): 初始密码统一哈希处理为 `111111`。
   - `role` (VARCHAR): 枚举值 `ADMIN`, `LAWYER`, `CLIENT`, `CHANNEL`, `DIRECTOR`。
   - **防腐层约定**：管理员账号唯一且默认存在，首次登录必须在前端路由层强制拦截并要求修改密码。

2. **AI 模型配置实体 (`ai_models`)**
   - `id` (UUID, Primary Key)
   - `model_name` (VARCHAR), `model_id` (VARCHAR, Unique)
   - `api_key` (TEXT): 加密存储。
   - `model_type` (VARCHAR): `ASR`, `VECTOR`, `LLM_GENERAL`。
   - `is_local` (BOOLEAN): 默认 `FALSE`。
   - **防腐层约定**：数据库强制写入 `CHECK (is_local = TRUE OR api_key IS NOT NULL)` 绝对约束。AI 任务崩溃时直接报错并整体重启，不做状态机挂起死锁。

3. **功能模型映射实体 (`function_model_mappings`)**
   - `id` (UUID, Primary Key)
   - `function_code` (VARCHAR, Unique)
   - `model_id` (UUID, Foreign Key -> `ai_models.id`)

4. **工具集与云盘实体 (`user_cloud_files` & `ai_tool_tasks`)**
   - 云盘资产及 AI 任务执行流必须包含强文件校验（如体积上限、文件类型强制约束）。
   - 保留 `asr_raw_text` 作为底层文本源以防数据断层。

#### RLS 行级安全策略 (Row Level Security)

- **绝对隔离原则**：`users`、`ai_tool_tasks` 与 `user_cloud_files` 必须启用严格的 RLS。同种角色不同用户之间绝对禁止相互读取数据。
- **管理员特权**：针对 `ai_models` 等系统级表，仅具有 `Role=ADMIN` 权限的用户允许进行 `SELECT`, `INSERT`, `UPDATE`, `DELETE` 操作。
- **扩展锚点预留**：RLS 策略在设计时需通过结构（如表结构预留关联字段或策略预埋条件）为未来的“团队共享与全局审计”功能留出平滑升级的通道。

## 3. 接口映射 (Interface Mappings)
<!-- 空白基准：后续记录前后端通信协议、API 路由及第三方对接明细 -->
