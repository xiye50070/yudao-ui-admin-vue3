<template>
  <main class="workbench">
    <header class="workbench-header">
      <div>
        <h1>数据市场运营工作台</h1>
        <p class="subtitle">聚焦待处理事项，贯通申请、交付与验收</p>
      </div>
      <div class="header-actions">
        <div class="data-status" :class="{ 'is-error': hasLoadError }">
          <span class="status-dot"></span>
          <span>{{ dataStatusLabel }}</span>
          <span v-if="lastUpdatedLabel" class="status-time">{{ lastUpdatedLabel }}</span>
        </div>
        <button
          v-if="applicationAvailable"
          class="primary-action"
          type="button"
          @click="navigateTo('DataMarketApplication')"
        >
          处理待办
          <Icon icon="ep:arrow-right" :size="16" />
        </button>
        <button
          v-if="hasAnyWorkbenchModule"
          class="refresh-action"
          type="button"
          aria-label="刷新工作台数据"
          :disabled="refreshing"
          @click="refreshWorkbench"
        >
          <Icon icon="ep:refresh" :size="18" :class="{ spinning: refreshing }" />
        </button>
      </div>
    </header>

    <section v-if="applicationAvailable" class="focus-panel" aria-labelledby="focus-title">
      <div class="panel-heading">
        <div>
          <h2 id="focus-title">当前运营焦点</h2>
        </div>
        <span class="source-badge">
          <Icon icon="ep:connection" :size="15" />
          申请管理实时接口
        </span>
      </div>

      <div v-if="applicationState === 'error'" class="panel-unavailable">
        <span><Icon icon="ep:warning" :size="22" /></span>
        <div>
          <strong>申请与交付数据暂不可用</strong>
          <p>已保留其他可用模块，可稍后单独刷新此区域。</p>
        </div>
      </div>

      <div v-else class="focus-layout" :class="{ 'is-loading': applicationState === 'loading' }">
        <aside class="focus-summary" data-testid="focus-total">
          <span class="focus-label">当前处理中</span>
          <div class="focus-number">
            {{ applicationState === 'ready' ? formatNumber(focusTotal) : '—' }}
            <small>项</small>
          </div>
          <p>来自申请状态的实时汇总</p>
          <dl class="focus-breakdown">
            <div v-for="item in focusBreakdown" :key="item.key">
              <dt>{{ item.label }}</dt>
              <dd>{{ applicationState === 'ready' ? formatNumber(item.value) : '—' }}</dd>
            </div>
          </dl>
        </aside>

        <div class="process-track" aria-label="申请交付流程">
          <template v-for="(stage, index) in processStages" :key="stage.key">
            <article
              class="process-stage"
              :class="{ 'is-complete': stage.key === 'completed' }"
              :data-testid="`stage-${stage.key}`"
            >
              <span class="stage-icon"><Icon :icon="stage.icon" :size="25" /></span>
              <h3>{{ stage.label }}</h3>
              <p>
                <strong>{{
                  applicationState === 'ready' ? formatNumber(stage.total) : '—'
                }}</strong>
                <span>项</span>
              </p>
              <small>{{ stage.description }}</small>
            </article>
            <span v-if="index < processStages.length - 1" class="process-connector">
              <Icon icon="ep:arrow-right" :size="19" />
            </span>
          </template>
        </div>
      </div>
    </section>

    <section v-if="!hasAnyWorkbenchModule" class="empty-workbench">
      <span><Icon icon="ep:lock" :size="26" /></span>
      <div>
        <h2>暂无可展示的数据市场模块</h2>
        <p>首页会根据当前账号的菜单与数据权限自动呈现可用内容。</p>
      </div>
    </section>

    <div v-if="hasMainContent" class="content-grid">
      <section v-if="applicationAvailable" class="content-card application-card">
        <div class="card-heading">
          <div>
            <h2>申请与交付进展</h2>
            <span>按更新时间展示当前处理中的记录</span>
          </div>
          <button class="text-action" type="button" @click="navigateTo('DataMarketApplication')">
            查看全部
            <Icon icon="ep:arrow-right" :size="15" />
          </button>
        </div>

        <div v-if="applicationState === 'error'" class="inline-state">
          <Icon icon="ep:warning" :size="18" />
          申请列表暂不可用
        </div>
        <div
          v-else-if="applicationState === 'loading'"
          class="table-loading"
          aria-label="申请数据加载中"
        >
          <span v-for="index in 5" :key="index"></span>
        </div>
        <div v-else-if="applicationRows.length" class="table-shell">
          <table>
            <thead>
              <tr>
                <th>申请单号</th>
                <th>申请名称</th>
                <th>申请类型</th>
                <th>当前环节</th>
                <th>数据集</th>
                <th>更新时间</th>
                <th class="action-column">操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in applicationRows" :key="row.id">
                <td class="application-no" :title="row.applicationNo">{{ row.applicationNo }}</td>
                <td class="application-name" :title="row.name">{{ row.name }}</td>
                <td>{{ getApplicationTypeLabel(row.applicationType) }}</td>
                <td>
                  <span class="status-pill" :class="`is-${getStatusTone(row.status)}`">
                    {{ getApplicationStatusLabel(row.status) }}
                  </span>
                </td>
                <td>{{ row.datasetCount ?? '—' }}</td>
                <td class="update-time">{{ formatUpdateTime(row.updateTime) }}</td>
                <td class="action-column">
                  <button
                    class="row-action"
                    type="button"
                    @click="navigateTo('DataMarketApplication')"
                  >
                    查看
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-else class="inline-state is-empty">
          <Icon icon="ep:circle-check" :size="20" />
          当前没有处理中的申请
        </div>
      </section>

      <aside v-if="assetMetrics.length || quickEntries.length" class="side-stack">
        <section v-if="assetMetrics.length" class="content-card asset-card">
          <div class="card-heading">
            <div>
              <h2>资产基座</h2>
            </div>
          </div>
          <div class="asset-grid">
            <article
              v-for="metric in assetMetrics"
              :key="metric.key"
              class="asset-metric"
              :data-testid="`metric-${metric.key}`"
            >
              <span class="metric-icon" :style="{ color: metric.color }">
                <Icon :icon="metric.icon" :size="23" />
              </span>
              <strong v-if="metric.state === 'ready'">{{ formatNumber(metric.value ?? 0) }}</strong>
              <strong v-else-if="metric.state === 'error'" class="metric-unavailable">
                暂不可用
              </strong>
              <strong v-else class="metric-loading">—</strong>
              <span>{{ metric.label }}</span>
            </article>
          </div>
        </section>

        <section v-if="quickEntries.length" class="content-card quick-card">
          <div class="card-heading">
            <div>
              <h2>快速进入</h2>
            </div>
          </div>
          <div class="quick-grid">
            <button
              v-for="entry in quickEntries"
              :key="entry.routeName"
              type="button"
              @click="navigateTo(entry.routeName)"
            >
              <span><Icon :icon="entry.icon" :size="20" /></span>
              <strong>{{ entry.label }}</strong>
              <Icon icon="ep:arrow-right" :size="15" class="quick-arrow" />
            </button>
          </div>
        </section>
      </aside>
    </div>

    <section v-if="noticeAvailable" class="content-card notice-card">
      <div class="card-heading">
        <div>
          <h2>系统公告</h2>
        </div>
        <button class="text-action" type="button" @click="navigateTo('SystemNotice')">
          查看全部
          <Icon icon="ep:arrow-right" :size="15" />
        </button>
      </div>
      <div v-if="noticeState === 'error'" class="inline-state">
        <Icon icon="ep:warning" :size="18" />
        公告数据暂不可用
      </div>
      <div v-else-if="noticeState === 'loading'" class="notice-loading" aria-label="公告加载中">
        <span></span>
        <span></span>
      </div>
      <div v-else-if="notices.length" class="notice-list">
        <button
          v-for="notice in notices"
          :key="notice.id"
          type="button"
          @click="navigateTo('SystemNotice')"
        >
          <span class="notice-icon"><Icon icon="ep:bell" :size="19" /></span>
          <span class="notice-type" :class="{ 'is-announcement': notice.type === 2 }">
            {{ getNoticeTypeLabel(notice.type) }}
          </span>
          <strong :title="notice.title">{{ notice.title }}</strong>
          <time>{{ formatNoticeDate(notice.createTime) }}</time>
        </button>
      </div>
      <div v-else class="inline-state is-empty">
        <Icon icon="ep:circle-check" :size="20" />
        暂无有效公告
      </div>
    </section>
  </main>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import * as CatalogApi from '@/api/dataMarket/catalog'
