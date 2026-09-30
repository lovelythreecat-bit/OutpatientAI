<script setup>
import { ref, reactive } from 'vue'
import HealthOrbit from '@/components/HealthOrbit.vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { User, Lock, Setting, ChatDotRound, Calendar, FirstAidKit, DataAnalysis } from '@element-plus/icons-vue'

const router = useRouter()
const userStore = useUserStore()
const loading = ref(false)

/** 登录表单 */
const form = reactive({
  username: '',
  password: '',
  role: 'user',
})

/** 角色选项 */
const roleOptions = [
  { label: '用户', value: 'user', icon: User },
  { label: '医生', value: 'doctor', icon: FirstAidKit },
  { label: '管理员', value: 'admin', icon: Setting },
]

/** 平台特色介绍 */
const features = [
  { icon: ChatDotRound, title: 'AI 智能问诊', desc: '基于大模型的症状分析与健康咨询' },
  { icon: Calendar, title: '在线预约挂号', desc: '科室医生一键预约，省时省心' },
  { icon: FirstAidKit, title: '专业医疗服务', desc: '连接优质医生资源，守护您的健康' },
  { icon: DataAnalysis, title: '健康数据管理', desc: '问诊记录与档案一站式管理' },
]

/** 提交登录 */
async function handleLogin() {
  if (!form.username || !form.password) {
    ElMessage.warning('请输入用户名和密码')
    return
  }
  loading.value = true
  try {
    await userStore.login(form)
    ElMessage.success('登录成功')
    const homeMap = { user: '/portal/home', doctor: '/doctor/dashboard', admin: '/admin/dashboard' }
    router.push(homeMap[form.role] || '/portal/home')
  } catch {
    /* 错误已在拦截器处理 */
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="login-page">
    <!-- 左侧：全屏背景图 + 品牌介绍 -->
    <div class="login-left">
      <div class="left-bg"></div>
      <div class="left-overlay"></div>
      <div class="left-deco">
        <div class="deco-circle c1"></div>
        <div class="deco-circle c2"></div>
        <div class="deco-circle c3"></div>
      </div>
      <div class="left-content">
        <div class="brand">
          <div class="brand-badge">
            <span class="brand-mark"><el-icon><FirstAidKit /></el-icon></span>
            <span class="brand-tag">智慧医疗</span>
          </div>
          <span class="brand-eyebrow">A LITTLE CARE. A HEALTHIER LIFE.</span><h1>让健康有依靠，<br>让生活更安心。</h1>
          <p class="brand-slogan">您的 AI 智能医疗问诊平台</p>
        </div>
        <HealthOrbit class="login-orbit" />
        <ul class="feature-list">
          <li v-for="item in features" :key="item.title" class="feature-item">
            <div class="feature-icon">
              <el-icon :size="20"><component :is="item.icon" /></el-icon>
            </div>
            <div class="feature-text">
              <strong>{{ item.title }}</strong>
              <span>{{ item.desc }}</span>
            </div>
          </li>
        </ul>
      </div>
    </div>

    <!-- 右侧：登录表单（自适应 1/3 宽度） -->
    <div class="login-right">
      <div class="right-bg-pattern">
        <div class="pattern-dot d1"></div>
        <div class="pattern-dot d2"></div>
      </div>
      <div class="right-inner">
        <div class="form-brand">
          <div class="form-brand-badge">
            <el-icon class="form-brand-icon"><FirstAidKit /></el-icon>
          </div>
          <div class="form-brand-info">
            <span class="form-brand-text">智慧医疗</span>
            <span class="form-brand-sub">HEALTHCARE · AI</span>
          </div>
        </div>

        <div class="form-panel">
          <div class="form-panel-accent"></div>
          <div class="form-header">
            <span class="eyebrow">WELCOME BACK</span><h2>欢迎回来<span>。</span></h2>
            <p>登录后即可使用 AI 问诊与健康服务</p>
          </div>

          <el-form :model="form" size="large" class="login-form" @submit.prevent="handleLogin">
            <div class="field-group">
              <label class="field-label" for="login-username">用户名</label>
              <el-input
                v-model="form.username"
                id="login-username" autocomplete="username"
                placeholder="请输入用户名"
                :prefix-icon="User"
                class="custom-input"
              />
            </div>
            <div class="field-group">
              <label class="field-label" for="login-password">密码</label>
              <el-input
                v-model="form.password"
                id="login-password" autocomplete="current-password"
                type="password"
                placeholder="请输入密码"
                :prefix-icon="Lock"
                show-password
                class="custom-input"
              />
            </div>
            <div class="field-group">
              <label class="field-label">登录身份</label>
              <div class="role-cards">
                <button
                  v-for="opt in roleOptions"
                  :key="opt.value"
                  type="button"
                  class="role-card"
                  :class="{ active: form.role === opt.value }"
                  :aria-pressed="form.role === opt.value"
                  @click="form.role = opt.value"
                >
                  <span class="role-icon-wrap">
                    <el-icon :size="18"><component :is="opt.icon" /></el-icon>
                  </span>
                  <span class="role-label">{{ opt.label }}</span>
                </button>
              </div>
            </div>
            <el-button type="primary" class="submit-btn" :loading="loading" native-type="submit">
              {{ loading ? '登录中...' : '立即登录' }}
            </el-button>
          </el-form>

          <div class="form-footer">
            <span>还没有账号？</span>
            <router-link to="/register" class="link">免费注册 →</router-link>
          </div>
        </div>

        <div class="form-trust">
          <span class="trust-item">用心连接医疗，温暖守护健康</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.login-page { min-height: 100vh; display: flex; background: #f6f7f1; }
.login-left { width: 52%; min-height: 100vh; background: radial-gradient(ellipse at 75% 70%, #3d6349, transparent 65%), #193e36; display: flex; align-items: center; justify-content: center; position: relative; overflow: hidden; color: #fff; }
.left-bg, .left-overlay, .left-deco, .right-bg-pattern, .form-panel-accent { display: none; }
.left-content { width: 100%; max-width: 660px; padding: 48px 60px; position: relative; }
.brand-badge { display: flex; align-items: center; gap: 12px; margin-bottom: 52px; }
.brand-badge .brand-mark { background: #d8e9bf; color: #2e5540; }
.brand-tag { font-size: 20px; letter-spacing: 2px; font-weight: 600; }
.brand-eyebrow { display: block; color: #9eb9a3; font-size: 9px; letter-spacing: 2.5px; margin-bottom: 20px; }
.brand h1 { font-size: clamp(32px, 3.2vw, 48px); font-weight: 500; line-height: 1.4; letter-spacing: 2px; }
.brand-slogan { margin-top: 19px; font-size: 13px; color: #abc3b2; letter-spacing: 2px; }
.login-orbit { margin: 8px auto 0; transform: scale(.85); height: 290px; }
.feature-list { list-style: none; display: grid; grid-template-columns: repeat(2,minmax(0,1fr)); gap: 20px 16px; padding-top: 24px; border-top: 1px solid #ffffff19; }
.feature-item { display: flex; align-items: center; gap: 10px; }.feature-icon { color: #c3d8ac; }.feature-text { display: flex; flex-direction: column; gap: 5px; }.feature-text strong { font-size: 12px; font-weight: 500; color: #dfebd7; }.feature-text span { font-size: 9px; color: #9db7a2; line-height: 1.5; }
.login-right { flex: 1; display: flex; align-items: center; justify-content: center; padding: 40px; min-width: 0; }
.right-inner { width: 100%; max-width: 412px; }
.form-brand { display: flex; align-items: center; gap: 11px; margin-bottom: 34px; }.form-brand-badge { display: grid; place-items: center; width: 42px; height: 42px; border-radius: 13px; background: #e6eddd; color: #63815c; }.form-brand-icon { font-size: 25px; }.form-brand-info { display: flex; flex-direction: column; gap: 5px; }.form-brand-text { font-size: 17px; font-weight: 650; letter-spacing: 1px; }.form-brand-sub { font-size: 9px; letter-spacing: 2px; color: #88947f; }
.form-panel { background: #fff; border: 1px solid #e4e8dc; border-radius: 22px; padding: 34px; box-shadow: 0 12px 40px #254a2c05; }.form-header { margin-bottom: 26px; }.form-header .eyebrow { font-size: 9px; color: #91a480; margin-bottom: 10px; }.form-header h2 { font-size: 30px; letter-spacing: -1px; font-weight: 600; }.form-header h2 span { color: #a3b28a; }.form-header p { font-size: 12px; color: #6c7c65; margin-top: 12px; }
.login-form { display: flex; flex-direction: column; gap: 19px; }.field-group { display: flex; flex-direction: column; gap: 9px; }.field-label { font-size: 12px; color: #607056; font-weight: 500; }.login-form :deep(.el-input__wrapper) { background: #fbfcf8; border-radius: 10px; padding: 4px 14px; }.login-form :deep(.el-input__inner) { font-size: 13px; height: 38px; }.login-form :deep(.el-input__prefix) { color: #a3ad9a; }
.role-cards { display: grid; grid-template-columns: repeat(3,minmax(0,1fr)); gap: 9px; }.role-card { display: flex; align-items: center; justify-content: center; gap: 7px; min-height: 47px; border: 1px solid #e5e9df; border-radius: 10px; background: #fff; color: #66765e; transition: background .2s, border-color .2s; }.role-card:hover { border-color: #9db99c; }.role-card.active { background: #edf4e9; border-color: #7ca17c; color: #3f7252; }.role-icon-wrap { display: flex; align-items: center; }.role-label { font-size: 12px; }
.submit-btn { width: 100%; height: 46px; margin-top: 4px; font-size: 14px; letter-spacing: 2px; }.form-footer { display: flex; align-items: center; justify-content: center; flex-wrap: wrap; gap: 6px; padding-top: 24px; margin-top: 24px; border-top: 1px solid #edf0e6; font-size: 12px; color: #6c7c65; }.link { color: #197568; font-weight: 600; }.form-trust { text-align: center; margin-top: 24px; }.trust-item { color: #6c7c65; font-size: 10px; letter-spacing: 1px; }
@media (min-width: 768px) and (max-width: 1100px) { .left-content { padding: 36px; }.login-right { padding: 30px; }.feature-list { grid-template-columns: 1fr; gap: 14px; }.login-orbit { transform: scale(.7); width: 320px; margin-left: -8px; }.brand-badge { margin-bottom: 38px; }.form-panel { padding: 26px; } }
@media (max-width: 767px) { .login-left { display: none; }.login-right { min-height: 100dvh; padding: 24px 16px; }.form-brand { margin-bottom: 24px; }.form-header { margin-bottom: 20px; }.form-header h2 { font-size: 27px; }.form-panel { padding: 26px 20px; }.login-form { gap: 16px; }.role-card { gap: 5px; }.role-icon-wrap .el-icon { font-size: 16px; }.form-footer { padding-top: 20px; margin-top: 20px; }.form-trust { margin-top: 20px; } }
</style>
