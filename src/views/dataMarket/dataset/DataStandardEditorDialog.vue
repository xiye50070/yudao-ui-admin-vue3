<template>
  <Dialog v-model="visible" :title="standard ? '编辑共享标准' : '新建数据标准'" width="760px">
    <el-alert
      v-if="standard"
      type="warning"
      :closable="false"
      class="mb-16px"
      :title="`该标准当前关联 ${standard.associatedDatasetCount} 张数据表、${standard.associatedFieldCount} 个字段，保存后所有引用字段将同步更新。`"
    />

    <el-form label-width="104px" @submit.prevent>
      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="标准编码" required>
            <el-input
              v-model="draft.standardCode"
              maxlength="64"
              placeholder="例如 EMPLOYEE_STATUS"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="标准名称" required>
            <el-input v-model="draft.standardName" maxlength="128" placeholder="例如 员工状态" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-form-item label="标准类型" required>
        <el-radio-group v-model="draft.standardType" @change="changeType">
          <el-radio-button value="ENUM">枚举值</el-radio-button>
          <el-radio-button value="RANGE">区间值</el-radio-button>
          <el-radio-button value="CODING">编码规范</el-radio-button>
        </el-radio-group>
      </el-form-item>

      <el-form-item label="标准说明">
        <el-input
          v-model="draft.description"
          type="textarea"
          :rows="2"
          maxlength="500"
          show-word-limit
          placeholder="说明该标准的业务用途和适用范围"
        />
      </el-form-item>

      <template v-if="draft.standardType === 'ENUM'">
        <el-divider content-position="left">枚举值与说明</el-divider>
        <el-table :data="draft.content.items" border>
          <el-table-column label="枚举值" min-width="180">
            <template #default="{ row }">
              <el-input v-model="row.value" placeholder="例如 1" />
            </template>
          </el-table-column>
          <el-table-column label="枚举值说明" min-width="260">
            <template #default="{ row }">
              <el-input v-model="row.description" placeholder="例如 在职" />
            </template>
          </el-table-column>
          <el-table-column label="操作" width="76" align="center">
            <template #default="{ $index }">
              <el-button
                link
                type="danger"
                :disabled="(draft.content.items?.length || 0) <= 1"
                @click="removeEnumItem($index)"
              >
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>
        <el-button class="mt-12px" plain @click="addEnumItem">
          <Icon icon="ep:plus" class="mr-5px" />新增枚举值
        </el-button>
      </template>

      <template v-else-if="draft.standardType === 'RANGE'">
        <el-divider content-position="left">区间范围</el-divider>
        <el-form-item label="值类型" required>
          <el-select v-model="draft.content.valueType" class="!w-220px">
            <el-option label="数值" value="NUMBER" />
            <el-option label="日期" value="DATE" />
            <el-option label="日期时间" value="DATETIME" />
          </el-select>
        </el-form-item>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="下界" required>
              <el-input
                v-if="draft.content.valueType === 'NUMBER'"
                v-model="draft.content.lowerBound"
                placeholder="例如 18"
              />
              <el-date-picker
                v-else
                v-model="draft.content.lowerBound"
                class="!w-1/1"
                :type="draft.content.valueType === 'DATE' ? 'date' : 'datetime'"
                :value-format="
                  draft.content.valueType === 'DATE' ? 'YYYY-MM-DD' : 'YYYY-MM-DDTHH:mm:ss'
                "
                placeholder="选择下界"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="上界" required>
              <el-input
                v-if="draft.content.valueType === 'NUMBER'"
                v-model="draft.content.upperBound"
                placeholder="例如 65"
              />
              <el-date-picker
                v-else
                v-model="draft.content.upperBound"
                class="!w-1/1"
                :type="draft.content.valueType === 'DATE' ? 'date' : 'datetime'"
                :value-format="
                  draft.content.valueType === 'DATE' ? 'YYYY-MM-DD' : 'YYYY-MM-DDTHH:mm:ss'
                "
                placeholder="选择上界"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="8">
            <el-form-item label="包含下界">
              <el-switch v-model="draft.content.lowerInclusive" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="包含上界">
              <el-switch v-model="draft.content.upperInclusive" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="单位">
              <el-input v-model="draft.content.unit" placeholder="例如 岁" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="区间说明">
          <el-input
            v-model="draft.content.rangeDescription"
            type="textarea"
            :rows="2"
            placeholder="说明上下界的业务含义"
          />
        </el-form-item>
      </template>

      <template v-else>
        <el-divider content-position="left">编码规则</el-divider>
        <el-form-item label="格式表达式" required>
          <el-input v-model="draft.content.formatExpression" placeholder="例如 ^EMP-[0-9]{6}$" />
        </el-form-item>
        <el-form-item label="示例">
          <el-input v-model="draft.content.example" placeholder="例如 EMP-000001" />
        </el-form-item>
        <el-form-item label="规则说明" required>
          <el-input
            v-model="draft.content.ruleDescription"
            type="textarea"
            :rows="3"
            placeholder="例如 EMP- 前缀加六位数字"
          />
        </el-form-item>
      </template>
    </el-form>

    <template #footer>
      <el-button :disabled="submitting" @click="visible = false">取消</el-button>
      <el-button type="primary" :loading="submitting" @click="submit">保存</el-button>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type {
  DataStandardDetail,
  DataStandardSaveReq,
  DataStandardType
} from '@/api/dataMarket/types'
import {
  createEmptyStandardDraft,
  resetStandardContent,
  validateStandardDraft
} from './standardContracts'
import { useMessage } from '@/hooks/web/useMessage'

const props = defineProps<{
  modelValue: boolean
  standard?: DataStandardDetail
  submitting?: boolean
}>()

const emit = defineEmits<{
  (event: 'update:modelValue', value: boolean): void
  (event: 'submit', value: DataStandardSaveReq): void
}>()

const message = useMessage()
const draft = ref<DataStandardSaveReq>(createEmptyStandardDraft())
const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value))

watch(
  () => [props.modelValue, props.standard] as const,
  ([opened, standard]) => {
    if (!opened) return
    draft.value = standard
      ? {
          standardCode: standard.standardCode,
          standardName: standard.standardName,
          standardType: standard.standardType,
          description: standard.description || '',
          content: clone(standard.content)
        }
      : createEmptyStandardDraft()
  },
  { immediate: true }
)

const changeType = (type: string | number | boolean | undefined) =>
  resetStandardContent(draft.value, type as DataStandardType)

const addEnumItem = () => {
  if (!draft.value.content.items) draft.value.content.items = []
  draft.value.content.items.push({ value: '', description: '' })
}

const removeEnumItem = (index: number) => draft.value.content.items?.splice(index, 1)

const submit = () => {
  const error = validateStandardDraft(draft.value)
  if (error) return message.warning(error)
  emit('submit', clone(draft.value))
}
</script>
