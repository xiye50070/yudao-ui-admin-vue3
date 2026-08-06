<template>
  <ContentWrap>
    <el-alert
      title="敏感级许可控制可访问的最高字段等级；数据集 ACL 用于进一步限定部门或角色。前端权限仅控制可见性，服务端仍需鉴权。"
      type="info"
      :closable="false"
    />
  </ContentWrap>

  <ContentWrap>
    <el-form :inline="true" :model="query" class="access-policy-toolbar">
      <el-form-item label="主体类型">
        <el-select
          v-model="query.principalType"
          class="!w-140px"
          @change="handlePrincipalTypeChange"
        >
          <el-option label="部门" value="DEPT" />
          <el-option label="角色" value="ROLE" />
        </el-select>
      </el-form-item>

      <el-form-item :label="query.principalType === 'DEPT' ? '选择部门' : '选择角色'">
        <el-tree-select
          v-if="query.principalType === 'DEPT'"
          v-model="query.principalId"
          class="!w-280px"
          :data="departmentTree"
          :props="defaultProps"
          :loading="principalLoading"
          node-key="id"
          check-strictly
          clearable
          filterable
          placeholder="请选择部门"
        />
        <el-select
          v-else
          v-model="query.principalId"
          class="!w-280px"
          :loading="principalLoading"
          clearable
          filterable
          placeholder="请选择角色"
        >
          <el-option v-for="role in roles" :key="role.id" :label="role.name" :value="role.id">
            <span>{{ role.name }}</span>
            <el-tag v-if="role.code" class="ml-8px" size="small" type="info">
              {{ role.code }}
            </el-tag>
          </el-option>
        </el-select>
      </el-form-item>

      <el-form-item label="当前版本">
        <el-input-number v-model="clearanceVersion" :min="0" disabled />
      </el-form-item>

      <el-form-item>
        <el-button @click="refresh">刷新列表</el-button>
        <el-button
          v-hasPermi="['data-market:access-policy:update']"
          type="primary"
          plain
          @click="add"
        >
          新增许可
        </el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>

  <ContentWrap>
    <el-table v-loading="loading" :data="rules">
      <el-table-column label="主体类型" width="140">
        <template #default="{ row }">
          <el-tag :type="row.principalType === 'DEPT' ? 'primary' : 'success'" effect="plain">
            {{ row.principalType === 'DEPT' ? '部门' : '角色' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="主体名称" min-width="220">
        <template #default="{ row }">
          <span :class="{ 'text-gray-400': !resolvePrincipalName(row) }">
            {{ resolvePrincipalName(row) || '主体已不存在' }}
          </span>
        </template>
      </el-table-column>
      <el-table-column label="最高敏感级" width="200">
        <template #default="{ row }">
          <el-input-number v-model="row.maxSensitivityLevel" :min="1" controls-position="right" />
        </template>
      </el-table-column>
      <el-table-column label="启用" width="140">
        <template #default="{ row }">
          <el-switch v-model="row.enabled" />
        </template>
      </el-table-column>
    </el-table>

    <el-button
      v-hasPermi="['data-market:access-policy:update']"
      class="mt-12px"
      type="primary"
      @click="save"
    >
      保存敏感级许可
    </el-button>
  </ContentWrap>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import * as DeptApi from '@/api/system/dept'
import * as RoleApi from '@/api/system/role'
import * as SecurityApi from '@/api/dataMarket/security'
import type { AccessClearanceRule, PrincipalType } from '@/api/dataMarket/types'
import { useMessage } from '@/hooks/web/useMessage'
import { defaultProps, handleTree } from '@/utils/tree'

defineOptions({ name: 'DataMarketAccessPolicy' })

const message = useMessage()
const loading = ref(false)
const principalLoading = ref(false)
const query = reactive<{ principalType: PrincipalType; principalId?: number }>({
  principalType: 'DEPT',
  principalId: undefined
})
const rules = ref<AccessClearanceRule[]>([])
const clearanceVersion = ref<number>()
const departments = ref<DeptApi.DeptVO[]>([])
const roles = ref<RoleApi.RoleVO[]>([])

const departmentTree = computed(() =>
  handleTree(departments.value.map((department) => ({ ...department })))
)
const departmentNames = computed(
  () => new Map(departments.value.map((department) => [department.id, department.name]))
)
const roleNames = computed(() => new Map(roles.value.map((role) => [role.id, role.name])))

const resolvePrincipalName = (rule: AccessClearanceRule) =>
  rule.principalType === 'DEPT'
    ? departmentNames.value.get(rule.principalId)
    : roleNames.value.get(rule.principalId)

const loadPrincipals = async () => {
  principalLoading.value = true
  try {
    const [departmentList, roleList] = await Promise.all([
      DeptApi.getSimpleDeptList(),
      RoleApi.getSimpleRoleList()
    ])
    departments.value = departmentList
    roles.value = roleList
  } finally {
    principalLoading.value = false
  }
}

const getList = async () => {
  loading.value = true
  try {
    const policy = await SecurityApi.getAccessClearances()
    rules.value = policy.rules
    clearanceVersion.value = policy.version
  } finally {
    loading.value = false
  }
}

const refresh = () => Promise.all([getList(), loadPrincipals()])

const handlePrincipalTypeChange = () => {
  query.principalId = undefined
}

const add = () => {
  if (!query.principalId) {
    return message.warning(query.principalType === 'DEPT' ? '请选择部门' : '请选择角色')
  }
  if (
    rules.value.some(
      (rule) => rule.principalType === query.principalType && rule.principalId === query.principalId
    )
  ) {
    return message.warning('该主体已存在，请直接调整现有许可')
  }
  rules.value.push({
    principalType: query.principalType,
    principalId: query.principalId,
    maxSensitivityLevel: 1,
    enabled: true
  })
  query.principalId = undefined
}

const save = async () => {
  if (clearanceVersion.value === undefined) return message.warning('请先刷新许可列表')
  const policy = await SecurityApi.updateAccessClearances(rules.value, clearanceVersion.value)
  rules.value = policy.rules
  clearanceVersion.value = policy.version
  message.success('敏感级许可已保存')
}

onMounted(refresh)
</script>

<style scoped>
.access-policy-toolbar :deep(.el-form-item) {
  margin-bottom: 0;
}
</style>
