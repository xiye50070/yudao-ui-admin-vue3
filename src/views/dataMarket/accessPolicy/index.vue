<template>
  <DataMarketManagementPage
    page-key="access-policy"
    title="访问策略"
    description="按部门或角色配置数据敏感级访问上限"
    icon="ep:lock"
    tone="amber"
  >
    <template #actions>
      <el-button :loading="loading || principalLoading" @click="refresh">
        <Icon icon="ep:refresh" />刷新
      </el-button>
      <el-button
        v-hasPermi="['data-market:access-policy:update']"
        type="primary"
        :loading="saving"
        :disabled="loadError"
        @click="save"
      >
        <Icon icon="ep:check" />保存策略
      </el-button>
    </template>

    <template #summary>
      <div class="dm-summary-item">
        <span class="dm-summary-item__icon"><Icon icon="ep:key" /></span>
        <span class="dm-summary-item__content"
          ><small>许可规则</small><strong>{{ rules.length }}</strong></span
        >
      </div>
      <div class="dm-summary-item">
        <span class="dm-summary-item__icon"><Icon icon="ep:circle-check" /></span>
        <span class="dm-summary-item__content"
          ><small>已启用</small><strong>{{ enabledRuleCount }}</strong></span
        >
      </div>
      <div class="dm-summary-item">
        <span class="dm-summary-item__icon"><Icon icon="ep:document" /></span>
        <span class="dm-summary-item__content"
          ><small>策略版本</small><strong>{{ clearanceVersion ?? '—' }}</strong></span
        >
      </div>
    </template>

    <section class="dm-panel">
      <el-alert
        title="敏感级许可决定主体可访问的最高字段等级；数据集 ACL 会在此基础上进一步限定范围。"
        type="info"
        :closable="false"
        show-icon
        class="policy-notice"
      />

      <div class="policy-create">
        <div class="policy-create__title">
          <span><Icon icon="ep:plus" /></span>
          <div><h2>新增许可主体</h2><p>选择部门或角色后加入下方策略列表</p></div>
        </div>
        <el-form :inline="true" :model="query" class="access-policy-toolbar">
          <el-form-item label="主体类型">
            <el-select v-model="query.principalType" @change="handlePrincipalTypeChange">
              <el-option label="部门" value="DEPT" />
              <el-option label="角色" value="ROLE" />
            </el-select>
          </el-form-item>
          <el-form-item :label="query.principalType === 'DEPT' ? '选择部门' : '选择角色'">
            <el-tree-select
              v-if="query.principalType === 'DEPT'"
              v-model="query.principalId"
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
              :loading="principalLoading"
              clearable
              filterable
              placeholder="请选择角色"
            >
              <el-option v-for="role in roles" :key="role.id" :label="role.name" :value="role.id">
                <span>{{ role.name }}</span
                ><el-tag v-if="role.code" class="ml-8px" size="small" type="info">{{
                  role.code
                }}</el-tag>
              </el-option>
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button
              v-hasPermi="['data-market:access-policy:update']"
              type="primary"
              plain
              @click="add"
              ><Icon icon="ep:plus" />加入策略</el-button
            >
          </el-form-item>
        </el-form>
      </div>

      <header class="dm-panel__header policy-list-header">
        <div
          ><h2>敏感级许可</h2><p>共 {{ rules.length }} 条规则，调整后统一保存</p></div
        >
      </header>
      <el-result
        v-if="loadError"
        class="dm-load-result"
        icon="warning"
        title="访问策略加载失败"
        sub-title="暂时无法获取策略版本与许可规则"
      >
        <template #extra><el-button type="primary" @click="refresh">重新加载</el-button></template>
      </el-result>
      <div v-else class="dm-table-wrap">
        <el-table v-loading="loading" :data="rules" empty-text="暂无敏感级许可">
          <el-table-column label="主体名称" min-width="260">
            <template #default="{ row }">
              <div class="dm-entity-cell">
                <span class="dm-entity-mark"
                  ><Icon
                    :icon="row.principalType === 'DEPT' ? 'ep:office-building' : 'ep:user-filled'"
                /></span>
                <span class="dm-entity-copy"
                  ><strong>{{ resolvePrincipalName(row) || '主体已不存在' }}</strong
                  ><small>{{ row.principalType === 'DEPT' ? '部门' : '角色' }}</small></span
                >
              </div>
            </template>
          </el-table-column>
          <el-table-column label="主体类型" width="130" align="center"
            ><template #default="{ row }"
              ><el-tag
                :type="row.principalType === 'DEPT' ? 'primary' : 'success'"
                effect="plain"
                round
                >{{ row.principalType === 'DEPT' ? '部门' : '角色' }}</el-tag
              ></template
            ></el-table-column
          >
          <el-table-column label="最高敏感级" width="210" align="center"
            ><template #default="{ row }"
              ><el-input-number
                v-model="row.maxSensitivityLevel"
                :min="1"
                controls-position="right" /></template
          ></el-table-column>
          <el-table-column label="状态" width="150" align="center"
            ><template #default="{ row }"
              ><el-switch v-model="row.enabled" active-text="启用" inactive-text="停用" /></template
          ></el-table-column>
          <el-table-column label="操作" width="100" align="right"
            ><template #default="{ $index }"
              ><el-button
                v-hasPermi="['data-market:access-policy:update']"
                link
                type="danger"
                @click="removeRule($index)"
                >移除</el-button
              ></template
            ></el-table-column
          >
        </el-table>
      </div>
    </section>
  </DataMarketManagementPage>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import * as DeptApi from '@/api/system/dept'
