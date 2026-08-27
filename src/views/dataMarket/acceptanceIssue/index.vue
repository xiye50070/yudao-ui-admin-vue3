<template>
  <DataMarketManagementPage
    page-key="acceptance-issue"
    title="验收问题"
    description="跟踪交付验收轮次、问题处理与重新提交"
    icon="ep:warning"
    tone="amber"
  >
    <template #actions>
      <el-button @click="goMessageCenter"><Icon icon="ep:bell" />消息中心</el-button>
      <el-button
        v-hasPermi="['data-market:acceptance:issue-query']"
        type="primary"
        :disabled="!applicationId"
        :loading="loading"
        @click="loadRounds"
        ><Icon icon="ep:refresh" />刷新问题</el-button
      >
    </template>

    <template #summary>
      <div class="dm-summary-item"
        ><span class="dm-summary-item__icon"><Icon icon="ep:refresh" /></span
        ><span class="dm-summary-item__content"
          ><small>验收轮次</small><strong>{{ rounds.length }}</strong></span
        ></div
      >
      <div class="dm-summary-item"
        ><span class="dm-summary-item__icon"><Icon icon="ep:warning" /></span
        ><span class="dm-summary-item__content"
          ><small>问题总数</small><strong>{{ issueRows.length }}</strong></span
        ></div
      >
      <div class="dm-summary-item"
        ><span class="dm-summary-item__icon"><Icon icon="ep:clock" /></span
        ><span class="dm-summary-item__content"
          ><small>未处理问题</small><strong>{{ unresolvedIssues.length }}</strong></span
        ></div
      >
    </template>

    <section class="dm-panel acceptance-context">
      <div class="acceptance-context__identity"
        ><span><Icon icon="ep:document" /></span
        ><div
          ><small>当前申请</small
          ><strong>{{ applicationId ? `#${applicationId}` : '未指定申请' }}</strong></div
        ></div
      >
      <p>按当前申请加载验收轮次；全部问题处理完成后，方可再次提交整包验收。</p>
      <el-badge
        v-if="rounds.length"
        :value="unresolvedIssues.length"
        :hidden="!unresolvedIssues.length"
        ><el-tag type="warning" effect="plain" round>问题提醒</el-tag></el-badge
      >
    </section>

    <section class="dm-panel">
      <header class="dm-panel__header"
        ><div
          ><h2>验收问题列表</h2
          ><p v-if="latestRound">最新轮次 {{ latestRound.roundNo }} · {{ latestRound.status }}</p
          ><p v-else>等待加载验收轮次</p></div
        ></header
      >
      <el-empty
        v-if="!applicationId && !loading"
        description="缺少申请 ID，请从申请管理或交付工作台进入"
      />
      <el-result
        v-else-if="loadError"
        class="dm-load-result"
        icon="warning"
        title="验收问题加载失败"
        sub-title="暂时无法获取当前申请的交付与验收轮次"
        ><template #extra
          ><el-button type="primary" @click="loadRounds">重新加载</el-button></template
        ></el-result
      >
      <template v-else>
        <el-descriptions
          v-if="rounds.length"
          :column="responsiveColumns"
          border
          class="acceptance-round-summary"
        >
          <el-descriptions-item label="验收轮次">{{ latestRound?.roundNo }}</el-descriptions-item>
          <el-descriptions-item label="轮次状态"
            ><el-tag effect="light">{{ latestRound?.status }}</el-tag></el-descriptions-item
          >
          <el-descriptions-item label="未处理问题"
            ><strong class="unresolved-count">{{
              unresolvedIssues.length
            }}</strong></el-descriptions-item
          >
        </el-descriptions>
        <div class="dm-table-wrap">
          <el-table
            v-loading="loading"
            :data="issueRows"
            empty-text="当前申请暂无验收问题"
            table-layout="fixed"
          >
            <el-table-column prop="roundNo" label="轮次" width="80" align="center" />
            <el-table-column label="API" min-width="190"
              ><template #default="{ row }"
                ><div class="dm-entity-cell"
                  ><span class="dm-entity-mark">API</span
                  ><span class="dm-entity-copy"
                    ><strong>{{ row.apiName || row.apiId }}</strong
                    ><small>{{ row.issueType }}</small></span
                  ></div
                ></template
              ></el-table-column
            >
            <el-table-column
              prop="description"
              label="问题描述"
              min-width="260"
              show-overflow-tooltip
            />
            <el-table-column label="状态" width="120" align="center"
              ><template #default="{ row }"
                ><el-tag :type="issueTagType(row.status)" effect="light" round>{{
                  issueStatusLabel(row.status)
                }}</el-tag></template
              ></el-table-column
            >
            <el-table-column prop="assigneeUserId" label="处理人" width="100" />
            <el-table-column prop="createdAt" label="提出时间" width="180" />
            <el-table-column label="操作" width="110" align="right"
              ><template #default="{ row }"
                ><el-button link type="primary" @click="openIssue(row)"
                  >详情 / 处理</el-button
                ></template
              ></el-table-column
            >
          </el-table>
        </div>
        <div
          v-if="latestRound"
          class="acceptance-resubmit"
          :class="{ 'acceptance-resubmit--ready': canResubmit }"
          ><div
            ><Icon :icon="canResubmit ? 'ep:circle-check' : 'ep:warning'" /><span
              ><strong>{{ canResubmit ? '可以再次提交验收' : '仍有问题需要处理' }}</strong
              ><small>{{ resubmitHint }}</small></span
            ></div
          ><el-button
            v-hasPermi="['data-market:acceptance:submit']"
            type="success"
            :disabled="!canResubmit || submitting"
            :loading="submitting"
            @click="resubmit"
            >再次提交统一验收</el-button
          ></div
        >
      </template>
    </section>
  </DataMarketManagementPage>
  <el-drawer v-model="detailVisible" title="验收问题详情与处理" size="min(680px, 92%)">
    <el-empty v-if="!selectedIssue" description="请选择问题" />
    <template v-else>
      <el-descriptions :column="1" border>
        <el-descriptions-item label="API">{{
          selectedIssue.apiName || selectedIssue.apiId
        }}</el-descriptions-item>
        <el-descriptions-item label="问题类型">{{ selectedIssue.issueType }}</el-descriptions-item>
        <el-descriptions-item label="问题描述">{{
          selectedIssue.description
        }}</el-descriptions-item>
        <el-descriptions-item label="当前状态">{{ selectedIssue.status }}</el-descriptions-item>
        <el-descriptions-item label="已有处理">{{
          selectedIssue.resolution || '暂无'
        }}</el-descriptions-item>
      </el-descriptions>
      <el-divider content-position="left">处理记录</el-divider>
      <el-form
        ref="resolutionFormRef"
        :model="resolutionForm"
        :rules="resolutionRules"
        label-width="90px"
      >
        <el-form-item label="处理说明" prop="resolution">
          <el-input
            v-model="resolutionForm.resolution"
            type="textarea"
            :rows="5"
            placeholder="填写修复、回归验证和影响说明"
            :disabled="isClosedIssue"
          />
        </el-form-item>
        <el-form-item>
          <el-button
            v-hasPermi="['data-market:acceptance:issue-handle']"
            type="primary"
            :disabled="isClosedIssue"
            :loading="resolving"
            @click="resolve"
            >提交处理结果</el-button
          >
        </el-form-item>
      </el-form>
    </template>
  </el-drawer>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useWindowSize } from '@vueuse/core'
