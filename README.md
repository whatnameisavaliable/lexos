```markdown
# 律所协同AI办公平台 - 本地开发指南

本平台基于 Next.js (App Router) 与 Supabase (PostgreSQL) 构建，致力于通过结构化的 AI 能力提升律师事务所的协同办公效率。

## 1. 前置依赖环境 (Prerequisites)
在开始本地初始化之前，请确保您的物理机或开发容器中已安装并正确配置以下运行环境：
* **Node.js**: `>= v20.0.0`
* **Package Manager**: `npm` (或者 `pnpm` / `yarn`)
* **Supabase CLI**: 最新的稳定版本（用于管理数据库迁移与 RLS 本地校验）

## 2. 本地项目初始化步骤 (Installation & Initialization)

### 第一步：克隆项目并安装依赖
```bash
# 克隆仓库（或在现有目录中初始化）
cd law-firm-ai-platform

# 安装项目核心全栈依赖
npm install

第二步：配置本地环境变量

# 从模板复制环境变量配置文件
cp .env.example .env.local
复制完成后，请使用文本编辑器打开 .env.local，并填入从 Supabase 线上主页以及 AI 服务商处获取到的对应密钥。
第三步：关联 Supabase 并同步数据库 Schema
由于项目严禁直接在线上控制台点选修改 Schema，必须通过迁移脚本进行本地到线上的分发同步：
# 登录 Supabase 账户
supabase login

# 初始化/关联您线上的 Supabase 项目
supabase link --project-ref your-supabase-project-ref

# 将现有的本地迁移脚本推送到线上数据库执行，重构 RLS 权限体系
supabase db push

4. 团队协作开发红线警告

Cursor 编辑器开发提示：启动 Cursor 后，编辑器会自动加载项目根目录下的 .cursorrules。严禁在提示词中命令 AI 绕过迁移控制，严禁在 src/app/ 以外擅自拼装未经类型安全校验的动态路由。

提交合规：任何涉及表结构的修改，在执行 git commit 前，必须确保 supabase/migrations/ 目录下生成了对应的时间戳 .sql 文件。