import * as DeliveryApi from '@/api/dataMarket/delivery'
import * as MasterDataApi from '@/api/dataMarket/masterData'
import type {
  ApplicationStatus,
  ApplicationSummaryVO,
  ApplicationType,
  PageResult
} from '@/api/dataMarket/types'
import * as NoticeApi from '@/api/system/notice'
import type { NoticeVO } from '@/api/system/notice'
import { useUserStore } from '@/store/modules/user'
import { formatDate } from '@/utils/formatTime'
import { getApplicationStatusLabel } from '@/views/dataMarket/application/filters'

defineOptions({ name: 'Index' })

type LoadState = 'idle' | 'loading' | 'ready' | 'error'

interface ModuleCapability {
  routeName: string
  permission: string
}

interface ProcessStageDefinition {
  key: 'intake' | 'approval' | 'delivery' | 'acceptance' | 'completed'
  label: string
  description: string
  icon: string
  statuses: ApplicationStatus[]
}

interface ProcessStage extends ProcessStageDefinition {
  total: number
}

interface AssetMetricDefinition extends ModuleCapability {
  key: 'dataset' | 'domain' | 'source' | 'master'
  label: string
  icon: string
  color: string
  load: () => Promise<number>
}

interface AssetMetric extends Omit<AssetMetricDefinition, 'load' | 'routeName' | 'permission'> {
  value?: number
  state: LoadState
}

