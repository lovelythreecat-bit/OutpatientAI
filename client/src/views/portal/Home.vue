<script setup>
import { computed, ref, onMounted } from 'vue'
import { useUserStore } from '@/stores/user'
import request from '@/utils/request'
import { formatDateTime } from '@/utils/format'
import HealthOrbit from '@/components/HealthOrbit.vue'

const userStore = useUserStore()
const notices = ref([])
const stats = ref({})
const loading = ref(true)
const displayName = computed(() => userStore.userInfo?.real_name || userStore.userInfo?.username || '朋友')
const dateLabel = new Intl.DateTimeFormat('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' }).format(new Date())
async function loadData() {
  try {
    const [noticeRes, statRes] = await Promise.allSettled([
      request.get('/notices/list'), request.get('/stat/user-overview'),
    ])
    if (noticeRes.status === 'fulfilled') notices.value = noticeRes.value.data || []
    if (statRes.status === 'fulfilled') stats.value = statRes.value.data || {}
  } finally { loading.value = false }
}
onMounted(loadData)
const shortcuts = [
  { path: '/portal/chat', label: 'AI 智能问诊', desc: '聊聊身体近况，获取健康建议', icon: 'ChatDotRound', tone: 'green' },
  { path: '/portal/symptom', label: '症状推理', desc: '从症状出发，了解可能原因', icon: 'FirstAidKit', tone: 'sage' },
  { path: '/portal/consult', label: '在线咨询', desc: '与专业医生沟通您的困扰', icon: 'Service', tone: 'sand' },
  { path: '/portal/appointment', label: '预约挂号', desc: '选择科室医生，安排就诊时间', icon: 'Calendar', tone: 'blue' },
  { path: '/portal/records', label: '健康档案', desc: '每一次诊疗，都有迹可循', icon: 'Notebook', tone: 'sand' },
  { path: '/portal/articles', label: '健康资讯', desc: '从科学知识开始，照顾好自己', icon: 'Reading', tone: 'sage' },
]
const metrics = [
  { key: 'consult_count', label: '我的咨询', icon: 'ChatLineRound', path: '/portal/consult', unit: '次' },
  { key: 'appointment_count', label: '我的预约', icon: 'Calendar', path: '/portal/appointment', unit: '次' },
  { key: 'record_count', label: '健康档案', icon: 'Notebook', path: '/portal/records', unit: '份' },
  { key: 'chat_count', label: 'AI 对话', icon: 'ChatDotRound', path: '/portal/chat', unit: '次' },
]
</script>

<template>
  <div class="portal-home">
    <div class="home-greeting"><div><span class="eyebrow">YOUR HEALTH, OUR PRIORITY</span><h1>您好，{{ displayName }}<span class="greeting-dot">。</span></h1><p>把健康放在心上，从今天开始。</p></div><span class="home-date"><el-icon><Calendar /></el-icon>{{ dateLabel }}</span></div>
    <section class="care-hero">
      <div class="hero-copy"><span class="hero-kicker"><span></span> 您身边的 AI 健康助手</span><h2>多一份了解，<br>多一份<span>安心。</span></h2><p>从一个小小的健康疑问开始，<br>让智能问诊与专业医疗，陪您走好每一步。</p><div class="hero-actions"><router-link to="/portal/chat" class="hero-primary">开始 AI 问诊 <el-icon><ArrowRight /></el-icon></router-link><router-link to="/portal/appointment" class="hero-secondary">预约医生 <el-icon><ArrowRight /></el-icon></router-link></div><div class="hero-footnote"><el-icon><CircleCheck /></el-icon> 智能分析 <i></i> 专业咨询 <i></i> 持续关怀</div></div>
      <HealthOrbit class="hero-art" />
    </section>
    <section class="health-summary" aria-label="我的健康服务概览" :aria-busy="loading">
      <router-link v-for="item in metrics" :key="item.key" :to="item.path" class="summary-item"><span class="summary-icon"><el-icon><component :is="item.icon" /></el-icon></span><div><span class="summary-label">{{ item.label }}</span><div class="summary-number">{{ stats[item.key] ?? '—' }}<small>{{ item.unit }}</small></div></div><el-icon class="summary-arrow"><ArrowRight /></el-icon></router-link>
    </section>
    <div class="home-columns">
      <section class="services-section"><div class="section-heading"><div><span class="eyebrow">HEALTH SERVICES</span><h2>为您而来的健康服务</h2></div><span class="section-caption">让每一次关怀，都触手可及</span></div><div class="service-grid"><router-link v-for="item in shortcuts" :key="item.path" :to="item.path" class="service-card"><span class="service-icon" :class="item.tone"><el-icon><component :is="item.icon" /></el-icon></span><h3>{{ item.label }}</h3><p>{{ item.desc }}</p><el-icon class="service-arrow"><TopRight /></el-icon></router-link></div></section>
      <aside class="home-aside"><section class="notice-panel"><div class="section-heading"><div><span class="eyebrow">WHAT'S NEW</span><h2>最新公告</h2></div><el-icon><Bell /></el-icon></div><el-skeleton v-if="loading" :rows="3" animated /><el-empty v-else-if="!notices.length" description="暂无新公告，安心开启健康生活" :image-size="68" /><router-link v-for="item in notices.slice(0, 5)" :key="item.id" class="notice-link" :to="'/portal/notices/' + item.id"><span class="notice-bullet"></span><div><h3>{{ item.title }}</h3><time>{{ formatDateTime(item.create_time) }}</time></div><el-icon><ArrowRight /></el-icon></router-link></section><router-link to="/portal/profile" class="profile-nudge"><span class="nudge-icon"><el-icon><User /></el-icon></span><div><h3>让关怀更了解您</h3><p>完善个人资料，开启健康管理</p></div><el-icon><ArrowRight /></el-icon></router-link></aside>
    </div>
    <footer class="home-footer"><span>智慧医疗 · 让健康关怀融入日常</span><span>HEALTHIER DAYS, TOGETHER</span></footer>
  </div>
