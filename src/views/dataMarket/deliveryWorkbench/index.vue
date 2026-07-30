<template>
  <ContentWrap
    ><el-alert
      title="交付配置仅提交受保护引用与服务端凭证；页面不会展示、缓存或伪造密钥。每项操作均需后端状态校验。"
      type="warning"
      :closable="false"
  /></ContentWrap>
  <ContentWrap
    ><el-tabs v-model="tab"
      ><el-tab-pane label="创建 API" name="api"
        ><el-form :model="apiForm" label-width="100px" class="max-w-600px"
          ><el-form-item label="交付 ID"
            ><el-input-number v-model="deliveryId" :min="1" /></el-form-item
          ><el-form-item label="API 名称"><el-input v-model="apiForm.name" /></el-form-item
          ><el-form-item label="负责人 ID"
            ><el-input-number v-model="apiForm.ownerUserId" :min="1" /></el-form-item
          ><el-form-item label="说明"
            ><el-input v-model="apiForm.description" type="textarea" /></el-form-item
          ><el-button
            v-hasPermi="['data-market:delivery:api-create']"
            type="primary"
            @click="createApi"
            >创建 API</el-button
          ></el-form
        ></el-tab-pane
      ><el-tab-pane label="API 版本与运行绑定" name="version"
        ><el-form :model="versionForm" label-width="130px" class="max-w-600px"
          ><el-form-item label="API ID"><el-input-number v-model="apiId" :min="1" /></el-form-item
          ><el-form-item label="版本号"><el-input v-model="versionForm.versionNo" /></el-form-item
          ><el-form-item label="公开地址"
            ><el-input
              v-model="versionForm.publicBaseUrl"
              placeholder="https://api.example.com" /></el-form-item
          ><el-form-item label="请求路径"
            ><el-input v-model="versionForm.requestPath" /></el-form-item
          ><el-form-item label="OpenAPI 文档"
            ><el-input v-model="versionDocument" type="textarea" /></el-form-item
          ><el-button
            v-hasPermi="['data-market:delivery:api-version-create']"
            type="primary"
            @click="createVersion"
            >创建不可变版本</el-button
          ><el-divider /><el-form-item label="版本 ID"
            ><el-input-number v-model="apiVersionId" :min="1" /></el-form-item
          ><el-form-item label="环境"
            ><el-select v-model="environment"
              ><el-option label="开发" value="DEVELOPMENT" /><el-option
                label="测试"
                value="TEST" /><el-option
                label="生产"
                value="PRODUCTION" /></el-select></el-form-item
          ><el-form-item label="受保护上游引用"
            ><el-input
              v-model="binding.upstreamTargetRef"
              placeholder="secret://..." /></el-form-item
          ><el-form-item label="超时 ms"
            ><el-input-number v-model="binding.timeoutMs" :min="100" :max="30000" /></el-form-item
          ><el-form-item label="TLS 校验"><el-switch v-model="binding.tlsVerify" /></el-form-item
          ><el-button
            v-hasPermi="['data-market:delivery:runtime-binding-update']"
            type="primary"
            @click="saveBinding"
            >保存运行绑定</el-button
          ></el-form
        ></el-tab-pane
      ><el-tab-pane label="凭证与验收" name="credential"
        ><el-form :model="credential" label-width="120px" class="max-w-600px"
          ><el-form-item label="交付 ID"
            ><el-input-number v-model="credential.deliveryId" :min="1" /></el-form-item
          ><el-form-item label="API ID"
            ><el-input-number v-model="credential.apiId" :min="1" /></el-form-item
          ><el-form-item label="凭证名称"><el-input v-model="credential.name" /></el-form-item
          ><el-form-item label="App Key"><el-input v-model="credential.appKey" /></el-form-item
          ><el-form-item label="App Secret"
            ><el-input
              v-model="credential.appSecret"
              type="password"
              show-password
              autocomplete="new-password" /></el-form-item
          ><el-form-item label="授权版本 ID"
            ><el-input-number v-model="authorizationVersionId" :min="1" /></el-form-item
          ><el-button
            v-hasPermi="['data-market:delivery:credential-create']"
            type="primary"
            @click="createCredential"
            >配置凭证</el-button
          ><el-divider /><el-form-item label="阶段"
            ><el-select v-model="stage"
              ><el-option label="交付方案" value="DELIVERY_PLAN" /><el-option
                label="API 配置"
                value="API_CONFIG" /><el-option
                label="凭证配置"
                value="CREDENTIAL_CONFIG" /><el-option
                label="文档"
                value="DOCUMENTATION" /></el-select></el-form-item
          ><el-form-item label="完成说明"
            ><el-input v-model="taskDescription" type="textarea" /></el-form-item
          ><el-button v-hasPermi="['data-market:delivery:task-complete']" @click="completeTask"
            >完成阶段</el-button
          ><el-button
            v-hasPermi="['data-market:delivery:acceptance-submit']"
            type="success"
            @click="submitAcceptance"
            >提交统一验收</el-button
          ></el-form
        ></el-tab-pane
      ></el-tabs
    ></ContentWrap
  >
