# 在线咨询长期聊天与知识沉淀开发计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将在线咨询升级为患者与医生长期保存的 WebSocket 聊天，支持 AI 问诊摘要自动转交，以及医生选取消息、编辑知识文章、确认入库和向量化。

**Architecture:** 在现有 Vue 3、FastAPI、MySQL 项目中增加独立的人工会话与消息模型，以 WebSocket 处理消息收发和状态推送，以 HTTP 处理按需查询。耗时模型调用和知识入库采用 MySQL 持久化任务，业务更新与待推送事件同事务保存。知识文章采用受限 JSON 编辑，医生确认后转换为 Markdown，复用现有 Chroma 检索链路。

**Tech Stack:** Vue 3、JavaScript、Vite、Element Plus、Pinia、Axios、浏览器原生 WebSocket、Tiptap；Python、FastAPI、Pydantic、SQLAlchemy、MySQL、LangChain/OpenAI 兼容接口、Chroma；pytest、HTTPX、Node Test Runner、Playwright、ego 浏览器。

**Spec:** [已确认设计](../specs/2026-10-22-consultation-chat-knowledge-design.md)，以其中 WebSocket 修订为准。

**Prototype:** [原型图集](../../prototypes/consultation/gallery.html)、[原型说明](../../prototypes/consultation/README.md)。原型只提供交互与视觉参考，不作为后端正确性的证据。

日期：2026-10-22。状态：开发计划，尚未实施。本文件的复选框只在对应实现及验证完成后勾选。

## 1. Global Constraints：全局约束

- 同一患者与同一医生始终共用一段长期聊天；数据库联合唯一约束必须成立。
- 人工聊天采用 WebSocket 双向通信，不使用定时轮询，也不在断线时降级为轮询。
- 每次最多加载 50 条消息，通过消息序号游标向前加载历史或向后获取新消息。
- 发起咨询前选择医生；下拉显示姓名、科室、职称，支持搜索和分页。
- 选择医生后自动生成并发送当前 AI 会话摘要，不增加患者预览或二次确认。
- 每个气泡独立选择；只处理选中的消息，不自动扩展为全部聊天或固定一问一答。
- 医生编辑正常排版的文章，不显示 Markdown 源码；只有确认版本进入公共知识库。
- 模型暂时失败最多自动重试 3 次（逐次退避），之后显示失败并允许手动重试。
- 医生端复用 `AdminLayout.vue` 的 240px 侧栏、76px 收起侧栏及顶部工具栏；移动端复用 `MobileNavigation.vue`。不重写患者端已确认的视觉方案。
- 第一版为文本聊天，不扩展图片、文件、语音、群聊、撤回或站外通知。
- 第一版只支持一个 Uvicorn worker；增加多个 worker/实例前必须引入跨进程分发。Redis、Celery 不列入本次必要依赖。
- 保留 AI 问诊现有 SSE 输出形式；人工聊天使用 WebSocket，两者职责独立。
- 测试使用独立数据库、临时上传目录与 Chroma 目录；测试不清空现有业务数据、不读取真实患者内容作为样例。
- 执行开发前按项目规则建立或复用隔离工作区；本计划阶段不创建工作区、不安装依赖、不运行迁移。

## 2. Review Focus：重点复核的五类故障

1. 患者 ID 和医生 ID 数值相同：连接、去重和事件路由必须使用 `(role, user_id)` 身份，不能只按数字 ID 分组。由任务 02、04 验证。
2. 消息已入库但确认丢失，或推送先于发送确认：重发不能多一条，临时气泡必须合并为已保存气泡。由任务 02、05 验证。
3. 初次历史加载或重连补取期间又收到实时消息：不能遗漏、重复、倒退已读位置或用旧会话状态覆盖新状态。由任务 04、05、17 验证。
4. 重新整理期间医生继续编辑，或管理员删除时旧入库任务仍在执行：旧生成结果不能覆盖新草稿，旧执行器不能恢复已删除知识。由任务 08、11、13 验证。
5. 中文输入法、中文标点与医疗文本中的 `#`、`*`、`<` 等字符：不能误发消息或改变最终文章含义，长文本不得静默截断。由任务 07、11、12、13 验证。

## 3. 实施顺序与阶段交付

这些模块共享会话、任务和权限契约，采用一个总计划顺序推进，避免拆成彼此不一致的独立方案。每个任务都应独立验证和提交；不要求同时上线。

| 阶段 | 任务 | 阶段交付与放行条件 |
| --- | --- | --- |
| A 数据与实时服务 | 01—04 | 新表、权限、历史接口、WebSocket 收发与恢复可独立测试 |
| B 医患聊天页面 | 05—07 | 患者和医生能持续聊天，历史、未读、响应式布局及选消息可用 |
| C AI 转人工 | 08—10 | 持久化任务可恢复；选择医生后自动发送摘要，失败可重试 |
| D 知识沉淀 | 11—13 | 消息整理、文章编辑、确认、Markdown 文件与检索全链路可用 |
| E 管理与历史 | 14—16 | 统计、管理员页面、迁移工具和只读历史入口完成 |
| F 验收与交付 | 17—18 | 真实服务联调、故障恢复、迁移演练及部署手册通过 |

主依赖：`01 → 02 → 03 → 04 → 05 → 06 → 07`；`01/04 → 08 → 09 → 10`；`07/08 → 11 → 12 → 13`；`02/13 → 14`；`01/02 → 15 → 16`；全部功能完成后执行 `17 → 18`。

## 4. 现状与文件职责

已核对现有代码：

- `server/api/v1/consult.py` 和 `server/models/doctor_consult.py` 使用工单与回复模型；新聊天不直接在旧字段上拼接追问。
- `server/api/v1/chat.py` 的 `done` 在助手消息保存前输出；必须增加数据库提交后的 `saved` 事件。
- `server/api/v1/knowledge.py` 使用 FastAPI `BackgroundTasks`；咨询相关耗时任务要持久化，知识重建统一走同一入库服务。
- `server/rag/vector_store.py` 删除异常目前被吞掉；必须向上报告，避免残留向量被误判为已清理。
- `server/services/rag_service.py` 存在问题正文、文档片段和模型消息预览日志；涉及本次链路时改为仅记录 ID、阶段和耗时。
- 前端现有页面直接使用 `client/src/utils/request.js`，没有 `src/api/` 目录；本次按下面规划新增功能目录，不假设已有接口层。
- 前端已有 Node 单测和 `client/tests/e2e/`，后端尚无本功能测试基座；任务 01 建立独立测试环境。

