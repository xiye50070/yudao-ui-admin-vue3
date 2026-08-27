<template>
  <el-dialog
    :model-value="modelValue"
    :title="dialogTitle"
    :aria-label="dialogTitle"
    width="min(820px, calc(100vw - 32px))"
    destroy-on-close
    @update:model-value="emit('update:modelValue', $event)"
    @closed="reset"
  >
    <el-alert
      title="未配置 ACL 时，租户内拥有指标浏览权限的用户均可查看该指标。"
      type="info"
      :closable="false"
      show-icon
      class="acl-open-alert"
    >
      <template #default>
        配置部门或角色后，任一规则命中即可查看；部门规则可选择是否包含下级部门。
      </template>
    </el-alert>

    <el-skeleton v-if="loading" :rows="5" animated />
    <template v-else>
      <el-table :data="rules" empty-text="暂未配置 ACL（租户内开放）" row-key="rowKey">
        <el-table-column label="主体类型" width="132">
          <template #default="{ row }">
            <el-select
              v-model="row.principalType"
              aria-label="主体类型"
              @change="handlePrincipalTypeChange(row)"
            >
              <el-option value="DEPT" label="部门" />
              <el-option value="ROLE" label="角色" />
            </el-select>
          </template>
        </el-table-column>
        <el-table-column label="授权主体" min-width="320">
          <template #default="{ row }">
            <div class="acl-principal-cell">
              <el-tree-select
                v-if="row.principalType === 'DEPT'"
                v-model="row.principalId"
                :data="departmentTree"
                :props="defaultProps"
                node-key="id"
                check-strictly
                clearable
                filterable
                aria-label="授权部门"
                placeholder="请选择部门"
                @change="row.invalidPrincipal = false"
              />
              <el-select
                v-else
                v-model="row.principalId"
                clearable
                filterable
                aria-label="授权角色"
                placeholder="请选择角色"
                @change="row.invalidPrincipal = false"
              >
                <el-option
                  v-for="role in roles"
                  :key="role.id"
                  :label="formatRoleLabel(role)"
                  :value="role.id"
                />
              </el-select>
              <p v-if="row.invalidPrincipal" class="acl-stale-warning">
                原授权主体已不存在，请重新选择或删除
              </p>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="含子部门" width="118" align="center">
          <template #default="{ row }">
            <el-switch
              v-if="row.principalType === 'DEPT'"
              v-model="row.includeChildDept"
              aria-label="包含下级部门"
            />
            <span v-else class="not-applicable">—</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="84" align="center">
          <template #default="{ $index }">
            <el-button
              v-hasPermi="['data-market:access-policy:update']"
              link
              type="danger"
              @click="removeRule($index)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-button
        v-hasPermi="['data-market:access-policy:update']"
        class="add-acl-button"
        @click="addRule"
      >
        <Icon icon="ep:plus" />新增 ACL
      </el-button>
    </template>

    <template #footer>
      <el-button @click="emit('update:modelValue', false)">取消</el-button>
      <el-button
        v-hasPermi="['data-market:access-policy:update']"
        type="primary"
        :loading="saving"
        :disabled="loading"
        @click="save"
      >
        保存 ACL
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import * as DeptApi from '@/api/system/dept'
import * as RoleApi from '@/api/system/role'
import * as IndicatorApi from '@/api/dataMarket/indicator'
import type { IndicatorAclRule } from '@/api/dataMarket/indicator'
import { useMessage } from '@/hooks/web/useMessage'
import { defaultProps, handleTree } from '@/utils/tree'

interface EditableIndicatorAclRule extends Omit<IndicatorAclRule, 'principalId'> {
  rowKey: number
  principalId?: number
  invalidPrincipal?: boolean
}

const props = defineProps<{
  modelValue: boolean
  indicatorId?: number
  indicatorName?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  saved: []
}>()

const message = useMessage()
const loading = ref(false)
const saving = ref(false)
const rules = ref<EditableIndicatorAclRule[]>([])
const departments = ref<DeptApi.DeptVO[]>([])
const roles = ref<RoleApi.RoleVO[]>([])
const originalRuleCount = ref(0)
let rowSequence = 0
let loadSequence = 0