interface QuickEntry extends ModuleCapability {
  label: string
  icon: string
}

const APPLICATION_CAPABILITY: ModuleCapability = {
  routeName: 'DataMarketApplication',
  permission: 'data-market:application:management-query'
}

const NOTICE_CAPABILITY: ModuleCapability = {
  routeName: 'SystemNotice',
  permission: 'system:notice:query'
}

const PROCESS_STAGE_DEFINITIONS: ProcessStageDefinition[] = [
  {
    key: 'intake',
    label: '申请受理',
    description: '提交与补充',
    icon: 'ep:document',
    statuses: ['SUBMITTING', 'SUBMIT_FAILED', 'RETURNED_SUPPLEMENT']
  },
  {
    key: 'approval',
    label: '统一审批',
    description: '审批处理中',
    icon: 'ep:user-filled',
    statuses: ['IN_APPROVAL']
  },
  {
    key: 'delivery',
    label: '交付配置',
    description: '待完成交付',
    icon: 'ep:setting',
    statuses: ['CONFIGURING']
  },
  {
    key: 'acceptance',
    label: '业务验收',
    description: '待验收与整改',
    icon: 'ep:circle-check',
    statuses: ['PENDING_ACCEPTANCE', 'RECTIFYING']
  },
  {
    key: 'completed',
    label: '交付完成',
    description: '已交付与完成',
    icon: 'ep:collection',
    statuses: ['DELIVERED', 'COMPLETED']
  }
]

const ACTIVE_APPLICATION_STATUSES: ApplicationStatus[] = [
  'SUBMITTING',
  'SUBMIT_FAILED',
  'IN_APPROVAL',
  'RETURNED_SUPPLEMENT',
  'CONFIGURING',
  'PENDING_ACCEPTANCE',
  'RECTIFYING'
]

const ASSET_METRIC_DEFINITIONS: AssetMetricDefinition[] = [
  {
    key: 'dataset',
    label: '数据集',
    icon: 'ep:coin',
    color: '#1677ff',
    routeName: 'DataMarketDataset',
    permission: 'data-market:dataset:query',
    load: async () => (await CatalogApi.getDatasetPage({ pageNo: 1, pageSize: 1 })).total
  },
  {
    key: 'domain',
    label: '主题域',
    icon: 'ep:collection-tag',
    color: '#18a6a9',
    routeName: 'DataMarketDomain',
    permission: 'data-market:domain:query',
    load: async () => (await CatalogApi.getSubjectDomainList()).length
  },
  {
    key: 'source',
    label: '来源系统',
    icon: 'ep:monitor',
    color: '#6c63ff',
    routeName: 'DataMarketSourceSystem',
    permission: 'data-market:source-system:query',
    load: async () => (await CatalogApi.getSourceSystemPage({ pageNo: 1, pageSize: 1 })).total
  },
  {
    key: 'master',
    label: '主数据对象',
    icon: 'ep:share',
    color: '#e88916',
    routeName: 'DataMarketMasterData',
    permission: 'data-market:master-data:query',
    load: async () => (await MasterDataApi.getMasterObjectPage({ pageNo: 1, pageSize: 1 })).total
  }
]

const QUICK_ENTRY_DEFINITIONS: QuickEntry[] = [
  {
    label: '目录总览',
    icon: 'ep:grid',
    routeName: 'DataMarketCatalog',
    permission: 'data-market:catalog:query'
  },
  {
    label: '申请管理',
    icon: 'ep:document',
    routeName: 'DataMarketApplication',
    permission: 'data-market:application:management-query'
  },
  {
    label: '数据集管理',
    icon: 'ep:coin',
    routeName: 'DataMarketDataset',
    permission: 'data-market:dataset:query'
  },
  {
    label: '交付配置',
    icon: 'ep:set-up',
    routeName: 'DataMarketDeliveryHistory',
    permission: 'data-market:delivery:query'
  },
  {
    label: '主数据管理',
    icon: 'ep:share',
    routeName: 'DataMarketMasterData',
    permission: 'data-market:master-data:query'
  },
  {
    label: '验收问题',
    icon: 'ep:warning',
    routeName: 'DataMarketAcceptanceIssue',
    permission: 'data-market:acceptance:issue-query'
  }
]

const router = useRouter()
const userStore = useUserStore()
const routeNames = new Set(
  router
    .getRoutes()
    .map((route) => route.name)
    .filter((name): name is string | symbol => name !== undefined)
    .map(String)
)

