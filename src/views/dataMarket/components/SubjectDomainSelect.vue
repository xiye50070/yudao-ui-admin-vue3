<template>
  <el-tree-select
    v-model="value"
    :data="data"
    :props="treeProps"
    :disabled="disabled"
    :placeholder="placeholder"
    check-strictly
    clearable
    default-expand-all
    filterable
    node-key="id"
    class="!w-1/1"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { SubjectDomainVO } from '@/api/dataMarket/types'
import {
  buildReferenceTree,
  buildSubjectDomainParentTree,
  ensureSelectedReferenceNode
} from '@/views/dataMarket/referenceSelectors'

defineOptions({ name: 'DataMarketSubjectDomainSelect' })

const props = withDefaults(
  defineProps<{
    modelValue?: number
    domains: SubjectDomainVO[]
    allowTopLevel?: boolean
    excludeBranchId?: number
    disabled?: boolean
    placeholder?: string
  }>(),
  {
    allowTopLevel: false,
    disabled: false,
    placeholder: '请选择主题域'
  }
)

const emit = defineEmits<{
  'update:modelValue': [value: number | undefined]
}>()

const value = computed({
  get: () => props.modelValue,
  set: (next) => emit('update:modelValue', next)
})

const data = computed(() =>
  ensureSelectedReferenceNode(
    props.allowTopLevel
      ? buildSubjectDomainParentTree(props.domains, props.excludeBranchId)
      : buildReferenceTree(props.domains),
    props.modelValue
  )
)

const treeProps = {
  value: 'id',
  label: 'name',
  children: 'children',
  disabled: 'disabled'
}
</script>
