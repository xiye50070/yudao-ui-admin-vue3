<template>
  <DataMarketManagementPage
    page-key="lifecycle"
    title="生命周期执行"
    description="执行已审批的数据变更、续期与停用申请"
    icon="ep:refresh"
    tone="amber"
  >
    <template #actions>
      <el-button @click="goMessageCenter"><Icon icon="ep:bell" />消息中心</el-button>
      <el-button :loading="applicationLoading" @click="loadApplications"
        ><Icon icon="ep:refresh" />刷新申请</el-button
      >
    </template>

    <section class="dm-panel lifecycle-queue">
      <header class="dm-panel__header">
        <div
          ><h2>待审查的生命周期申请</h2
          ><p>当前列表展示 {{ applications.length }} 条变更、续期或停用申请</p></div
        >
        <div class="dm-toolbar lifecycle-id-search"
          ><el-input-number
            v-model="form.applicationId"
            :min="1"
            placeholder="输入申请 ID"
          /><el-button
            v-hasPermi="['data-market:application:management-query']"
            type="primary"
            plain
            :loading="reviewLoading"
            @click="loadReview"
            ><Icon icon="ep:search" />加载审查</el-button
          ></div
        >
      </header>
      <el-alert
        title="仅执行已审批的生命周期申请；页面先加载服务端影响审查，再提交执行确认。"
        type="warning"
        :closable="false"
        show-icon
        class="lifecycle-notice"
      />
      <el-result
        v-if="applicationLoadError"
        class="dm-load-result"
        icon="warning"
        title="生命周期申请加载失败"
        sub-title="暂时无法获取申请列表"
        ><template #extra
          ><el-button type="primary" @click="loadApplications">重新加载</el-button></template
        ></el-result
      >
      <div v-else class="dm-table-wrap">
        <el-table
          v-loading="applicationLoading"
          :data="applications"
          empty-text="暂无变更、续期或停用申请"
          table-layout="fixed"
        >
          <el-table-column label="申请" min-width="280"
            ><template #default="{ row }"
              ><div class="dm-entity-cell"
                ><span class="dm-entity-mark"><Icon icon="ep:document" /></span
                ><span class="dm-entity-copy"
                  ><strong>{{ row.name }}</strong
                  ><small>{{ row.applicationNo }}</small></span
                ></div
              ></template
            ></el-table-column
          >
          <el-table-column label="类型" width="120" align="center"
            ><template #default="{ row }"
              ><el-tag type="warning" effect="plain" round>{{
                applicationTypeLabel(row.applicationType)
              }}</el-tag></template
            ></el-table-column
          >
          <el-table-column label="状态" width="150" align="center"
            ><template #default="{ row }"
              ><el-tag effect="light" round>{{ row.status }}</el-tag></template
            ></el-table-column
          >
          <el-table-column label="更新时间" width="180"
            ><template #default="{ row }">{{
              formatDate(row.updateTime)
            }}</template></el-table-column
          >
          <el-table-column label="操作" width="110" align="right"
            ><template #default="{ row }"
              ><el-button
                v-hasPermi="['data-market:application:management-query']"
                link
                type="primary"
                @click="reviewApplication(row.id)"
                >影响审查</el-button
              ></template
            ></el-table-column
          >
        </el-table>
      </div>
    </section>

    <section class="dm-panel lifecycle-review">
      <header class="dm-panel__header"
        ><div
          ><h2>影响审查与执行确认</h2
          ><p>{{
            application
              ? `${application.applicationNo} · ${application.name}`
              : '选择上方申请或输入申请 ID 后加载'
          }}</p></div
        ><el-tag v-if="lifecycleRequest?.executionStatus" type="info" effect="plain" round>{{
          lifecycleRequest.executionStatus
        }}</el-tag></header
      >
      <el-result
        v-if="reviewLoadError"
        class="dm-load-result"
        icon="warning"
        title="影响审查加载失败"
        sub-title="暂时无法获取当前申请详情"
        ><template #extra
          ><el-button type="primary" @click="loadReview">重新加载</el-button></template
        ></el-result
      >
      <el-empty
        v-else-if="!application && !reviewLoading"
        description="加载已审批的生命周期申请后执行"
      />
      <template v-else-if="application">
        <el-descriptions :column="responsiveColumns" border class="lifecycle-descriptions">
          <el-descriptions-item label="申请单号">{{
            application.applicationNo
          }}</el-descriptions-item>
          <el-descriptions-item label="申请类型"
            ><el-tag type="warning" effect="plain">{{
              applicationTypeLabel(application.applicationType)
            }}</el-tag></el-descriptions-item
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
          <el-descriptions-item label="已关联凭证"
            ><el-tag
              v-for="id in lifecycleRequest?.affectedCredentialIds || []"
              :key="id"
              class="mr-4px"
              >{{ id }}</el-tag
            ><span v-if="!lifecycleRequest?.affectedCredentialIds?.length"
              >无</span
            ></el-descriptions-item
          >
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
          class="lifecycle-block"
        />
        <el-form
          ref="formRef"
          :model="form"
          :rules="rules"
          label-position="top"
          class="lifecycle-form"
        >
          <div class="lifecycle-form__grid">
            <el-form-item label="近期调用摘要" prop="recentCallSummary"
              ><el-input
                v-model="form.recentCallSummary"
                type="textarea"
                :rows="3"
                placeholder="审查近期调用量、失败率与调用方"
            /></el-form-item>
            <el-form-item label="已确认影响" prop="confirmedImpactSummary"
              ><el-input
                v-model="form.confirmedImpactSummary"
                type="textarea"
                :rows="3"
                placeholder="确认调用方、数据与变更窗口影响"
            /></el-form-item>
            <el-form-item label="计划 / 实际生效时间" prop="actualEffectiveAt"
              ><el-date-picker
                v-model="form.actualEffectiveAt"
                type="datetime"
                value-format="YYYY-MM-DDTHH:mm:ssZ"
                class="!w-100%"
            /></el-form-item>
            <el-form-item label="关联凭证确认"
              ><el-select
                v-model="affectedCredentialIds"
                multiple
                filterable
                allow-create
                default-first-option
                class="!w-100%"
                placeholder="输入并确认受影响凭证 ID"
                ><el-option
                  v-for="id in lifecycleRequest?.affectedCredentialIds || []"
                  :key="id"
                  :label="String(id)"
                  :value="String(id)" /></el-select
            ></el-form-item>
            <el-form-item
              v-if="application.applicationType === 'CHANGE'"
              label="目标版本 ID"
              prop="targetApiVersionId"
              ><el-input-number v-model="form.targetApiVersionId" :min="1" /><span
                class="lifecycle-form__tip"
                >变更切换前原版本保持可用</span
              ></el-form-item
            >
            <el-form-item label="执行动作" prop="actionDetail"
              ><el-input
                v-model="form.actionDetail"
                type="textarea"
                :rows="3"
                placeholder="说明切换、续期或停用执行动作"
            /></el-form-item>
            <el-form-item label="执行结果"
              ><el-input
                v-model="form.executionResult"
                type="textarea"
                :rows="3"
                placeholder="立即执行时填写；计划执行由后台完成后回填"
            /></el-form-item>
          </div>
          <div class="lifecycle-submit"
            ><div
              ><Icon icon="ep:warning" /><span
                ><strong>高风险操作</strong
                ><small>系统将执行已审批的生命周期申请，请确认影响审查完整。</small></span
              ></div
            ><el-button
              v-hasPermi="['data-market:lifecycle:execute']"
              type="danger"
              :loading="submitting"
              :disabled="Boolean(lifecycleExecutionBlockReason)"
              @click="execute"
              >确认执行</el-button
            ></div
          >
        </el-form>
      </template>
    </section>
  </DataMarketManagementPage>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useWindowSize } from '@vueuse/core'
