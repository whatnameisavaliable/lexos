# LexOS 前端与 UI 交互规范

| 字段 | 内容 |
|------|------|
| 文档版本 | v1.1 |
| 依据 | `docs/prd.md` v0.3 §5.5、`docs/architecture.md` v1.1、`docs/database.md` v1.2 |
| 技术栈 | React（Next.js App Router 或等价）、Tailwind CSS、Shadcn UI |

---

## 1. 总则

### 1.1 目标

1.1.1 呈现律所级专业界面：深蓝 / 藏青 / 高级灰主色（PRD §5.5）。

1.1.2 左侧角色侧边栏 + 右侧宽屏工作区；数据列表以高密度表格为主。

1.1.3 与 RBAC、强制改密、MFA 流程严格对齐；禁止仅靠 UI 隐藏替代权限控制。

### 1.2 禁止事项

1.2.1 禁止在可复用交互控件上使用未封装的裸 `<button>`、`<input>`、`<select>` 堆叠样式（§2）。

1.2.2 禁止使用 Mermaid 或纯 SVG 流程图渲染**法律/业务复杂图表**及**打印视图**（§4）。

1.2.3 禁止长列表虚拟滚动直连全表数据（PRD §5.1）；须分页 API + 表格分页器。

---

## 2. UI 组件库选型约束

### 2.1 强制技术选型

| 类别 | 选型 | 说明 |
|------|------|------|
| 样式 | Tailwind CSS 3+ | 设计令牌通过 `tailwind.config` 扩展 |
| 组件 | Shadcn UI | 源码拷贝至 `components/ui/*`，可项目内改 |
| 图标 | Lucide React | 与 Shadcn 默认一致 |
| 表格 | Shadcn `Table` + `@tanstack/react-table` | 排序、列显隐、分页 |
| 表单 | Shadcn `Form` + `react-hook-form` + `zod` | 服务端错误映射至字段 |
| 对话框 | Shadcn `Dialog` / `AlertDialog` | 禁用、重置密码等二次确认 |
| 吐司 | Shadcn `Sonner` 或 `Toast` | 操作反馈 |

### 2.2 组件使用红线

2.2.1 **按钮**：一律使用 `components/ui/button.tsx` 的 `Button`；变体 `default` | `destructive` | `outline` | `ghost` | `link`。

2.2.2 **表单控件**：`Input`、`Label`、`Select`、`Checkbox`、`Switch` 均来自 `components/ui/*`。

2.2.3 **数据展示**：列表页使用 `Table` + `TableHeader`/`TableBody`/`TableRow`/`TableCell`；禁止用 `<div>` 模拟表格行列（除 §4 规定的图表区域）。

2.2.4 **禁止引入**第二套完整组件库（Ant Design、MUI 等）与 Shadcn 并行用于基础控件。

### 2.3 设计令牌（颜色）

| 令牌名 | 用途 | 参考 HSL（Tailwind 扩展） |
|--------|------|---------------------------|
| `--background` | 页面底 | 深蓝灰 220 30% 8% |
| `--foreground` | 主文字 | 220 15% 92% |
| `--primary` | 主操作、选中 | 220 60% 35%（藏青） |
| `--secondary` | 次要底 | 220 20% 18% |
| `--muted` | 表头、禁用底 | 220 15% 22% |
| `--destructive` | 删除、禁用 | 0 65% 45% |
| `--border` | 分割线 | 220 15% 28% |
| `--sidebar` | 侧边栏底 | 220 35% 12% |

2.3.1 具体数值在 `globals.css` 的 `:root` 定义；禁止组件内硬编码零散 hex。

---

## 3. 视图层布局红线

### 3.1 应用级骨架（强制 CSS Grid）

3.1.1 已认证业务布局组件：`AppShell`。

3.1.2 网格定义（二维划分）：

```css
/* AppShell 根容器 */
.app-shell {
  display: grid;
  grid-template-columns: var(--sidebar-width, 240px) 1fr;
  grid-template-rows: var(--header-height, 56px) 1fr;
  grid-template-areas:
    "sidebar header"
    "sidebar main";
  min-height: 100dvh;
}
```