const hasPermission = (permission: string) =>
  userStore.permissions.has('*:*:*') || userStore.permissions.has(permission)
const canAccess = (capability: ModuleCapability) =>
  routeNames.has(capability.routeName) && hasPermission(capability.permission)

const applicationAvailable = canAccess(APPLICATION_CAPABILITY)
const noticeAvailable = canAccess(NOTICE_CAPABILITY)
const availableAssetDefinitions = ASSET_METRIC_DEFINITIONS.filter(canAccess)
const quickEntries = QUICK_ENTRY_DEFINITIONS.filter(canAccess)
const hasAnyWorkbenchModule =
  applicationAvailable ||
  noticeAvailable ||
  availableAssetDefinitions.length > 0 ||
  quickEntries.length > 0
const hasMainContent =
  applicationAvailable || availableAssetDefinitions.length > 0 || quickEntries.length > 0

const applicationState = ref<LoadState>(applicationAvailable ? 'loading' : 'idle')
const applicationRows = ref<ApplicationSummaryVO[]>([])
const processStages = ref<ProcessStage[]>(
  PROCESS_STAGE_DEFINITIONS.map((stage) => ({ ...stage, total: 0 }))
)
const assetMetrics = ref<AssetMetric[]>(
  availableAssetDefinitions.map(
    ({ load: _load, routeName: _routeName, permission: _permission, ...metric }) => ({
      ...metric,
      state: 'loading'
    })
  )
)
const noticeState = ref<LoadState>(noticeAvailable ? 'loading' : 'idle')
const notices = ref<NoticeVO[]>([])
const refreshing = ref(false)
const lastUpdatedAt = ref<Date>()

const stageTotal = (key: ProcessStage['key']) =>
  processStages.value.find((stage) => stage.key === key)?.total ?? 0
const focusTotal = computed(
  () =>
    stageTotal('intake') +
    stageTotal('approval') +
    stageTotal('delivery') +
    stageTotal('acceptance')
)
const focusBreakdown = computed(() => [
  { key: 'approval', label: '待审批', value: stageTotal('approval') },
  { key: 'delivery', label: '待交付', value: stageTotal('delivery') },
  { key: 'acceptance', label: '待验收 / 整改', value: stageTotal('acceptance') }
])
const hasLoadError = computed(
  () =>
    applicationState.value === 'error' ||
    noticeState.value === 'error' ||
    assetMetrics.value.some((metric) => metric.state === 'error')
)
const hasReadyData = computed(
  () =>
    applicationState.value === 'ready' ||
    noticeState.value === 'ready' ||
    assetMetrics.value.some((metric) => metric.state === 'ready')
)
const dataStatusLabel = computed(() => {
  if (refreshing.value) return '数据更新中'
  if (hasLoadError.value && hasReadyData.value) return '部分数据可用'
  if (hasLoadError.value) return '数据暂不可用'
  if (hasReadyData.value) return '接口实时数据'
  return '按权限展示'
})
const lastUpdatedLabel = computed(() => {
  if (!lastUpdatedAt.value || refreshing.value) return ''
  return formatDate(lastUpdatedAt.value, 'HH:mm')
})

const formatNumber = (value: number) =>
  new Intl.NumberFormat('zh-CN', { maximumFractionDigits: 0 }).format(value)
const applicationTypeLabels: Record<ApplicationType, string> = {
  CREATE: '新建',
  CHANGE: '变更',
  RENEW: '续期',
  DEACTIVATE: '停用'
}
const getApplicationTypeLabel = (type: ApplicationType) => applicationTypeLabels[type] || type
const getStatusTone = (status: ApplicationStatus) => {
  if (['DELIVERED', 'COMPLETED'].includes(status)) return 'success'
  if (['SUBMIT_FAILED', 'RETURNED_SUPPLEMENT', 'RECTIFYING'].includes(status)) return 'warning'
  if (['REJECTED', 'CANCELLED'].includes(status)) return 'muted'
  return 'processing'
}
const formatUpdateTime = (value: string) => formatDate(value, 'YYYY-MM-DD HH:mm')
const formatNoticeDate = (value: Date) => formatDate(value, 'YYYY-MM-DD')
const getNoticeTypeLabel = (type: number) => (type === 1 ? '通知' : type === 2 ? '公告' : '消息')

const navigateTo = (routeName: string) => {
  if (routeNames.has(routeName)) void router.push({ name: routeName })
}

