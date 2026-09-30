# AI 智能医疗问诊平台 · PC / 移动 Web

同一套 Vue 3 应用、账号和接口。手机宽度小于 768px 时自动显示移动布局，桌面保持 PC 布局；无需单独安装 App 或另建移动数据库。

## 启动与手机访问

在 `client` 目录运行：

```powershell
npm install
npm run dev
```

电脑打开 `http://localhost:5173`。手机与电脑连接同一局域网，打开启动日志中显示的 `Network` 地址，例如 `http://192.168.1.11:5173`。电脑 IP 变化时以实际启动日志为准。

前端已监听 `0.0.0.0`，`/api` 和 `/uploads33` 由 Vite 转发到本机 `http://127.0.0.1:8000`。手机无需填写后端 IP。实际业务需要先按原项目配置启动 `server`，并保证数据库、图谱和 AI 服务可用；只有前端运行时可以打开登录页，但无法登录或加载真实业务。

已有 Python 环境和后端配置就绪时，可在 `server` 目录启动：

```powershell
.\venv\Scripts\python.exe -m uvicorn main:app --host 127.0.0.1 --port 8000
```

## 功能覆盖

| 角色 | 移动端功能 |
| --- | --- |
| 公共 | 三角色登录、患者注册 |
| 患者 | 首页与公告详情、AI 问诊与历史会话、症状推理与疾病详情、在线咨询、预约挂号、健康档案、健康资讯与详情、个人资料、头像、密码 |
| 医生 | 工作台、咨询回复、预约确认/完成/取消、患者档案新增/编辑/删除、个人资料、头像、密码 |
| 管理员 | 数据统计、用户管理、医生管理、科室管理、知识文件上传/删除、知识图谱搜索、咨询管理、预约管理、文章管理、公告管理、个人资料、头像、密码 |

手机底部提供常用功能，左上角菜单和底部“全部”提供当前角色的所有功能及退出登录。15 个业务表格在手机上显示为完整字段卡片，直接保留编辑、回复、删除等操作。搜索、分页和表单复用原业务方法。

AI 聊天可展开/收起历史；手机回车用于换行，点击“发送”提交。桌面 Enter 发送、Shift+Enter 换行，中文输入法确认不会误发送。历史加载时暂停发送，发送过程中暂停切换会话。

## 验证

```powershell
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

浏览器测试使用独立模拟接口，拦截全部 `/api/v1` 请求，不写入真实医疗数据。覆盖三角色共 26 个业务页面及登录注册的布局、完整菜单、卡片操作、咨询和预约提交、医生回复和预约确认、管理员编辑/搜索/分页、AI 历史与流式回复、症状详情、聊天历史加载竞态。

自动验证宽度为 320、390、430、1440px，聊天补充短视口检查。自动化为 Chromium 测试，不能替代真实 iOS Safari、微信内置浏览器和真实后端服务联调。截图输出在 `test-results`。

已有 Chromium 可通过环境变量指定可执行文件，随后运行浏览器测试：

```powershell
$env:PLAYWRIGHT_CHROMIUM_EXECUTABLE = '本机 Chromium 的完整可执行文件路径'
npm run test:e2e
```

## 发布

`npm run build` 输出 `dist`。Web 服务器需将未知前端路由回退到 `index.html`，并将 `/api/`、`/uploads33/` 转发到原后端。Vite 的开发代理不会包含在生产构建中。

## 主要改动位置

- `src/components/MobileNavigation.vue`：角色菜单、底部导航和手机标题栏。
- `src/components/ResponsiveTable.js`：复用 PC 列定义及插槽的手机卡片。
- `src/composables/useMobile.js`：与 CSS 一致的断点监听。
- `src/styles/mobile.css`：小屏表单、弹窗、图表、内容页和安全区适配。
- `src/views/portal/Chat.vue`：移动历史切换、输入区和流式会话处理。
- `tests`：组件测试与浏览器回归测试。
