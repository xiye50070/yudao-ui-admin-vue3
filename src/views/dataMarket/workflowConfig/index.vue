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
      ><el-form-item label="流程定义 Key" prop="processDefinitionKey"
        ><el-input
          v-model="form.processDefinitionKey"
          placeholder="例如 data-market-renew" /></el-form-item
      ><el-form-item label="流程定义名称"
        ><el-input v-model="form.processDefinitionName" /></el-form-item
      ><el-form-item label="启用"><el-switch v-model="form.enabled" /></el-form-item
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
import * as WorkflowApi from '@/api/dataMarket/workflow'
import type { ApplicationType, WorkflowConfigVO } from '@/api/dataMarket/types'
import { APPLICATION_TYPE_OPTIONS } from '../shared'
import { useMessage } from '@/hooks/web/useMessage'
defineOptions({ name: 'DataMarketWorkflowConfig' })
const message = useMessage()
const applicationType = ref<ApplicationType>('CREATE')
const formRef = ref<any>()
const form = reactive<WorkflowConfigVO>({
  processDefinitionKey: '',
  processDefinitionName: '',
  enabled: true
})
const rules = {
  processDefinitionKey: [{ required: true, message: '请输入流程定义 Key', trigger: 'blur' }]
}
const currentLabel = computed(
  () => APPLICATION_TYPE_OPTIONS.find((item) => item.value === applicationType.value)?.label
)
const getConfig = async () => {
  Object.assign(form, await WorkflowApi.getWorkflowConfig(applicationType.value))
}
const save = async () => {
  if (!(await formRef.value.validate())) return
  await WorkflowApi.updateWorkflowConfig(applicationType.value, form)
  message.success('流程配置已保存')
}
onMounted(getConfig)
</script>
