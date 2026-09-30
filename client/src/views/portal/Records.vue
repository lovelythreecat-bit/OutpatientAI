<script setup>
import ResponsiveTable from '@/components/ResponsiveTable.js'
import { ref, onMounted } from 'vue'
import request from '@/utils/request'
import { formatDateTime } from '@/utils/format'

const list = ref([])
const loading = ref(false)

/** 加载健康档案 */
async function loadList() {
  loading.value = true
  try {
    const res = await request.get('/records/my')
    list.value = res.data || []
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
    <div class="page-intro"><span class="eyebrow">YOUR HEALTH STORY</span><h2 class="page-title">健康档案</h2><p>记录每一次诊疗，串联属于您的健康历程。</p></div>
    <div class="modern-card">
      <ResponsiveTable :data="list" v-loading="loading" class="adaptive-table" stripe>
        <el-table-column prop="record_type" label="档案类型" min-width="120" />
        <el-table-column prop="diagnosis" label="诊断" min-width="180" show-overflow-tooltip />
        <el-table-column prop="treatment" label="治疗方案" min-width="180" show-overflow-tooltip />
        <el-table-column prop="doctor_name" label="主治医生" min-width="100" />
        <el-table-column prop="visit_date" label="就诊日期" min-width="120" />
        <el-table-column prop="create_time" label="记录时间" min-width="170">
          <template #default="{ row }">{{ formatDateTime(row.create_time || row.created_at) }}</template>
        </el-table-column>
      </ResponsiveTable>
      <el-empty v-if="!loading && !list.length" description="暂无健康档案" />
    </div>
  </div>
</template>