| 文件或目录 | 状态 | 单一职责 |
| --- | --- | --- |
| `server/models/human_chat.py` | 新增 | 会话、消息及会话版本 |
| `server/models/consult_processing.py` | 新增 | 转人工、知识草稿、后台任务、待推送事件、迁移映射 |
| `server/services/consultation_mode.py` | 新增 | 持久化切换模式、首次新写入标记和统一写入守卫 |
| `server/schemas/human_chat.py` | 新增 | 聊天 HTTP/WS 数据契约 |
| `server/schemas/consult_processing.py` | 新增 | 任务状态、消息快照、文章结构及草稿契约 |
| `server/services/human_chat_service.py` | 新增 | 会话事务、消息、已读、未读和待回复 |
| `server/services/consult_access.py` | 新增 | 聊天、草稿、任务归属与账号状态检查 |
| `server/realtime/connection_manager.py`、`outbox.py` | 新增 | 在线连接管理、可靠事件投递 |
| `server/api/v1/consult_ws.py` | 新增 | WS 鉴权、命令与心跳入口 |
| `server/jobs/runner.py`、`repository.py`、`handlers.py` | 新增 | 任务租约、调度和业务处理器注册 |
| `server/services/ai_handoff_service.py`、`consult_knowledge_service.py` | 新增 | 摘要转交、知识草稿业务 |
| `server/services/consult_generation.py`、`article_format.py` | 新增 | 模型调用与脱敏、文章校验与 Markdown 序列化 |
| `server/services/knowledge_ingestion.py` | 新增 | 文件入库、串行向量处理、发布与删除 |
| `server/api/v1/consult.py` | 修改 | 人工会话查询；最终封停旧写入口 |
| `server/api/v1/consult_processing.py`、`consult_history.py` | 新增 | 任务/草稿 API、只读旧记录与继续咨询 |
| `client/src/features/consultation/` | 新增 | 本功能 HTTP、WS、事件合并及编辑器适配；维持 JavaScript |
| `client/src/stores/consultation.js` | 新增 | 医患会话、消息及任务状态 |
| `client/src/components/consultation/` | 新增 | 聊天列表、气泡、输入框、医生选择器、文章编辑器等 |
| `client/src/views/portal/Consult.vue`、`Chat.vue` | 修改 | 患者长期聊天、AI 转人工入口 |
| `client/src/views/doctor/Consults.vue` | 修改 | 医生聊天、筛选、选择消息及信息抽屉 |
| `client/src/views/doctor/KnowledgeReview.vue` | 新增 | 文章确认与入库结果 |
| `server/scripts/consultation_schema.py`、`migrate_consultations.py` | 新增 | 幂等结构升级、旧数据审计与迁移 |
| `server/tests/`、`client/tests/` | 新增/扩展 | 后端契约/集成测试、前端逻辑与流程验证 |

新 Python 包补充 `__init__.py`。只修改任务明确涉及的文件；不因本需求全面重构现有应用。

## 5. 公共契约与测试约定

### 5.1 数据与接口约定

- 继续使用 `CurrentUser`，`role` 为 `user/doctor/admin`；模型中的 `patient_id` 对应现有 `User.id`，不另建身份体系。
- `HumanMessage` 的 `(conversation_id, seq)` 唯一；用户发送去重键为 `(sender_role, sender_id, client_request_id)`，同标识不同正文或不同目标返回冲突。任务消息使用唯一 `source_task_id`。
- `HumanConversation` 增加 `version`，消息、已读及会影响展示的状态变更均递增。未读只统计对方有效消息，不含自己和系统提示；待回复按最后患者/摘要序号与医生序号比较。
- `ConversationDTO` 包括 `id/version/peer/last_message/last_seq/my_read_seq/unread_count/pending_reply/can_send`；`peer` 包括姓名、科室和职称。`MessageDTO` 包括 `id/conversation_id/seq/sender_role/sender_id/type/content/structured_content/client_request_id/created_at`。
- `SendMessageCommand` 包括 `client_request_id/content` 及二选一的 `doctor_id/conversation_id`。`MessagePage` 包括 `items/has_more/next_before_seq/next_after_seq`；`ConversationPage` 包括 `items/total/page/page_size`。
- WS 地址 `/api/v1/consult/ws`；帧为 `{version:1,type,request_id,data}`，事件另含 `event_id`。类型使用设计中的 `auth/message.send/message.ack/message.created/conversation.read/conversation.updated/task.updated/request.error/ping/pong`，补充认证响应 `auth.ok`。
- 本计划新增的工程默认值：首帧认证超时 5 秒；每 25 秒心跳，10 秒未收到 pong 判定断开；重连按 1、2、4、8、16、30 秒上限退避并随机抖动；10 秒未收到发送确认显示“结果未确认”，重试复用原标识。可配置但不得恢复为消息轮询。
- 限制单条人工文本 10,000 字符、单帧 64 KiB；超限明确提示，不截断。每身份每分钟最多 60 次发送请求，心跳不计入发送限额；慢连接待发队列最多 256 个事件，超出关闭连接并由客户端恢复同步，不能拖住其他连接。
- 任务状态统一 `queued/running/succeeded/failed`；知识草稿业务状态为 `generating/editable/publishing/published/failed/removed`，另记 `failure_stage`。确认后的文章版本锁定，不能再次编辑。
- `ArticleDocument = {schema_version:1,title,content}`，`content` 使用 Tiptap JSON 文档结构；白名单节点 `doc/paragraph/heading/text/bulletList/orderedList/listItem/hardBreak`，heading 只允许 2、3 级，mark 只允许 `bold`。禁用 HTML、图片、链接、嵌入、代码块等节点。
- `SourceMessage` 为服务器读取后冻结的消息快照，保留来源类型、角色、顺序及时间；生成服务不接受前端拼接的正文作为可信来源。
- `HandoffDTO` 包括 `id/conversation_id/ai_session_id/cutoff_message_id/status/stage/summary_message_id/error_code/can_retry`；`DraftDTO` 包括 `id/conversation_id/source_message_ids/version/generation_version/article/status/failure_stage/warnings/knowledge_file_id/can_retry`，确认后另返回 `confirmed_version`。
- `task.updated` 的 data 包括 `object_type/object_id/status/stage/version`，客户端按业务对象及版本合并；接收身份只在服务端路由中使用，不向无关用户公开。
- `ConsultationRuntimeState` 为单例数据库记录，包含 `mode=legacy/migrating/chat` 和 `first_new_write_at`，初始为 legacy。`require_chat_write(db) -> None` 在新写事务中检查模式并设置首次新写入标记；迁移专用事务仅允许 migrating 模式。模式值不依赖各进程自行读取的不同配置。
- HTTP 保持现有 `{code,message,data}` 包装，业务错误使用真实 HTTP 状态；WS 错误包含关联请求 ID 和错误码。查询不存在或无权访问的他人资源使用一致的 404，角色不允许使用某功能返回 403。

### 5.2 测试环境与命令

