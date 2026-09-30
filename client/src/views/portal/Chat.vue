<script setup>
import { ref, reactive, onMounted, onUnmounted, nextTick } from 'vue'
import { useMobile } from '@/composables/useMobile'
import { ElMessage } from 'element-plus'
import MarkdownIt from 'markdown-it'
import { useUserStore } from '@/stores/user'
import request from '@/utils/request'
import { formatDateTime } from '@/utils/format'

const userStore = useUserStore()
const md = new MarkdownIt()

const sessions = ref([])
const messages = ref([])
const currentSessionId = ref(null)
const inputText = ref('')
const composer = ref(null)
const suggestedQuestions = [
  { label: '最近总是睡不好', text: '最近总是睡不好，应该如何改善睡眠？', icon: 'Moon' },
  { label: '头痛应该注意什么', text: '最近有头痛的情况，应该注意哪些症状？', icon: 'FirstAidKit' },
  { label: '了解日常健康管理', text: '我想了解如何通过饮食和运动做好日常健康管理。', icon: 'Apple' },
]
async function useSuggestion(text) {
  if (sending.value || loadingMessages.value) return
  inputText.value = text
  await nextTick()
  composer.value?.focus()
}
const sending = ref(false)
const loadingMessages = ref(false)
const chatContainer = ref(null)
const isMobile = useMobile()
const historyOpen = ref(false)
const viewportHeight = ref(window.visualViewport?.height || window.innerHeight)
let sendController
let messageRequest = 0
const updateViewport = () => { viewportHeight.value = window.visualViewport?.height || window.innerHeight }

function handleEnter(event) {
  if (event.isComposing || event.keyCode === 229 || event.shiftKey || isMobile.value) return
  event.preventDefault()
  sendMessage()
}

/** 加载会话列表 */
async function loadSessions() {
  try {
    const res = await request.get('/chat/sessions')
    sessions.value = res.data || []
  } catch {
    sessions.value = []
  }
}

/** 加载消息历史 */
async function loadMessages(sessionId) {
  if (sending.value) return
  const requestId = ++messageRequest
  loadingMessages.value = true
  messages.value = []
  currentSessionId.value = sessionId
  historyOpen.value = false
  try {
    const res = await request.get(`/chat/sessions/${sessionId}/messages`)
    if (requestId !== messageRequest) return
    messages.value = (res.data || []).map((m) => ({
      ...m,
      html: m.role === 'assistant' ? md.render(m.content || '') : m.content,
    }))
    scrollToBottom()
  } catch {
    if (requestId === messageRequest) messages.value = []
  } finally {
    if (requestId === messageRequest) loadingMessages.value = false
  }
}

/** 新建会话 */
function newSession() {
  if (sending.value) return
  messageRequest++
  loadingMessages.value = false
  historyOpen.value = false
  currentSessionId.value = null
  messages.value = []
}

/** 滚动到底部 */
async function scrollToBottom() {
  await nextTick()
  if (chatContainer.value) {
    chatContainer.value.scrollTop = chatContainer.value.scrollHeight
  }
}

/**
 * SSE 流式发送消息
 */
