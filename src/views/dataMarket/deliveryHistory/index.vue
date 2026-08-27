<template>
  <DataMarketManagementPage
    page-key="delivery-history"
    title="交付配置"
    description="查询已交付 API 的配置、版本与验收记录"
    icon="ep:box"
    tone="teal"
  >
    <template #actions>
      <el-tag class="read-only-tag" type="info" effect="plain" round
        ><Icon icon="ep:view" />只读查询</el-tag
      >
      <el-button :loading="loading" @click="getList"><Icon icon="ep:refresh" />刷新</el-button>
    </template>

    <template #summary>
      <div class="dm-summary-item"
        ><span class="dm-summary-item__icon"><Icon icon="ep:box" /></span
        ><span class="dm-summary-item__content"
          ><small>历史配置</small><strong>{{ total }}</strong></span
        ></div
      >
      <div class="dm-summary-item"
        ><span class="dm-summary-item__icon"><Icon icon="ep:circle-check" /></span
        ><span class="dm-summary-item__content"
          ><small>本页已验收</small><strong>{{ currentAcceptedCount }}</strong></span
        ></div
      >
      <div class="dm-summary-item"
        ><span class="dm-summary-item__icon"><Icon icon="ep:warning" /></span
        ><span class="dm-summary-item__content"
          ><small>本页整改中</small><strong>{{ currentRectifyingCount }}</strong></span
        ></div
      >
    </template>

    <section class="dm-panel delivery-filter-panel">
      <header class="dm-panel__header"
        ><div
          ><h2>筛选交付记录</h2><p>支持按 API、申请单、交付单、状态和完成时间查询</p></div
        ></header
      >
      <el-form :inline="true" :model="query" class="delivery-filter-form">
        <el-form-item label="关键词"
          ><el-input
            v-model="query.keyword"
            clearable
            placeholder="API、申请单或交付单"
            @keyup.enter="handleQuery"
            ><template #prefix><Icon icon="ep:search" /></template></el-input
        ></el-form-item>
        <el-form-item label="交付状态"
          ><el-select v-model="query.deliveryStatus" clearable placeholder="全部"
            ><el-option
              v-for="status in deliveryStatuses"
              :key="status"
              :label="deliveryStatusLabel(status)"
              :value="status" /></el-select
        ></el-form-item>
        <el-form-item label="验收状态"
          ><el-select v-model="query.acceptanceStatus" clearable placeholder="全部"
            ><el-option
              v-for="status in acceptanceStatuses"
              :key="status"
              :label="acceptanceStatusLabel(status)"
              :value="status" /></el-select
        ></el-form-item>
        <el-form-item label="配置完成时间"
          ><el-date-picker
            v-model="query.completedAt"
            type="datetimerange"
            value-format="YYYY-MM-DD HH:mm:ss"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
        /></el-form-item>
        <el-form-item
          ><el-button
            v-hasPermi="['data-market:delivery:query']"
            type="primary"
            @click="handleQuery"
            >查询</el-button
          ><el-button @click="resetQuery">重置</el-button></el-form-item
        >
      </el-form>
    </section>

    <section class="dm-panel">
      <header class="dm-panel__header"
        ><div
          ><h2>API 交付历史</h2><p v-if="!pageError">共 {{ total }} 条历史配置</p
          ><p v-else>交付历史暂不可用</p></div
        ><el-tooltip content="配置内容只读，凭证仅显示脱敏值" placement="left"
          ><Icon class="delivery-security-icon" icon="ep:lock" /></el-tooltip
      ></header>
      <el-result
        v-if="pageError"
        class="dm-load-result"
        icon="warning"
        title="交付历史加载失败"
        :sub-title="pageError"
        ><template #extra
          ><el-button type="primary" @click="getList">重新加载</el-button></template
        ></el-result
      >
      <template v-else>
        <div class="dm-table-wrap">
          <el-table
            v-loading="loading"
            :data="list"
            empty-text="暂无已完成配置的 API"
            table-layout="fixed"
          >
            <el-table-column label="API" min-width="240"
              ><template #default="{ row }"
                ><div class="dm-entity-cell"
                  ><span class="dm-entity-mark">API</span
                  ><span class="dm-entity-copy"
                    ><strong>{{ row.apiName }}</strong
                    ><small>{{ row.apiNo }}</small></span
                  ></div
                ></template
              ></el-table-column
            >
            <el-table-column label="申请单" min-width="190"
              ><template #default="{ row }"
                ><div>{{ row.applicationNo }}</div
                ><div class="dm-secondary">{{ row.applicationName }}</div></template
              ></el-table-column
            >
            <el-table-column label="交付批次" min-width="175"
              ><template #default="{ row }"
                ><div class="dm-code">{{ row.deliveryNo }}</div
                ><div class="dm-secondary">{{
                  deliveryStatusLabel(row.deliveryStatus)
                }}</div></template
              ></el-table-column
            >
            <el-table-column label="当前版本" min-width="190"
              ><template #default="{ row }"
                ><div>{{ row.versionNo || '—' }}</div
                ><div class="dm-secondary endpoint-text">{{
                  formatApiEndpoint(row.method, row.requestPath)
                }}</div></template
              ></el-table-column
            >
            <el-table-column label="验收状态" width="130" align="center"
              ><template #default="{ row }"
                ><el-tag
                  :type="row.acceptanceStatus === 'ACCEPTED' ? 'success' : 'warning'"
                  effect="light"
                  round
                  >{{ acceptanceStatusLabel(row.acceptanceStatus) }}</el-tag
                ></template
              ></el-table-column
            >
            <el-table-column label="配置完成时间" min-width="180"
              ><template #default="{ row }">{{
                formatTimestamp(row.apiConfigCompletedAt)
              }}</template></el-table-column
            >
            <el-table-column label="操作" width="100" align="right"
              ><template #default="{ row }"
                ><el-button
                  v-hasPermi="['data-market:delivery:query']"
                  link
                  type="primary"
                  @click="openDetail(row.apiId)"
                  >查看详情</el-button
                ></template
              ></el-table-column
            >
          </el-table>
        </div>
        <Pagination
          v-model:limit="query.pageSize"
          v-model:page="query.pageNo"
          :total="total"
          @pagination="getList"
        />
      </template>
    </section>
  </DataMarketManagementPage>

  <Dialog
    v-model="detailVisible"
    title="API 历史配置详情"
    width="min(1180px, calc(100vw - 32px))"
    align-center
  >
    <div v-loading="detailLoading" class="detail-body">
      <el-alert
        v-if="detailError"
        :title="detailError"
        type="error"
        :closable="false"
        class="mb-12px"
      />
      <template v-if="detail">
        <el-descriptions title="交付概览" :column="3" border>
          <el-descriptions-item label="API"
            >{{ detail.summary.apiNo }} · {{ detail.summary.apiName }}</el-descriptions-item
          >
          <el-descriptions-item label="申请单">{{
            detail.summary.applicationNo
          }}</el-descriptions-item>
          <el-descriptions-item label="交付批次">{{
            detail.summary.deliveryNo
          }}</el-descriptions-item>
          <el-descriptions-item label="接口">{{
            formatApiEndpoint(detail.summary.method, detail.summary.requestPath)
          }}</el-descriptions-item>
          <el-descriptions-item label="配置完成">{{
            formatTimestamp(detail.summary.apiConfigCompletedAt)
          }}</el-descriptions-item>
          <el-descriptions-item label="验收状态">{{
            acceptanceStatusLabel(detail.summary.acceptanceStatus)
          }}</el-descriptions-item>
        </el-descriptions>

        <el-tabs class="mt-16px">
          <el-tab-pane label="接口说明">
            <el-descriptions v-if="currentVersion" :column="2" border>
              <el-descriptions-item label="版本号">{{
                currentVersion.versionNo
              }}</el-descriptions-item>
              <el-descriptions-item label="状态">{{ currentVersion.status }}</el-descriptions-item>
              <el-descriptions-item label="公开地址">{{
                currentVersion.publicBaseUrl
              }}</el-descriptions-item>
              <el-descriptions-item label="认证方式">{{
                currentVersion.authType
              }}</el-descriptions-item>
              <el-descriptions-item label="请求说明">{{
                currentVersion.requestDescription || '—'
              }}</el-descriptions-item>
              <el-descriptions-item label="返回说明">{{
                currentVersion.responseDescription || '—'
              }}</el-descriptions-item>
              <el-descriptions-item label="成功说明">{{
                currentVersion.successDescription || '—'
              }}</el-descriptions-item>
              <el-descriptions-item label="失败说明">{{
                currentVersion.failureDescription || '—'
              }}</el-descriptions-item>
            </el-descriptions>
            <el-empty v-else description="暂无版本配置" />
          </el-tab-pane>
          <el-tab-pane label="策略与 OpenAPI">
            <template v-if="currentVersion">
              <h4>OpenAPI 文档</h4
              ><pre class="json-view">{{ prettyJson(currentVersion.openapiDocument) }}</pre>
              <h4>限流策略</h4
              ><pre class="json-view">{{ prettyJson(currentVersion.rateLimitPolicy) }}</pre>
              <h4>黑白名单与网络策略</h4
              ><pre class="json-view">{{ prettyJson(currentVersion.networkPolicy) }}</pre>
            </template>
            <el-empty v-else description="暂无策略配置" />
          </el-tab-pane>
          <el-tab-pane :label="DATA_MARKET_ONLINE_DEBUG_ENABLED ? '运行绑定与血缘' : '数据血缘'">
            <!-- 在线调试能力暂时隐藏；历史绑定数据仍保留在接口和模型中。 -->
            <template v-if="DATA_MARKET_ONLINE_DEBUG_ENABLED">
              <el-table
                :data="currentVersion?.runtimeBindings || []"
                size="small"
                empty-text="暂无运行绑定"
              >
                <el-table-column prop="environment" label="环境" />
                <el-table-column prop="upstreamTargetRef" label="受保护上游引用" min-width="240" />
                <el-table-column prop="timeoutMs" label="超时 ms" />
                <el-table-column prop="status" label="状态" />
              </el-table>
              <el-divider />
            </template>
            <el-table :data="currentVersion?.lineage || []" size="small" empty-text="暂无血缘配置">
              <el-table-column prop="sourceType" label="来源类型" />
              <el-table-column prop="sourceId" label="来源标识" />
              <el-table-column prop="role" label="角色" />
              <el-table-column prop="description" label="说明" />
            </el-table>
          </el-tab-pane>
          <el-tab-pane label="凭证（脱敏）">
            <el-table :data="detail.api.credentials" size="small" empty-text="暂无凭证">
              <el-table-column prop="credentialNo" label="凭证编号" min-width="150" />
              <el-table-column prop="name" label="凭证名称" />
              <el-table-column prop="authType" label="认证方式" />
              <el-table-column prop="appKey" label="App Key" min-width="150" />
              <el-table-column prop="secretMasked" label="密钥（脱敏）" min-width="160" />
              <el-table-column prop="status" label="状态" />
              <el-table-column label="有效期" min-width="260">
                <template #default="{ row }"
                  >{{ formatTimestamp(row.effectiveAt) }} 至
                  {{ formatTimestamp(row.expiresAt) }}</template
                >
              </el-table-column>
            </el-table>
          </el-tab-pane>
        </el-tabs>
      </template>
    </div>
  </Dialog>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import * as DeliveryApi from '@/api/dataMarket/delivery'