const loadApplications = async () => {
  if (!applicationAvailable) return
  applicationState.value = 'loading'
  try {
    const [stageResults, pageResult] = await Promise.all([
      Promise.all(
        PROCESS_STAGE_DEFINITIONS.map(async (stage) => {
          const result = await DeliveryApi.getApplicationPage({
            pageNo: 1,
            pageSize: 1,
            statuses: [...stage.statuses],
            updateTimeSort: 'DESC'
          })
          return { ...stage, total: result.total }
        })
      ),
      DeliveryApi.getApplicationPage({
        pageNo: 1,
        pageSize: 5,
        statuses: [...ACTIVE_APPLICATION_STATUSES],
        updateTimeSort: 'DESC'
      })
    ])
    processStages.value = stageResults
    applicationRows.value = pageResult.list
    applicationState.value = 'ready'
  } catch {
    applicationRows.value = []
    processStages.value = PROCESS_STAGE_DEFINITIONS.map((stage) => ({ ...stage, total: 0 }))
    applicationState.value = 'error'
  }
}

const loadAssets = async () => {
  await Promise.all(
    availableAssetDefinitions.map(async (definition) => {
      const metric = assetMetrics.value.find((item) => item.key === definition.key)
      if (!metric) return
      metric.state = 'loading'
      metric.value = undefined
      try {
        const value = await definition.load()
        if (!Number.isFinite(value) || value < 0) throw new Error('Invalid total')
        metric.value = value
        metric.state = 'ready'
      } catch {
        metric.state = 'error'
      }
    })
  )
}

const loadNotices = async () => {
  if (!noticeAvailable) return
  noticeState.value = 'loading'
  try {
    const result = (await NoticeApi.getNoticePage({
      pageNo: 1,
      pageSize: 10
    })) as PageResult<NoticeVO>
    notices.value = result.list.filter((notice) => notice.status === 0).slice(0, 3)
    noticeState.value = 'ready'
  } catch {
    notices.value = []
    noticeState.value = 'error'
  }
}

const refreshWorkbench = async () => {
  if (refreshing.value) return
  refreshing.value = true
  await Promise.all([loadApplications(), loadAssets(), loadNotices()])
  if (hasReadyData.value) lastUpdatedAt.value = new Date()
  refreshing.value = false
}

onMounted(() => void refreshWorkbench())
</script>

