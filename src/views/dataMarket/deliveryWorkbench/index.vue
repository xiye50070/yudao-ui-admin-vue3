<template>
  <ContentWrap v-if="pageState === 'LOADING'" v-loading="true" class="min-h-180px" />

  <ContentWrap v-else-if="pageState === 'ERROR'">
    <el-result icon="error" title="交付配置无法加载" :sub-title="pageError">
      <template #extra>
        <el-button type="primary" @click="loadWorkbench">重试</el-button>
      </template>
    </el-result>
  </ContentWrap>

  <ContentWrap v-else-if="pageState === 'WAIT_APPROVAL'">
    <el-result
      icon="info"
      title="审批流程尚未完成"
      sub-title="只有整条审批流程完全通过后，具备交付创建权限的用户才能创建交付方案。"
    >
      <template #extra
        ><el-tag>{{ application?.status }}</el-tag></template
      >
    </el-result>
  </ContentWrap>

  <ContentWrap v-else-if="pageState === 'CREATE_PLAN'" v-loading="referenceLoading">
    <el-alert
      title="当前申请尚未创建交付方案。请确认负责人和方案说明后进入 API 配置。"
      type="info"
      :closable="false"
      class="mb-16px"
    />
    <el-descriptions v-if="application" title="申请信息" :column="3" border class="mb-16px">
      <el-descriptions-item label="申请单号">{{ application.applicationNo }}</el-descriptions-item>
      <el-descriptions-item label="申请名称">{{ application.name }}</el-descriptions-item>
      <el-descriptions-item label="申请状态">{{ application.status }}</el-descriptions-item>
    </el-descriptions>
    <el-form
      ref="deliveryPlanFormRef"
      data-testid="delivery-plan-form"
      :model="deliveryPlanForm"
      :rules="deliveryPlanRules"
      label-width="110px"
      class="max-w-760px"
    >
      <el-form-item label="方案说明" prop="planDescription">
        <el-input
          v-model="deliveryPlanForm.planDescription"
          type="textarea"
          :rows="4"
          placeholder="说明 API 拆分、加工结果与交付安排"
        />
      </el-form-item>
      <el-form-item label="交付负责人" prop="ownerUserId">
        <UserDepartmentSelect
          v-model="deliveryPlanForm.ownerUserId"
          :departments="departments"
          :users="users"
          :disabled="!referencesReady"
        />
      </el-form-item>
      <el-form-item>
        <el-button
          v-hasPermi="['data-market:delivery:create']"
          type="primary"
          :loading="createPlanLoading"
          @click="createDeliveryPlan"
        >
          创建交付方案并进入配置
        </el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>

  <template v-else-if="pageState === 'CONFIGURE'">
    <ContentWrap v-if="workbench?.apis.length" title="已配置 API">
      <el-table :data="workbench.apis" size="small">
        <el-table-column prop="apiNo" label="API 编号" min-width="180" />
        <el-table-column prop="name" label="API 名称" min-width="180" />
        <el-table-column prop="status" label="状态" width="130" />
        <el-table-column label="版本数" width="90">
          <template #default="{ row }">{{ row.versions.length }}</template>
        </el-table-column>
        <el-table-column label="凭证数" width="90">
          <template #default="{ row }">{{ row.credentials.length }}</template>
        </el-table-column>
      </el-table>
    </ContentWrap>

    <ContentWrap title="创建 API">
      <el-steps :active="wizardStep" finish-status="success" align-center class="mb-28px">
        <el-step title="API 基本信息" />
        <el-step title="版本与接口契约" />
        <el-step title="运行绑定与血缘" />
        <el-step title="凭证与授权" />
        <el-step title="确认创建" />
      </el-steps>

      <el-result
        v-if="provisionCompleted"
        icon="success"
        title="API 创建完成"
        sub-title="API、不可变版本、运行绑定和凭证已全部创建。"
      >
        <template #extra>
          <el-button type="primary" @click="resetWizard">继续创建 API</el-button>
        </template>
      </el-result>

      <div v-else class="wizard-panel">
        <section v-show="wizardStep === 0" class="wizard-section">
          <div class="wizard-heading">
            <span class="wizard-index">1</span>
            <div>
              <h3>API 基本信息</h3>
              <p>填写本次交付 API 的业务名称与用途。</p>
            </div>
          </div>
          <el-form :model="apiForm" label-position="top" class="wizard-form">
            <el-form-item label="API 名称" required>
              <el-input v-model="apiForm.name" maxlength="100" show-word-limit />
            </el-form-item>
            <el-form-item label="API 说明" required>
              <el-input
                v-model="apiForm.description"
                type="textarea"
                :rows="5"
                maxlength="500"
                show-word-limit
              />
            </el-form-item>
          </el-form>
        </section>

        <section v-show="wizardStep === 1" class="wizard-section">
          <div class="wizard-heading">
            <span class="wizard-index">2</span>
            <div>
              <h3>版本与接口契约</h3>
              <p>定义版本、访问地址、请求规范和响应约定。</p>
            </div>
          </div>
          <el-form :model="versionForm" label-position="top" class="wizard-form">
            <div class="form-grid form-grid-3">
              <el-form-item label="版本号" required>
                <el-input v-model="versionForm.versionNo" placeholder="v1" />
              </el-form-item>
              <el-form-item label="请求方法" required>
                <el-select v-model="versionForm.method" class="!w-100%">
                  <el-option label="GET" value="GET" />
                  <el-option label="POST" value="POST" />
                  <el-option label="PUT" value="PUT" />
                  <el-option label="PATCH" value="PATCH" />
                  <el-option label="DELETE" value="DELETE" />
                </el-select>
              </el-form-item>
              <el-form-item label="认证方式" required>
                <el-select v-model="versionForm.authType" class="!w-100%">
                  <el-option label="App Key / Secret" value="APP_KEY_SECRET" />
                  <el-option label="API Key" value="API_KEY" />
                  <el-option label="Bearer" value="BEARER" />
                </el-select>
              </el-form-item>
            </div>
            <div class="form-grid form-grid-2">
              <el-form-item label="公开地址" required>
                <el-input
                  v-model="versionForm.publicBaseUrl"
                  placeholder="https://api.example.com"
                />
              </el-form-item>
              <el-form-item label="请求路径" required>
                <el-input v-model="versionForm.requestPath" placeholder="/orders" />
              </el-form-item>
            </div>
            <el-form-item label="内容类型" required>
              <el-input v-model="versionForm.contentType" placeholder="application/json" />
            </el-form-item>
            <div class="form-grid form-grid-2">
              <el-form-item label="请求说明" required>
                <el-input v-model="versionForm.requestDescription" type="textarea" :rows="3" />
              </el-form-item>
              <el-form-item label="响应说明" required>
                <el-input v-model="versionForm.responseDescription" type="textarea" :rows="3" />
              </el-form-item>
              <el-form-item label="成功说明" required>
                <el-input v-model="versionForm.successDescription" type="textarea" :rows="3" />
              </el-form-item>
              <el-form-item label="失败说明" required>
                <el-input v-model="versionForm.failureDescription" type="textarea" :rows="3" />
              </el-form-item>
            </div>
            <el-form-item label="OpenAPI 文档（JSON）" required>
              <el-input v-model="versionDocument" type="textarea" :rows="8" class="json-input" />
            </el-form-item>
          </el-form>
        </section>

        <section v-show="wizardStep === 2" class="wizard-section">
          <div class="wizard-heading">
            <span class="wizard-index">3</span>
            <div>
              <h3>运行绑定与血缘</h3>
              <p>配置运行环境、上游引用、访问策略和真实数据来源。</p>
            </div>
          </div>
          <el-form label-position="top" class="wizard-form">
            <div class="form-grid form-grid-2">
              <el-form-item label="限流策略（JSON）" required>
                <el-input
                  v-model="rateLimitPolicyDocument"
                  type="textarea"
                  :rows="6"
                  class="json-input"
                />
              </el-form-item>
              <el-form-item label="网络策略（JSON）" required>
                <el-input
                  v-model="networkPolicyDocument"
                  type="textarea"
                  :rows="6"
                  class="json-input"
                />
              </el-form-item>
            </div>
            <div class="lineage-editor">
              <div class="form-grid lineage-grid">
                <el-form-item label="血缘类型">
                  <el-select v-model="lineageSourceType" class="!w-100%">
                    <el-option label="数据集" value="DATASET" />
                    <el-option label="加工项" value="PROCESSING_ITEM" />
                  </el-select>
                </el-form-item>
                <el-form-item label="来源 ID">
                  <el-input-number
                    v-model="lineageSourceId"
                    :min="1"
                    controls-position="right"
                    class="!w-100%"
                  />
                </el-form-item>
                <el-form-item label="血缘角色">
                  <el-select v-model="lineageRole" class="!w-100%">
                    <el-option label="主来源" value="PRIMARY" />
                    <el-option label="输入" value="INPUT" />
                    <el-option label="查询" value="LOOKUP" />
                    <el-option label="派生" value="DERIVED" />
                  </el-select>
                </el-form-item>
                <el-form-item label=" ">
                  <el-button class="!w-100%" @click="addLineage">添加血缘</el-button>
                </el-form-item>
              </div>
              <el-table :data="lineages" size="small" empty-text="请添加至少一个真实数据来源">
                <el-table-column prop="sourceType" label="类型" />
                <el-table-column prop="sourceId" label="来源 ID" />
                <el-table-column prop="role" label="角色" />
                <el-table-column label="操作" width="80">
                  <template #default="{ $index }">
                    <el-button link type="danger" @click="lineages.splice($index, 1)"
                      >删除</el-button
                    >
                  </template>
                </el-table-column>
              </el-table>
            </div>
            <el-divider content-position="left">运行绑定</el-divider>
            <div class="form-grid form-grid-3">
              <el-form-item label="环境" required>
                <el-select v-model="environment" class="!w-100%">
                  <el-option label="开发" value="DEVELOPMENT" />
                  <el-option label="测试" value="TEST" />
                  <el-option label="生产" value="PRODUCTION" />
                </el-select>
              </el-form-item>
              <el-form-item label="超时（毫秒）" required>
                <el-input-number
                  v-model="binding.timeoutMs"
                  :min="100"
                  :max="30000"
                  controls-position="right"
                  class="!w-100%"
                />
              </el-form-item>
              <el-form-item label="TLS 校验">
                <el-switch v-model="binding.tlsVerify" />
              </el-form-item>
            </div>
            <el-form-item label="受保护上游引用" required>
              <el-input v-model="binding.upstreamTargetRef" placeholder="secret://orders-test" />
            </el-form-item>
          </el-form>
        </section>

        <section v-show="wizardStep === 3" class="wizard-section">
          <div class="wizard-heading">
            <span class="wizard-index">4</span>
            <div>
              <h3>凭证与授权</h3>
              <p>配置调用方凭证；所创建凭证会自动授权给本次新建版本。</p>
            </div>
          </div>
          <el-form :model="credential" label-position="top" class="wizard-form">
            <div class="form-grid form-grid-2">
              <el-form-item label="凭证名称" required>
                <el-input v-model="credential.name" maxlength="100" />
              </el-form-item>
              <el-form-item label="认证方式" required>
                <el-select v-model="credential.authType" class="!w-100%">
                  <el-option label="App Key / Secret" value="APP_KEY_SECRET" />
                  <el-option label="API Key" value="API_KEY" />
                  <el-option label="Bearer" value="BEARER" />
                </el-select>
              </el-form-item>
            </div>
            <el-form-item label="App Key" required>
              <el-input v-model="credential.appKey" autocomplete="off" />
            </el-form-item>
            <el-form-item label="一次性密钥" required>
              <el-input
                v-model="secretForSubmission"
                type="password"
                show-password
                autocomplete="new-password"
              />
            </el-form-item>
          </el-form>
        </section>

        <section v-show="wizardStep === 4" class="wizard-section">
          <div class="wizard-heading">
            <span class="wizard-index">5</span>
            <div>
              <h3>确认创建</h3>
              <p>核对全部配置。只有在此步骤确认后，系统才会执行创建。</p>
            </div>
          </div>
          <el-descriptions :column="2" border class="confirmation-table">
            <el-descriptions-item label="API 名称">{{ apiForm.name }}</el-descriptions-item>
            <el-descriptions-item label="版本号">{{ versionForm.versionNo }}</el-descriptions-item>
            <el-descriptions-item label="接口"
              >{{ versionForm.method }} {{ versionForm.requestPath }}</el-descriptions-item
            >
            <el-descriptions-item label="运行环境">{{ environment }}</el-descriptions-item>
            <el-descriptions-item label="上游引用">{{
              binding.upstreamTargetRef
            }}</el-descriptions-item>
            <el-descriptions-item label="血缘数量">{{ lineages.length }} 项</el-descriptions-item>
            <el-descriptions-item label="凭证名称">{{ credential.name }}</el-descriptions-item>
            <el-descriptions-item label="认证方式">{{ credential.authType }}</el-descriptions-item>
            <el-descriptions-item label="API 说明" :span="2">{{
              apiForm.description
            }}</el-descriptions-item>
          </el-descriptions>
        </section>

        <el-alert
          v-if="versionError"
          :title="versionError"
          type="error"
          :closable="false"
          class="mt-20px"
        />
        <div class="wizard-actions">
          <el-button v-if="wizardStep > 0" :disabled="provisionLoading" @click="previousStep"
            >上一步</el-button
          >
          <el-button v-if="wizardStep < 4" type="primary" @click="nextStep">下一步</el-button>
          <el-button
            v-else
            v-hasPermi="[
              'data-market:api:create',
              'data-market:api:version:create',
              'data-market:api:runtime:update',
              'data-market:credential:create'
            ]"
            type="primary"
            :loading="provisionLoading"
            @click="submitProvisioning"
          >
            完成配置并创建 API
          </el-button>
        </div>
      </div>
    </ContentWrap>

    <ContentWrap v-if="workbench?.apis.length" title="交付流程操作">
      <el-form label-width="100px" class="max-w-760px">
        <el-form-item label="当前阶段">
          <el-select v-model="stage" class="!w-260px">
            <el-option label="交付方案" value="DELIVERY_PLAN" />
            <el-option label="API 配置" value="API_CONFIG" />
            <el-option label="凭证配置" value="CREDENTIAL_CONFIG" />
            <el-option label="文档" value="DOCUMENTATION" />
          </el-select>
        </el-form-item>
        <el-form-item label="完成说明">
          <el-input v-model="taskDescription" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item>
          <el-button v-hasPermi="['data-market:delivery:task:complete']" @click="completeTask"
            >完成阶段</el-button
          >
          <el-button
            v-hasPermi="['data-market:acceptance:submit']"
            type="success"
            @click="submitAcceptance"
            >提交统一验收</el-button
          >
        </el-form-item>
      </el-form>
    </ContentWrap>
  </template>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
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
import { provisionConfiguredApi } from './provisioning'
import { selectDeliveryWorkbenchState } from './restore'
import { validateApiVersionDraft } from './validation'
import { buildApiVersionCreateRequest } from './versionDraft'

