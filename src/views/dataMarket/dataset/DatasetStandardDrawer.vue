<template>
  <el-drawer v-model="visible" :title="`${datasetName || '数据集'} · 数据标准`" size="880px">
    <div class="standard-drawer__intro">
      <div>
        <div class="standard-drawer__title">字段标准配置</div>
        <div class="standard-drawer__description">
          一个字段最多绑定一项标准；共享标准修改后，所有引用字段会同步生效。
        </div>
      </div>
      <el-tag effect="plain">{{ fields.length }} 个字段</el-tag>
    </div>

    <el-input
      v-model="fieldKeyword"
      clearable
      class="mb-16px"
      placeholder="搜索字段名称、编码或当前标准"
      prefix-icon="Search"
    />

    <el-table v-loading="loading" :data="filteredFields" border>
      <el-table-column label="字段" min-width="180">
        <template #default="{ row }">
          <div class="standard-drawer__field-name">{{ row.fieldName }}</div>
          <div class="standard-drawer__field-code">{{ row.fieldCode }} · {{ row.dataType }}</div>
        </template>
      </el-table-column>
      <el-table-column label="当前标准" min-width="260">
        <template #default="{ row }">
          <template v-if="row.standard">
            <div class="standard-drawer__standard-line">
              <el-tag size="small" :type="standardTagType(row.standard.standardType)">
                {{ standardTypeLabel(row.standard.standardType) }}
              </el-tag>
              <span>{{ row.standard.standardName }}</span>
              <span class="standard-drawer__field-code">{{ row.standard.standardCode }}</span>
            </div>
            <div class="standard-drawer__summary">{{ row.standard.summary }}</div>
          </template>
          <span v-else class="standard-drawer__empty">—</span>
        </template>
      </el-table-column>
      <el-table-column label="配置" min-width="320">
        <template #default="{ row }">
          <div class="standard-drawer__actions">
            <el-select
              v-hasPermi="['data-market:data-standard:bind']"
              :model-value="row.standard?.id"
              class="standard-drawer__select"
              filterable
              clearable
              placeholder="选择已有标准"
              @change="bindExisting(row, $event)"
            >
              <el-option
                v-for="standard in standardOptions"
                :key="standard.id"
                :label="`${standard.standardName}（${standard.standardCode}）`"
                :value="standard.id"
              >
                <div class="standard-drawer__option">
                  <span>{{ standard.standardName }}</span>
                  <el-tag size="small" effect="plain">
                    {{ standardTypeLabel(standard.standardType) }}
                  </el-tag>
                </div>
              </el-option>
            </el-select>
            <el-button
              v-hasPermi="['data-market:data-standard:create']"
              link
              type="primary"
              @click="openCreate(row)"
            >
              新建并绑定
            </el-button>
            <el-button
              v-if="row.standard"
              v-hasPermi="['data-market:data-standard:update']"
              link
              type="primary"
              @click="openEdit(row.standard.id)"
            >
              编辑共享标准
            </el-button>
            <el-button
              v-if="row.standard"
              v-hasPermi="['data-market:data-standard:bind']"
              link
              type="danger"
              @click="unbind(row)"
            >
              解除绑定
            </el-button>
          </div>
        </template>
      </el-table-column>
    </el-table>

    <el-empty
      v-if="!loading && !filteredFields.length"
      :description="fields.length ? '没有匹配的字段' : '该数据集还没有字段'"
    />
  </el-drawer>

  <DataStandardEditorDialog
    v-model="editorVisible"
    :standard="editingStandard"
    :submitting="submitting"
    @submit="saveStandard"
  />
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import * as CatalogApi from '@/api/dataMarket/catalog'
import type {
  DataStandardDetail,
  DataStandardSaveReq,
  DataStandardSummary,
  DataStandardType,
  DatasetFieldVO
} from '@/api/dataMarket/types'
import DataStandardEditorDialog from './DataStandardEditorDialog.vue'
import { useMessage } from '@/hooks/web/useMessage'

const props = defineProps<{
  modelValue: boolean
  datasetId?: number
  datasetName?: string
}>()

const emit = defineEmits<{
  (event: 'update:modelValue', value: boolean): void
}>()

const message = useMessage()
const loading = ref(false)
const submitting = ref(false)
const fields = ref<DatasetFieldVO[]>([])
const standardOptions = ref<DataStandardSummary[]>([])
const fieldKeyword = ref('')
const editorVisible = ref(false)
const editingStandard = ref<DataStandardDetail>()
const targetFieldId = ref<number>()

const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const filteredFields = computed(() => {
  const keyword = fieldKeyword.value.trim().toLowerCase()
  if (!keyword) return fields.value
  return fields.value.filter((field) =>
    [
      field.fieldName,
      field.fieldCode,
      field.standard?.standardName,
      field.standard?.standardCode
    ].some((value) => value?.toLowerCase().includes(keyword))
  )
})

