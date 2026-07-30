<template>
  <ContentWrap>
    <el-alert
      title="按交付单加载服务端验收轮次；整改后仅当全部问题已处理，才可再次提交整包验收。"
      type="info"
      :closable="false"
      show-icon
    />
  </ContentWrap>
  <ContentWrap>
    <el-form :inline="true" class="-mb-15px">
      <el-form-item label="交付 ID">
        <el-input-number v-model="deliveryId" :min="1" placeholder="输入交付 ID" />
      </el-form-item>
      <el-form-item>
        <el-button
          v-hasPermi="['data-market:acceptance:issue-query']"
          type="primary"
          :loading="loading"
          @click="loadRounds"
        >
          <Icon icon="ep:search" class="mr-5px" />查询验收问题
        </el-button>
        <el-button @click="goMessageCenter"
          ><Icon icon="ep:bell" class="mr-5px" />消息中心</el-button
        >
      </el-form-item>
      <el-form-item v-if="rounds.length">
        <el-badge :value="unresolvedIssues.length" :hidden="!unresolvedIssues.length">
          <el-button type="warning" plain>未处理问题提醒</el-button>
        </el-badge>
      </el-form-item>
    </el-form>
  </ContentWrap>
  <ContentWrap>
    <el-empty v-if="!deliveryId && !loading" description="请输入交付 ID 查询验收轮次" />
    <template v-else>
      <el-descriptions v-if="rounds.length" :column="responsiveColumns" border class="mb-16px">
        <el-descriptions-item label="验收轮次">{{ latestRound?.roundNo }}</el-descriptions-item>
        <el-descriptions-item label="轮次状态">
          <el-tag>{{ latestRound?.status }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="未处理问题">{{
          unresolvedIssues.length
        }}</el-descriptions-item>
      </el-descriptions>
      <el-table v-loading="loading" :data="issueRows" empty-text="当前交付暂无验收问题">
        <el-table-column prop="roundNo" label="轮次" width="80" />
        <el-table-column prop="apiName" label="API" min-width="140" />
        <el-table-column prop="issueType" label="问题类型" width="130" />
        <el-table-column
          prop="description"
          label="问题描述"
          min-width="220"
          show-overflow-tooltip
        />
        <el-table-column prop="status" label="状态" width="120">
          <template #default="{ row }"
            ><el-tag :type="issueTagType(row.status)">{{ row.status }}</el-tag></template
          >
        </el-table-column>
        <el-table-column prop="assigneeUserId" label="处理人" width="100" />
        <el-table-column prop="createdAt" label="提出时间" width="180" />
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openIssue(row)">详情/处理</el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-alert
        v-if="latestRound"
        class="mt-16px"
        :title="resubmitHint"
        :type="canResubmit ? 'success' : 'warning'"
        :closable="false"
        show-icon
      />
      <div class="mt-16px flex justify-end">
        <el-button
          v-hasPermi="['data-market:acceptance:submit']"
          type="success"
          :disabled="!canResubmit || submitting"
          :loading="submitting"
          @click="resubmit"
          >再次提交统一验收</el-button
        >
      </div>
    </template>
  </ContentWrap>
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
import { computed, reactive, ref } from 'vue'
import { useWindowSize } from '@vueuse/core'
import { useRouter } from 'vue-router'
import * as DeliveryApi from '@/api/dataMarket/delivery'
import type { AcceptanceIssueVO, AcceptanceRoundVO } from '@/api/dataMarket/types'
import { useMessage } from '@/hooks/web/useMessage'
import { canResubmitAcceptance } from './validation'

defineOptions({ name: 'DataMarketAcceptanceIssue' })
const message = useMessage()
const router = useRouter()
const { width } = useWindowSize()
const deliveryId = ref<number>()
const rounds = ref<AcceptanceRoundVO[]>([])
const loading = ref(false)
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
const loadRounds = async () => {
  if (!deliveryId.value) return message.warning('请输入交付 ID')
  loading.value = true
  try {
    rounds.value = await DeliveryApi.getDeliveryAcceptanceRounds(deliveryId.value)
  } catch {
    rounds.value = []
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
  if (!deliveryId.value || !canResubmit.value) return
  await message.confirm('确认将整改后的整包 API 再次提交统一验收吗？')
  submitting.value = true
  try {
    await DeliveryApi.submitDeliveryAcceptance(deliveryId.value, '验收问题已处理，申请再次验收')
    message.success('已再次提交统一验收')
    await loadRounds()
  } finally {
    submitting.value = false
  }
}
const goMessageCenter = () => router.push({ name: 'MyNotifyMessage' })
</script>