| 区域 | `grid-area` | 内容 |
|------|-------------|------|
| 侧边栏 | `sidebar` | 角色菜单、`SidebarNav` |
| 顶栏 | `header` | 面包屑、用户菜单、退出 |
| 主内容 | `main` | 页面子路由 `children` |

3.1.3 窄屏【待确认】：宽度 `< 1024px` 时侧边栏改为抽屉；抽屉打开时仍由 Grid 占位或 `position:fixed`，主内容区不采用多列 Grid 嵌套混乱。

### 3.2 主内容区内部

3.2.1 列表页标准结构（Flexbox 纵向）：

```
main (grid-area: main)
  └── .page-container (display: flex; flex-direction: column; gap: 1rem; padding)
        ├── .page-toolbar (flex; justify-between; align-items: center)
        └── .page-body (flex: 1; min-height: 0; overflow: auto)
              └── Table + Pagination
```

3.2.2 工具栏与表格之间 **禁止** 再用 Grid 拆整页；仅 §4 图表模块内部可用 Grid。

### 3.3 登录 / 改密 / MFA 页

3.3.1 不使用 `AppShell`；单栏居中：

```css
.auth-layout {
  display: flex;
  min-height: 100dvh;
  align-items: center;
  justify-content: center;
}
```

3.3.2 卡片宽度 `max-width: 420px`；使用 Shadcn `Card`。

### 3.4 强制改密门禁（PRD §2.5.4）

3.4.1 `requires_password_change === true` 时：

- Router Guard 仅允许 `/change-password`；
- 不渲染 `SidebarNav` 业务项；
- `AppShell` 可降级为仅 `auth-layout` 包裹改密卡。

3.4.2 业务 API 返回 `AUTH_PASSWORD_CHANGE_REQUIRED` 时，客户端统一重定向改密页。

3.4.3 BFF 仅 `password-change-gate` 中间件拦截；前端 Router Guard 负责导航，**不在**页面层重复校验 session 字段。

---

## 4. 复杂图表与打印视图渲染强制要求

### 4.1 适用范围

4.1.1 时间线（如庭审阶段、录音段落时间轴）。

4.1.2 矛盾矩阵、对照表、多级法律关系表。

4.1.3 转写工作台**打印预览**与**导出前预览**。

### 4.2 技术红线

4.2.1 **严禁** Mermaid、`@mermaid-js/*`、纯客户端 Graphviz 渲染上述视图。

4.2.2 **必须**使用语义化 HTML + CSS Grid / Flexbox：

| 结构 | 布局 | 说明 |
|------|------|------|
| 时间线 | 外层 `display: grid`; `grid-template-columns: auto 1fr` | 左列时间点，右列事件块 |
| 矩阵表 | `display: grid`; `grid-template-columns: repeat(N, minmax(0, 1fr))` | 表头与单元格同级子元素 |
| 对照行 | `display: flex`; `gap`; `align-items: start` | 标签列固定宽 `flex: 0 0 120px` |

4.2.3 打印样式：独立 `@media print` 块；`print-color-adjust: exact`；禁止依赖 JS 重绘 canvas。时间线、矛盾矩阵等须保持版面稳定，支持法律文书场景下的精准对照输出（含 PDF 导出），避免动态图表库常见的截断与错位。

### 4.3 转写工作台音文对照（PRD §3.5）

4.3.1 桌面布局（Grid 两列）：

```css
.transcript-workbench {
  display: grid;
  grid-template-columns: minmax(280px, 36%) 1fr;
  gap: 1rem;
  height: calc(100dvh - var(--header-height) - 2rem);
}
```

4.3.2 右列编辑边界（**禁止**在可编辑富文本中直接改写字段 `asr_raw_json`）：

| 模式 | 数据源 | 交互 |
|------|--------|------|
| **校对模式**（默认进入，若存在时间戳） | `asr_raw_json` | 只读；按句/段渲染；点击块 `seek` 音频；不挂载 TipTap/Slate 可写文档 |
| **编辑模式** | `polished_text`（LLM 润色纯文本/HTML） | Shadcn 封装富文本编辑器；自由删改排版；**不**维护词级时间戳映射 |

