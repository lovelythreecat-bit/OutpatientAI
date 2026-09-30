<script setup>
import { computed } from 'vue'
import MobileNavigation from '@/components/MobileNavigation.vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { formatAvatar } from '@/utils/format'
import {
  HomeFilled, ChatDotRound, FirstAidKit, Document,
  Calendar, Notebook, Reading, User,
} from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

/** 顶部导航菜单 */
const navItems = [
  { path: '/portal/home', label: '首页', icon: HomeFilled },
  { path: '/portal/chat', label: 'AI问诊', icon: ChatDotRound },
  { path: '/portal/symptom', label: '症状推理', icon: FirstAidKit },
  { path: '/portal/consult', label: '在线咨询', icon: Document },
  { path: '/portal/appointment', label: '预约挂号', icon: Calendar },
  { path: '/portal/records', label: '健康档案', icon: Notebook },
  { path: '/portal/articles', label: '健康资讯', icon: Reading },
]

/** 当前激活路径 */
const activePath = computed(() => route.path)

/** 头像地址 */
const avatarUrl = computed(() => formatAvatar(userStore.userInfo?.avatar))

/** 跳转个人中心 */
function goProfile() {
  router.push('/portal/profile')
}

/** 退出登录 */
function handleLogout() {
  userStore.logout()
}
</script>

<template>
  <div class="portal-layout">
    <MobileNavigation title="智慧医疗" :items="navItems" :tabs="[navItems[0], navItems[1], navItems[4], { path: '/portal/profile', label: '我的', icon: User }]" profile-path="/portal/profile" />
    <!-- 渐变顶部导航 -->
    <header class="portal-header">
      <div class="header-inner">
        <router-link class="logo" to="/portal/home" aria-label="智慧医疗首页">
          <span class="brand-mark"><el-icon><FirstAidKit /></el-icon></span>
          <span class="logo-text">智慧医疗<small>HEALTHCARE · AI</small></span>
        </router-link>
        <nav class="nav-menu" aria-label="主导航">
          <router-link
            v-for="item in navItems"
            :key="item.path"
            :to="item.path"
            class="nav-item"
            :class="{ active: activePath.startsWith(item.path) }"
            :aria-current="activePath.startsWith(item.path) ? 'page' : undefined"
          >
            <el-icon><component :is="item.icon" /></el-icon>
            <span>{{ item.label }}</span>
          </router-link>
        </nav>
        <div class="header-user">
          <el-dropdown trigger="click">
            <button type="button" class="user-info" aria-label="账户菜单">
              <el-avatar :size="36" :src="avatarUrl">
                <el-icon><User /></el-icon>
              </el-avatar>
              <span class="username">{{ userStore.userInfo?.real_name || userStore.userInfo?.username || '用户' }}</span>
            </button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item @click="goProfile">
                  <el-icon><User /></el-icon> 个人中心
                </el-dropdown-item>
                <el-dropdown-item divided @click="handleLogout">
                  安全退出
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>
    </header>
    <!-- 主内容区 -->
    <main class="portal-main">
      <router-view />
    </main>
  </div>
</template>

<style scoped>

.portal-layout { min-height: 100vh; background: var(--bg-gradient); }
.portal-header { background: #ffffffed; border-bottom: 1px solid var(--line); position: sticky; top: 0; z-index: 100; backdrop-filter: blur(16px); }
.header-inner { max-width: 1400px; margin: 0 auto; padding: 0 36px; height: 80px; display: flex; align-items: center; gap: 36px; }
.logo { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
.logo-text { font-size: 19px; font-weight: 700; letter-spacing: 1px; white-space: nowrap; color: var(--brand-dark); }
.logo-text small { display: block; font-size: 8px; font-weight: 500; letter-spacing: 2px; margin-top: 3px; color: var(--text-secondary); }
.nav-menu { display: flex; align-items: center; justify-content: center; gap: 4px; flex: 1; min-width: 0; }
.nav-item { display: flex; align-items: center; gap: 7px; padding: 11px 13px; border-radius: 9px; color: #6d7b74; font-size: 13px; transition: background .2s, color .2s; white-space: nowrap; }
.nav-item .el-icon { font-size: 16px; }
.nav-item:hover { color: var(--brand); background: #f2f6ef; }
.nav-item.active { background: #eaf3ec; color: var(--brand); font-weight: 650; }
.header-user { flex-shrink: 0; }
.user-info { display: flex; align-items: center; gap: 10px; border: 1px solid var(--line); background: #fff; border-radius: 30px; padding: 5px 13px 5px 5px; }
.username { max-width: 90px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--text-primary); font-size: 12px; }
.portal-main { max-width: 1400px; margin: 0 auto; padding: 32px 36px; min-height: calc(100vh - 80px); }
@media (min-width: 768px) and (max-width: 1199px) {
  .header-inner { height: auto; min-height: 76px; flex-wrap: wrap; gap: 12px; padding: 14px 24px 10px; }
  .nav-menu { order: 3; width: 100%; flex-basis: 100%; justify-content: space-between; }
  .header-user { margin-left: auto; }
  .nav-item { padding: 10px 12px; }
  .portal-main { padding: 24px; }
}

</style>