import * as RoleApi from '@/api/system/role'
import * as SecurityApi from '@/api/dataMarket/security'
import type { AccessClearanceRule, PrincipalType } from '@/api/dataMarket/types'
import { useMessage } from '@/hooks/web/useMessage'
import { defaultProps, handleTree } from '@/utils/tree'
import DataMarketManagementPage from '@/views/dataMarket/components/DataMarketManagementPage.vue'

defineOptions({ name: 'DataMarketAccessPolicy' })

const message = useMessage()
const loading = ref(false)
const saving = ref(false)
const loadError = ref(false)
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
const enabledRuleCount = computed(() => rules.value.filter((rule) => rule.enabled).length)

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
  loadError.value = false
  try {
    const policy = await SecurityApi.getAccessClearances()
    rules.value = policy.rules
    clearanceVersion.value = policy.version
  } catch {
    loadError.value = true
  } finally {
    loading.value = false
  }
}
const removeRule = (index: number) => rules.value.splice(index, 1)

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
  saving.value = true
  try {
    const policy = await SecurityApi.updateAccessClearances(rules.value, clearanceVersion.value)
    rules.value = policy.rules
    clearanceVersion.value = policy.version
    message.success('敏感级许可已保存')
  } finally {
    saving.value = false
  }
}

onMounted(refresh)
</script>

<style scoped lang="scss">
.policy-notice {
  margin-bottom: 18px;
}

.policy-create {
  display: flex;
  padding: 16px 18px;
  margin-bottom: 22px;
  background: #fffaf0;
  border: 1px solid #f4e4c4;
  border-radius: 9px;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
}

.policy-create__title {
  display: flex;
  min-width: 260px;
  align-items: center;
  gap: 12px;

  > span {
    display: grid;
    width: 38px;
    height: 38px;
    color: #d97706;
    background: #ffefd1;
    border-radius: 9px;
    place-items: center;
  }

  h2,
  p {
    margin: 0;
  }

  h2 {
    font-size: 15px;
    color: #3e3424;
  }

  p {
    margin-top: 4px;
    font-size: 12px;
    color: #8f8068;
  }
}

.access-policy-toolbar :deep(.el-form-item) {
  margin-bottom: 0;
}

.access-policy-toolbar :deep(.el-select),
.access-policy-toolbar :deep(.el-tree-select) {
  width: 230px;
}

.policy-list-header {
  margin-bottom: 12px !important;
}

@media (width <= 1100px) {
  .policy-create {
    align-items: flex-start;
    flex-direction: column;
  }

  .access-policy-toolbar :deep(.el-form-item) {
    margin-bottom: 12px;
  }
}
</style>
