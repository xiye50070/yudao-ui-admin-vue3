<template>
  <ContentWrap
    ><el-alert
      title="交付配置仅提交受保护引用与服务端凭证；页面不会展示、缓存或伪造密钥。每项操作均需后端状态校验。"
      type="warning"
      :closable="false"
  /></ContentWrap>
  <ContentWrap v-if="pageState === 'LOADING'" v-loading="true" class="min-h-180px" />
  <ContentWrap v-else-if="pageState === 'ERROR'"
    ><el-result icon="error" title="交付配置无法加载" :sub-title="pageError"
      ><template #extra
        ><el-button type="primary" @click="loadWorkbench">重试</el-button></template
      ></el-result
    ></ContentWrap
  >
  <ContentWrap v-else-if="pageState === 'WAIT_APPROVAL'"
    ><el-result
      icon="info"
      title="审批流程尚未完成"
      sub-title="只有整条审批流程完全通过后，具备交付创建权限的用户才能创建交付方案。"
      ><template #extra><el-tag>{{ application?.status }}</el-tag></template></el-result
  ></ContentWrap>
  <ContentWrap v-else-if="pageState === 'CREATE_PLAN'" v-loading="referenceLoading"
    ><el-alert
      title="当前申请尚未创建交付方案。请确认负责人和方案说明后进入 API 配置。"
      type="info"
      :closable="false"
      class="mb-16px"
    />
    <el-descriptions v-if="application" title="申请信息" :column="3" border class="mb-16px"
      ><el-descriptions-item label="申请单号">{{ application.applicationNo }}</el-descriptions-item
      ><el-descriptions-item label="申请名称">{{ application.name }}</el-descriptions-item
      ><el-descriptions-item label="申请状态">{{ application.status }}</el-descriptions-item
      ></el-descriptions
    >
    <el-form
      ref="deliveryPlanFormRef"
      data-testid="delivery-plan-form"
      :model="deliveryPlanForm"
      :rules="deliveryPlanRules"
      label-width="110px"
      class="max-w-760px"
    >
      <el-form-item label="方案说明" prop="planDescription"
        ><el-input
          v-model="deliveryPlanForm.planDescription"
          type="textarea"
          :rows="4"
          placeholder="说明 API 拆分、加工结果与交付安排"
      /></el-form-item>
      <el-form-item label="交付负责人" prop="ownerUserId"
        ><UserDepartmentSelect
          v-model="deliveryPlanForm.ownerUserId"
          :departments="departments"
          :users="users"
          :disabled="!referencesReady"
      /></el-form-item>
      <el-form-item
        ><el-button
          v-hasPermi="['data-market:delivery:create']"
          type="primary"
          :loading="createPlanLoading"
          @click="createDeliveryPlan"
          >创建交付方案并进入配置</el-button
        ></el-form-item
      >
    </el-form></ContentWrap
  >
  <ContentWrap v-else-if="pageState === 'CONFIGURE'"
    ><el-alert
      v-if="workbench"
      :title="`已恢复交付 ${workbench.deliveryNo}（${workbench.status}），${workbench.apis.length} 个 API`"
      type="success"
      :closable="false"
      class="mb-12px"
    />
    <el-table v-if="workbench" :data="workbench.apis" size="small"
      ><el-table-column prop="apiNo" label="API 编号" /><el-table-column
        prop="name"
        label="API 名称"
      /><el-table-column prop="status" label="状态" /><el-table-column label="版本数" width="90"
        ><template #default="{ row }">{{ row.versions.length }}</template></el-table-column
      ><el-table-column label="凭证数" width="90"
        ><template #default="{ row }">{{ row.credentials.length }}</template></el-table-column
      ></el-table
    ></ContentWrap
  >
  <ContentWrap v-if="pageState === 'CONFIGURE'"
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
          ><el-button v-hasPermi="['data-market:api:create']" type="primary" @click="createApi"
            >创建 API</el-button
          ></el-form
        ></el-tab-pane
      ><el-tab-pane label="API 版本与运行绑定" name="version"
        ><el-form :model="versionForm" label-width="130px" class="max-w-600px"
          ><el-form-item label="API ID"><el-input-number v-model="apiId" :min="1" /></el-form-item
          ><el-form-item label="版本号"><el-input v-model="versionForm.versionNo" /></el-form-item
          ><el-form-item label="请求方法"
            ><el-select v-model="versionForm.method"
              ><el-option label="GET" value="GET" /><el-option
                label="POST"
                value="POST" /><el-option label="PUT" value="PUT" /><el-option
                label="PATCH"
                value="PATCH" /><el-option
                label="DELETE"
                value="DELETE" /></el-select></el-form-item
          ><el-form-item label="公开地址"
            ><el-input
              v-model="versionForm.publicBaseUrl"
              placeholder="https://api.example.com" /></el-form-item
          ><el-form-item label="请求路径"
            ><el-input v-model="versionForm.requestPath" /></el-form-item
          ><el-form-item label="认证方式"
            ><el-select v-model="versionForm.authType"
              ><el-option label="App Key / Secret" value="APP_KEY_SECRET" /><el-option
                label="API Key"
                value="API_KEY" /><el-option
                label="Bearer"
                value="BEARER" /></el-select></el-form-item
          ><el-form-item label="内容类型"
            ><el-input
              v-model="versionForm.contentType"
              placeholder="application/json" /></el-form-item
          ><el-form-item label="请求说明"
            ><el-input v-model="versionForm.requestDescription" type="textarea" /></el-form-item
          ><el-form-item label="响应说明"
            ><el-input v-model="versionForm.responseDescription" type="textarea" /></el-form-item
          ><el-form-item label="成功说明"
            ><el-input v-model="versionForm.successDescription" type="textarea" /></el-form-item
          ><el-form-item label="失败说明"
            ><el-input v-model="versionForm.failureDescription" type="textarea" /></el-form-item
          ><el-form-item label="限流策略 JSON"
            ><el-input v-model="rateLimitPolicyDocument" type="textarea" /></el-form-item
          ><el-form-item label="网络策略 JSON"
            ><el-input v-model="networkPolicyDocument" type="textarea" /></el-form-item
          ><el-form-item label="血缘类型"
            ><el-select v-model="lineageSourceType"
              ><el-option label="数据集" value="DATASET" /><el-option
                label="加工项"
                value="PROCESSING_ITEM" /></el-select></el-form-item
          ><el-form-item label="血缘来源 ID"
            ><el-input-number v-model="lineageSourceId" :min="1" /></el-form-item
          ><el-form-item label="血缘角色"
            ><el-select v-model="lineageRole"
              ><el-option label="主来源" value="PRIMARY" /><el-option
                label="输入"
                value="INPUT" /><el-option label="查询" value="LOOKUP" /><el-option
                label="派生"
                value="DERIVED" /></el-select></el-form-item
          ><el-form-item label="血缘操作"
            ><el-button @click="addLineage">添加血缘</el-button></el-form-item
          ><el-form-item label="已选血缘"
            ><el-table :data="lineages" size="small" class="!w-100%"
              ><el-table-column prop="sourceType" label="类型" /><el-table-column
                prop="sourceId"
                label="来源 ID"
              /><el-table-column prop="role" label="角色" /><el-table-column label="操作" width="80"
                ><template #default="{ $index }"
                  ><el-button link type="danger" @click="lineages.splice($index, 1)"
                    >删除</el-button
                  ></template
                ></el-table-column
              ></el-table
            ></el-form-item
          ><el-form-item label="OpenAPI 文档"
            ><el-input v-model="versionDocument" type="textarea" /></el-form-item
          ><el-alert
            v-if="versionError"
            :title="versionError"
            type="error"
            :closable="false"
            class="mb-12px"
          />
          ><el-button
            v-hasPermi="['data-market:api:version:create']"
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
            v-hasPermi="['data-market:api:runtime:update']"
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
          ><el-form-item label="授权版本 ID"
            ><el-input-number v-model="authorizationVersionId" :min="1" /></el-form-item
          ><el-button
            v-hasPermi="['data-market:credential:create']"
            type="primary"
            @click="openSecretDialog"
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
          ><el-button v-hasPermi="['data-market:delivery:task:complete']" @click="completeTask"
            >完成阶段</el-button
          ><el-button
            v-hasPermi="['data-market:acceptance:submit']"
            type="success"
            @click="submitAcceptance"
            >提交统一验收</el-button
          ></el-form
        ></el-tab-pane
      ></el-tabs
    ></ContentWrap
  >
  <Dialog
    v-if="secretDialogVisible"
    v-model="secretDialogVisible"
    title="一次性密钥录入"
    @closed="clearSecret"
    ><el-alert
      title="密钥只用于本次提交；关闭、取消或提交完成后立即清空。"
      type="warning"
      :closable="false"
    />
    ><el-input
      v-model="secretForSubmission"
      type="password"
      autocomplete="one-time-code"
      class="mt-12px"
    />
    ><template #footer
      ><el-button @click="cancelSecretDialog">取消</el-button
      ><el-button type="primary" @click="createCredential">确认并提交</el-button></template
    >
    ></Dialog
  >