- 后端命令工作目录为 `server/`；前端命令工作目录为 `client/`。使用项目实际 Python 环境和已有包管理器。
- 新增 `server/requirements-dev.txt`：包含生产依赖及 `pytest/httpx/pytest-asyncio`。`server/pytest.ini` 注册 `mysql/live` 标记并配置模块路径。
- `server/tests/conftest.py` 提供 `db`、`patient`、`doctor`、`other_patient`、`other_doctor`、`admin`、`api_client`、`ws_client`，并提供会话、消息和任务工厂。身份对象均为 `CurrentUser`；样本使用虚构数据。
- `TEST_DATABASE_URL` 必须明确指向独立、名称以 `_test` 结尾的 MySQL 数据库；测试启动拒绝业务库。并发和事务测试必须使用 MySQL，不使用 SQLite 结果代替。
- 文章转换等纯逻辑测试不依赖数据库；单测使用可控模型/向量替身。`live` 测试使用显式启用的测试配置、真实模型和独立 Chroma，不输出密钥或医疗正文。
- 每个任务先运行新增测试确认因目标行为缺失而失败，再实现并运行至通过；不能将环境缺失当作预期失败。下列测试片段描述必须落实的断言，辅助工厂在对应测试文件中实现。
- 每个任务验收后只暂存本任务文件并作一个清晰提交，不执行 `git add .`。不要提交本地凭据、真实数据或无关的原型变更。

## 6. 阶段 A：数据与实时服务

### 任务 01：建立新模型、结构升级和后端测试基座

**文件：** 新增 `server/models/human_chat.py`、`server/models/consult_processing.py`、`server/schemas/human_chat.py`、`server/schemas/consult_processing.py`、`server/services/consultation_mode.py`、`server/scripts/consultation_schema.py`、`server/tests/conftest.py`、`server/tests/test_consultation_schema.py`、`server/requirements-dev.txt`、`server/pytest.ini`；修改 `server/models/__init__.py`、`server/models/knowledge.py`、`server/models/consult.py`。

**接口：** 输出公共 DTO；结构脚本提供 `upgrade(engine) -> None` 和 `inspect_schema(engine) -> dict`，CLI 为 `python -m scripts.consultation_schema --check|--apply`。模型具体字段以设计第 6 节及本计划第 5 节为准。

- [ ] 1. 添加结构测试：联合唯一约束、角色参与去重、来源草稿与知识文件一对一、任务阶段唯一约束、重复升级保留原数据。
  ```python
  def test_schema_upgrade_is_repeatable(engine, existing_knowledge_file):
      upgrade(engine)
      upgrade(engine)
      assert inspect_schema(engine)["missing_constraints"] == []
      assert existing_knowledge_file_still_exists(engine, existing_knowledge_file.id)
  ```
- [ ] 2. 运行 `python -m pytest tests/test_consultation_schema.py -q`，确认缺少模型/约束导致失败。
- [ ] 3. 建立新表与索引及 `ConsultationRuntimeState`、统一写入守卫。事件接收身份必须带角色；草稿保存 `version/generation_version/confirmed_version/selected_hash`；任务保存阶段、尝试次数、租约、执行令牌、下次执行时间；知识文件增加来源、移除状态及有效发布代次；AI 会话增加生成状态、生成令牌、租约到期时间。迁移脚本逐项检查后执行 DDL，不能仅用 `create_all()` 假定已有表字段已升级。纯逻辑测试不自动连接 MySQL，业务测试 fixture 在独立库显式设为 chat 模式。
- [ ] 4. 在独立 MySQL 上重跑上述命令，预期全部通过；`--check` 只读、不自动建表，`--apply` 重复运行无破坏。
- [ ] 5. 提交 `feat: add persistent consultation models and schema upgrade`。

### 任务 02：完成聊天事务、权限和消息语义

**文件：** 新增 `server/services/human_chat_service.py`、`server/services/consult_access.py`、`server/tests/test_human_chat_service.py`；修改 `server/core/deps.py`。

**接口：** `send_message(db, actor: CurrentUser, command: SendMessageCommand) -> MessageDTO`；`append_summary(db, handoff_id: int, document: dict) -> MessageDTO`；`mark_read(db, actor, conversation_id: int, seq: int) -> ConversationDTO`；`require_conversation(db, actor, conversation_id: int, write: bool=False) -> HumanConversation`。业务函数管理完整短事务，提交消息和事件后才返回；调用方不再二次提交同一事务。

- [ ] 1. 添加并发首次发送、确认丢失重试、跨会话越权、同 ID 不同角色、停用医生和已读/待回复分离测试。
  ```python
  def test_retry_saves_one_message(db, patient, command):
      first = send_message(db, patient, command)
      retried = send_message(db, patient, command)
      assert first.id == retried.id
      assert count_messages(db, first.conversation_id) == 1
      assert count_pending_replies(db, first.conversation_id) == 1
  ```
- [ ] 2. 运行 `python -m pytest tests/test_human_chat_service.py -q`，确认目标行为未实现。
- [ ] 3. 新写调用任务 01 的模式守卫；实现唯一会话竞争处理、锁定会话行分配序号、消息和事件同事务写入；同请求不同内容返回冲突。首次创建与账号删除使用一致的身份行锁定顺序，防止检查无关联后又建立聊天的竞争。账号停用后不可访问受保护接口，正常另一方可读历史但不能向停用对象发消息。已读只能单调推进，不得通过读列表清空未读，读取不清除待回复。
- [ ] 4. 重跑上述测试，包含真实 MySQL 双事务并发；预期一个医患组合仅一个会话、序号不重不漏、回滚不遗留事件。
- [ ] 5. 提交 `feat: implement durable consultation messaging and access rules`。

### 任务 03：提供会话、历史与医生选择查询

**文件：** 修改 `server/api/v1/consult.py`、`server/api/v1/doctor.py`；扩展 `server/services/human_chat_service.py`；新增 `server/tests/test_consultation_queries.py`。

**接口：** `list_conversations(db, actor, page: int, page_size: int, pending_only: bool=False) -> ConversationPage`；`get_messages(db, actor, conversation_id: int, before_seq: int|None=None, after_seq: int|None=None, limit: int=50) -> MessagePage`。路由采用设计第 7 节的 GET 契约；按医生查询无会话时返回空结果且不写库。

- [ ] 1. 添加分页边界、超过 100 名医生搜索、无科室/职称、只查自己的会话及无会话不创建测试。
  ```python
  def test_history_is_bounded(api_client, populated_conversation):
      data = get_history(api_client, populated_conversation.id, limit=50)
      assert len(data["items"]) == 50
      assert data["has_more"] is True
      assert [m["seq"] for m in data["items"]] == sorted(m["seq"] for m in data["items"])
  ```
- [ ] 2. 运行 `python -m pytest tests/test_consultation_queries.py -q`，确认新契约未满足。
- [ ] 3. 实现游标查询，拒绝同时指定 `before_seq/after_seq`，拒绝超过 50 的消息页大小。医生列表保留启用过滤，返回科室、职称及分页；列表按最新消息时间及稳定 ID 排序，无新消息会话保持稳定。
- [ ] 4. 重跑测试，检查不存在/越权响应、搜索分页与消息排序全部通过；接口只返回当前角色允许看到的身份信息。
- [ ] 5. 提交 `feat: expose consultation history and searchable doctor queries`。

### 任务 04：实现 WebSocket 服务、事件投递与运行配置