import { useRoute, useRouter } from 'vue-router'
import * as DeliveryApi from '@/api/dataMarket/delivery'
import type { AcceptanceIssueVO, AcceptanceRoundVO } from '@/api/dataMarket/types'
import { useMessage } from '@/hooks/web/useMessage'
import { resolveRouteApplicationId } from '@/views/dataMarket/deliveryWorkbench/pageState'
import DataMarketManagementPage from '@/views/dataMarket/components/DataMarketManagementPage.vue'
import { canResubmitAcceptance } from './validation'

defineOptions({ name: 'DataMarketAcceptanceIssue' })
const message = useMessage()
const route = useRoute()
const router = useRouter()
const { width } = useWindowSize()
const applicationId = computed(() =>
  resolveRouteApplicationId(route.query.applicationId ?? route.params.applicationId)
)
const deliveryId = ref<number>()
const rounds = ref<AcceptanceRoundVO[]>([])
const loading = ref(false)
const loadError = ref(false)
const submitting = ref(false)
const resolving = ref(false)
const detailVisible = ref(false)
const selectedIssue = ref<AcceptanceIssueVO>()
const resolutionFormRef = ref<any>()
const resolutionForm = reactive({ resolution: '' })
const resolutionRules = {
  resolution: [{ required: true, message: '请输入处理说明', trigger: 'blur' }]
}
const latestRound = computed(() => rounds.value[0])
const responsiveColumns = computed(() => (width.value <= 1024 ? 1 : 3))
const issueRows = computed(() =>
  rounds.value.flatMap((round) =>
    round.issues.map((issue) => ({ ...issue, roundNo: round.roundNo }))
  )
)
const unresolvedIssues = computed(() =>
  issueRows.value.filter((issue) => issue.status !== 'RESOLVED' && issue.status !== 'CLOSED')
)
const canResubmit = computed(
  () => Boolean(latestRound.value) && canResubmitAcceptance(issueRows.value)
)
const isClosedIssue = computed(
  () => selectedIssue.value?.status === 'RESOLVED' || selectedIssue.value?.status === 'CLOSED'
)
const resubmitHint = computed(() =>
  canResubmit.value ? '全部问题已处理，可再次提交整包统一验收。' : '请先处理所有未关闭的验收问题。'
)
const issueTagType = (status: AcceptanceIssueVO['status']) =>
  status === 'RESOLVED' || status === 'CLOSED'
    ? 'success'
    : status === 'PROCESSING'
      ? 'warning'
      : 'danger'