</template>
<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'
import * as DeliveryApi from '@/api/dataMarket/delivery'
import * as DeptApi from '@/api/system/dept'
import * as UserApi from '@/api/system/user'
import type {
  ApiVersionCreateReq,
  ApplicationDetailVO,
  CredentialCreateReq,
  DeliveryWorkbenchVO,
  RuntimeBindingReq
} from '@/api/dataMarket/types'
import { useMessage } from '@/hooks/web/useMessage'
import UserDepartmentSelect from '@/views/dataMarket/components/UserDepartmentSelect.vue'
import {
  getBusinessErrorMessage,
  isDeliveryNotFoundError,
  resolveRouteApplicationId,
  type DeliveryWorkbenchPageState
} from './pageState'
import { selectDeliveryWorkbenchState } from './restore'
import { validateApiVersionDraft } from './validation'
import { buildApiVersionCreateRequest } from './versionDraft'
defineOptions({ name: 'DataMarketDeliveryWorkbench' })
const message = useMessage()
const route = useRoute()
const tab = ref('api')
const applicationId = computed(() =>
  resolveRouteApplicationId(route.query.applicationId ?? route.params.applicationId)
)
const pageState = ref<DeliveryWorkbenchPageState>('LOADING')
const pageError = ref('')
const application = ref<ApplicationDetailVO>()
const workbench = ref<DeliveryWorkbenchVO>()
const referenceLoading = ref(false)
const referencesReady = ref(false)
const createPlanLoading = ref(false)
const departments = ref<DeptApi.DeptVO[]>([])
const users = ref<UserApi.UserVO[]>([])
const deliveryPlanFormRef = ref<any>()
const deliveryPlanForm = reactive({
  planDescription: '',
  ownerUserId: undefined as number | undefined
})
const deliveryPlanRules = {
  planDescription: [{ required: true, message: '请输入交付方案说明', trigger: 'blur' }],
  ownerUserId: [{ required: true, message: '请选择交付负责人', trigger: 'change' }]
}
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
const rateLimitPolicyDocument = ref('{}')
const networkPolicyDocument = ref('{}')
const lineageSourceType = ref<'DATASET' | 'PROCESSING_ITEM'>('DATASET')
const lineageSourceId = ref<number>()
const lineageRole = ref<'PRIMARY' | 'INPUT' | 'LOOKUP' | 'DERIVED'>('PRIMARY')
const lineages = ref<ApiVersionCreateReq['lineage']>([])
const versionError = ref('')
const secretDialogVisible = ref(false)
const secretForSubmission = ref('')
const apiForm = reactive({
  name: '',
  ownerUserId: undefined as number | undefined,
  description: ''
})
const versionForm = reactive({
  versionNo: 'v1',
  method: 'GET' as ApiVersionCreateReq['method'],
  publicBaseUrl: '',
  requestPath: '/',
  authType: 'APP_KEY_SECRET' as ApiVersionCreateReq['authType'],
  contentType: 'application/json',
  rateLimitPolicy: {},
  networkPolicy: {},
  requestDescription: '',
  responseDescription: '',
  successDescription: '',
  failureDescription: ''
})
const binding = reactive({
  upstreamTargetRef: '',
  timeoutMs: 10000,
  tlsVerify: true,
  debugEnabled: false,
  status: 'ENABLED' as RuntimeBindingReq['status']
})
const credential = reactive({
  deliveryId: undefined as number | undefined,
  apiId: undefined as number | undefined,
  name: '',
  authType: 'APP_KEY_SECRET' as CredentialCreateReq['authType'],
  appKey: ''
})
const requireId = (id: number | undefined, label: string) =>
  id || (message.warning(`请填写${label}`), undefined)