**文件：** 新增 `server/realtime/__init__.py`、`connection_manager.py`、`outbox.py`、`server/api/v1/consult_ws.py`、`server/tests/test_consultation_ws.py`、`server/tests/test_realtime_outbox.py`；修改 `server/api/v1/__init__.py`、`server/main.py`、`server/core/config.example.py`、`client/vite.config.js`。本地配置只添加非敏感选项，不改动已有凭据。

**接口：** `ConnectionManager.connect(actor, websocket) -> str`、`disconnect(connection_id) -> None`、`publish(role: str, user_id: int, event: dict) -> None`；`dispatch_pending_events() -> int`；`consult_ws(websocket: WebSocket) -> None`。HTTP 身份解析与 WS 共用同一有效账号校验逻辑。

- [ ] 1. 添加首帧认证、Origin 拒绝、到期断开、发送后确认、多连接推送、同数值不同角色隔离、事务后故障恢复与慢客户端测试。
  ```python
  def test_same_numeric_id_does_not_share_events(patient_ws, unrelated_doctor_ws):
      event = send_patient_message(patient_ws)
      assert event["type"] == "message.ack"
      assert no_private_event_received(unrelated_doctor_ws)
  ```
- [ ] 2. 运行 `python -m pytest tests/test_consultation_ws.py tests/test_realtime_outbox.py -q`，记录未实现行为。
- [ ] 3. 实现第 5 节协议、限额和心跳。认证后先注册连接再确认就绪；所有入站命令重新验证权限，发送事件前检查接收账号是否有效。每个连接使用独立有界发送队列；同步 SQLAlchemy 工作放到线程中并在线程内部创建/关闭 Session，不能阻塞事件循环或跨线程共享 Session。
- [ ] 4. 生命周期启动事件投递循环，停机取消并释放连接；事件记录只含必要标识，投递时生成接收方 DTO。发送失败允许重试，离线用户靠数据库补取；投递成功不等于已读。Vite `/api` 代理启用 `ws: true`，配置允许的前端 Origin。重跑测试，覆盖提交后进程退出再恢复。
- [ ] 5. 提交 `feat: add authenticated consultation websocket transport`。本任务通过后，后端消息链路可以独立交付测试。

## 7. 阶段 B：医患聊天页面

### 任务 05：前端连接、消息合并与恢复同步

**文件：** 新增 `client/src/features/consultation/api.js`、`socket.js`、`reconcile.js`、`client/src/stores/consultation.js`、`client/tests/consultation-socket.test.js`、`client/tests/consultation-reconcile.test.js`；修改 `client/src/stores/user.js`、`client/src/layouts/PortalLayout.vue`、`AdminLayout.vue`。

**接口：** `createConsultationSocket({getToken,onEvent,onState,WebSocketImpl,clock})` 返回 `connect()/send(type,data,requestId)/close()`；`mergeMessages(existing,incoming) -> MessageDTO[]`；`useConsultationStore()` 暴露 `connect()/openConversation(id)/sendMessage(command)/loadOlder(id)/markRead(id,seq)/reset()`。`api.js` 使用既有 request 封装 HTTP 契约。

- [ ] 1. 测试重连退避、退出时停止重连、推送先于 ack、缺口补取、快照加载期间事件缓冲、旧版本会话事件被忽略。
  ```javascript
  test('ack and pushed message merge into one bubble', () => {
    const result = mergeMessages([pendingMessage], [pushedMessage, acknowledgedMessage])
    assert.equal(result.length, 1)
    assert.equal(result[0].id, pushedMessage.id)
  })
  ```
- [ ] 2. 运行 `node --test tests/consultation-socket.test.js tests/consultation-reconcile.test.js`，确认新行为失败。
- [ ] 3. 实现每页面一条连接，切换会话不重复连接，退出/切换账号清空内存中的上个账号消息。先缓冲事件、加载快照，再合并；重连刷新列表及当前会话消息，缺口补到连续序号再推进游标。对过期版本事件按会话状态单独判定，不因消息去重丢掉状态更新。
- [ ] 4. 重跑测试。使用可控时钟推进空闲时间，断言除心跳外没有定时 HTTP 业务请求；认证失败跳转登录，网络失败才退避重连，失败输入保留且未确认消息保持原请求 ID。
- [ ] 5. 提交 `feat: add consultation websocket state and reconnect recovery`。

### 任务 06：患者长期聊天与医生选择

**文件：** 修改 `client/src/views/portal/Consult.vue`；新增 `client/src/components/consultation/ConversationList.vue`、`MessageList.vue`、`MessageBubble.vue`、`MessageComposer.vue`、`DoctorSelector.vue`、`client/tests/e2e/patient-consultation.spec.js`。测试使用确定的 HTTP/WS 替身，并明确标记为交互测试。

**接口：** `DoctorSelector` 发出 `select(doctor)`；`MessageComposer` 发出 `send(content)`；`MessageList` 接收 `messages/hasOlder`，发出 `loadOlder/readThrough(seq)`；页面调用任务 05 Store，不自行维护第二份 WebSocket。

- [ ] 1. 编写患者流程测试：姓名/科室/职称、分页搜索、选医生不创建空会话、再次咨询复用历史、断线重试、读历史不被新消息拉到底部。
  ```javascript
  test('reopening the same doctor shows the saved conversation', async ({ page }) => {
    await openDoctorConversation(page, doctorFixture)
    await expect(page.getByText(savedPatientMessage)).toBeVisible()
    expect(await createdConversationCount()).toBe(0)
  })
  ```
- [ ] 2. 运行 `npm run test:e2e -- tests/e2e/patient-consultation.spec.js`，确认新流程尚不可用。
- [ ] 3. 按原型实现桌面两栏、移动端列表/聊天切换、发送中/未确认/失败状态、加载更多历史及“有新消息”提示；缺少科室、职称显示指定兜底文案。停用医生显示只读历史，不允许发送或转交。
- [ ] 4. 重跑测试，并用 ego 浏览器检查 1440×900、390×844；长姓名、长消息、空列表和键盘焦点不溢出。截图保存到本任务 QA 目录。
- [ ] 5. 提交 `feat: build persistent patient consultation chat`。

### 任务 07：医生聊天、患者信息与消息选择

**文件：** 修改 `client/src/views/doctor/Consults.vue`、`client/src/router/index.js`、`client/src/layouts/AdminLayout.vue`、`client/src/components/MobileNavigation.vue`；新增 `client/src/components/consultation/PatientInfoDrawer.vue`、`SelectionToolbar.vue`、`client/tests/e2e/doctor-consultation.spec.js`。

**接口：** 使用任务 05 Store；选中集合 `selectedMessageIds: Set<number>` 仅包含当前会话已保存且可选择的消息；发出 `createKnowledgeDraft(conversationId, messageIds)`，实际生成在任务 11 接通。

- [ ] 1. 编写待回复与未读分离、回复后仍保留会话、非连续选择、切换会话清空选择、抽屉开关、中文输入法测试。
  ```javascript
  test('composition enter does not send a message', async ({ page }) => {
    await composeChineseAndPressEnter(page)
    expect(await sentMessageCommands()).toHaveLength(0)
  })
  ```