defineOptions({ name: 'DataMarketDeliveryWorkbench' })

const message = useMessage()
const route = useRoute()
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
const wizardStep = ref(0)
const provisionLoading = ref(false)
const provisionCompleted = ref(false)
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
const secretForSubmission = ref('')

const apiForm = reactive({ name: '', description: '' })
const versionForm = reactive({
  versionNo: 'v1',
  method: 'GET' as ApiVersionCreateReq['method'],
  publicBaseUrl: '',
  requestPath: '/',
  authType: 'APP_KEY_SECRET' as ApiVersionCreateReq['authType'],
  contentType: 'application/json',
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
  name: '',
  authType: 'APP_KEY_SECRET' as CredentialCreateReq['authType'],
  appKey: ''
})

const createIdempotencyKeys = () => ({
  api: crypto.randomUUID(),
  version: crypto.randomUUID(),
  credential: crypto.randomUUID()
})
const idempotencyKeys = ref(createIdempotencyKeys())

const requireId = (id: number | undefined, label: string) =>
  id || (message.warning(`缺少${label}，请刷新页面后重试`), undefined)

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
  stage.value = state.stage
  taskDescription.value = state.taskDescription
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

const parseObject = (content: string, label: string) => {
  try {
    const value = JSON.parse(content)
    if (!value || Array.isArray(value) || typeof value !== 'object') throw new Error()
    return value as Record<string, unknown>
  } catch {
    throw new Error(`${label}必须是合法的 JSON 对象`)
  }
}