import { DATA_MARKET_ONLINE_DEBUG_ENABLED } from '@/config/dataMarketFeatures'
import type {
  DeliveredApiAcceptanceStatus,
  DeliveredApiHistoryDetailVO,
  DeliveredApiHistoryPageReq,
  DeliveredApiHistorySummaryVO
} from '@/api/dataMarket/types'
import {
  acceptanceStatusLabel,
  formatApiEndpoint,
  formatTimestamp,
  prettyJson
} from './presentation'
import DataMarketManagementPage from '@/views/dataMarket/components/DataMarketManagementPage.vue'

defineOptions({ name: 'DataMarketDeliveryHistory' })

const acceptanceStatuses: DeliveredApiAcceptanceStatus[] = [
  'NOT_SUBMITTED',
  'PENDING_ACCEPTANCE',
  'RECTIFYING',
  'ACCEPTED'
]
const deliveryStatuses = ['CREATED', 'CONFIGURING', 'PENDING_ACCEPTANCE', 'RECTIFYING', 'DELIVERED']
const query = reactive<DeliveredApiHistoryPageReq>({ pageNo: 1, pageSize: 10 })
const loading = ref(false)
const pageError = ref('')
const list = ref<DeliveredApiHistorySummaryVO[]>([])
const total = ref(0)
const detailVisible = ref(false)
const detailLoading = ref(false)
const detailError = ref('')
const detail = ref<DeliveredApiHistoryDetailVO>()
const currentVersion = computed(() => {
  if (!detail.value) return undefined
  return (
    detail.value.api.versions.find(
      (version) => version.id === detail.value?.summary.deliveryVersionId
    ) || detail.value.api.versions[0]
  )
})
const currentAcceptedCount = computed(
  () => list.value.filter((item) => item.acceptanceStatus === 'ACCEPTED').length
)
const currentRectifyingCount = computed(
  () => list.value.filter((item) => item.acceptanceStatus === 'RECTIFYING').length
)
const deliveryStatusLabels: Record<string, string> = {
  CREATED: '已创建',
  CONFIGURING: '配置中',
  PENDING_ACCEPTANCE: '待验收',
  RECTIFYING: '整改中',
  DELIVERED: '已交付'
}
const deliveryStatusLabel = (status?: string) =>
  status ? deliveryStatusLabels[status] || status : '—'

