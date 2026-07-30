<template>
  <ContentWrap>
    <el-alert
      title="仅执行已审批的变更、续期或停用申请。先从服务端申请详情完成影响审查，原 API 不会被前端直接修改或停用。"
      type="warning"
      :closable="false"
      show-icon
    />
  </ContentWrap>
  <ContentWrap>
    <el-table
      v-loading="applicationLoading"
      :data="applications"
      empty-text="暂无变更、续期或停用申请"
    >
      <el-table-column prop="applicationNo" label="申请单号" min-width="160" />
      <el-table-column prop="name" label="申请名称" min-width="180" />
      <el-table-column prop="applicationType" label="类型" width="110" />
      <el-table-column prop="status" label="状态" width="130" />
      <el-table-column prop="updateTime" label="更新时间" width="180" />
      <el-table-column label="操作" width="110" fixed="right">
        <template #default="{ row }">
          <el-button
            v-hasPermi="['data-market:application:management-query']"
            link
            type="primary"
            @click="reviewApplication(row.id)"
            >影响审查</el-button
          >
        </template>
      </el-table-column>
    </el-table>
  </ContentWrap>
  <ContentWrap>
    <el-form :inline="true" class="-mb-15px">
      <el-form-item label="生命周期申请 ID">
        <el-input-number v-model="form.applicationId" :min="1" placeholder="输入申请 ID" />
      </el-form-item>
      <el-form-item>
        <el-button
          v-hasPermi="['data-market:application:management-query']"
          type="primary"
          :loading="reviewLoading"
          @click="loadReview"
        >
          <Icon icon="ep:search" class="mr-5px" />加载影响审查
        </el-button>
        <el-button @click="goMessageCenter"
          ><Icon icon="ep:bell" class="mr-5px" />消息中心</el-button
        >
      </el-form-item>
    </el-form>
  </ContentWrap>
  <ContentWrap>
    <el-empty v-if="!application && !reviewLoading" description="加载已审批的生命周期申请后执行" />
    <template v-else-if="application">
      <el-descriptions title="申请与影响审查" :column="responsiveColumns" border class="mb-16px">
        <el-descriptions-item label="申请单号">{{
          application.applicationNo
        }}</el-descriptions-item>
        <el-descriptions-item label="申请类型"
          ><el-tag>{{ application.applicationType }}</el-tag></el-descriptions-item
        >
        <el-descriptions-item label="申请状态">{{ application.status }}</el-descriptions-item>
        <el-descriptions-item label="原 API">{{
          lifecycleRequest?.originalApiId ?? '服务端未返回'
        }}</el-descriptions-item>
        <el-descriptions-item label="原版本">{{
          lifecycleRequest?.originalApiVersionId ?? '服务端未返回'
        }}</el-descriptions-item>
        <el-descriptions-item label="执行状态">{{
          lifecycleRequest?.executionStatus ?? '服务端未返回'
        }}</el-descriptions-item>
        <el-descriptions-item label="申请生效时间">{{
          lifecycleRequest?.desiredEffectiveAt || '未设置'
        }}</el-descriptions-item>
        <el-descriptions-item label="申请使用截止">{{
          lifecycleRequest?.requestedUseEndDate || '未设置'
        }}</el-descriptions-item>
        <el-descriptions-item label="已关联凭证">
          <el-tag
            v-for="id in lifecycleRequest?.affectedCredentialIds || []"
            :key="id"
            class="mr-4px"
            >{{ id }}</el-tag
          >
          <span v-if="!lifecycleRequest?.affectedCredentialIds?.length">无</span>
        </el-descriptions-item>
        <el-descriptions-item label="服务端影响摘要" :span="responsiveColumns">{{
          lifecycleRequest?.impactSummary || '待评估'
        }}</el-descriptions-item>
        <el-descriptions-item label="已有执行结果" :span="responsiveColumns">{{
          lifecycleRequest?.executionResult || '尚未执行'
        }}</el-descriptions-item>
      </el-descriptions>
      <el-alert
        v-if="lifecycleExecutionBlockReason"
        :title="lifecycleExecutionBlockReason"
        type="warning"
        :closable="false"
        class="mb-16px"
      />
      <el-form ref="formRef" :model="form" :rules="rules" label-width="140px" class="max-w-760px">
        <el-divider content-position="left">执行确认</el-divider>
        <el-form-item label="近期调用摘要" prop="recentCallSummary">
          <el-input
            v-model="form.recentCallSummary"
            type="textarea"
            :rows="3"
            placeholder="审查近期调用量、失败率与调用方"
          />
        </el-form-item>
        <el-form-item label="已确认影响" prop="confirmedImpactSummary">
          <el-input
            v-model="form.confirmedImpactSummary"
            type="textarea"
            :rows="3"
            placeholder="确认调用方、数据与变更窗口影响"
          />
        </el-form-item>
        <el-form-item label="计划/实际生效时间" prop="actualEffectiveAt">
          <el-date-picker
            v-model="form.actualEffectiveAt"
            type="datetime"
            value-format="YYYY-MM-DDTHH:mm:ssZ"
          />
        </el-form-item>
        <el-form-item label="关联凭证确认">
          <el-select
            v-model="affectedCredentialIds"
            multiple
            filterable
            allow-create
            default-first-option
            class="!w-100%"
            placeholder="输入并确认受影响凭证 ID"
          >
            <el-option
              v-for="id in lifecycleRequest?.affectedCredentialIds || []"
              :key="id"
              :label="String(id)"
              :value="String(id)"
            />
          </el-select>
        </el-form-item>
        <el-form-item
          v-if="application.applicationType === 'CHANGE'"
          label="目标版本 ID"
          prop="targetApiVersionId"
        >
          <el-input-number v-model="form.targetApiVersionId" :min="1" />
          <span class="ml-8px text-gray-500">变更切换前原版本保持可用</span>
        </el-form-item>
        <el-form-item label="执行动作" prop="actionDetail">
          <el-input
            v-model="form.actionDetail"
            type="textarea"
            :rows="3"
            placeholder="说明切换、续期或停用执行动作"
          />
        </el-form-item>
        <el-form-item label="执行结果">
          <el-input
            v-model="form.executionResult"
            type="textarea"
            :rows="3"
            placeholder="立即执行时填写；计划执行由后台完成后回填"
          />
        </el-form-item>
        <el-form-item>
          <el-button
            v-hasPermi="['data-market:lifecycle:execute']"
            type="danger"
            :loading="submitting"
            :disabled="Boolean(lifecycleExecutionBlockReason)"
            @click="execute"
            >确认执行</el-button
          >
        </el-form-item>
      </el-form>
    </template>
  </ContentWrap>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useWindowSize } from '@vueuse/core'