<style lang="scss" scoped>
.workbench {
  --wb-primary: var(--el-color-primary, #1677ff);
  --wb-ink: #13233a;
  --wb-muted: #68778d;
  --wb-line: #e5ebf2;

  min-width: 0;
  color: var(--wb-ink);
}

.workbench button {
  font: inherit;
}

.workbench-header {
  display: flex;
  min-height: 68px;
  padding: 3px 6px 0;
  margin-bottom: 14px;
  align-items: flex-start;
  justify-content: space-between;
  gap: 28px;
}

.workbench-header h1 {
  margin: 0;
  font-size: clamp(25px, 2vw, 32px);
  font-weight: 750;
  line-height: 1.2;
  letter-spacing: -0.025em;
  color: #0e2038;
}

.subtitle {
  margin: 7px 0 0;
  font-size: 14px;
  color: #5f6e82;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  padding-top: 10px;
}

.data-status {
  display: flex;
  min-height: 36px;
  padding: 0 10px;
  font-size: 13px;
  color: #3e5066;
  white-space: nowrap;
  align-items: center;
  gap: 7px;
}

.status-dot {
  width: 8px;
  height: 8px;
  background: #13a673;
  border-radius: 50%;
  box-shadow: 0 0 0 4px rgb(19 166 115 / 10%);
}

.data-status.is-error .status-dot {
  background: #e88916;
  box-shadow: 0 0 0 4px rgb(232 137 22 / 11%);
}

.status-time {
  color: #8b98aa;
  font-variant-numeric: tabular-nums;
}

.primary-action,
.refresh-action,
.text-action,
.row-action {
  cursor: pointer;
  border: 0;
}

.primary-action {
  display: inline-flex;
  height: 42px;
  padding: 0 18px;
  font-size: 14px;
  font-weight: 650;
  color: #fff;
  background: var(--wb-primary);
  border-radius: 9px;
  box-shadow: 0 8px 18px rgb(22 119 255 / 18%);
  transition:
    transform 160ms ease,
    box-shadow 160ms ease;
  align-items: center;
  gap: 7px;
}

.primary-action:hover {
  transform: translateY(-1px);
  box-shadow: 0 10px 22px rgb(22 119 255 / 25%);
}

.refresh-action {
  display: inline-flex;
  width: 42px;
  height: 42px;
  color: #5e6e82;
  background: #fff;
  border: 1px solid #dbe4ee;
  border-radius: 9px;
  align-items: center;
  justify-content: center;
}

.refresh-action:disabled {
  cursor: wait;
  opacity: 0.65;
}

.spinning {
  animation: spin 800ms linear infinite;
}

.focus-panel {
  padding: 17px 20px;
  margin-bottom: 16px;
  overflow: hidden;
  background: linear-gradient(135deg, #eff7ff 0%, #e2f0ff 100%);
  border: 1px solid #cfe2f5;
  border-radius: 17px;
  box-shadow: 0 10px 28px rgb(43 92 139 / 8%);
}

.panel-heading,
.card-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18px;
}

.panel-heading {
  margin-bottom: 11px;
}

.focus-panel h2,
.content-card h2,
.empty-workbench h2 {
  margin: 0;
  font-size: 17px;
  font-weight: 700;
  letter-spacing: -0.01em;
  color: #17283f;
}

.source-badge {
  display: inline-flex;
  padding: 6px 9px;
  font-size: 12px;
  color: #52708f;
  background: rgb(255 255 255 / 62%);
  border: 1px solid rgb(74 140 202 / 18%);
  border-radius: 7px;
  align-items: center;
  gap: 6px;
}

.focus-layout {
  display: grid;
  grid-template-columns: minmax(210px, 0.86fr) minmax(660px, 3.5fr);
  gap: 26px;
  align-items: stretch;
}

.focus-layout.is-loading {
  opacity: 0.75;
}

.focus-summary {
  padding: 13px 16px;
  background: rgb(255 255 255 / 72%);
  border: 1px solid rgb(89 142 193 / 22%);
  border-radius: 13px;
}

.focus-label {
  font-size: 13px;
  font-weight: 650;
  color: #49637f;
}

.focus-number {
  margin-top: 4px;
  font-size: 29px;
  font-weight: 760;
  letter-spacing: -0.03em;
  color: #0e6fe8;
  font-variant-numeric: tabular-nums;
}

.focus-number small {
  margin-left: 4px;
  font-size: 13px;
  font-weight: 600;
  color: #5b718b;
}

.focus-summary > p {
  margin: 0 0 8px;
  font-size: 11px;
  color: #8392a5;
}

.focus-breakdown {
  margin: 0;
  border-top: 1px solid rgb(103 147 189 / 17%);
}

.focus-breakdown > div {
  display: flex;
  min-height: 27px;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid rgb(103 147 189 / 14%);
}

.focus-breakdown > div:last-child {
  border-bottom: 0;
}

.focus-breakdown dt {
  font-size: 12px;
  color: #5e738c;
}

.focus-breakdown dd {
  margin: 0;
  font-size: 15px;
  font-weight: 700;
  color: #17314e;
  font-variant-numeric: tabular-nums;
}

.process-track {
  display: flex;
  min-width: 0;
  align-items: center;
  justify-content: space-between;
  overflow-x: auto;
  scrollbar-width: thin;
}

.process-stage {
  display: flex;
  min-width: 104px;
  flex: 1 0 104px;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.stage-icon {
  display: inline-flex;
  width: 48px;
  height: 48px;
  color: #1677ff;
  background: #fff;
  border: 1px solid rgb(22 119 255 / 22%);
  border-radius: 50%;
  box-shadow:
    0 7px 16px rgb(38 101 170 / 11%),
    inset 0 0 0 5px rgb(22 119 255 / 6%);
  align-items: center;
  justify-content: center;
}

.process-stage.is-complete .stage-icon {
  color: #0f9d91;
  border-color: rgb(15 157 145 / 24%);
  box-shadow:
    0 7px 16px rgb(15 157 145 / 11%),
    inset 0 0 0 5px rgb(15 157 145 / 7%);
}

.process-stage h3 {
  margin: 7px 0 0;
  font-size: 13px;
  font-weight: 700;
  color: #1a314d;
}

.process-stage p {
  display: flex;
  margin: 4px 0 0;
  font-size: 11px;
  color: #74859a;
  align-items: baseline;
  gap: 3px;
}

.process-stage p strong {
  font-size: 20px;
  font-weight: 740;
  color: #173657;
  font-variant-numeric: tabular-nums;
}

.process-stage > small {
  margin-top: 1px;
  font-size: 10px;
  color: #8695a8;
}

.process-connector {
  display: inline-flex;
  flex: 0 0 22px;
  align-items: center;
  justify-content: center;
  margin: 0 -2px 39px;
  color: #77a1ce;
}

.panel-unavailable {
  display: flex;
  min-height: 145px;
  align-items: center;
  justify-content: center;
  gap: 13px;
  color: #5f7188;
}

.panel-unavailable > span {
  display: inline-flex;
  width: 42px;
  height: 42px;
  color: #d38218;
  background: rgb(255 255 255 / 68%);
  border-radius: 10px;
  align-items: center;
  justify-content: center;
}

.panel-unavailable strong {
  font-size: 14px;
  color: #314a66;
}

.panel-unavailable p {
  margin: 4px 0 0;
  font-size: 12px;
}

.content-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.95fr) minmax(340px, 0.9fr);
  gap: 16px;
  align-items: start;
}

.content-card {
  min-width: 0;
  background: #fff;
  border: 1px solid var(--wb-line);
  border-radius: 13px;
  box-shadow: 0 5px 18px rgb(28 48 74 / 4%);
}

.application-card,
.asset-card,
.quick-card,
.notice-card {
  padding: 18px;
}

.card-heading {
  margin-bottom: 14px;
}

