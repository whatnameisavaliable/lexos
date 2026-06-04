# Project Architecture Whitepaper - 律所协同AI办公平台

## 1. 核心技术栈 (Core Tech Stack)
* **前端框架**：Next.js 14+ (App Router, 强制全栈 TypeScript)
* **样式与UI**：Tailwind CSS + shadcn/ui (基于 Radix Primitives)
* **后端与数据库**：Supabase (PostgreSQL) + Row Level Security (RLS)
* **基础设施与部署**：Vercel Serverless 环境

## 2. 系统目录结构树 (System Directory Tree)
```text
├── .cursorrules             # Cursor 行为约束规则文件
├── .env.example             # 环境变量模版
├── Architecture.md          # 核心架构白皮书（本文档）
├── README.md                # 运行与初始化指南
├── supabase/                # Supabase 配置及迁移目录
│   ├── config.toml          # Supabase 本地配置文件
│   └── migrations/          # 数据库迁移 SQL 脚本目录
└── src/                     # Next.js 源代码主目录
    ├── app/                 # App Router 路由与页面层
    │   ├── layout.tsx       # 全局根布局
    │   ├── page.tsx         # 平台主页
    │   ├── api/             # 独立 API 路由接口层
    │   └── (dashboard)/     # 协同办公仪表盘业务聚合路由
    ├── components/          # 可复用组件库
    │   ├── ui/              # shadcn/ui 自动生成的原子组件
    │   └── shared/          # 跨业务线共享的复杂排版组件（如文书、时间轴）
    ├── lib/                 # 核心工具类与系统配置
    │   ├── supabase.ts      # Supabase 客户端初始化（强制区分 Client/Server）
    │   └── utils.ts         # Tailwind 样式合并等通用工具
    ├── types/               # 全局 TypeScript 类型定义声明文件
    └── services/            # 后端核心业务逻辑与 AI 提示词引擎服务层
3. 前后端通信契约基础规范 (API & Server Actions Communication Contract)
系统内部所有前后端数据通信（无论是 Server Actions 还是标准 API Routes），响应格式必须严格遵守以下 JSON 契约基础格式。

成功响应格式 (Success Response)
{
  "success": true,
  "data": {
    "id": "case_9921102",
    "status": "active",
    "updated_at": "2026-06-04T09:37:00Z"
  },
  "error": null
}
失败/异常响应格式 (Error Response)
{
  "success": false,
  "data": null,
  "error": {
    "code": "UNAUTHORIZED_ACCESS",
    "message": "当前操作违反 RLS 行级权限保护，用户无权读取该案件资产数据。",
    "details": "Operator UID does not match case owner ID or collaborative whitelist."
  }
}
4. 核心架构约束与设计红线
排版解耦：涉及法律案件文书呈现与打印输出的组件，必须强制在 src/components/shared/ 下基于 CSS Grid/Flexbox 进行静态独立设计。组件内严禁直接暴露或拼接敏感律所的硬编码字符串，应统一通过上层 View 组件的 Props 或是平台多租户上下文动态注入。

跨境合规字段要求：鉴于平台包含涉港法律业务服务（如跨境资产与房产尽职调查），所有与案件相关的核心数据表（如 cases, documents），必须包含 data_region 字段（取值范围：mainland, hongkong）。RLS 策略需与此字段联动，涉及香港地区的数据在流转、展示及日志记录时，术语必须自动适配香港商业及法律惯例术语。

风险控制点命名法：后端执行器在校验输入边界（例如大文件附件深度解析、多线程并发调用 Gemini API 状态）时，代码块上方必须设置 风险控制点 标识，确保 IT 审计流程能够对异常熔断机制进行回溯。