const validateStep = (step: number) => {
  versionError.value = ''
  try {
    if (step === 0 && (!apiForm.name.trim() || !apiForm.description.trim())) {
      throw new Error('请完整填写 API 名称和说明')
    }
    if (step === 1) {
      parseObject(versionDocument.value, 'OpenAPI 文档')
      if (
        !versionForm.versionNo.trim() ||
        !versionForm.publicBaseUrl.trim() ||
        !versionForm.requestPath.trim() ||
        !versionForm.contentType.trim() ||
        !versionForm.requestDescription.trim() ||
        !versionForm.responseDescription.trim() ||
        !versionForm.successDescription.trim() ||
        !versionForm.failureDescription.trim()
      ) {
        throw new Error('请完整填写版本与接口契约')
      }
    }
    if (step === 2) {
      const rateLimitPolicy = parseObject(rateLimitPolicyDocument.value, '限流策略')
      const networkPolicy = parseObject(networkPolicyDocument.value, '网络策略')
      const errors = validateApiVersionDraft({
        ...versionForm,
        rateLimitPolicy,
        networkPolicy,
        lineage: lineages.value
      })
      if (Object.keys(errors).length) throw new Error(Object.values(errors)[0])
      if (!binding.upstreamTargetRef.trim()) throw new Error('请填写受保护上游引用')
    }
    if (
      step === 3 &&
      (!credential.name.trim() || !credential.appKey.trim() || !secretForSubmission.value)
    ) {
      throw new Error('请完整填写凭证信息和一次性密钥')
    }
    return true
  } catch (error) {
    versionError.value = error instanceof Error ? error.message : '请检查当前步骤配置'
    return false
  }
}

