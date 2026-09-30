<script setup>
import { computed, ref } from 'vue'
import MobileNavigation from '@/components/MobileNavigation.vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { formatAvatar } from '@/utils/format'
import {
  DataAnalysis, User, FirstAidKit, OfficeBuilding, Collection,
  Share, ChatDotRound, Calendar, Document, Bell, Fold, ArrowDown,
} from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const isCollapse = ref(false)

/** 根据角色生成侧边栏菜单 */
const menuItems = computed(() => {
  if (userStore.role === 'admin') {
    return [
      { path: '/admin/dashboard', label: '数据概览', icon: DataAnalysis },
      { path: '/admin/users', label: '用户管理', icon: User },
      { path: '/admin/doctors', label: '医生管理', icon: FirstAidKit },
      { path: '/admin/departments', label: '科室管理', icon: OfficeBuilding },
      { path: '/admin/knowledge', label: '知识库', icon: Collection },
      { path: '/admin/graph', label: '知识图谱', icon: Share },
      { path: '/admin/consults', label: '咨询管理', icon: ChatDotRound },
      { path: '/admin/appointments', label: '预约管理', icon: Calendar },
      { path: '/admin/articles', label: '文章管理', icon: Document },
      { path: '/admin/notices', label: '公告管理', icon: Bell },
    ]
  }
  return [
    { path: '/doctor/dashboard', label: '工作台', icon: DataAnalysis },
    { path: '/doctor/consults', label: '待回复咨询', icon: ChatDotRound },
    { path: '/doctor/appointments', label: '我的预约', icon: Calendar },
    { path: '/doctor/patients', label: '患者档案', icon: User },
  ]
})

/** 面包屑路径 */
const breadcrumbs = computed(() => {
  const matched = route.matched.filter((r) => r.meta?.title)
  return matched.map((r) => ({ title: r.meta.title, path: r.path }))
})

/** 个人中心路径 */
const profilePath = computed(() =>
  userStore.role === 'admin' ? '/admin/profile' : '/doctor/profile',
)

/** 头像地址 */
const avatarUrl = computed(() => formatAvatar(userStore.userInfo?.avatar))

/** 显示名称 */
const displayName = computed(() =>
  userStore.userInfo?.nickname || userStore.userInfo?.real_name || userStore.userInfo?.username || '用户',
)

/** 侧边栏标题 */
const sidebarTitle = computed(() =>
  userStore.role === 'admin' ? '管理后台' : '医生工作台',
)

function goProfile() {
  router.push(profilePath.value)
}

function handleLogout() {
  userStore.logout()
}
</script>

<template>
  <el-container class="admin-layout">
    <MobileNavigation :title="sidebarTitle" :items="menuItems" :tabs="userStore.role === 'admin' ? [menuItems[0], menuItems[1], menuItems[6], { path: profilePath, label: '我的', icon: User }] : [...menuItems.slice(0, 3), { path: profilePath, label: '我的', icon: User }]" :profile-path="profilePath" />
    <!-- 侧边栏 -->
    <el-aside :width="isCollapse ? '76px' : '240px'" class="sidebar">
      <div class="sidebar-logo">
        <span class="brand-mark"><el-icon><FirstAidKit /></el-icon></span>
        <span v-if="!isCollapse" class="logo-text">智慧医疗<small>{{ sidebarTitle }}</small></span>
      </div>
      <div v-if="!isCollapse" class="menu-caption">WORKSPACE / 工作空间</div>
      <el-menu
        :default-active="route.path"
        :collapse="isCollapse"
        router
        class="sidebar-menu"
      >
        <el-menu-item v-for="item in menuItems" :key="item.path" :index="item.path">
          <el-icon><component :is="item.icon" /></el-icon>
          <template #title>{{ item.label }}</template>
        </el-menu-item>
      </el-menu>
      <div v-if="!isCollapse" class="sidebar-note"><el-icon><FirstAidKit /></el-icon><strong>让医疗更有温度</strong><span>连接专业，关怀每一刻。</span></div>
    </el-aside>

    <el-container class="main-container">
      <!-- 顶部栏 -->
      <el-header class="top-header">
        <div class="header-left">
          <button class="collapse-btn" type="button" :aria-label="isCollapse ? '展开侧边栏' : '收起侧边栏'" :aria-expanded="!isCollapse" @click="isCollapse = !isCollapse"><el-icon><Fold /></el-icon></button>
          <span class="workspace-label">{{ sidebarTitle }}</span>
          <el-breadcrumb separator="/">
            <el-breadcrumb-item v-for="item in breadcrumbs" :key="item.path">
              {{ item.title }}
            </el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        <!-- 右上角头像下拉 -->
        <el-dropdown trigger="click">
          <button type="button" class="header-user" aria-label="账户菜单">
            <el-avatar :size="36" :src="avatarUrl">
              <el-icon><User /></el-icon>
            </el-avatar>
            <span class="username">{{ displayName }}</span>
            <el-icon><ArrowDown /></el-icon>
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
      </el-header>

      <!-- 内容区 -->
      <el-main class="main-content">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<style scoped>