- [ ] 2. 运行 `npm run test:e2e -- tests/e2e/doctor-consultation.spec.js`，确认新增行为缺失。
- [ ] 3. 对齐真实医生外壳，把菜单“待回复咨询”调整为“患者咨询”，在页内提供全部/待回复筛选；默认关闭患者信息抽屉。独立勾选完整消息，显示已选数量，禁止系统提示、未保存气泡及跨会话混选；不自动勾选关联问题或回答。
- [ ] 4. 重跑测试；ego 检查侧栏收起、顶部知识整理记录、移动导航及输入框。任务 11 未完成前隐藏未接通的入库动作，不显示虚假的整理成功结果。
- [ ] 5. 提交 `feat: build doctor conversations and message selection`。

## 8. 阶段 C：后台任务与 AI 转人工

### 任务 08：持久化任务与执行恢复

**文件：** 新增 `server/jobs/__init__.py`、`repository.py`、`runner.py`、`handlers.py`、`server/tests/test_processing_jobs.py`；修改 `server/main.py`、`server/core/config.example.py`。

**接口：** `enqueue(db, job_type: str, object_id: int, stage: str) -> ProcessingJob` 在调用方事务中写入；`claim_job(db, now) -> ProcessingJob|None`；`complete_job(db, job_id: int, execution_token: str, result: dict) -> bool`；`run_job(job_id: int, execution_token: str) -> None`。处理器注册表只负责把任务类型路由到后续服务。

- [ ] 1. 测试服务重启、租约到期被接管、旧令牌完成被拒绝、同业务同阶段重复 enqueue、失败次数及退避。
  ```python
  def test_expired_worker_cannot_complete(db, reclaimed_job):
      assert complete_job(db, reclaimed_job.id, "expired-token", {}) is False
      assert job_result_unchanged(db, reclaimed_job.id)
  ```
- [ ] 2. 运行 `python -m pytest tests/test_processing_jobs.py -q`，确认缺少持久化调度。
- [ ] 3. 实现短事务领取、60 秒租约和每 20 秒续租、执行令牌校验；慢模型/向量调用在事务外执行。自动重试定义为首次失败后最多再试 3 次，间隔 2、5、15 秒；校验或权限失败不重试。正常停机停止领取并等待/释放当前任务，启动恢复到期任务。
- [ ] 4. 重跑测试，并断言各阶段状态更新与 `task.updated` 同事务写入。执行器每秒检查待执行任务属于后台任务调度，不是前端聊天轮询；向前端的状态反馈仍通过 WebSocket。
- [ ] 5. 提交 `feat: add recoverable consultation processing jobs`。

### 任务 09：AI 摘要后端、来源校验和自动发送

**文件：** 新增 `server/services/ai_handoff_service.py`、`consult_generation.py`、`server/api/v1/consult_processing.py`、`server/tests/test_ai_handoff.py`；修改 `server/api/v1/chat.py`、`server/api/v1/__init__.py`、`server/jobs/handlers.py`。

**接口：** `create_handoff(db, actor, doctor_id: int, ai_session_id: int) -> HandoffDTO`；`generate_handoff(snapshot: list[SourceMessage]) -> dict`；`process_handoff(job_id: int, execution_token: str) -> None`。提供 `POST /consult/ai-handoffs`、`GET /consult/ai-handoffs/{id}`、`POST /consult/ai-handoffs/{id}/retry`；输出服务端校验的摘要结构，最终通过任务 02 的 `append_summary` 保存并推送。

- [ ] 1. 测试当前 AI 会话归属、固定消息截止范围、同快照双击去重、新快照允许更新、生成成功但发送失败只重试发送、摘要生成中仍可普通聊天。
  ```python
  def test_same_snapshot_is_sent_once(db, patient, doctor, saved_ai_session):
      a = create_handoff(db, patient, doctor.user_id, saved_ai_session.id)
      b = create_handoff(db, patient, doctor.user_id, saved_ai_session.id)
      assert a.id == b.id
      assert count_handoff_jobs(db, a.id) == 1
  ```
- [ ] 2. 运行 `python -m pytest tests/test_ai_handoff.py -q`，确认新流程未实现。
- [ ] 3. 修复 AI 历史查询归属；助手消息成功提交后输出 SSE `saved`，携带助手消息 ID；流式失败不伪造保存成功。生成器收到客户端取消时确保任务清理和生成中标志释放；后端持久记录会话生成中/失败/已保存状态，拒绝在生成中转交。AI 生成采用令牌和续租，服务重启后到期状态转为失败，旧执行器不能提交过期结果；锁定源会话后确定截止消息与快照，避免检查后又开始生成的竞争。
- [ ] 4. 实现冻结快照、创建/复用目标聊天及排队任务；摘要按患者事实、AI 建议和待确认问题分组，保留来源说明。长快照分段整理后归并、保存中间结果，不静默截断；结构不合法或超时报告失败。模型使用独立提示词、输出校验和配置，调用在事务外；向已停用医生不追加。重跑测试，并验证提交后未发送阶段可恢复。
- [ ] 5. 提交 `feat: automatically hand off saved AI consultation summaries`。

### 任务 10：AI 转人工前端与任务状态恢复

**文件：** 修改 `client/src/views/portal/Chat.vue`、`Consult.vue`、`client/src/features/consultation/api.js`、`client/src/stores/consultation.js`；新增 `client/src/components/consultation/HandoffStatus.vue`、`client/tests/e2e/ai-handoff.spec.js`。

**接口：** 路由只传 `aiSessionId`；`api.createHandoff({doctor_id,ai_session_id})` 返回 `HandoffDTO`；Store 按 `task.updated` 更新状态，页面进入/重连时按需 GET 已有任务。

- [ ] 1. 测试无已保存消息不展示入口、生成中禁用、只收到 `done` 尚不能转交、选医生后自动发送、刷新不重复、失败可重试。
  ```javascript
  test('doctor selection starts handoff without a second confirmation', async ({ page }) => {
    await selectHandoffDoctor(page)
    expect(await handoffRequestCount()).toBe(1)
    await expect(page.getByText('正在整理问诊摘要，完成后将自动发送')).toBeVisible()
    await expect(page.getByRole('button', { name: '确认发送摘要' })).toHaveCount(0)
  })
  ```
- [ ] 2. 运行 `npm run test:e2e -- tests/e2e/ai-handoff.spec.js`，确认目标行为缺失。
- [ ] 3. 在 AI 消息末尾、输入区上方增加入口；等待 `saved` 再允许正常转交。跳转后选择医生即创建任务；出现已有结果时直接进入该聊天，不增加预览或发送确认。摘要消息显示来源、范围时间及更新标记。
- [ ] 4. 重跑测试，并检查网络请求不携带摘要到 URL、不进行任务轮询、生成中允许普通发送、失败提示与恢复状态一致。生成失败时允许基于已保存消息转交，未保存部分不出现在摘要。
- [ ] 5. 提交 `feat: connect AI handoff flow to patient conversations`。

## 9. 阶段 D：知识整理、编辑和入库