const nextStep = () => {
  if (validateStep(wizardStep.value)) wizardStep.value += 1
}

const previousStep = () => {
  versionError.value = ''
  wizardStep.value -= 1
}

const buildProvisioningDraft = () => {
  const id = requireId(deliveryId.value, '交付方案')
  if (!id) return
  const openapiDocument = parseObject(versionDocument.value, 'OpenAPI 文档')
  const rateLimitPolicy = parseObject(rateLimitPolicyDocument.value, '限流策略')
  const networkPolicy = parseObject(networkPolicyDocument.value, '网络策略')
  return {
    deliveryId: id,
    api: { name: apiForm.name.trim(), description: apiForm.description.trim() },
    version: buildApiVersionCreateRequest({
      ...versionForm,
      openapiDocument,
      rateLimitPolicy,
      networkPolicy,
      lineage: lineages.value
    }),
    environment: environment.value,
    binding: { ...binding },
    credential: {
      ...credential,
      name: credential.name.trim(),
      appKey: credential.appKey.trim(),
      appSecret: secretForSubmission.value
    },
    idempotencyKeys: idempotencyKeys.value
  }
}

const submitProvisioning = async () => {
  if (![0, 1, 2, 3].every(validateStep)) return
  const draft = buildProvisioningDraft()
  if (!draft) return
  provisionLoading.value = true
  try {
    await provisionConfiguredApi(draft)
    clearSecret()
    provisionCompleted.value = true
    wizardStep.value = 5
    message.success('API、版本、运行绑定和凭证已创建')
    await loadWorkbench()
  } catch (error) {
    versionError.value = getBusinessErrorMessage(error)
  } finally {
    provisionLoading.value = false
  }
}