</template>
<script setup lang="ts">
import { reactive, ref } from 'vue'
import * as DeliveryApi from '@/api/dataMarket/delivery'
import { useMessage } from '@/hooks/web/useMessage'
defineOptions({ name: 'DataMarketDeliveryWorkbench' })
const message = useMessage()
const tab = ref('api')
const deliveryId = ref<number>()
const apiId = ref<number>()
const apiVersionId = ref<number>()
const authorizationVersionId = ref<number>()
const environment = ref<'DEVELOPMENT' | 'TEST' | 'PRODUCTION'>('TEST')
const stage = ref<'DELIVERY_PLAN' | 'API_CONFIG' | 'CREDENTIAL_CONFIG' | 'DOCUMENTATION'>(
  'DELIVERY_PLAN'
)
const taskDescription = ref('')
const versionDocument = ref('{}')
const apiForm = reactive({
  name: '',
  ownerUserId: undefined as number | undefined,
  description: ''
})
const versionForm = reactive({
  versionNo: 'v1',
  method: 'GET' as const,
  publicBaseUrl: '',
  requestPath: '/',
  authType: 'APP_KEY_SECRET' as const,
  contentType: 'application/json',
  rateLimitPolicy: {},
  networkPolicy: {},
  requestDescription: '',
  responseDescription: '',
  successDescription: '',
  failureDescription: '',
  lineage: [{ sourceType: 'DATASET' as const, sourceId: 1, role: 'PRIMARY' as const }]
})
const binding = reactive({
  upstreamTargetRef: '',
  timeoutMs: 10000,
  tlsVerify: true,
  debugEnabled: false,
  status: 'ENABLED' as const
})
const credential = reactive({
  deliveryId: undefined as number | undefined,
  apiId: undefined as number | undefined,
  name: '',
  authType: 'APP_KEY_SECRET' as const,
  appKey: '',
  appSecret: ''
})
const requireId = (id: number | undefined, label: string) =>
  id || (message.warning(`请填写${label}`), undefined)
const createApi = async () => {
  const id = requireId(deliveryId.value, '交付 ID')
  if (!id || !apiForm.name || !apiForm.ownerUserId) return message.warning('请完整填写 API 信息')
  await DeliveryApi.createDeliveredApi(
    id,
    apiForm as { name: string; ownerUserId: number; description?: string }
  )
  message.success('API 已创建')
}
const createVersion = async () => {
  const id = requireId(apiId.value, 'API ID')
  if (!id) return
  try {
    const openapiDocument = JSON.parse(versionDocument.value)
    await DeliveryApi.createApiVersion(id, { ...versionForm, openapiDocument })
    message.success('不可变版本已创建')
  } catch {
    message.error('OpenAPI 文档必须是合法 JSON')
  }
}
const saveBinding = async () => {
  const id = requireId(apiVersionId.value, '版本 ID')
  if (!id || !binding.upstreamTargetRef) return message.warning('请填写受保护上游引用')
  await DeliveryApi.updateRuntimeBinding(id, environment.value, binding)
  message.success('运行绑定已保存')
}
const createCredential = async () => {
  if (
    !credential.deliveryId ||
    !credential.apiId ||
    !credential.name ||
    !credential.appKey ||
    !credential.appSecret ||
    !authorizationVersionId.value
  )
    return message.warning('请完整填写凭证及授权版本')
  try {
    await DeliveryApi.createCredential({
      ...credential,
      deliveryId: credential.deliveryId,
      apiId: credential.apiId,
      authorizations: [{ apiVersionId: authorizationVersionId.value, status: 'ACTIVE' }]
    })
    message.success('凭证已提交配置')
  } finally {
    credential.appSecret = ''
  }
}
const completeTask = async () => {
  const id = requireId(deliveryId.value, '交付 ID')
  if (!id || !taskDescription.value) return message.warning('请填写阶段完成说明')
  await DeliveryApi.completeDeliveryTask(id, stage.value, { description: taskDescription.value })
  message.success('阶段已完成')
}
const submitAcceptance = async () => {
  const id = requireId(deliveryId.value, '交付 ID')
  if (!id) return
  await message.confirm('确认提交整包 API 进入统一验收吗？')
  await DeliveryApi.submitDeliveryAcceptance(id, taskDescription.value)
  message.success('已提交统一验收')
}
</script>
