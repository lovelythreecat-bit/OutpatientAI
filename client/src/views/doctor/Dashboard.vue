<script setup>
import { ref, onMounted } from 'vue'
import request from '@/utils/request'
import { useUserStore } from '@/stores/user'

const stats = ref({})
const userStore = useUserStore()
const dateLabel = new Intl.DateTimeFormat('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' }).format(new Date())

/** 加载工作台数据 */
async function loadStats() {
  try {
    const res = await request.get('/stat/overview')
    stats.value = res.data || {}
  } catch { /* */ }
}

onMounted(loadStats)
</script>

<template>
  <div>
    <div class="dashboard-intro"><div><span class="eyebrow">DOCTOR WORKSPACE</span><h2 class="page-title">您好，{{ userStore.userInfo?.real_name || '医生' }}</h2><p>新一天的关怀，从这里开始。及时回应，连接每一份信任。</p></div><span class="dashboard-date">{{ dateLabel }}</span></div>
    <el-row :gutter="20">
      <el-col :xs="12" :sm="6">
        <div class="stat-card">
          <div class="stat-value">{{ stats.pending_consults ?? '--' }}</div>
          <div class="stat-label">待回复咨询</div>
        </div>
      </el-col>
      <el-col :xs="12" :sm="6">
        <div class="stat-card">
          <div class="stat-value">{{ stats.today_appointments ?? '--' }}</div>
          <div class="stat-label">今日预约</div>
        </div>
      </el-col>
      <el-col :xs="12" :sm="6">
        <div class="stat-card">
          <div class="stat-value">{{ stats.total_patients ?? '--' }}</div>
          <div class="stat-label">患者总数</div>
        </div>
      </el-col>
      <el-col :xs="12" :sm="6">
        <div class="stat-card">
          <div class="stat-value">{{ stats.replied_consults ?? '--' }}</div>
          <div class="stat-label">已回复咨询</div>
        </div>
      </el-col>
    </el-row>
    <div class="work-actions">
      <router-link to="/doctor/consults" class="work-action"><el-icon><ChatDotRound /></el-icon><h3>回应患者的健康疑问</h3><p>查看待回复咨询，了解患者症状，给出专业建议。</p><span class="text-link">处理咨询 <el-icon><ArrowRight /></el-icon></span></router-link>
      <router-link to="/doctor/appointments" class="work-action"><el-icon><Calendar /></el-icon><h3>从容安排每一次就诊</h3><p>查看预约信息与就诊时间，做好接诊准备。</p><span class="text-link">查看预约 <el-icon><ArrowRight /></el-icon></span></router-link>
      <router-link to="/doctor/patients" class="work-action"><el-icon><Notebook /></el-icon><h3>让诊疗记录清晰可循</h3><p>回顾患者健康档案，连接过去与当下的诊疗。</p><span class="text-link">查看档案 <el-icon><ArrowRight /></el-icon></span></router-link>
    </div>
    <div class="work-note"><strong>每一份专业回应，都是一份安心。</strong><br>结合患者的既往记录与当前症状，为后续诊疗提供更完整的参考。</div>
  </div>
</template>