const dialogTitle = computed(() =>
  props.indicatorName ? `指标 ACL · ${props.indicatorName}` : '指标 ACL'
)
const departmentTree = computed(() =>
  handleTree(departments.value.map((department) => ({ ...department })))
)
const formatRoleLabel = (role: Pick<RoleApi.RoleVO, 'name' | 'code'>) =>
  role.code ? `${role.name}（${role.code}）` : role.name

const reset = () => {
  loadSequence += 1
  loading.value = false
  saving.value = false
  rules.value = []
  originalRuleCount.value = 0
}

const load = async () => {
  if (!props.modelValue || !props.indicatorId) return
  const sequence = ++loadSequence
  loading.value = true
  rules.value = []
  try {
    const [aclRules, departmentOptions, roleOptions] = await Promise.all([
      IndicatorApi.getIndicatorAcl(props.indicatorId),
      DeptApi.getSimpleDeptList(),
      RoleApi.getSimpleRoleList()
    ])
    if (sequence !== loadSequence || !props.modelValue) return
    departments.value = departmentOptions || []
    roles.value = roleOptions || []
    originalRuleCount.value = (aclRules || []).length
    const departmentIds = new Set(departments.value.map((item) => item.id))
    const roleIds = new Set(roles.value.map((item) => item.id))
    rules.value = (aclRules || []).map((rule) => {
      const principalExists =
        rule.principalType === 'DEPT'
          ? departmentIds.has(rule.principalId)
          : roleIds.has(rule.principalId)
      return {
        ...rule,
        rowKey: ++rowSequence,
        principalId: principalExists ? rule.principalId : undefined,
        includeChildDept:
          rule.principalType === 'DEPT' ? Boolean(rule.includeChildDept) : false,
        invalidPrincipal: !principalExists
      }
    })
  } catch {
    if (sequence !== loadSequence) return
    emit('update:modelValue', false)
    message.error('ACL 配置加载失败，请重试')
  } finally {
    if (sequence === loadSequence) loading.value = false
  }
}

const addRule = () => {
  rules.value.push({
    rowKey: ++rowSequence,
    principalType: 'DEPT',
    principalId: undefined,
    includeChildDept: false
  })
}

const handlePrincipalTypeChange = (row: EditableIndicatorAclRule) => {
  row.principalId = undefined
  row.invalidPrincipal = false
  if (row.principalType === 'ROLE') row.includeChildDept = false
}

const removeRule = (index: number) => rules.value.splice(index, 1)

const save = async () => {
  if (!props.indicatorId || loading.value || saving.value) return
  if (rules.value.some((rule) => rule.principalId === undefined)) {
    message.warning('请选择授权部门或角色')
    return
  }
  const keys = rules.value.map((rule) => `${rule.principalType}:${rule.principalId}`)
  if (new Set(keys).size !== keys.length) {
    message.warning('同一部门或角色不能重复授权')
    return
  }
  const normalizedRules: IndicatorAclRule[] = rules.value.map((rule) => ({
    principalType: rule.principalType,
    principalId: rule.principalId!,
    includeChildDept: rule.principalType === 'DEPT' && Boolean(rule.includeChildDept)
  }))
  saving.value = true
  try {
    if (originalRuleCount.value > 0 && normalizedRules.length === 0) {
      await message.confirm(
        '清空全部 ACL 后，该指标将对当前租户内拥有指标浏览权限的用户开放。确认继续吗？'
      )
    }
    await IndicatorApi.updateIndicatorAcl(props.indicatorId, normalizedRules)
    message.success('ACL 已保存')
    emit('saved')
    emit('update:modelValue', false)
  } catch (error) {
    if (error !== 'cancel' && error !== 'close') message.error('ACL 保存失败，请重试')
  } finally {
    saving.value = false
  }
}

watch(
  () => [props.modelValue, props.indicatorId] as const,
  ([visible]) => {
    if (visible) void load()
    else reset()
  },
  { immediate: true }
)
</script>

<style scoped lang="scss">
.acl-open-alert {
  margin-bottom: 16px;
}

.acl-principal-cell {
  padding: 4px 0;
}

.acl-principal-cell :deep(.el-select),
.acl-principal-cell :deep(.el-tree-select) {
  width: 100%;
}

.acl-stale-warning {
  margin: 5px 0 0;
  color: var(--el-color-danger);
  font-size: 12px;
  line-height: 1.4;
}

.not-applicable {
  color: #a8b0bc;
}

.add-acl-button {
  margin-top: 14px;
}
</style>
