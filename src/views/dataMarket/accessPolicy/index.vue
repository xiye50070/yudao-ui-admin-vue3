<template>
  <ContentWrap
    ><el-alert
      title="敏感级许可控制可访问的最高字段等级；数据集 ACL 用于进一步限定部门或角色。前端权限仅控制可见性，服务端仍需鉴权。"
      type="info"
      :closable="false"
  /></ContentWrap>
  <ContentWrap
    ><el-form :inline="true" :model="query"
      ><el-form-item label="主体类型"
        ><el-select v-model="query.principalType" class="!w-120px"
          ><el-option label="部门" value="DEPT" /><el-option
            label="角色"
            value="ROLE" /></el-select></el-form-item
      ><el-form-item label="主体 ID"
        ><el-input-number v-model="query.principalId" :min="1" /></el-form-item
      ><el-form-item
        ><el-button @click="getList">查询许可</el-button
        ><el-button
          v-hasPermi="['data-market:access-policy:update']"
          type="primary"
          plain
          @click="add"
          >新增许可</el-button
        ></el-form-item
      ></el-form
    ></ContentWrap
  >
  <ContentWrap
    ><el-table v-loading="loading" :data="rules"
      ><el-table-column prop="principalType" label="主体类型" /><el-table-column
        prop="principalId"
        label="主体 ID" /><el-table-column
        prop="maxSensitivityLevel"
        label="最高敏感级" /><el-table-column label="启用"
        ><template #default="{ row }"
          ><el-switch v-model="row.enabled" /></template></el-table-column></el-table
    ><el-button
      v-hasPermi="['data-market:access-policy:update']"
      class="mt-12px"
      type="primary"
      @click="save"
      >保存敏感级许可</el-button
    ></ContentWrap
  >
</template>
<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue'
import * as SecurityApi from '@/api/dataMarket/security'
import type { AccessClearanceRule, PrincipalType } from '@/api/dataMarket/types'
import { useMessage } from '@/hooks/web/useMessage'
defineOptions({ name: 'DataMarketAccessPolicy' })
const message = useMessage()
const loading = ref(false)
const query = reactive<{ principalType?: PrincipalType; principalId?: number }>({
  principalType: 'DEPT',
  principalId: undefined
})
const rules = ref<AccessClearanceRule[]>([])
const getList = async () => {
  loading.value = true
  try {
    rules.value = await SecurityApi.getAccessClearances(query)
  } finally {
    loading.value = false
  }
}
const add = () =>
  rules.value.push({
    principalType: query.principalType || 'DEPT',
    principalId: query.principalId || 0,
    maxSensitivityLevel: 0,
    enabled: true
  })
const save = async () => {
  if (rules.value.some((item) => !item.principalId)) return message.warning('主体 ID 不能为空')
  await SecurityApi.updateAccessClearances(rules.value)
  message.success('敏感级许可已保存')
}
onMounted(getList)
</script>
