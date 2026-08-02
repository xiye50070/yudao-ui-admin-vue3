<template>
  <div class="user-department-select">
    <DepartmentCascader
      v-model="lookupDeptId"
      :departments="departments"
      :disabled="disabled"
      data-test="lookup-dept"
      placeholder="按部门筛选负责人"
    />
    <el-select
      v-model="value"
      :disabled="disabled"
      :filter-method="handleFilter"
      clearable
      filterable
      no-data-text="当前范围内暂无可选负责人"
      placeholder="请选择负责人"
      class="!w-1/1"
    >
      <el-option v-if="missingSelected" :value="modelValue" label="已停用或不可见" disabled />
      <el-option
        v-for="user in candidates"
        :key="user.id"
        :label="getUserLabel(user)"
        :value="user.id"
      >
        <div class="user-option">
          <span>{{ user.nickname || user.username }}</span>
          <span v-if="user.username" class="user-option__account">{{ user.username }}</span>
          <el-tag v-if="user.deptName" size="small" type="info">{{ user.deptName }}</el-tag>
        </div>
      </el-option>
    </el-select>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { DeptVO } from '@/api/system/dept'
import type { UserVO } from '@/api/system/user'
import { filterOwnerUsers } from '@/views/dataMarket/referenceSelectors'
import DepartmentCascader from './DepartmentCascader.vue'

defineOptions({ name: 'DataMarketUserDepartmentSelect' })

const props = withDefaults(
  defineProps<{
    modelValue?: number
    departments: DeptVO[]
    users: UserVO[]
    disabled?: boolean
  }>(),
  {
    disabled: false
  }
)

const emit = defineEmits<{
  'update:modelValue': [value: number | undefined]
}>()

const lookupDeptId = ref<number>()
const keyword = ref('')
const value = computed({
  get: () => props.modelValue,
  set: (next) => emit('update:modelValue', next)
})
const candidates = computed(() =>
  filterOwnerUsers(props.users, props.departments, {
    deptId: lookupDeptId.value,
    keyword: keyword.value,
    selectedUserId: props.modelValue
  })
)
const missingSelected = computed(
  () => props.modelValue !== undefined && !props.users.some((user) => user.id === props.modelValue)
)

const handleFilter = (query: string) => {
  keyword.value = query
}

const getUserLabel = (user: UserVO) => {
  const name = user.nickname || user.username
  return user.username && user.username !== name ? `${name}（${user.username}）` : name
}
</script>

<style scoped>
.user-department-select {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 8px;
  width: 100%;
}

.user-option {
  display: flex;
  gap: 8px;
  align-items: center;
}

.user-option__account {
  color: var(--el-text-color-secondary);
}
</style>