const loadReferences = async () => {
  if (referencesReady.value) return
  referenceLoading.value = true
  try {
    const [departmentList, userList] = await Promise.all([
      DeptApi.getSimpleDeptList(),
      UserApi.getSimpleUserList()
    ])
    departments.value = departmentList
    users.value = userList
    referencesReady.value = true
  } finally {
    referenceLoading.value = false
  }
}
const restoreWorkbench = (aggregate: DeliveryWorkbenchVO) => {
  const state = selectDeliveryWorkbenchState(aggregate)
  workbench.value = aggregate
  deliveryId.value = state.deliveryId
  apiId.value = state.apiId
  apiVersionId.value = state.apiVersionId
  authorizationVersionId.value = state.authorizationVersionId
  environment.value = state.environment
  stage.value = state.stage
  taskDescription.value = state.taskDescription
  Object.assign(versionForm, state.version)
  versionDocument.value = JSON.stringify(state.versionDocument, null, 2)
  rateLimitPolicyDocument.value = JSON.stringify(state.rateLimitPolicy, null, 2)
  networkPolicyDocument.value = JSON.stringify(state.networkPolicy, null, 2)
  lineages.value = state.lineage
  Object.assign(binding, state.binding)
  Object.assign(credential, state.credential)
  clearSecret()
}
const loadWorkbench = async () => {
  const id = applicationId.value
  if (!id) {
    pageError.value = '缺少有效的申请单参数，请从申请管理进入交付配置。'
    pageState.value = 'ERROR'
    return
  }
  pageState.value = 'LOADING'
  pageError.value = ''
  try {
    application.value = await DeliveryApi.getApplication(id)
    const aggregate = await DeliveryApi.getApplicationDelivery(id)
    restoreWorkbench(aggregate)
    pageState.value = 'CONFIGURE'
  } catch (error) {
    if (isDeliveryNotFoundError(error) && application.value) {
      workbench.value = undefined
      if (application.value.status !== 'CONFIGURING') {
        pageState.value = 'WAIT_APPROVAL'
        return
      }
      try {
        await loadReferences()
        pageState.value = 'CREATE_PLAN'
      } catch (referenceError) {
        pageError.value = getBusinessErrorMessage(referenceError)
        pageState.value = 'ERROR'
      }
      return
    }
    pageError.value = getBusinessErrorMessage(error)
    pageState.value = 'ERROR'
  }
}
const createDeliveryPlan = async () => {
  const id = applicationId.value
  if (!id || !(await deliveryPlanFormRef.value?.validate())) return
  createPlanLoading.value = true
  try {
    await DeliveryApi.createDelivery(id, {
      planDescription: deliveryPlanForm.planDescription,
      ownerUserId: deliveryPlanForm.ownerUserId as number
    })
    message.success('交付方案已创建')
    await loadWorkbench()
  } finally {
    createPlanLoading.value = false
  }
}
const addLineage = () => {
  if (!lineageSourceId.value) return message.warning('请填写血缘来源 ID')
  lineages.value.push({
    sourceType: lineageSourceType.value,
    sourceId: lineageSourceId.value,
    role: lineageRole.value
  })
  lineageSourceId.value = undefined
}
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
    const rateLimitPolicy = JSON.parse(rateLimitPolicyDocument.value)
    const networkPolicy = JSON.parse(networkPolicyDocument.value)
    const errors = validateApiVersionDraft({
      ...versionForm,
      rateLimitPolicy,
      networkPolicy,
      lineage: lineages.value
    })
    if (Object.keys(errors).length) {
      versionError.value = Object.values(errors)[0]
      return
    }
    versionError.value = ''
    await DeliveryApi.createApiVersion(
      id,
      buildApiVersionCreateRequest({
        ...versionForm,
        openapiDocument,
        rateLimitPolicy,
        networkPolicy,
        lineage: lineages.value
      })
    )
    message.success('不可变版本已创建')
  } catch {
    versionError.value = 'OpenAPI、限流策略和网络策略必须是合法 JSON'
  }
}
const saveBinding = async () => {
  const id = requireId(apiVersionId.value, '版本 ID')
  if (!id || !binding.upstreamTargetRef) return message.warning('请填写受保护上游引用')
  await DeliveryApi.updateRuntimeBinding(id, environment.value, binding)
  message.success('运行绑定已保存')
}
const openSecretDialog = () => {
  if (
    !credential.deliveryId ||
    !credential.apiId ||
    !credential.name ||
    !credential.appKey ||
    !authorizationVersionId.value
  )
    return message.warning('请完整填写凭证及授权版本')
  secretDialogVisible.value = true
}
const clearSecret = () => {
  secretForSubmission.value = ''
}
const cancelSecretDialog = () => {
  clearSecret()
  secretDialogVisible.value = false
}
const createCredential = async () => {
  if (
    !secretForSubmission.value ||
    !credential.deliveryId ||
    !credential.apiId ||
    !authorizationVersionId.value
  )
    return message.warning('请完整填写凭证及一次性密钥')
  try {
    await DeliveryApi.createCredential({
      ...credential,
      deliveryId: credential.deliveryId,
      apiId: credential.apiId,
      appSecret: secretForSubmission.value,
      authorizations: [{ apiVersionId: authorizationVersionId.value, status: 'ACTIVE' }]
    })
    message.success('凭证已提交配置')
  } finally {
    secretDialogVisible.value = false
    clearSecret()
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
onMounted(loadWorkbench)
</script>