async function sendMessage() {
  const content = inputText.value.trim()
  if (!content || sending.value || loadingMessages.value) return

  messages.value.push({ role: 'user', content, html: content })
  inputText.value = ''
  sending.value = true
  messageRequest++
  scrollToBottom()

  const assistantMsg = reactive({ role: 'assistant', content: '', html: '' })
  messages.value.push(assistantMsg)

  try {
    sendController = new AbortController()
    const response = await fetch('/api/v1/chat/send', {
      signal: sendController.signal,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userStore.token}`,
      },
      body: JSON.stringify({
        session_id: currentSessionId.value,
        message: content,
      }),
    })

    if (!response.ok) throw new Error('发送失败')

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6).trim()
          if (data === '[DONE]') continue
          try {
            const parsed = JSON.parse(data)
            if (parsed.type === 'session' && parsed.session_id) {
              currentSessionId.value = parsed.session_id
            } else if (parsed.type === 'content' && parsed.content) {
              assistantMsg.content += parsed.content
              assistantMsg.html = md.render(assistantMsg.content)
              scrollToBottom()
            } else if (parsed.type === 'error') {
              throw new Error(parsed.message || 'AI 回复失败')
            }
          } catch (err) {
            if (err instanceof SyntaxError) {
              assistantMsg.content += data
              assistantMsg.html = md.render(assistantMsg.content)
              scrollToBottom()
            } else {
              throw err
            }
          }
        }
      }
    }
    loadSessions()
  } catch (error) {
    if (error.name === 'AbortError') return
    assistantMsg.content = '抱歉，AI 回复出现异常，请稍后重试。'
    assistantMsg.html = assistantMsg.content
    ElMessage.error('发送失败')
  } finally {
    sending.value = false
  }
}

onMounted(() => {
  loadSessions()
  window.visualViewport?.addEventListener('resize', updateViewport)
  window.addEventListener('resize', updateViewport)
})
onUnmounted(() => {
  messageRequest++
  sendController?.abort()
  window.visualViewport?.removeEventListener('resize', updateViewport)
  window.removeEventListener('resize', updateViewport)
})
</script>

<template>
  <div class="chat-page" :style="{ '--chat-viewport-height': `${viewportHeight}px` }">
    <div v-if="isMobile" class="mobile-chat-toolbar">
      <el-button :aria-expanded="historyOpen" @click="historyOpen = !historyOpen">{{ historyOpen ? '收起历史' : '对话历史' }}</el-button>
      <el-button type="primary" :disabled="sending" @click="newSession">新对话</el-button>
    </div>
    <div v-show="!isMobile || historyOpen" class="chat-sidebar modern-card">
      <span class="eyebrow">YOUR CONVERSATIONS</span>
      <div class="sidebar-header">
        <h3>对话历史</h3>
        <el-button type="primary" size="small" class="gradient-btn" :disabled="sending" @click="newSession">新对话</el-button>
      </div>
      <div class="session-list">
        <button
          v-for="s in sessions"
          :key="s.id"
          class="session-item"
          type="button"
          :disabled="sending"
          :class="{ active: currentSessionId === s.id }"
          @click="loadMessages(s.id)"
        >
          <span class="session-title">{{ s.title || '新对话' }}</span>
          <span class="session-time">{{ formatDateTime(s.create_time) }}</span>
        </button>
        <el-empty v-if="!sessions.length" description="暂无对话" :image-size="60" />
      </div>
    </div>

    <div class="chat-main modern-card">
      <div class="chat-topbar"><div class="assistant-identity"><span class="assistant-icon"><el-icon><FirstAidKit /></el-icon></span><div><strong>AI 健康助手</strong><span>认真倾听，温暖陪伴</span></div></div><span class="assistant-badge">智能问诊</span></div>
      <div ref="chatContainer" class="chat-messages" :aria-busy="loadingMessages">
        <div v-if="loadingMessages" class="chat-welcome" role="status">正在加载对话…</div>
        <div v-else-if="!messages.length" class="chat-welcome">
          <span class="welcome-icon"><el-icon><FirstAidKit /></el-icon></span>
          <span class="eyebrow">A LITTLE CONVERSATION, A LITTLE CARE</span>
          <h2>今天，有什么想和我聊聊？</h2>
          <p>描述您的症状或健康困扰，<br>我会陪您一起了解身体发出的信号。</p>
          <div class="suggestion-grid"><button v-for="item in suggestedQuestions" :key="item.label" type="button" class="suggestion-card" @click="useSuggestion(item.text)"><el-icon><component :is="item.icon" /></el-icon><span>{{ item.label }}</span><el-icon><TopRight /></el-icon></button></div>
        </div>
        <div
          v-for="(msg, idx) in messages"
          :key="idx"
          class="message"
          :class="msg.role"
        >
          <div class="message-avatar"><el-icon><User v-if="msg.role === 'user'" /><FirstAidKit v-else /></el-icon></div>
          <div class="message-bubble">
            <div v-if="msg.role === 'assistant'" class="markdown-body" v-html="msg.html"></div>
            <div v-else>{{ msg.content }}</div>
          </div>
        </div>
        <div v-if="sending" class="typing-indicator">
          <span></span><span></span><span></span>
        </div>
      </div>
      <div class="chat-input">
        <el-input
          ref="composer"
          v-model="inputText"
          :disabled="loadingMessages"
          type="textarea"
          :rows="2"
          placeholder="请描述您的症状或健康问题..."
          @keydown.enter="handleEnter"
        />
        <el-button type="primary" class="gradient-btn send-btn" :loading="sending" :disabled="loadingMessages" @click="sendMessage">
          发送
        </el-button>
      </div>
      <div class="composer-note">AI 建议供健康参考，不能替代医生诊断<span v-if="!isMobile"> · Enter 发送 / Shift + Enter 换行</span></div>
    </div>
  </div>
</template>

<style scoped>
.chat-page {
  display: flex;
  gap: 20px;
  height: calc(100vh - 144px);
}

.chat-sidebar {
  width: 248px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  padding: 24px 18px;
  background: #f0f3eb;
}

.sidebar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.sidebar-header h3 {
  font-size: 16px;
}

.session-list {
  flex: 1;
  overflow-y: auto;
}

.session-item {
  display: block;
  width: 100%;
  text-align: left;
  font: inherit;
  color: inherit;
  background: transparent;
  border: 0;
  padding: 10px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s;
  margin-bottom: 4px;
}

.session-item:hover,
.session-item.active {
  background: #e1ebdc;
}

.session-item:disabled { opacity: .6; cursor: wait; }
.chat-main, .chat-messages { min-width: 0; min-height: 0; }
.message-bubble { overflow-wrap: anywhere; }
.markdown-body :deep(pre) { max-width: 100%; overflow-x: auto; }
.markdown-body :deep(table) { display: block; max-width: 100%; overflow-x: auto; }

.session-title {
  display: block;
  font-size: 14px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.session-time {
  font-size: 12px;
  color: var(--text-secondary);
}

.chat-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 0;
  overflow: hidden;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}

.chat-welcome {
  text-align: center;
  padding: 42px 20px 24px;
  color: var(--text-secondary);
}

.welcome-icon {
  display: inline-grid; place-items: center; width: 74px; height: 74px;
  font-size: 42px; color: #70945b; background: #eef3e3; border: 1px solid #e0e9d4; border-radius: 24px; transform: rotate(-8deg); margin-bottom: 26px;
}

.chat-welcome h2 {
  margin: 12px 0;
  color: var(--text-primary);
  font-size: 27px; font-weight: 550; letter-spacing: -.5px;
}

.message {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
}

.message.user {
  flex-direction: row-reverse;
}

.message-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  flex-shrink: 0;
  background: #e9f0e0; color: #68844f;
}

.message-bubble {
  max-width: 70%;
  padding: 12px 16px;
  border-radius: 16px;
  font-size: 14px;
  line-height: 1.6;
}

.message.user .message-bubble {
  background: #277466;
  color: #fff;
  border-bottom-right-radius: 4px;
}

.message.assistant .message-bubble {
  background: #f2f5ed;
  border-bottom-left-radius: 4px;
}

.chat-input {
  display: flex;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid var(--line);
  align-items: flex-end;
}

.chat-input .el-textarea {
  flex: 1;
}

.send-btn {
  height: 40px;
}

.typing-indicator {
  display: flex;
  gap: 4px;
  padding: 8px 16px;
}

.typing-indicator span {
  width: 8px;
  height: 8px;
  background: #197568;
  border-radius: 50%;
  animation: bounce 1.4s infinite ease-in-out both;
}

.typing-indicator span:nth-child(1) { animation-delay: -0.32s; }
.typing-indicator span:nth-child(2) { animation-delay: -0.16s; }

@keyframes bounce {
  0%, 80%, 100% { transform: scale(0); }
  40% { transform: scale(1); }
}

.markdown-body :deep(p) { margin: 0 0 8px; }
.markdown-body :deep(ul) { padding-left: 20px; }
.chat-topbar { display: flex; align-items: center; justify-content: space-between; padding: 17px 24px; border-bottom: 1px solid var(--line); flex-shrink: 0; }
.assistant-identity { display: flex; align-items: center; gap: 11px; }
.assistant-icon { display: grid; place-items: center; width: 36px; height: 36px; background: #edf3e3; border-radius: 12px; color: #79975e; font-size: 21px; }
.assistant-identity strong { font-size: 13px; font-weight: 600; display: block; }
.assistant-identity div > span { display: block; font-size: 10px; color: #6c7c65; margin-top: 4px; }
.assistant-badge { font-size: 10px; padding: 6px 10px; border-radius: 6px; background: #f1f5e9; color: #8b9d71; }
.chat-welcome .eyebrow { font-size: 8px; letter-spacing: 1.5px; color: #9bab86; }
.chat-welcome p { font-size: 13px; line-height: 1.9; color: #6c7c65; }
.suggestion-grid { display: flex; flex-direction: column; gap: 10px; max-width: 420px; margin: 28px auto 0; }
.suggestion-card { display: flex; align-items: center; gap: 12px; width: 100%; padding: 14px 16px; border: 1px solid #e7ecdf; border-radius: 10px; background: #fdfefa; color: #617354; text-align: left; font-size: 12px; }
.suggestion-card .el-icon:first-child { font-size: 17px; color: #9aac7d; }
.suggestion-card .el-icon:last-child { margin-left: auto; color: #aeb89d; }
.suggestion-card:hover { background: #f1f6e9; border-color: #bccdaa; }
.composer-note { font-size: 11px; color: #6c7c65; text-align: center; padding: 0 12px 13px; flex-shrink: 0; line-height: 1.6; }
@media (min-width: 768px) and (max-width: 1199px) { .chat-page { height: calc(100vh - 188px); }.chat-sidebar { width: 210px; } }
@media (max-width: 767px) {
  .chat-page {
    position: relative; flex-direction: column; gap: 10px;
    height: calc(var(--chat-viewport-height, 100dvh) - var(--mobile-header-height) - var(--mobile-nav-height) - 32px);
    min-height: 260px;
  }
  .mobile-chat-toolbar { display: flex; align-items: center; justify-content: space-between; flex-shrink: 0; }
  #app .chat-sidebar { position: absolute; top: 50px; bottom: 0; left: 0; right: 0; z-index: 20; width: auto; box-shadow: 0 10px 30px #24376326; }
  #app .chat-main { padding: 0; }
  .chat-messages { padding: 16px 12px; overscroll-behavior: contain; }
  .chat-welcome { padding: 28px 8px; }
  .welcome-icon { font-size: 44px; }
  .chat-welcome h2 { font-size: 20px; }
  .chat-welcome p { font-size: 13px; line-height: 1.7; }
  .message { gap: 7px; margin-bottom: 16px; }
  .message-avatar { width: 28px; height: 28px; font-size: 18px; }
  .message-bubble { max-width: calc(100% - 35px); padding: 10px 12px; }
  .chat-input { padding: 12px; gap: 8px; flex-shrink: 0; }
  .chat-input .send-btn { padding: 0 14px; height: 44px; }
  .chat-topbar { padding: 12px 15px; }
  .assistant-identity div > span { display: none; }
  .chat-welcome { padding: 22px 4px; }
  .welcome-icon { width: 58px; height: 58px; font-size: 32px; margin-bottom: 20px; }
  .chat-welcome h2 { font-size: 20px; }
  .chat-welcome .eyebrow { font-size: 6px; letter-spacing: 1px; }
  .suggestion-grid { margin-top: 20px; }
  .suggestion-card { padding: 12px; font-size: 11px; }
  .composer-note { font-size: 10px; padding-bottom: 8px; }
}

</style>