### 任务 11：消息快照、知识草稿与结构化文章生成

**文件：** 新增 `server/services/consult_knowledge_service.py`、`article_format.py`、`server/tests/test_knowledge_drafts.py`、`server/tests/test_article_format.py`；扩展 `server/services/consult_generation.py`、`server/schemas/consult_processing.py`、`server/api/v1/consult_processing.py`、`server/jobs/handlers.py`。

**接口：** `create_draft(db, actor, conversation_id: int, message_ids: list[int]) -> DraftDTO`；`save_draft(db, actor, draft_id: int, version: int, article: ArticleDocument) -> DraftDTO`；`regenerate_draft(db, actor, draft_id: int, version: int) -> DraftDTO`；`generate_article(snapshot: list[SourceMessage]) -> ArticleDocument`；`validate_article(raw: dict) -> ArticleDocument`。

HTTP 提供设计第 7 节的创建/列表 `/consult/conversations/{id}/knowledge-drafts`、草稿 GET/PUT `/consult/knowledge-drafts/{id}` 和 `regenerate/retry` 动作。重试根据 `failure_stage` 恢复，已发布或已移除不可再次入库；confirm 在任务 13 实现。

- [ ] 1. 测试只包含选中消息、选择顺序无关、跨会话被拒绝、草稿去重、身份脱敏、AI 建议不冒充医生解答、无医生回复时提示补充、版本冲突及过期生成结果。
  ```python
  def test_selection_order_reuses_draft(db, doctor, conversation, message_ids):
      a = create_draft(db, doctor, conversation.id, message_ids)
      b = create_draft(db, doctor, conversation.id, list(reversed(message_ids)))
      assert a.id == b.id
      assert a.source_message_ids == sorted_by_sequence(message_ids)
  ```
- [ ] 2. 运行 `python -m pytest tests/test_knowledge_drafts.py tests/test_article_format.py -q`，确认未实现行为。
- [ ] 3. 创建按会话序号排序的不可变快照及选择集合摘要；模型输入前移除身份字段和明确标识符，输出再检查。对长内容分段归并，不丢掉适用条件；禁止模型按聊天中的指令另行检索、补药物剂量或虚构诊断。首版标题最多 200 字、文章正文最多 50,000 字，超出明确失败，不截断。
- [ ] 4. 保存草稿采用乐观版本检查，冲突返回 409；生成任务保存启动版本与生成版本，完成时双重比较，医生已编辑则保留编辑内容并标记生成结果未应用。仅白名单文章结构可保存；缺少医生解答时返回提示。重跑测试，覆盖非法节点、畸形模型 JSON、超长文本和修改竞争。
- [ ] 5. 提交 `feat: generate validated knowledge drafts from selected messages`。

### 任务 12：医生文章编辑、自动保存与确认界面

**文件：** 新增 `client/src/views/doctor/KnowledgeReview.vue`、`client/src/components/consultation/KnowledgeArticleEditor.vue`、`KnowledgeDraftList.vue`、`client/src/features/consultation/article-editor.js`、`client/tests/e2e/knowledge-review.spec.js`；修改 `client/package.json`、`client/package-lock.json`、`client/src/router/index.js`、`client/src/views/doctor/Consults.vue`、功能 API/Store。

**接口：** 路由 `/doctor/consults/knowledge/:draftId`；编辑器 `v-model<ArticleDocument>`，标题单独输入；`toEditorDocument(article)` / `fromEditorDocument(title,doc)` 在 JSON 边界转换，不以 HTML 作为可信存储。新增同一版本系列的 `@tiptap/vue-3/@tiptap/pm/@tiptap/starter-kit`，按公共白名单关闭其余扩展。

- [ ] 1. 测试格式编辑、粘贴清理、草稿恢复、保存失败留在页面、多窗口 409、不显示源码、重新整理覆盖提醒和确认前刷新恢复。
  ```javascript
  test('failed draft save keeps the edited article on screen', async ({ page }) => {
    await editArticleAndFailSave(page)
    await page.getByRole('button', { name: '返回聊天' }).click()
    await expect(page.getByText('保存失败，请重试')).toBeVisible()
    await expect(page.getByTestId('article-editor')).toContainText(editedText)
  })
  ```
- [ ] 2. 运行 `npm run test:e2e -- tests/e2e/knowledge-review.spec.js`，确认编辑流程未实现。
- [ ] 3. 安装并封装 Tiptap，提供标题、段落、小标题、加粗及列表；粘贴时剔除非白名单格式。500ms 防抖自动保存，每次带服务端版本；路由离开、重新整理和确认先等待保存。关闭标签页有未保存内容时提供浏览器离开提醒，不承诺异步请求一定能完成。
- [ ] 4. 接入整理记录、生成/失败/可编辑状态；重新整理只在医生已有修改时提示覆盖。确认操作接任务 13，未接通时不伪造成功。重跑测试，ego 验证手机工具栏、中文输入法、长列表及键盘操作；医生侧所有文案均使用文章、整理、存入知识库等业务词。
- [ ] 5. 提交 `feat: add readable knowledge article review and draft recovery`。

### 任务 13：确认入库、Markdown 转换与可靠向量发布

**文件：** 新增 `server/services/knowledge_ingestion.py`、`server/tests/test_knowledge_ingestion.py`、`server/tests/test_knowledge_retrieval.py`；修改 `server/services/article_format.py`、`consult_knowledge_service.py`、`server/api/v1/knowledge.py`、`server/services/rag_service.py`、`server/rag/vector_store.py`、`server/jobs/handlers.py`、医生确认页。

**接口：** `confirm_draft(db, actor, draft_id: int, version: int) -> DraftDTO`；`article_to_markdown(article: ArticleDocument) -> str`；`ingest_confirmed_draft(job_id: int, execution_token: str) -> None`；`remove_knowledge(db, actor, file_id: int) -> None`；`search_published(query: str, top_k: int) -> list[dict]`。确认 API 为 `/consult/knowledge-drafts/{id}/confirm`，已确认版本重复调用返回同一结果。

- [ ] 1. 测试确认幂等、正文特殊字符、文件重试复用、分批向量失败不被检索、删除失败可见、删除与旧任务竞争，以及管理员上传知识回归。
  ```python
  def test_partial_vectors_are_not_searchable(db, partly_indexed_file):
      assert partly_indexed_file.vector_status != 2
      assert all(x["metadata"]["file_id"] != partly_indexed_file.id
                 for x in search_published("虚构测试问题", top_k=5))
  ```
