<script setup>
import { ref, onMounted } from 'vue'
import request from '@/utils/request'
import { formatDateTime, parseListData } from '@/utils/format'

const list = ref([])
const loading = ref(false)

/** 加载文章列表 */
async function loadList() {
  loading.value = true
  try {
    const res = await request.get('/articles/list', { params: { page_size: 100 } })
    list.value = parseListData(res)
  } catch {
    list.value = []
  } finally {
    loading.value = false
  }
}

onMounted(loadList)
</script>

<template>
  <div>
    <div class="dashboard-intro"><div><span class="eyebrow">THE HEALTH JOURNAL</span><h2 class="page-title">健康资讯</h2><p>用科学的知识，照顾日常里的自己。</p></div></div>
    <el-row :gutter="20">
      <el-col v-for="item in list" :key="item.id" :xs="24" :sm="12" :md="8">
        <router-link class="article-card modern-card" :to="'/portal/articles/' + item.id">
          <div class="article-cover"><el-icon><Reading /></el-icon><span>{{ item.category || '健康科普' }}</span><span class="cover-label">HEALTH JOURNAL</span></div>
          <h3>{{ item.title }}</h3>
          <p class="article-summary">{{ item.summary || item.content?.slice(0, 80) }}</p>
          <div class="article-meta">
            <span>{{ item.author || '管理员' }}</span>
            <span>{{ formatDateTime(item.create_time || item.created_at) }}</span>
          </div>
        </router-link>
      </el-col>
    </el-row>
    <el-empty v-if="!loading && !list.length" description="暂无文章" />
  </div>
</template>

<style scoped>
.article-card {
  display: block;
  cursor: pointer;
  margin-bottom: 20px;
  transition: transform 0.3s;
}

.article-card:hover {
  transform: translateY(-4px);
}

.article-card h3 {
  font-size: 16px;
  margin-bottom: 8px;
}
.article-cover { position: relative; display: flex; align-items: center; gap: 12px; height: 128px; margin: -6px -6px 23px; padding: 25px; border-radius: 12px; background: #edf3e3; color: #849963; overflow: hidden; }
.article-cover::after { content: ''; position: absolute; width: 130px; height: 130px; border: 24px solid #d9e4c7; border-radius: 50%; right: -26px; top: -28px; }
.article-cover > .el-icon { font-size: 29px; }.article-cover > span { font-size: 13px; letter-spacing: 1px; }.article-cover .cover-label { position: absolute; bottom: 14px; left: 25px; font-size: 7px; letter-spacing: 2px; }
.article-card h3 { line-height: 1.6; font-size: 18px; }
.article-summary { display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
.article-meta { border-top: 1px solid var(--line); padding-top: 18px; margin-top: 20px; }

.article-summary {
  color: var(--text-secondary);
  font-size: 14px;
  line-height: 1.6;
  margin-bottom: 12px;
}

.article-meta {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: var(--text-secondary);
}
</style>