import { useRouter } from 'vue-router'
import * as DeliveryApi from '@/api/dataMarket/delivery'
import type {
  ApplicationDetailVO,
  ApplicationSummaryVO,
  LifecycleRequestDetail
} from '@/api/dataMarket/types'
import { useMessage } from '@/hooks/web/useMessage'
import { getLifecycleExecutionBlockReason, validateLifecycleExecution } from './validation'

defineOptions({ name: 'DataMarketLifecycle' })
const message = useMessage()
const router = useRouter()
const { width } = useWindowSize()
const formRef = ref<any>()
const application = ref<ApplicationDetailVO>()
const applications = ref<ApplicationSummaryVO[]>([])
const applicationLoading = ref(false)
const reviewLoading = ref(false)
const submitting = ref(false)
const affectedCredentialIds = ref<string[]>([])
const responsiveColumns = computed(() => (width.value <= 1024 ? 1 : 3))
const lifecycleRequest = computed<LifecycleRequestDetail | undefined>(
  () => application.value?.lifecycleRequest
)
const lifecycleExecutionBlockReason = computed(() =>
  application.value
    ? getLifecycleExecutionBlockReason({
        applicationStatus: application.value.status,
        executionStatus: lifecycleRequest.value?.executionStatus
      })
    : '请先加载生命周期申请'
)
const form = reactive({
  applicationId: undefined as number | undefined,
  recentCallSummary: '',
  confirmedImpactSummary: '',
  actualEffectiveAt: '',
  actionDetail: '',
  targetApiVersionId: undefined as number | undefined,
  executionResult: ''
})
const rules = {
  applicationId: [{ required: true, message: '请输入申请 ID', trigger: 'change' }],
  recentCallSummary: [{ required: true, message: '请输入近期调用摘要', trigger: 'blur' }],
  confirmedImpactSummary: [{ required: true, message: '请输入已确认影响', trigger: 'blur' }],
  actualEffectiveAt: [{ required: true, message: '请选择计划或实际生效时间', trigger: 'change' }],
  actionDetail: [{ required: true, message: '请输入执行动作', trigger: 'blur' }]
}
const loadReview = async () => {
  if (!form.applicationId) return message.warning('请输入生命周期申请 ID')
  reviewLoading.value = true
  try {
    application.value = await DeliveryApi.getApplication(form.applicationId)
    const review = application.value.lifecycleRequest
    form.recentCallSummary = review?.recentCallSummary || ''
    form.confirmedImpactSummary = review?.impactSummary || ''
    form.actualEffectiveAt = review?.confirmedEffectiveAt || review?.desiredEffectiveAt || ''
    form.targetApiVersionId = review?.targetApiVersionId
    form.executionResult = review?.executionResult || ''
    affectedCredentialIds.value = (review?.affectedCredentialIds || []).map(String)
  } finally {
    reviewLoading.value = false
  }
}
const loadApplications = async () => {
  applicationLoading.value = true
  try {
    const page = await DeliveryApi.getApplicationPage({ pageNo: 1, pageSize: 20 })
    applications.value = page.list.filter((item) =>
      ['CHANGE', 'RENEW', 'DEACTIVATE'].includes(item.applicationType)
    )
  } finally {
    applicationLoading.value = false
  }
}
const reviewApplication = async (applicationId: number) => {
  form.applicationId = applicationId
  await loadReview()
}
const execute = async () => {
  if (!application.value || !(await formRef.value.validate()) || !form.applicationId) return
  if (lifecycleExecutionBlockReason.value)
    return message.warning(lifecycleExecutionBlockReason.value)
  const errors = validateLifecycleExecution({
    applicationType: application.value.applicationType,
    targetApiVersionId: form.targetApiVersionId
  })
  if (errors.targetApiVersionId) return message.warning(errors.targetApiVersionId)
  await message.confirm('该操作将执行已审批的生命周期申请，是否继续？')
  submitting.value = true
  try {
    await DeliveryApi.executeLifecycleApplication(form.applicationId, {
      recentCallSummary: form.recentCallSummary,
      confirmedImpactSummary: form.confirmedImpactSummary,
      actualEffectiveAt: form.actualEffectiveAt,
      actionDetail: form.actionDetail,
      targetApiVersionId: form.targetApiVersionId,
      affectedCredentialIds: affectedCredentialIds.value.map(Number).filter(Number.isInteger),
      executionResult: form.executionResult || undefined
    })
    message.success('生命周期执行请求已提交')
    await loadReview()
  } finally {
    submitting.value = false
  }
}
const goMessageCenter = () => router.push({ name: 'MyNotifyMessage' })
onMounted(loadApplications)
</script>
