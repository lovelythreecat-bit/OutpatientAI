<script setup>
import { ref, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { Grid, User, SwitchButton } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import { useMobile } from '@/composables/useMobile'

const props = defineProps({
  title: { type: String, required: true },
  items: { type: Array, required: true },
  tabs: { type: Array, required: true },
  profilePath: { type: String, required: true },
})
const route = useRoute()
const userStore = useUserStore()
const isMobile = useMobile()
const open = ref(false)
const allItems = computed(() => [...props.items, { path: props.profilePath, label: '个人中心', icon: User }])
const active = (path) => route.path === path || route.path.startsWith(`${path}/`)
watch(() => route.fullPath, () => { open.value = false })
watch(isMobile, () => { open.value = false })
</script>

<template>
  <template v-if="isMobile">
    <header class="mobile-header">
      <button class="mobile-icon-button" type="button" aria-label="打开全部功能" :aria-expanded="open" @click="open = true">
        <el-icon><Grid /></el-icon>
      </button>
      <div class="mobile-heading"><span>{{ title }}</span><strong>{{ route.meta.title || title }}</strong></div>
      <router-link :to="profilePath" class="mobile-icon-button" aria-label="个人中心"><el-icon><User /></el-icon></router-link>
    </header>
    <nav class="mobile-bottom-nav" aria-label="常用功能">
      <router-link v-for="item in tabs" :key="item.path" :to="item.path" :class="{ active: active(item.path) }" :aria-current="active(item.path) ? 'page' : undefined">
        <el-icon><component :is="item.icon" /></el-icon><span>{{ item.label }}</span>
      </router-link>
      <button type="button" :class="{ active: open }" @click="open = true"><el-icon><Grid /></el-icon><span>全部</span></button>
    </nav>
    <el-drawer v-model="open" title="全部功能" direction="ltr" size="88%" class="mobile-menu-drawer">
      <div class="mobile-account"><strong>{{ userStore.userInfo?.nickname || userStore.userInfo?.real_name || userStore.userInfo?.username || '用户' }}</strong><span>{{ title }}</span></div>
      <nav class="mobile-service-grid" aria-label="全部功能">
        <router-link v-for="item in allItems" :key="item.path" :to="item.path" :class="{ active: active(item.path) }" :aria-current="active(item.path) ? 'page' : undefined" @click="open = false">
          <el-icon><component :is="item.icon" /></el-icon><span>{{ item.label }}</span>
        </router-link>
      </nav>
      <el-button class="mobile-logout" :icon="SwitchButton" @click="userStore.logout()">退出登录</el-button>
    </el-drawer>
  </template>
</template>
