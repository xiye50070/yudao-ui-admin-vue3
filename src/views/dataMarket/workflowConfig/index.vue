<template>
  <ContentWrap
    ><el-alert
      title="四类申请各自绑定 BPM 流程定义；保存仅配置映射，审批执行仍由 BPM 服务完成。"
      type="info"
      :closable="false"
  /></ContentWrap>
  <ContentWrap
    ><el-tabs v-model="applicationType" @tab-change="getConfig"
      ><el-tab-pane
        v-for="option in APPLICATION_TYPE_OPTIONS"
        :key="option.value"
        :label="option.label"
        :name="option.value" /></el-tabs
    ><el-form ref="formRef" :model="form" :rules="rules" label-width="130px" class="max-w-560px"
      ><el-form-item label="流程定义" prop="processDefinitionKey"
        ><el-select
          v-model="form.processDefinitionKey"
          :disabled="definitionLoading"
          :loading="definitionLoading"
          class="!w-1/1"
          filterable
          no-data-text="暂无可用流程定义"
          placeholder="请选择流程定义"
          @change="handleDefinitionChange"
        >
          <el-option
            v-if="missingSelectedDefinition"
            :label="missingSelectedDefinitionLabel"
            :value="form.processDefinitionKey"
            disabled
          />
          <el-option
            v-for="definition in processDefinitionOptions"
            :key="definition.key"
            :label="formatDefinitionLabel(definition)"
            :value="definition.key"
          /> </el-select></el-form-item
      ><el-form-item label="启用"
        ><el-switch
          v-model="form.status"
          :active-value="0"
          :inactive-value="1"
          active-text="启用"
          inactive-text="停用" /></el-form-item
      ><el-form-item
        ><el-button v-hasPermi="['data-market:workflow-config:update']" type="primary" @click="save"
          >保存 {{ currentLabel }} 流程</el-button
        ></el-form-item
      ></el-form
    ></ContentWrap
  >
</template>
<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import * as DefinitionApi from '@/api/bpm/definition'
import * as WorkflowApi from '@/api/dataMarket/workflow'
import type { ApplicationType, WorkflowConfigVO } from '@/api/dataMarket/types'
import { APPLICATION_TYPE_OPTIONS } from '../shared'
import { useMessage } from '@/hooks/web/useMessage'
defineOptions({ name: 'DataMarketWorkflowConfig' })
const message = useMessage()
const applicationType = ref<ApplicationType>('CREATE')
const formRef = ref<any>()
const definitionLoading = ref(false)
const processDefinitions = ref<DefinitionApi.SimpleProcessDefinitionVO[]>([])
const form = reactive<WorkflowConfigVO>({
  processDefinitionKey: '',
  processDefinitionName: '',
  status: 0
})
const rules = {
  processDefinitionKey: [{ required: true, message: '请选择流程定义', trigger: 'change' }]
}
const currentLabel = computed(
  () => APPLICATION_TYPE_OPTIONS.find((item) => item.value === applicationType.value)?.label
)
const processDefinitionOptions = computed(() => {
  const definitionsByKey = new Map<string, DefinitionApi.SimpleProcessDefinitionVO>()
  processDefinitions.value.forEach((definition) => {
    if (!definitionsByKey.has(definition.key)) definitionsByKey.set(definition.key, definition)
  })
  return Array.from(definitionsByKey.values())
})
const selectedDefinition = computed(() =>
  processDefinitionOptions.value.find((definition) => definition.key === form.processDefinitionKey)
)
const missingSelectedDefinition = computed(
  () => Boolean(form.processDefinitionKey) && !selectedDefinition.value
)
const missingSelectedDefinitionLabel = computed(() => {
  const name = form.processDefinitionName?.trim()
  const configuredDefinition = {
    key: form.processDefinitionKey,
    name: name || form.processDefinitionKey
  }
  return `${formatDefinitionLabel(configuredDefinition)} · 已停用或不可见`
})

const formatDefinitionLabel = (
  definition: Pick<DefinitionApi.SimpleProcessDefinitionVO, 'key' | 'name'>
) =>
  definition.name === definition.key ? definition.key : `${definition.name}（${definition.key}）`

const loadProcessDefinitions = async () => {
  definitionLoading.value = true
  try {
    processDefinitions.value = await DefinitionApi.getSimpleProcessDefinitionList()
  } catch {
    processDefinitions.value = []
    message.error('流程定义加载失败，请稍后重试')
  } finally {
    definitionLoading.value = false
  }
}
const getConfig = async () => {
  Object.assign(
    form,
    { processDefinitionKey: '', processDefinitionName: '', status: 0 },
    await WorkflowApi.getWorkflowConfig(applicationType.value)
  )
}
const handleDefinitionChange = (key: string) => {
  form.processDefinitionName = processDefinitionOptions.value.find(
    (definition) => definition.key === key
  )?.name
}
const save = async () => {
  if (!(await formRef.value.validate())) return
  await WorkflowApi.updateWorkflowConfig(applicationType.value, form)
  message.success('流程配置已保存')
}
onMounted(() => Promise.all([loadProcessDefinitions(), getConfig()]))
</script>