.card-heading > div > span {
  display: inline-block;
  margin-top: 4px;
  font-size: 11px;
  color: #8996a7;
}

.text-action {
  display: inline-flex;
  padding: 4px;
  font-size: 12px;
  color: var(--wb-primary);
  white-space: nowrap;
  background: transparent;
  align-items: center;
  gap: 4px;
}

.table-shell {
  overflow-x: auto;
}

table {
  width: 100%;
  min-width: 760px;
  border-collapse: collapse;
  table-layout: fixed;
}

th {
  height: 36px;
  font-size: 11px;
  font-weight: 600;
  color: #7c899a;
  text-align: left;
  border-top: 1px solid #edf1f5;
  border-bottom: 1px solid #e7ecf2;
}

td {
  height: 52px;
  font-size: 12px;
  color: #415167;
  border-bottom: 1px solid #edf1f5;
}

tbody tr:last-child td {
  border-bottom: 0;
}

tbody tr {
  transition: background 140ms ease;
}

tbody tr:hover {
  background: #f8fbff;
}

th:nth-child(1),
td:nth-child(1) {
  width: 145px;
}

th:nth-child(2),
td:nth-child(2) {
  width: 190px;
}

th:nth-child(3),
td:nth-child(3) {
  width: 78px;
}

th:nth-child(4),
td:nth-child(4) {
  width: 105px;
}

th:nth-child(5),
td:nth-child(5) {
  width: 62px;
}

th:nth-child(6),
td:nth-child(6) {
  width: 132px;
}

.application-no {
  padding-right: 12px;
  overflow: hidden;
  color: #315579;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}

.application-name {
  padding-right: 12px;
  overflow: hidden;
  font-weight: 600;
  color: #24374f;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.update-time {
  color: #718095;
  font-variant-numeric: tabular-nums;
}

.status-pill {
  display: inline-flex;
  min-height: 23px;
  padding: 0 8px;
  font-size: 11px;
  font-weight: 600;
  color: #176fd1;
  background: #eaf3ff;
  border-radius: 6px;
  align-items: center;
}

.status-pill.is-warning {
  color: #bb6a09;
  background: #fff3df;
}

.status-pill.is-success {
  color: #16815e;
  background: #e8f7f1;
}

.status-pill.is-muted {
  color: #707b8b;
  background: #f0f2f5;
}

.action-column {
  width: 52px;
  text-align: right;
}

.row-action {
  padding: 5px 0 5px 8px;
  font-size: 12px;
  font-weight: 600;
  color: var(--wb-primary);
  background: transparent;
}

.table-loading,
.notice-loading {
  display: grid;
  gap: 9px;
}

.table-loading span,
.notice-loading span {
  height: 40px;
  background: linear-gradient(90deg, #f3f6f9 25%, #eaf0f5 50%, #f3f6f9 75%);
  background-size: 220% 100%;
  border-radius: 7px;
  animation: shimmer 1.4s ease infinite;
}

.side-stack {
  display: grid;
  min-width: 0;
  gap: 16px;
}

.asset-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(72px, 1fr));
}

.asset-metric {
  position: relative;
  display: flex;
  min-width: 0;
  flex-direction: column;
  padding: 4px 13px 3px;
}

.asset-metric:not(:last-child)::after {
  position: absolute;
  top: 7px;
  right: 0;
  bottom: 5px;
  width: 1px;
  background: #e8edf3;
  content: '';
}

.asset-metric:first-child {
  padding-left: 0;
}

.asset-metric:last-child {
  padding-right: 0;
}

.metric-icon {
  display: inline-flex;
  margin-bottom: 5px;
}

.asset-metric strong {
  overflow: hidden;
  font-size: 22px;
  font-weight: 730;
  line-height: 1.25;
  letter-spacing: -0.02em;
  color: #17283f;
  text-overflow: ellipsis;
  font-variant-numeric: tabular-nums;
}

.asset-metric > span:last-child {
  margin-top: 2px;
  font-size: 11px;
  color: #6f7e91;
  white-space: nowrap;
}

.asset-metric .metric-unavailable {
  font-size: 12px;
  line-height: 27px;
  letter-spacing: 0;
  color: #b77725;
}

.asset-metric .metric-loading {
  color: #a1adba;
}

.quick-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 7px;
}

.quick-grid button {
  display: grid;
  min-width: 0;
  padding: 9px;
  color: #33475f;
  text-align: left;
  cursor: pointer;
  background: #fbfcfe;
  border: 1px solid #edf1f5;
  border-radius: 9px;
  transition:
    border-color 150ms ease,
    background 150ms ease,
    transform 150ms ease;
  grid-template-columns: 32px minmax(0, 1fr) 16px;
  align-items: center;
  gap: 8px;
}

.quick-grid button:hover {
  background: #f5f9ff;
  border-color: #cfe1f7;
  transform: translateY(-1px);
}