4.3.2.1 模式切换：顶栏 `Switch` 或 `Tabs`（「校对」「编辑」）；切换至编辑模式时 `AlertDialog` 提示：「编辑模式仅修改润色文稿，不影响时间戳校对视图」。

4.3.2.2 保存：`PATCH` 仅提交当前模式对应字段；编辑模式保存 `polished_text` + `If-Match: version`（`architecture.md` §6.5）；校对模式无写接口（或仅管理员标记纠错【待确认】）。

4.3.3 左列：音频播放器（Flex 列）；与校对模式联动。

4.3.4 点击文稿段落 seek：校对模式下，段落块为 `<button type="button">` 并带 `data-start-ms`；**禁止** canvas 波形图作为唯一交互层【待确认】波形可选插件。

4.3.5 Diarization 降级横幅（PRD §4.3）：页面内容区顶部 `Alert` 组件，文案固定：

> 音频声纹重叠严重，已降级为无区分文本展示

---

## 5. 角色与导航

### 5.1 菜单可见性

| 角色 | 首期菜单 |
|------|----------|
| `admin` | 用户管理、AI 配置、审计日志、系统设置、管理首页 |
| `lawyer` | 语音转写、个人云盘、个人中心 |
| `director` / `client` / `channel` | 占位页（功能尚未开放）、个人中心（只读）、修改密码 |

5.1.1 菜单项由服务端 `role` 驱动配置数组渲染；禁止前端写死后仅靠 `display:none` 隐藏无权限路由。

### 5.2 路由守卫顺序

1. 是否登录  
2. `requires_password_change`  
3. 角色是否匹配路由 `allowedRoles`（admin 禁止进入 `/transcription`、`/drive`、`/lawyer`；预留角色仅 `/coming-soon`、`/profile`、`/change-password`）  
4. 是否存在进行中的 TUS 上传（见 §6.3.4.2）  

**首期不含 MFA 门禁**（`profiles.mfa_enabled` 字段保留，UI 不展示）。

---

## 6. 关键页面交互规范

### 6.1 登录页

6.1.1 字段：用户名、密码。（**首期实施**：无验证码、无 MFA 页；目标态见 `prd.md` §2.5.2–§2.5.3。）

6.1.2 无「忘记密码」提交；展示文案「请联系系统管理员重置密码」。

6.1.3 登录失败（不存在/密码错误/账户禁用）统一提示：**用户名或密码错误**。

6.1.4 会话：`localStorage` 持久化 refresh token；access 过期时静默 refresh；仅登出或清除本地 token 后须重登。

### 6.2 用户管理（admin）

6.2.1 表格列：用户名、真实姓名、角色、状态、创建时间、操作。（首期 **不含 MFA 列**。）

6.2.2 操作：`编辑`、`禁用/启用`、`重置密码`（`AlertDialog` 二次确认）。内置 `admin` 行的「禁用」置灰不可点。

6.2.3 分页：每页 50；Offset 或 Cursor 与 API 一致。

### 6.3 语音转写任务列表（lawyer / admin）

6.3.1 列：任务名、状态、时长、创建时间、操作。`failed` 显示「重试后续步骤」；`completed` 且 `llm_*_failed` 显示「部分成功」及分项重试。

6.3.2 状态标签：与 `transcription_task_status` 枚举对应；`completed` + LLM 分项失败时 Badge 为 **部分成功**（`warning` 色）。

6.3.2.1 新建任务：可选「说话人上限」数字框；**留空 = 不限制**（PRD-3.5-02）。

6.3.3 上传时序（**必须**经 BFF，严禁前端自拼 Storage 路径）