</template>

<style scoped>
.home-greeting { display: flex; align-items: center; justify-content: space-between; margin-bottom: 28px; }
.home-greeting .eyebrow { font-size: 9px; margin-bottom: 7px; letter-spacing: 2px; }
.home-greeting h1 { font-size: 29px; letter-spacing: -.8px; font-weight: 600; }
.greeting-dot { color: #7fa381; }
.home-greeting p { font-size: 12px; color: var(--text-secondary); margin-top: 8px; }
.home-date { display: flex; align-items: center; gap: 8px; color: #778579; font-size: 12px; }
.care-hero { position: relative; overflow: hidden; display: flex; align-items: center; justify-content: space-between; min-height: 352px; padding: 36px 62px; border-radius: 24px; background: radial-gradient(ellipse at 85% 75%, #3d6044 0, transparent 60%), #183f37; color: #fff; }
.hero-copy { position: relative; z-index: 1; }
.hero-kicker { display: flex; align-items: center; gap: 8px; color: #c6dbbf; font-size: 11px; letter-spacing: 1.5px; }
.hero-kicker > span { width: 6px; height: 6px; border-radius: 50%; background: #c4d99e; }
.hero-copy h2 { font-size: 44px; line-height: 1.35; letter-spacing: 1px; font-weight: 550; margin-top: 18px; }
.hero-copy h2 > span { color: #d4e4b5; }
.hero-copy p { color: #b4cabe; font-size: 12px; line-height: 1.9; margin-top: 16px; }
.hero-actions { display: flex; gap: 12px; margin-top: 25px; }
.hero-actions a { display: inline-flex; align-items: center; justify-content: center; gap: 18px; min-height: 44px; padding: 0 20px; border-radius: 9px; font-size: 13px; font-weight: 550; transition: background .2s, transform .2s; }
.hero-actions a:hover { transform: translateY(-2px); }
.hero-primary { background: #dceabd; color: #284736; }
.hero-primary:hover { background: #e6f1d1; }
.hero-secondary { border: 1px solid #ffffff36; color: #e9f0e7; }
.hero-secondary:hover { background: #ffffff0d; }
.hero-footnote { display: flex; align-items: center; gap: 10px; font-size: 10px; color: #9bb5a2; margin-top: 24px; }
.hero-footnote i { width: 3px; height: 3px; background: #6b8b72; border-radius: 50%; }
.hero-art { margin-left: 24px; flex-shrink: 0; }
.health-summary { display: grid; grid-template-columns: repeat(4, minmax(0,1fr)); padding: 24px 10px; margin-top: 22px; background: #fff; border: 1px solid var(--line); border-radius: 18px; }
.summary-item { display: flex; align-items: center; gap: 17px; padding: 0 26px; border-right: 1px solid var(--line); }
.summary-item:last-child { border: 0; }.summary-icon { display: grid; place-items: center; width: 42px; height: 42px; flex-shrink: 0; border-radius: 13px; background: #f0f4eb; color: #63876c; font-size: 20px; }
.summary-label { font-size: 11px; color: var(--text-secondary); }.summary-number { font-size: 28px; font-weight: 550; line-height: 1.25; margin-top: 3px; letter-spacing: -.5px; }.summary-number small { font-size: 10px; color: #a0a99c; margin-left: 8px; font-weight: 400; }.summary-arrow { color: #b1baae; margin-left: auto; font-size: 12px; }.summary-item:hover .summary-arrow { color: var(--brand); }
.home-columns { display: grid; grid-template-columns: minmax(0, 1fr) 310px; gap: 26px; margin-top: 34px; }
.section-heading { display: flex; justify-content: space-between; align-items: center; gap: 10px; margin-bottom: 19px; }.section-heading .eyebrow { font-size: 8px; margin-bottom: 8px; letter-spacing: 2px; }.section-heading h2 { font-size: 19px; font-weight: 600; }.section-caption { font-size: 10px; color: #6c7c65; }.section-heading > .el-icon { color: #879780; font-size: 19px; }
.service-grid { display: grid; grid-template-columns: repeat(3, minmax(0,1fr)); gap: 14px; }.service-card { position: relative; background: #fff; border: 1px solid var(--line); border-radius: 17px; padding: 23px 21px; transition: transform .2s, box-shadow .2s, border-color .2s; }.service-card:hover { transform: translateY(-4px); box-shadow: var(--card-shadow-hover); border-color: #c7d9c9; }.service-icon { display: inline-grid; place-items: center; width: 42px; height: 42px; border-radius: 13px; font-size: 22px; background: #e8f2e9; color: #4e8664; }.service-icon.sage { background: #eff2e5; color: #879451; }.service-icon.sand { background: #f8eee1; color: #b18a58; }.service-icon.blue { background: #eaf2f1; color: #658c8d; }.service-card h3 { font-size: 14px; font-weight: 600; margin-top: 17px; }.service-card p { color: #6c7c65; font-size: 12px; line-height: 1.7; margin-top: 7px; }.service-arrow { position: absolute; top: 25px; right: 20px; color: #b3bcae; font-size: 15px; }
.notice-panel { background: #fff; border: 1px solid var(--line); border-radius: 18px; padding: 23px; }.notice-panel .section-heading { margin-bottom: 10px; }.notice-panel h2 { font-size: 17px; }.notice-link { display: flex; align-items: center; gap: 10px; padding: 17px 0; border-bottom: 1px solid #edf0e9; }.notice-link:last-child { border-bottom: none; }.notice-bullet { width: 5px; height: 5px; background: #a8b688; border-radius: 50%; flex-shrink: 0; }.notice-link > div { min-width: 0; flex: 1; }.notice-link h3 { font-weight: 500; font-size: 12px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }.notice-link time { display: block; font-size: 11px; color: #6c7c65; margin-top: 8px; }.notice-link > .el-icon { font-size: 11px; color: #a7b19f; }.notice-link:hover h3 { color: var(--brand); }
.profile-nudge { display: flex; align-items: center; gap: 12px; padding: 22px 18px; background: #eaf0df; border: 1px solid #e0e8d3; border-radius: 16px; margin-top: 15px; }.nudge-icon { display: grid; place-items: center; width: 36px; height: 36px; background: #f6f8ef; color: #7a9164; border-radius: 50%; flex-shrink: 0; font-size: 19px; }.profile-nudge h3 { font-size: 12px; font-weight: 600; }.profile-nudge p { font-size: 11px; color: #687951; margin-top: 6px; }.profile-nudge > .el-icon { margin-left: auto; font-size: 12px; color: #687951; }
.home-footer { display: flex; justify-content: space-between; gap: 12px; margin-top: 32px; padding-top: 18px; border-top: 1px solid var(--line); font-size: 9px; letter-spacing: .5px; color: #6c7c65; }
@media (min-width: 768px) and (max-width: 1100px) { .care-hero { padding: 32px; }.hero-art { width: 350px; }.hero-copy h2 { font-size: 38px; }.home-columns { grid-template-columns: minmax(0,1fr) 270px; gap: 18px; }.service-grid { grid-template-columns: repeat(2,minmax(0,1fr)); }.summary-item { padding: 0 16px; gap: 10px; }.section-caption { display: none; } }
@media (max-width: 767px) { .home-greeting { margin-bottom: 20px; align-items: flex-start; }.home-greeting h1 { font-size: 24px; }.home-date { display: none; }.care-hero { padding: 28px; min-height: 0; border-radius: 20px; }.hero-art { display: none; }.hero-copy h2 { font-size: 35px; }.hero-copy p { font-size: 12px; }.hero-actions { gap: 10px; }.hero-actions a { padding: 0 14px; gap: 8px; font-size: 12px; }.hero-footnote { font-size: 9px; }.health-summary { grid-template-columns: repeat(2,minmax(0,1fr)); gap: 20px 0; padding: 20px 6px; margin-top: 16px; }.summary-item { padding: 0 12px; gap: 10px; }.summary-item:nth-child(2) { border: 0; }.summary-icon { width: 32px; height: 32px; font-size: 17px; border-radius: 10px; }.summary-number { font-size: 23px; }.summary-arrow { display: none; }.home-columns { grid-template-columns: 1fr; gap: 22px; margin-top: 26px; }.section-caption { display: none; }.section-heading h2 { font-size: 18px; }.service-grid { grid-template-columns: repeat(2,minmax(0,1fr)); gap: 10px; }.service-card { padding: 19px 15px; }.service-card p { font-size: 11px; }.service-card h3 { font-size: 13px; }.service-arrow { top: 20px; right: 14px; }.home-footer { flex-direction: column; font-size: 9px; gap: 8px; } }
</style>