.quick-grid button > span {
  display: inline-flex;
  width: 32px;
  height: 32px;
  color: var(--wb-primary);
  background: #eaf3ff;
  border-radius: 8px;
  align-items: center;
  justify-content: center;
}

.quick-grid button strong {
  overflow: hidden;
  font-size: 12px;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.quick-arrow {
  color: #9aa7b6;
}

.notice-card {
  margin-top: 16px;
}

.notice-list {
  display: grid;
}

.notice-list button {
  display: grid;
  min-width: 0;
  min-height: 42px;
  padding: 0;
  color: #3c4f66;
  text-align: left;
  cursor: pointer;
  background: transparent;
  border: 0;
  border-top: 1px solid #edf1f5;
  grid-template-columns: 34px 46px minmax(0, 1fr) auto;
  align-items: center;
  gap: 9px;
}

.notice-icon {
  display: inline-flex;
  width: 28px;
  height: 28px;
  color: #277ae0;
  background: #edf5ff;
  border-radius: 7px;
  align-items: center;
  justify-content: center;
}

.notice-type {
  display: inline-flex;
  width: fit-content;
  padding: 3px 7px;
  font-size: 10px;
  color: #2774ca;
  border: 1px solid #cce0fa;
  border-radius: 5px;
  justify-content: center;
}

.notice-type.is-announcement {
  color: #607287;
  border-color: #d6e2ec;
}

.notice-list strong {
  overflow: hidden;
  font-size: 12px;
  font-weight: 550;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.notice-list time {
  font-size: 11px;
  color: #909dac;
  font-variant-numeric: tabular-nums;
}

.inline-state {
  display: flex;
  min-height: 102px;
  font-size: 12px;
  color: #a66c20;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.inline-state.is-empty {
  color: #6e8399;
}

.empty-workbench {
  display: flex;
  min-height: 220px;
  color: #708096;
  background: #fff;
  border: 1px dashed #ccd8e4;
  border-radius: 14px;
  align-items: center;
  justify-content: center;
  gap: 14px;
}

.empty-workbench > span {
  display: inline-flex;
  width: 48px;
  height: 48px;
  color: #5f7894;
  background: #edf4fb;
  border-radius: 12px;
  align-items: center;
  justify-content: center;
}

.empty-workbench p {
  margin: 5px 0 0;
  font-size: 12px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes shimmer {
  to {
    background-position: -220% 0;
  }
}

@media (width <= 1180px) {
  .focus-layout {
    grid-template-columns: 1fr;
  }

  .focus-summary {
    display: grid;
    grid-template-columns: auto auto minmax(180px, 1fr);
    align-items: center;
    gap: 0 18px;
  }

  .focus-label,
  .focus-number {
    grid-column: 1;
  }

  .focus-summary > p {
    grid-column: 2;
    grid-row: 1 / 3;
    margin: 0;
  }

  .focus-breakdown {
    display: grid;
    grid-column: 3;
    grid-row: 1 / 3;
    grid-template-columns: repeat(3, 1fr);
    border-top: 0;
  }

  .focus-breakdown > div {
    display: block;
    min-height: 0;
    padding: 0 12px;
    border-right: 1px solid rgb(103 147 189 / 17%);
    border-bottom: 0;
  }

  .focus-breakdown dd {
    margin-top: 4px;
  }

  .content-grid {
    grid-template-columns: 1fr;
  }

  .side-stack {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (width <= 760px) {
  .workbench-header {
    flex-direction: column;
    gap: 11px;
  }

  .header-actions {
    width: 100%;
    flex-wrap: wrap;
    padding-top: 0;
  }

  .data-status {
    padding-left: 0;
    margin-right: auto;
  }

  .focus-panel {
    padding: 17px;
  }

  .source-badge {
    display: none;
  }

  .focus-summary {
    display: block;
  }

  .focus-summary > p {
    margin: 2px 0 15px;
  }

  .focus-breakdown {
    display: block;
    border-top: 1px solid rgb(103 147 189 / 17%);
  }

  .focus-breakdown > div {
    display: flex;
    min-height: 34px;
    padding: 0;
    border-right: 0;
    border-bottom: 1px solid rgb(103 147 189 / 14%);
  }

  .focus-breakdown dd {
    margin-top: 0;
  }

  .side-stack {
    grid-template-columns: 1fr;
  }

  .asset-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 16px 0;
  }

  .asset-metric:nth-child(2)::after {
    display: none;
  }

  .quick-grid {
    grid-template-columns: 1fr;
  }

  .notice-list button {
    grid-template-columns: 32px 44px minmax(0, 1fr);
    padding: 6px 0;
  }

  .notice-list time {
    display: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .primary-action,
  .quick-grid button,
  tbody tr {
    transition: none;
  }

  .spinning,
  .table-loading span,
  .notice-loading span {
    animation: none;
  }
}
</style>