const issueStatusLabels: Record<string, string> = {
  OPEN: '待处理',
  PROCESSING: '处理中',
  RESOLVED: '已解决',
  CLOSED: '已关闭'
}
const issueStatusLabel = (status: AcceptanceIssueVO['status']) =>
  issueStatusLabels[status] || status
const loadRounds = async () => {
  const id = applicationId.value
  if (!id) return message.warning('当前页面缺少申请 ID')
  loading.value = true
  loadError.value = false
  deliveryId.value = undefined
  rounds.value = []
  try {
    const workbench = await DeliveryApi.getApplicationDelivery(id)
    deliveryId.value = workbench.id
    rounds.value = await DeliveryApi.getDeliveryAcceptanceRounds(workbench.id)
  } catch {
    rounds.value = []
    loadError.value = true
  } finally {
    loading.value = false
  }
}
const openIssue = (issue: AcceptanceIssueVO) => {
  selectedIssue.value = issue
  resolutionForm.resolution = issue.resolution || ''
  detailVisible.value = true
}
const resolve = async () => {
  if (!(await resolutionFormRef.value.validate()) || !selectedIssue.value) return
  await message.confirm('确认提交该验收问题的处理结果吗？')
  resolving.value = true
  try {
    await DeliveryApi.resolveAcceptanceIssue(selectedIssue.value.id, resolutionForm.resolution)
    message.success('处理结果已提交')
    await loadRounds()
    detailVisible.value = false
  } finally {
    resolving.value = false
  }
}
const resubmit = async () => {
  if (!applicationId.value || !canResubmit.value) return
  await message.confirm('确认将整改后的整包 API 再次提交统一验收吗？')
  submitting.value = true
  try {
    await DeliveryApi.submitApplicationAcceptance(
      applicationId.value,
      '验收问题已处理，申请再次验收'
    )
    message.success('已再次提交统一验收')
    await loadRounds()
  } finally {
    submitting.value = false
  }
}
const goMessageCenter = () => router.push({ name: 'MyNotifyMessage' })
watch(
  applicationId,
  (id) => {
    if (id) {
      void loadRounds()
      return
    }
    deliveryId.value = undefined
    rounds.value = []
  },
  { immediate: true }
)
</script>

<style scoped lang="scss">
.acceptance-context {
  display: flex;
  padding-block: 14px !important;
  align-items: center;
  gap: 22px;

  > p {
    margin: 0;
    font-size: 13px;
    color: #718096;
    flex: 1;
  }
}

.acceptance-context__identity {
  display: flex;
  min-width: 190px;
  align-items: center;
  gap: 11px;

  > span {
    display: grid;
    width: 38px;
    height: 38px;
    color: #d97706;
    background: #fff0d6;
    border-radius: 9px;
    place-items: center;
  }

  div {
    display: grid;
    gap: 3px;
  }

  small {
    color: #8a96a8;
  }

  strong {
    color: #34425a;
  }
}

.acceptance-round-summary {
  margin-bottom: 16px;
}

.unresolved-count {
  color: #d97706;
}

.acceptance-resubmit {
  display: flex;
  padding: 16px 18px;
  margin-top: 16px;
  background: #fffaf0;
  border: 1px solid #f2dfbb;
  border-radius: 9px;
  align-items: center;
  justify-content: space-between;
  gap: 20px;

  > div {
    display: flex;
    color: #d97706;
    align-items: center;
    gap: 11px;
  }

  span {
    display: grid;
    gap: 3px;
  }

  strong {
    color: #4d3d23;
  }

  small {
    color: #8f8068;
  }

  &--ready {
    color: #0d9488;
    background: #effaf8;
    border-color: #ccebe5;

    > div {
      color: #0d9488;
    }

    strong {
      color: #24534c;
    }

    small {
      color: #668d87;
    }
  }
}

@media (width <= 720px) {
  .acceptance-context,
  .acceptance-resubmit {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