| 步骤 | 动作 |
|------|------|
| 1 | `POST /api/transcription/uploads/init`（或架构文档等价路径 `/api/upload-session`）提交文件名、大小、时长、MIME |
| 2 | BFF 创建 `transcription_tasks`（`uploading`）+ `upload_sessions`，返回 `upload_session_id`、`storage_key_prefix`、`tus_endpoint`、TUS 所需 headers/token |
| 3 | TUS 客户端使用返回的 **前缀与端点** 上传；`metadata` 仅作辅助，**不得**自行构造 `{other_user_id}/...` 路径 |
| 4 | 上传完成 → `POST /api/transcription/uploads/complete` 携带 `upload_session_id` |
| 5 | 任务进入 `queued`；列表展示进度条 |

6.3.3.1 **禁止**将 `File` body 经业务 API 上传；**禁止**未调用 init 即直传 Storage。

6.3.4 大文件上传防误操作（任务状态为 `uploading` 或 TUS 进度 `< 100%` 时生效）

6.3.4.1 **浏览器关闭/刷新**：挂载 `window.addEventListener('beforeunload', handler)`；`handler` 内 `event.preventDefault()`（现代浏览器显示系统级离开确认）。

6.3.4.2 **SPA 内部路由跳转**（含侧边栏菜单）：在路由守卫或布局层检测「存在进行中的上传」→ 阻塞导航并弹出 Shadcn `AlertDialog`：

> 当前有大文件正在上传，离开页面将中断传输。确定离开吗？

6.3.4.3 用户确认离开后：可选调用 TUS `abort()`；任务保持 `uploading` 或标记失败由用户重试【待确认】与 API 对齐。

6.3.4.4 上传结束后（`complete` 成功或用户取消且已 abort）：移除 `beforeunload` 监听，关闭路由拦截。

6.3.5 状态刷新：**HTTP 轮询**间隔 ≥ 2s（PRD-3.5-05）；首期不用 Realtime。

### 6.4 个人云盘

6.4.1 左树右表或单表「当前路径」；禁止根目录新建文件（PRD §3.6）；无 `parent_id` 时仅显示文件夹导航。

6.4.2 自动归档目录名使用完整标题（非法字符替换为 `_`，**不截断**）；超过 256 字归档失败并提示。

6.4.3 同级目录/文件**禁止重名**；创建或重命名冲突时 Toast 提示。

6.4.4 删除：律师可删本人节点；**管理员**可跨用户删除（不可浏览/下载律师云盘），审计 `file.delete` 含 `deletedByAdmin`。文件夹删除前二次确认，文案说明**级联软删**子项；成功 Toast 可展示 `deletedCount`。

6.4.5 自动归档目录允许律师重命名（PRD §3.6）。

### 6.5 高密度表格通用规范

6.5.1 行高 `h-9` 或 `h-10`；字号 `text-sm`。

6.5.2 数值列右对齐（`text-right`）；状态列居中。

6.5.3 空态：Shadcn 空状态插图 + 主操作按钮一枚。

---

## 7. 无障碍与国际化

### 7.1 首期语言

7.1.1 界面文案简体中文；`lang="zh-CN"`。

### 7.2 无障碍【待确认】

7.2.1 表单控件须关联 `Label` 或 `aria-label`。

7.2.2 对比度满足 WCAG AA【待确认】等级闭合后实测。

---

## 8. 文件与目录约定（前端）

```
apps/web/
├── app/                    # 路由
├── components/
│   ├── ui/                 # Shadcn 生成组件（禁止业务逻辑）
│   ├── layout/             # AppShell, SidebarNav
│   ├── auth/               # 登录、改密、MFA
│   ├── admin/
│   ├── transcription/
│   └── drive/
├── lib/                    # API 客户端、auth、upload-tus（封装 init/complete，禁止裸拼路径）
└── styles/
    └── globals.css         # 设计令牌
```

8.1 页面级业务组件放在 `components/<domain>/`；`components/ui/` 仅放无业务耦合的 UI 原语。

---

## 9. 文档修订记录

| 版本 | 日期 | 说明 |
|------|------|------|
| v1.0 | 2026-05-29 | 首版，依据 PRD v0.3 |
| v1.1 | 2026-05-29 | TUS BFF 时序、上传防误操作、工作台校对/编辑双模式、用户列表 MFA 列 |