- [ ] 2. 运行 `python -m pytest tests/test_article_format.py tests/test_knowledge_ingestion.py tests/test_knowledge_retrieval.py -q`，确认旧链路不满足可靠发布。
- [ ] 3. 确认时锁定版本、建立唯一知识记录和持久化任务。Markdown 文件为 UTF-8，使用内部 ID 文件名、临时文件加原子替换；序列化转义 Markdown 文本和 HTML 特殊字符。保留渲染语义，中文标点、换行、加粗与列表与医生确认内容一致。
- [ ] 4. 将管理员上传、重建和咨询入库统一接到同一文件级执行锁/租约；向量 ID 按文件、发布代次和块序号确定，同一代次重试复用 ID，清除残留失败必须中止。租约接管时使用新代次，清理仅针对旧代次，避免旧执行器清掉新向量；已有向量通过兼容代次 0 处理。全部向量成功且执行令牌仍有效后才发布 `vector_status=2` 和有效代次。检索验证数据库中的有效、未移除、成功状态与代次，不足时扩大召回至集合规模或 `max(100, top_k*10)` 上限；删除先标记不可检索、失效执行令牌，再清理向量和文件，旧任务禁止发布。生成文件只放脱敏正文，受保护的来源追溯不写进向量或公共文件路径。
- [ ] 5. 重跑测试并确认入库结果由实际状态驱动；向量失败只重试失败阶段、不会再次调用文章模型。日志不记录输入/文章/令牌，接通医生页成功与失败提示。提交 `feat: publish confirmed consultation knowledge reliably`。

## 10. 阶段 E：联动、迁移和旧入口

### 任务 14：管理员、统计、健康档案与账号保护

**文件：** 修改 `server/services/stat_service.py`、`server/api/v1/record.py`、`user.py`、`doctor.py`、`knowledge.py`、`consult.py`、`client/src/views/admin/Consults.vue`、`Knowledge.vue`、`client/src/views/doctor/Dashboard.vue`、`client/src/views/portal/Home.vue`；新增 `server/tests/test_consultation_integrations.py`、`client/tests/e2e/consultation-admin.spec.js`。

**接口：** 维持现有统计接口字段名，调整含义及页面标签；新增管理员 `GET /consult/admin/conversations`、`GET /consult/admin/conversations/{id}/messages`；知识列表补充 `source_type/doctor_name/processing_status/removed`。管理员只读会话，不提供代发命令。

- [ ] 1. 测试患者继续发言后待回复恢复、已回复统计不等于关闭、档案患者来源并集、含聊天账号硬删除被拒绝、停用连接停止接收和管理员只读。
  ```python
  def test_reading_does_not_clear_pending(db, doctor, pending_conversation):
      mark_read(db, doctor, pending_conversation.id, pending_conversation.last_seq)
      assert doctor_pending_count(db, doctor.user_id) == 1
  ```
- [ ] 2. 运行 `python -m pytest tests/test_consultation_integrations.py -q` 和 `npm run test:e2e -- tests/e2e/consultation-admin.spec.js`，分别在规定目录验证缺失行为。
- [ ] 3. 替换旧工单统计与关联查询；已有预约、健康档案患者来源继续保留。管理员列表改为会话历史并移除整段删除操作。账号删除前在同一保护事务中检查聊天/迁移关联；账号停用及资料编辑的状态变更路径都触发连接关闭或权限失效，防止绕过。
- [ ] 4. 重跑测试；知识来源只向管理员或原整理医生开放，普通用户引用信息不包含患者/会话 ID。更新页面“咨询会话”等文案并验证旧管理员知识上传仍可用。
- [ ] 5. 提交 `feat: align administration and statistics with long-lived consultations`。

### 任务 15：旧数据审计、幂等迁移和核对

**文件：** 新增 `server/scripts/migrate_consultations.py`、`server/tests/test_consultation_migration.py`、`docs/runbooks/consultation-migration.md`；复用任务 01 模型、升级脚本和任务 02 消息顺序约定。

**接口：** `audit_legacy(db) -> dict`；`migrate_legacy(db, dry_run: bool=True) -> dict`；`verify_migration(db) -> dict`。CLI `python -m scripts.migrate_consultations --audit|--dry-run|--apply|--verify`；输出数量、异常 ID、内容哈希和归属校验，不输出患者正文。

- [ ] 1. 用旧库样本工厂测试：同医患多工单合并、空医生无回复保留、空医生唯一回复可归属、多医生/归属矛盾不迁移、相同时间排序、缺失账号和重复运行。
  ```python
  def test_repeated_migration_does_not_duplicate(db, legacy_fixture):
      migrate_legacy(db, dry_run=False)
      before = migration_counts(db)
      migrate_legacy(db, dry_run=False)
      assert migration_counts(db) == before
      assert verify_migration(db)["unexplained_difference_count"] == 0
  ```
- [ ] 2. 运行 `python -m pytest tests/test_consultation_migration.py -q`，确认迁移能力尚缺失。
- [ ] 3. 按设计第 9 节转换主诉与回复，保留旧 ID、原时间、原正文和原有标题（现模型无标题，不虚构字段）；以时间、旧工单 ID、主诉优先、回复 ID 稳定排序。已读初始化到迁移末尾，待回复按实际消息计算。异常数据保留只读，不猜测归属；迁移映射约束保证幂等。
- [ ] 4. 在测试库运行全部四种模式，dry-run 不改变行数；模拟中途停止后可继续。`--apply` 必须验证旧写入已关闭且新聊天写入未开放；已开始新写入时禁止重排历史序号。
- [ ] 5. 提交 `feat: add auditable consultation history migration`。文档记录备份、核对与异常清单处置，本任务不迁移真实业务库。

### 任务 16：只读历史、继续咨询和写入口切换

**文件：** 新增 `server/api/v1/consult_history.py`、`server/services/consult_history_service.py`、`server/tests/test_consultation_history.py`、`client/src/components/consultation/LegacyConsultationList.vue`、`client/tests/e2e/consultation-history.spec.js`；修改 `server/api/v1/consult.py`、`__init__.py`、配置示例、患者咨询页和功能 API。

**接口：** `GET /consult/history`、`GET /consult/history/{id}`；`POST /consult/history/{id}/continue` 接受 `doctor_id/client_request_id`，调用 `continue_legacy(db, actor, legacy_id: int, doctor_id: int, request_id: str) -> MessageDTO`。这是用户明确点击继续咨询的按需操作，生成消息仍通过同一事务与 WS 推送。

- [ ] 1. 测试异常旧记录仅原有合法身份可见、管理员可审计、继续咨询只复制一次、旧写 API 被关闭、切换状态不能双写。
  ```python
  def test_legacy_continue_is_idempotent(db, patient, unassigned_legacy, doctor):
      a = continue_legacy(db, patient, unassigned_legacy.id, doctor.user_id, "first")
      b = continue_legacy(db, patient, unassigned_legacy.id, doctor.user_id, "retry")
      assert a.id == b.id
  ```
- [ ] 2. 运行 `python -m pytest tests/test_consultation_history.py -q` 和 `npm run test:e2e -- tests/e2e/consultation-history.spec.js`，确认缺失行为。
- [ ] 3. 实现患者选择医生后“继续咨询”，以旧记录、患者、目标医生业务键去重，不仅依赖请求标识。不自动把异常记录分配给任何医生；涉及多医生的旧记录仅按原访问范围或管理员可见，不能让所有回复医生看到彼此无权内容。
- [ ] 4. 在旧 API 和切换管理中接通任务 01 的持久化模式：legacy 禁止新链路写入；migrating 两套业务写入口都关闭，仅允许迁移专用写入；chat 关闭 `/consult/create`、`/consult/reply` 并禁止旧删除入口，仅允许新链路。结构脚本增加 `--set-mode legacy|migrating|chat` 操作，在事务中校验当前模式及首次新写入标记；已有新写入后拒绝直接切回 legacy。重跑测试，HTTP、WS、后台任务和继续咨询均受模式约束。
- [ ] 5. 提交 `feat: preserve legacy consultations and gate the chat cutover`。

