<template>
  <el-cascader
    v-model="value"
    :disabled="disabled"
    :options="options"
    :placeholder="placeholder"
    :props="cascaderProps"
    clearable
    filterable
    class="!w-1/1"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { DeptVO } from '@/api/system/dept'
import {
  buildReferenceTree,
  ensureSelectedReferenceNode
} from '@/views/dataMarket/referenceSelectors'

defineOptions({ name: 'DataMarketDepartmentCascader' })

const props = withDefaults(
  defineProps<{
    modelValue?: number
    departments: DeptVO[]
    disabled?: boolean
    placeholder?: string
  }>(),
  {
    disabled: false,
    placeholder: '请选择部门'
  }
)

const emit = defineEmits<{
  'update:modelValue': [value: number | undefined]
}>()

const value = computed({
  get: () => props.modelValue,
  set: (next) => emit('update:modelValue', next)
})

const options = computed(() =>
  ensureSelectedReferenceNode(buildReferenceTree(props.departments), props.modelValue)
)

const cascaderProps = {
  value: 'id',
  label: 'name',
  children: 'children',
  disabled: 'disabled',
  emitPath: false,
  checkStrictly: true
} as const
</script>
