<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import request from '@/utils/request'
import { User, Lock, Phone } from '@element-plus/icons-vue'

const router = useRouter()
const loading = ref(false)

/** 注册表单 */
const form = reactive({
  username: '',
  password: '',
  confirm_password: '',
  real_name: '',
  phone: '',
})

/** 提交注册 */
async function handleRegister() {
  if (!form.username || !form.password) {
    ElMessage.warning('请填写用户名和密码')
    return
  }
  if (form.password !== form.confirm_password) {
    ElMessage.warning('两次输入的密码不一致')
    return
  }
  loading.value = true
  try {
    await request.post('/auth/register', form)
    ElMessage.success('注册成功，请登录')
    router.push('/login')
  } catch {
    /* 错误已在拦截器处理 */
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="auth-page">
    <div class="auth-bg">
      <div class="bg-circle c1"></div>
      <div class="bg-circle c2"></div>
    </div>
    <div class="auth-card">
      <div class="auth-header">
        <span class="auth-logo brand-mark"><el-icon><FirstAidKit /></el-icon></span>
        <span class="eyebrow">START YOUR HEALTH JOURNEY</span><h1>开启您的健康之旅</h1>
        <p>创建账号，让每一天多一份安心</p>
      </div>
      <el-form :model="form" size="large" @submit.prevent="handleRegister">
        <el-form-item>
          <el-input v-model="form.username" aria-label="用户名" autocomplete="username" placeholder="用户名" :prefix-icon="User" />
        </el-form-item>
        <el-form-item>
          <el-input v-model="form.real_name" aria-label="用户昵称" autocomplete="name" placeholder="用户昵称" :prefix-icon="User" />
        </el-form-item>
        <el-form-item>
          <el-input v-model="form.phone" aria-label="手机号" autocomplete="tel" placeholder="手机号" :prefix-icon="Phone" />
        </el-form-item>
        <el-form-item>
          <el-input v-model="form.password" aria-label="密码" autocomplete="new-password" type="password" placeholder="密码" :prefix-icon="Lock" show-password />
        </el-form-item>
        <el-form-item>
          <el-input v-model="form.confirm_password" aria-label="确认密码" autocomplete="new-password" type="password" placeholder="确认密码" :prefix-icon="Lock" show-password />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" class="submit-btn" :loading="loading" native-type="submit">
            注 册
          </el-button>
        </el-form-item>
      </el-form>
      <div class="auth-footer">
        已有账号？
        <router-link to="/login" class="link">返回登录</router-link>
      </div>
    </div>
  </div>
</template>

<style scoped>
.auth-page { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 40px 20px; background: radial-gradient(ellipse at 5% 0%, #dce8d2, transparent 50%), radial-gradient(ellipse at 100% 100%, #e4ecdc, transparent 50%), #f5f6f0; }
.auth-bg { display: none; }.auth-card { width: 440px; max-width: 100%; background: #fff; border: 1px solid #e1e7d9; padding: 38px; border-radius: 24px; box-shadow: 0 20px 70px #2c4c3010; }.auth-header { text-align: center; margin-bottom: 28px; }.auth-logo { margin-bottom: 22px; width: 48px; height: 48px; font-size: 29px; background: #e7efdc; color: #658757; }.auth-header .eyebrow { font-size: 8px; letter-spacing: 1.7px; color: #92a17f; }.auth-header h1 { font-size: 24px; font-weight: 600; letter-spacing: -.7px; }.auth-header p { color: #6c7c65; font-size: 12px; margin-top: 12px; }.auth-card :deep(.el-input__wrapper) { background: #fbfcf8; padding: 4px 14px; }.auth-card :deep(.el-form-item) { margin-bottom: 18px; }.submit-btn { width: 100%; height: 46px; font-size: 14px; }.auth-footer { text-align: center; padding-top: 20px; border-top: 1px solid var(--line); color: var(--text-secondary); font-size: 12px; }.link { color: var(--brand); font-weight: 600; }
</style>
