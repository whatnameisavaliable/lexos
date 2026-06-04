# 项目任务看板 (TODO.md)

## [Task Backlog]

### 阶段一：基础设施构建
- [x] 启动并配置本地 Supabase 环境
- [ ] 验证本地 Supabase 与 Next.js 环境变量的连通性
- [ ] 执行数据库首次基础迁移与 RLS 验证

### 阶段二：业务功能开发
- [ ] 建立用户认证中心（Auth Flow）
- [ ] 模块化核心业务组件

### 阶段三：测试与发布
- [ ] 执行 TypeScript 严格模式全局类型静态检查
- [ ] 验证物理页面及打印排版的布局稳定性

### 阶段：用户管理与AI基础模块开发
- [ ] Database: 生成纯 SQL Migration 脚本（包含表结构与 RLS 策略）。
- [ ] Type: 执行 Supabase CLI 同步最新 TypeScript 接口类型。
- [ ] Server: 编写服务端核心逻辑及数据交互接口。
- [ ] Client: 实现前端 UI 视图与数据绑定（强制遵循仅使用 CSS Grid/Flexbox 规范）。