const standardTypeLabel = (type: DataStandardType) =>
  ({ ENUM: '枚举值', RANGE: '区间值', CODING: '编码规范' })[type]

const standardTagType = (type: DataStandardType) =>
  ({ ENUM: 'primary', RANGE: 'success', CODING: 'warning' })[type] as
    | 'primary'
    | 'success'
    | 'warning'

const loadAllStandards = async () => {
  const pageSize = 100
  const first = await CatalogApi.getDataStandardPage({ pageNo: 1, pageSize })
  const result = [...first.list]
  for (let pageNo = 2; result.length < first.total; pageNo += 1) {
    const next = await CatalogApi.getDataStandardPage({ pageNo, pageSize })
    if (!next.list.length) break
    result.push(...next.list)
  }
  standardOptions.value = result
}

const loadData = async () => {
  if (!props.datasetId) return
  loading.value = true
  try {
    const [datasetFields] = await Promise.all([
      CatalogApi.getDatasetFields(props.datasetId),
      loadAllStandards()
    ])
    fields.value = datasetFields
  } catch {
    message.error('数据标准配置加载失败，请重试')
  } finally {
    loading.value = false
  }
}

watch(
  () => [props.modelValue, props.datasetId] as const,
  ([opened]) => {
    if (!opened) return
    fieldKeyword.value = ''
    loadData()
  }
)

const bindExisting = async (field: DatasetFieldVO, standardId: number | undefined) => {
  if (!props.datasetId || !field.id) return
  if (!standardId) return unbind(field)
  try {
    await CatalogApi.bindDatasetFieldStandard(props.datasetId, field.id, standardId)
    message.success('数据标准已绑定')
    await loadData()
  } catch {
    message.error('绑定失败，请重试')
  }
}

const openCreate = (field: DatasetFieldVO) => {
  if (!field.id) return
  targetFieldId.value = field.id
  editingStandard.value = undefined
  editorVisible.value = true
}

const openEdit = async (standardId: number) => {
  try {
    targetFieldId.value = undefined
    editingStandard.value = await CatalogApi.getDataStandard(standardId)
    editorVisible.value = true
  } catch {
    message.error('标准详情加载失败，请重试')
  }
}

const isVersionConflict = (error: unknown) => {
  const value = error as { code?: number; response?: { status?: number } }
  return value?.code === 1_012_000_055 || value?.response?.status === 409
}

const reloadEditingStandard = async () => {
  if (!editingStandard.value) return
  editingStandard.value = await CatalogApi.getDataStandard(editingStandard.value.id)
}

const saveStandard = async (data: DataStandardSaveReq) => {
  submitting.value = true
  try {
    if (editingStandard.value) {
      try {
        await CatalogApi.updateDataStandard(
          editingStandard.value.id,
          editingStandard.value.lockVersion,
          data
        )
      } catch (error) {
        if (!isVersionConflict(error)) {
          message.error('标准保存失败，请重试')
          return
        }
        await reloadEditingStandard()
        message.warning('标准已被其他用户修改，已重新加载最新内容，请核对后再保存')
        return
      }
      editorVisible.value = false
      message.success('共享标准已更新，所有引用字段已同步生效')
      await loadData()
      return
    }

    const standardId = await CatalogApi.createDataStandard(data)
    editorVisible.value = false
    await loadAllStandards()
    if (!props.datasetId || !targetFieldId.value) {
      message.success('数据标准已创建')
      return
    }
    try {
      await CatalogApi.bindDatasetFieldStandard(props.datasetId, targetFieldId.value, standardId)
    } catch {
      message.warning('标准已创建，但绑定失败，请重试绑定')
      await loadData()
      return
    }
    message.success('数据标准已创建并绑定')
    await loadData()
  } finally {
    submitting.value = false
  }
}

const unbind = async (field: DatasetFieldVO) => {
  if (!props.datasetId || !field.id || !field.standard) return
  try {
    await message.confirm(
      `确认解除字段“${field.fieldName}”与标准“${field.standard.standardName}”的绑定吗？`
    )
    await CatalogApi.unbindDatasetFieldStandard(props.datasetId, field.id)
    message.success('已解除绑定，标准仍保留在标准库中')
    await loadData()
  } catch (error) {
    if (error !== 'cancel' && error !== 'close') message.error('解除绑定失败，请重试')
  }
}
</script>

<style scoped>
.standard-drawer__intro {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 16px;
  margin-bottom: 16px;
  background: var(--el-fill-color-light);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
}

.standard-drawer__title,
.standard-drawer__field-name {
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.standard-drawer__description,
.standard-drawer__field-code,
.standard-drawer__summary,
.standard-drawer__empty {
  margin-top: 4px;
  font-size: 12px;
  line-height: 1.5;
  color: var(--el-text-color-secondary);
}

.standard-drawer__standard-line,
.standard-drawer__option,
.standard-drawer__actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.standard-drawer__option {
  justify-content: space-between;
  width: 100%;
}

.standard-drawer__select {
  width: 100%;
}
</style>