.admin-layout { min-height: 100vh; }
.sidebar { position: sticky; top: 0; height: 100vh; background: #173e38; transition: width .2s; overflow-x: hidden; overflow-y: auto; display: flex; flex-direction: column; flex-shrink: 0; }
.sidebar-logo { height: 88px; min-height: 88px; display: flex; align-items: center; justify-content: center; gap: 12px; border-bottom: 1px solid #ffffff12; margin: 0 18px; }
.sidebar-logo .brand-mark { background: #d5e8ce; color: #244d40; width: 36px; height: 36px; }
.logo-text { color: #fff; font-size: 19px; font-weight: 650; letter-spacing: 1px; white-space: nowrap; }
.logo-text small { display: block; color: #98b5a9; font-size: 10px; font-weight: 400; letter-spacing: 2px; margin-top: 4px; }
.menu-caption { color: #8ba99c; font-size: 9px; letter-spacing: 1.5px; padding: 28px 26px 12px; white-space: nowrap; }
.sidebar-menu { border-right: none; background: transparent; padding: 8px 14px; --el-menu-item-height: 47px; width: 100%; }
.sidebar-menu :deep(.el-menu-item) { color: #b2c8bd; margin-bottom: 5px; border-radius: 9px; font-size: 13px; }
.sidebar-menu :deep(.el-menu-item .el-icon) { font-size: 18px; margin-right: 10px; }
.sidebar-menu :deep(.el-menu-item:hover) { color: #fff; background: #ffffff0d; }
.sidebar-menu :deep(.el-menu-item.is-active) { color: #f4ffec; background: #365e4f; }
.sidebar-menu.el-menu--collapse { padding-inline: 10px; }
.sidebar-menu.el-menu--collapse :deep(.el-menu-item) { padding: 0 !important; justify-content: center; }
.sidebar-note { display: flex; flex-direction: column; gap: 8px; margin: auto 18px 22px; padding: 22px 16px; border: 1px solid #ffffff16; border-radius: 14px; color: #cbdccf; }
.sidebar-note .el-icon { color: #b5cf9f; font-size: 24px; margin-bottom: 4px; }
.sidebar-note strong { font-size: 13px; font-weight: 500; }
.sidebar-note span { font-size: 11px; color: #8ba99c; }
.main-container { background: var(--bg-gradient); min-width: 0; }
.top-header { background: #ffffffd9; border-bottom: 1px solid var(--line); display: flex; align-items: center; justify-content: space-between; padding: 0 32px; height: 76px; }
.header-left { display: flex; align-items: center; gap: 18px; }
.workspace-label { color: #8a978f; padding-right: 18px; border-right: 1px solid var(--line); font-size: 12px; }
.collapse-btn { display: grid; place-items: center; width: 36px; height: 36px; background: #f4f6f0; border: 1px solid var(--line); border-radius: 9px; font-size: 19px; color: #6a7a70; }
.collapse-btn:hover { color: var(--brand); background: var(--brand-soft); }
.header-user { display: flex; align-items: center; gap: 10px; background: transparent; border: 0; padding: 4px 8px; border-radius: 8px; color: var(--text-secondary); }
.header-user:hover { background: #f4f6ef; }
.username { font-size: 13px; color: var(--text-primary); max-width: 160px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.main-content { padding: 32px; min-height: calc(100vh - 76px); }

</style>
