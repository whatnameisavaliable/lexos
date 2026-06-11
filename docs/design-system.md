# Lexos 设计系统说明

## 当前结论

Lexos 当前继续使用自定义 Tailwind 组件体系，不在本轮引入 shadcn。

原因：

- 当前后台已经形成深色商务侧栏、紧凑内容区、密集表格和克制色彩的行业风格。
- 项目尚处 MVP 迭代期，引入 shadcn 会带来较大的组件迁移面。
- 当前最需要的是统一现有样式 token，减少重复 class，而不是替换组件库。

后续如果出现大量弹窗、命令菜单、复杂选择器、日期范围筛选或可组合数据表，再评估引入 shadcn。

## 视觉原则

- 律所后台优先体现稳重、可信、清晰和高信息密度。
- 页面不做营销式大 hero，不做装饰性渐变背景，不用大面积单一紫蓝或咖色主题。
- 内容区保持紧凑，表格和表单以可扫描为主。
- 卡片只用于独立信息块、重复项和工具面板，不做卡片套卡片。
- 圆角控制在 `rounded-md` 以内，保持商务感。

## 代码约定

当前共用 UI token 位于：

```text
src/features/demo/ui-tokens.ts
```

优先复用：

- `lexosUi.panel`
- `lexosUi.panelHeader`
- `lexosUi.panelBody`
- `lexosUi.input`
- `lexosUi.inputBare`
- `lexosUi.tableWrap`
- `lexosUi.table`
- `lexosUi.tableHead`

新增后台页面时，先复用这些 token，再根据页面需要做小范围扩展。

## 后续组件化方向

下一阶段可继续抽象：

- 按钮：主按钮、次按钮、危险按钮、图标按钮。
- 表单行：label、说明、错误提示和输入控件组合。
- 数据表：表头、行、空状态、分页和批量操作。
- 筛选栏：搜索、状态筛选、日期范围和导出按钮。
- 审计与参数类页面：统一的设置行和只读详情行。