const clearSecret = () => {
  secretForSubmission.value = ''
}

const resetWizard = () => {
  wizardStep.value = 0
  provisionCompleted.value = false
  versionError.value = ''
  Object.assign(apiForm, { name: '', description: '' })
  Object.assign(versionForm, {
    versionNo: 'v1',
    method: 'GET',
    publicBaseUrl: '',
    requestPath: '/',
    authType: 'APP_KEY_SECRET',
    contentType: 'application/json',
    requestDescription: '',
    responseDescription: '',
    successDescription: '',
    failureDescription: ''
  })
  Object.assign(binding, {
    upstreamTargetRef: '',
    timeoutMs: 10000,
    tlsVerify: true,
    debugEnabled: false,
    status: 'ENABLED'
  })
  Object.assign(credential, { name: '', authType: 'APP_KEY_SECRET', appKey: '' })
  versionDocument.value = '{}'
  rateLimitPolicyDocument.value = '{}'
  networkPolicyDocument.value = '{}'
  lineages.value = []
  environment.value = 'TEST'
  idempotencyKeys.value = createIdempotencyKeys()
  clearSecret()
}

const completeTask = async () => {
  const id = requireId(deliveryId.value, '交付方案')
  if (!id || !taskDescription.value.trim()) return message.warning('请填写阶段完成说明')
  await DeliveryApi.completeDeliveryTask(id, stage.value, { description: taskDescription.value })
  message.success('阶段已完成')
  await loadWorkbench()
}

