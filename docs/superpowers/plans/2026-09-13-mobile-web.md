# 移动 Web Implementation Plan

**Goal:** 完整移植现有 PC 页面到移动 Web，共用现有业务接口。

**Architecture:** Vue 响应式布局、统一移动导航、表格卡片双形态组件。页面保留原业务方法，卡片复用原列插槽。

**Tech Stack:** Vue 3、Element Plus、Vite、Node test。

**Spec:** ../specs/2026-09-13-mobile-web-design.md

## Global Constraints

- 768px 以下启用移动布局，支持 320px 以上视口。
- 患者、医生、管理员全部入口及原有权限保持一致。
- 不复制后端，不引入新的运行时 UI 依赖。
- 当前目录没有 Git 元数据，直接在当前源码目录实现并保留验证记录。

## 执行任务

- [x] 创建 `client/tests/mobile-table.test.js`，用 Vue 自定义渲染器验证真实卡片字段和按钮点击的行参数，先运行 `node --test tests/mobile-table.test.js` 确认缺失实现。
- [x] 创建 `client/src/composables/useMobile.js` 和 `client/src/components/ResponsiveTable.js`，手机渲染列标签与原始插槽，桌面使用 Element Plus 表格；替换所有页面的表格容器。
- [x] 创建 `MobileNavigation.vue`，接入 `PortalLayout.vue` 和 `AdminLayout.vue`，实现角色导航、抽屉关闭、退出登录。
- [x] 创建移动样式文件，适配搜索、分页、弹窗、抽屉、表单、图表、内容页与登录注册；在 `main.js` 引入。
- [x] 调整 `Chat.vue` 历史折叠、动态视口、中文输入发送、流式消息响应式更新；首页补全服务快捷入口。
- [x] 配置局域网开发入口、viewport 与中文语言，运行组件测试和 `npm run build`。
- [x] 浏览器检查手机与 PC 页面，记录接口联调范围和手机访问方式到 `client/README.md`。
