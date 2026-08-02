<template>
  <el-select
    v-model="value"
    :disabled="disabled"
    :loading="loading"
    :remote-method="handleSearch"
    clearable
    filterable
    remote
    remote-show-suffix
    placeholder="请选择来源系统"
    class="!w-1/1"
    @visible-change="handleVisibleChange"
  >
    <el-option
      v-for="option in visibleOptions"
      :key="option.id"
      :disabled="option.status !== undefined && option.status !== 0"
      :label="formatSourceSystemLabel(option)"
      :value="option.id"
    />
  </el-select>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {
  formatSourceSystemLabel,
  type SourceSystemOption
} from '@/views/dataMarket/referenceSelectors'

defineOptions({ name: 'DataMarketSourceSystemSelect' })

const props = withDefaults(
  defineProps<{
    modelValue?: number
    options: SourceSystemOption[]
    loading?: boolean
    disabled?: boolean
  }>(),
  {
    loading: false,
    disabled: false
  }
)

const emit = defineEmits<{
  'update:modelValue': [value: number | undefined]
  search: [query: string]
}>()

const value = computed({
  get: () => props.modelValue,
  set: (next) => emit('update:modelValue', next)
})
const visibleOptions = computed<SourceSystemOption[]>(() => {
  if (
    props.modelValue === undefined ||
    props.options.some((option) => option.id === props.modelValue)
  ) {
    return props.options
  }
  return [{ id: props.modelValue, name: '已停用或不可见', status: 1 }, ...props.options]
})

const handleSearch = (query: string) => emit('search', query)
const handleVisibleChange = (visible: boolean) => {
  if (visible) emit('search', '')
}
</script>
