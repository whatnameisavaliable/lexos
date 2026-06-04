# 系统架构与开发规范 (ARCHITECTURE.md)

## 1. 核心目录树结构
本规范确立项目核心目录的职责划分，全体开发成员及 AI 辅助工具必须严格遵守：

```text
├── app/                  # Next.js App Router 路由与页面层（默认优先 RSC）
├── components/           # 共享 UI 组件层（仅限 CSS Grid/Flexbox 排版，禁用绝对定位）
├── lib/
│   └── supabase/         # Supabase JS Client v2 客户端初始化与核心封装
└── types/                # 全局 TypeScript 严格类型声明目录
```

2. 统一日志记录规范
系统必须执行分级日志记录与错误追踪，严禁使用非结构化的 console.log：

日志级别 (Logging Levels)
DEBUG: 仅在开发环境中输出的详细调试信息（如接口原始响应）。

INFO: 关键业务节点、系统启动、核心配置加载等常规事件。

WARN: 潜在的非致命性异常，不影响核心业务运行（如非关键第三方 API 超时）。

ERROR: 系统致命错误、未捕获异常、断网或凭证失效，必须触发错误追踪拦截器。

错误追踪规则
所有异步操作和数据库请求必须包裹在 try...catch 块中。

捕获的错误必须保留完整的 Error Object（包含 Stack Trace），并统一通过专门的异常处理器进行结构化包装后上报，禁止吞掉错误信息。

3. Supabase RLS（行级安全）基础策略模板
所有数据库表必须默认启用 RLS，基础策略声明模板如下：

```sql
-- 1. 启用行级安全约束
ALTER TABLE "your_table_name" ENABLE ROW LEVEL SECURITY;

-- 2. 默认匿名/公开查询策略（如适用）
CREATE POLICY "允许公开匿名读取" 
ON "your_table_name" 
FOR SELECT 
USING (true);

-- 3. 认证用户专属操作策略
CREATE POLICY "允许认证用户管理个人数据" 
ON "your_table_name" 
FOR ALL 
TO authenticated 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);
```