const getList = async () => {
  loading.value = true
  pageError.value = ''
  try {
    const data = await DeliveryApi.getDeliveredApiHistoryPage(query)
    list.value = data.list
    total.value = data.total
  } catch {
    list.value = []
    total.value = 0
    pageError.value = '已配置 API 历史加载失败，请稍后重试'
  } finally {
    loading.value = false
  }
}
const handleQuery = () => {
  query.pageNo = 1
  void getList()
}
const resetQuery = () => {
  Object.assign(query, {
    pageNo: 1,
    pageSize: query.pageSize,
    keyword: undefined,
    deliveryStatus: undefined,
    acceptanceStatus: undefined,
    completedAt: undefined
  })
  void getList()
}
const openDetail = async (apiId: number) => {
  detailVisible.value = true
  detailLoading.value = true
  detailError.value = ''
  detail.value = undefined
  try {
    detail.value = await DeliveryApi.getDeliveredApiHistoryDetail(apiId)
  } catch {
    detailError.value = 'API 配置详情加载失败，请稍后重试'
  } finally {
    detailLoading.value = false
  }
}

onMounted(getList)
</script>

<style scoped lang="scss">
.read-only-tag {
  min-height: 32px;
  padding-inline: 12px;

  :deep(.el-tag__content) {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
}

.delivery-filter-panel {
  padding-bottom: 8px !important;
}

.delivery-filter-form :deep(.el-form-item) {
  margin-bottom: 14px;
}

.delivery-filter-form :deep(.el-input) {
  width: 220px;
}

.delivery-filter-form :deep(.el-select) {
  width: 155px;
}

.delivery-security-icon {
  font-size: 20px;
  color: #0d9488;
}

.endpoint-text {
  font-family: SFMono-Regular, Consolas, monospace;
}

.detail-body {
  min-height: 240px;
}

.json-view {
  max-height: 320px;
  padding: 12px;
  margin: 8px 0 16px;
  overflow: auto;
  word-break: break-all;
  white-space: pre-wrap;
  background: var(--el-fill-color-light);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 6px;
}
</style>