## 11. 阶段 F：联调、验收与部署交付

### 任务 17：真实链路与故障恢复验收

**文件：** 新增 `server/tests/integration/test_consultation_flow.py`、`test_consultation_recovery.py`、`client/tests/e2e/consultation-live.spec.js`、`docs/qa/consultation-chat-acceptance.md`；必要时修改 `client/playwright.config.js` 增加显式 live 配置。单元测试替身与真实联调结果分栏记录。

**接口：** 只调用已实现的公开 API/WS 及测试隔离配置；不得借直接写生产表制造成功状态。测试身份、库名和文件目录均由专用测试配置提供。

- [ ] 1. 先建立可重复场景：患者选择医生 → 多轮聊天 → AI 转人工 → 医生选择部分消息 → 修改文章 → 确认入库 → 通过相关问题检索到文章。断言摘要只发送一次、未选内容未进入草稿、修改内容进入最终文件、知识能真实检索。
  ```python
  def test_confirmed_article_is_retrievable(live_flow):
      result = live_flow.run()
      assert result.summary_message_count == 1
      assert result.saved_markdown_contains_doctor_edit
      assert result.published_file_id in result.retrieved_file_ids
  ```
- [ ] 2. 运行后端新增测试全量 `python -m pytest tests -m "not live" -q`，前端 `npm test`、`npm run build` 和本功能交互测试；预期全部通过，无未说明的失败。已有移动页面测试同时回归。
- [ ] 3. 在独立真实 MySQL、测试模型配置、临时 Chroma 环境运行 `python -m pytest tests/integration -m live -q`；前后端启动后运行 `npm run test:e2e -- tests/e2e/consultation-live.spec.js`。真实模型不可用时标记未完成，不能以固定摘要替代验收。
- [ ] 4. 注入故障：提交后确认丢失、初次快照期间新消息、断线积压超过 50 条、后端重启、任务租约接管、向量第二批失败、清理失败、入库时删除、停用与退出。断言无重复消息、无错误知识可检索、无越权和无聊天定时轮询。
- [ ] 5. 使用 ego 浏览器进行 1440×900、1280×900、390×844 验收，记录截图及操作证据；检查焦点、抽屉、历史滚动、输入法、编辑器与无障碍标签。填写每项实际结果、未测项和原因，提交 `test: verify consultation chat and knowledge workflows`。

### 任务 18：部署、迁移演练和发布交接

**文件：** 新增 `docs/runbooks/consultation-chat-deployment.md`、`docs/deploy/consultation-nginx.conf.example`；更新 `docs/runbooks/consultation-migration.md`、`docs/qa/consultation-chat-acceptance.md`、`README.md`。

**接口：** 部署沿用现有项目运行方式。服务以 `uvicorn main:app --host 0.0.0.0 --port 8000 --workers 1` 启动；生产 WSS、Origin 白名单、WebSocket Upgrade 和代理读超时 75 秒。不使用多 worker 配置冒充已经具备跨实例分发。

- [ ] 1. 编写部署检查项：模式、数据库结构版本、单 worker、可写文件目录、任务恢复、模型连接、Embedding 维度、Chroma 持久目录和代理升级；输出检查结果不包含密钥。
- [ ] 2. 在隔离的旧版样例库完整演练：备份 → 只读审计 → 模式切到 migrating → 升级结构 → 最终迁移 → 数量/哈希/归属核对 → 同步部署前后端 → chat 模式 → 冒烟验证。任一核对失败则保持只读。
- [ ] 3. 演练开放前恢复备份的流程，并记录开放后只能保留新表、临时只读和修复的边界；不能回滚到看不到新消息的旧应用。备份包含数据库、上传文件及 Chroma 的一致性快照。
- [ ] 4. 按任务 17 的完整流程做发布冒烟，核对活动 WS 连接、失败任务、待推送事件积压与向量发布状态。异常日志只留 ID、阶段和错误码，操作手册说明重试失败任务而非重复生成文章。
- [ ] 5. 提交 `docs: document consultation deployment and migration recovery`，交付变更清单、配置示例、验收报告和迁移报告。真实业务环境的迁移/上线不在“编写计划”授权范围内，执行阶段只在用户明确安排上线时进行。

## 12. 验收清单与追溯

| 需求 | 主任务 | 必须保留的证据 |
| --- | --- | --- |
| 同医患长期唯一聊天与旧内容保留 | 01、02、15 | 并发测试、迁移计数及内容哈希 |
| WebSocket 双向收发、无轮询 | 04、05、17 | 双客户端测试、网络请求记录 |
| 断线、重启、确认丢失不丢不重 | 04、05、08、17 | 故障注入与恢复结果 |
| 医生选择显示科室和职称 | 03、06 | 超过 100 名医生及空字段测试 |
| AI 当前会话摘要自动发送 | 09、10 | saved 顺序、快照边界和重复转交测试 |
| 选择任意完整消息，不混入未选内容 | 07、11 | 来源 ID、生成输入与归属测试 |
| 医生编辑普通文章 | 11、12 | 编辑器截图、格式与自动保存测试 |
| 确认后生成文件、向量化、可检索 | 13、17 | 确认版本、真实文件及检索结果 |
| 脱敏、权限、停用及删除保护 | 02、04、11、13、14 | 越权矩阵、删除竞争与日志检查 |
| 管理员、工作台及健康档案联动 | 14 | 新统计口径和关联查询测试 |
| 无医生及异常旧记录只读保留 | 15、16 | 异常报告、继续咨询幂等结果 |
| 桌面及移动端保持现有框架 | 06、07、12、17 | ego 截图与交互验收记录 |

完成条件：上述任务对应检查通过，未测项有明确记录且不冒充通过；真实模型、数据库和检索链路全部完成后，才可宣布整项功能具备发布条件。

## 13. 执行方式与计划维护

- 推荐按阶段顺序执行，每完成一个任务更新复选框、测试命令及提交记录，阶段结束展示可运行结果。
- 可以由当前会话连续实施，或由分任务代理实施并逐项审查；具体方式由用户选择。本计划不自动启动代理或进入编码。
- 本计划推荐分任务实施与逐项审查，原因是 WebSocket、数据库事务、任务租约和向量发布之间有明确且关键的接口，需要及时检查前后任务的一致性。
- 发现范围或接口需要改变时，先更新设计及受影响任务，保留用户确认的行为：WebSocket、唯一长期会话、自动转交、文章式确认。
- 本文已按设计要求进行文档自查；所列实现、测试、迁移和发布操作仍全部待执行。