const submitAcceptance = async () => {
  const id = requireId(deliveryId.value, '交付方案')
  if (!id) return
  await message.confirm('确认提交整包 API 进入统一验收吗？')
  await DeliveryApi.submitDeliveryAcceptance(id, taskDescription.value)
  message.success('已提交统一验收')
  await loadWorkbench()
}

onMounted(loadWorkbench)
onBeforeUnmount(clearSecret)
</script>

<style scoped>
.wizard-panel {
  max-width: 1040px;
  margin: 0 auto;
}

.wizard-section {
  min-height: 430px;
  padding: 28px 36px 20px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 12px;
  background: var(--el-bg-color);
}

.wizard-heading {
  display: flex;
  gap: 14px;
  align-items: flex-start;
  padding-bottom: 22px;
  margin-bottom: 24px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.wizard-heading h3 {
  margin: 1px 0 6px;
  font-size: 18px;
  color: var(--el-text-color-primary);
}

.wizard-heading p {
  margin: 0;
  color: var(--el-text-color-secondary);
}

.wizard-index {
  display: inline-flex;
  width: 30px;
  height: 30px;
  flex: 0 0 30px;
  align-items: center;
  justify-content: center;
  border-radius: 9px;
  color: var(--el-color-primary);
  font-weight: 700;
  background: var(--el-color-primary-light-9);
}

.wizard-form {
  max-width: 900px;
  margin: 0 auto;
}

.form-grid {
  display: grid;
  gap: 0 18px;
}

.form-grid-2 {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.form-grid-3 {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.lineage-grid {
  grid-template-columns: 1.2fr 1fr 1.2fr 120px;
}

.lineage-editor {
  padding: 18px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 10px;
  background: var(--el-fill-color-extra-light);
}

.json-input :deep(textarea) {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}

.confirmation-table {
  max-width: 880px;
  margin: 0 auto;
}

.wizard-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding-top: 22px;
}

@media (max-width: 900px) {
  .form-grid-2,
  .form-grid-3,
  .lineage-grid {
    grid-template-columns: 1fr;
  }

  .wizard-section {
    padding: 22px 18px 16px;
  }
}
</style>