import { useRouter } from 'vue-router'
import * as DeliveryApi from '@/api/dataMarket/delivery'
import { toEpochMillis } from '@/api/dataMarket/datetime'
import type {
  ApplicationDetailVO,
  ApplicationSummaryVO,
  LifecycleRequestDetail
} from '@/api/dataMarket/types'
import { useMessage } from '@/hooks/web/useMessage'
import { getLifecycleExecutionBlockReason, validateLifecycleExecution } from './validation'
import { formatDate } from '@/utils/formatTime'
import DataMarketManagementPage from '@/views/dataMarket/components/DataMarketManagementPage.vue'

defineOptions({ name: 'DataMarketLifecycle' })
const message = useMessage()
const router = useRouter()
const { width } = useWindowSize()
const formRef = ref<any>()
const application = ref<ApplicationDetailVO>()
const applications = ref<ApplicationSummaryVO[]>([])
const applicationLoading = ref(false)
const applicationLoadError = ref(false)
const reviewLoading = ref(false)
const reviewLoadError = ref(false)
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
const applicationTypeLabels: Record<string, string> = {
  CHANGE: '变更',
  RENEW: '续期',
  DEACTIVATE: '停用'
}
const applicationTypeLabel = (type?: string) => (type ? applicationTypeLabels[type] || type : '—')
const loadReview = async () => {
  if (!form.applicationId) return message.warning('请输入生命周期申请 ID')
  reviewLoading.value = true
  reviewLoadError.value = false
  try {
    application.value = await DeliveryApi.getApplication(form.applicationId)
    const review = application.value.lifecycleRequest
    form.recentCallSummary = review?.recentCallSummary || ''
    form.confirmedImpactSummary = review?.impactSummary || ''
    form.actualEffectiveAt = review?.confirmedEffectiveAt || review?.desiredEffectiveAt || ''
    form.targetApiVersionId = review?.targetApiVersionId
    form.executionResult = review?.executionResult || ''
    affectedCredentialIds.value = (review?.affectedCredentialIds || []).map(String)
  } catch {
    application.value = undefined
    reviewLoadError.value = true
  } finally {
    reviewLoading.value = false
  }
}
const loadApplications = async () => {
  applicationLoading.value = true
  applicationLoadError.value = false
  try {
    const page = await DeliveryApi.getApplicationPage({ pageNo: 1, pageSize: 20 })
    applications.value = page.list.filter((item) =>
      ['CHANGE', 'RENEW', 'DEACTIVATE'].includes(item.applicationType)
    )
  } catch {
    applications.value = []
    applicationLoadError.value = true
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
      actualEffectiveAt: toEpochMillis(form.actualEffectiveAt)!,
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

<style scoped lang="scss">
.lifecycle-notice {
  margin-bottom: 16px;
}

.lifecycle-id-search :deep(.el-input-number) {
  width: 180px;
}

.lifecycle-review {
  min-height: 340px;
}

.lifecycle-descriptions {
  margin-bottom: 18px;
}

.lifecycle-block {
  margin-bottom: 18px;
}

.lifecycle-form {
  padding-top: 4px;
}

.lifecycle-form__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0 22px;
}

.lifecycle-form__tip {
  margin-left: 10px;
  font-size: 12px;
  color: #8a96a8;
}

.lifecycle-submit {
  display: flex;
  padding: 16px 18px;
  margin-top: 4px;
  background: #fff7f5;
  border: 1px solid #f4d9d4;
  border-radius: 9px;
  align-items: center;
  justify-content: space-between;
  gap: 20px;

  > div {
    display: flex;
    color: var(--el-color-danger);
    align-items: center;
    gap: 11px;
  }

  span {
    display: grid;
    gap: 3px;
  }

  strong {
    color: #6e332d;
  }

  small {
    color: #956d68;
  }
}

@media (width <= 900px) {
  .lifecycle-form__grid {
    grid-template-columns: 1fr;
  }

  .lifecycle-submit {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
