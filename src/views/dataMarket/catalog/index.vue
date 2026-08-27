<template>
  <main class="catalog-overview">
    <section class="catalog-hero" aria-labelledby="catalog-page-title">
      <div>
        <h1 id="catalog-page-title">数据目录</h1>
        <p>统一浏览主题域、来源系统与已登记数据集</p>
      </div>

      <div class="catalog-hero__actions">
        <el-tag :type="overviewStatus.type" effect="plain" round>
          <span class="catalog-status" aria-live="polite">
            <span class="catalog-status__dot" aria-hidden="true"></span>
            {{ overviewStatus.label }}
          </span>
        </el-tag>
        <el-tooltip content="刷新目录数据" placement="bottom">
          <el-button
            class="catalog-refresh"
            :loading="refreshing"
            aria-label="刷新目录数据"
            @click="loadOverview"
          >
            <Icon v-if="!refreshing" icon="ep:refresh" />
          </el-button>
        </el-tooltip>
        <el-button
          v-if="datasetAvailable"
          type="primary"
          class="catalog-primary-action"
          @click="navigateTo('DataMarketDataset')"
        >
          进入数据集管理
          <Icon icon="ep:right" class="catalog-primary-action__icon" />
        </el-button>
      </div>
    </section>

    <section v-if="availableMetrics.length" class="catalog-metrics" aria-label="目录资产概览">
      <button
        v-for="metric in availableMetrics"
        :key="metric.key"
        :data-testid="`metric-${metric.key}`"
        class="catalog-metric"
        type="button"
        :aria-label="`前往${metric.label}`"
        @click="navigateTo(metric.capability.routeName)"
      >
        <span class="catalog-metric__icon" :style="{ '--metric-color': metric.color }">
          <Icon :icon="metric.icon" :size="25" />
        </span>
        <span class="catalog-metric__content">
          <span class="catalog-metric__label">{{ metric.label }}</span>
          <el-skeleton-item
            v-if="moduleStates[metric.key].state === 'loading'"
            class="catalog-metric__skeleton"
            variant="text"
          />
          <span
            v-else-if="moduleStates[metric.key].state === 'error'"
            class="catalog-metric__error"
          >
            暂不可用
          </span>
          <strong v-else>{{ moduleStates[metric.key].value }}</strong>
        </span>
      </button>
    </section>

    <section v-if="hasAnyModule" class="catalog-workspace">
      <aside v-if="hasSidebar" class="catalog-sidebar" aria-label="目录分类">
        <section v-if="domainAvailable" class="catalog-side-card catalog-domain-card">
          <header class="catalog-side-card__header">
            <h2>主题域</h2>
            <el-button
              v-if="moduleStates.domain.state === 'ready' && query.subjectDomainId"
              link
              type="primary"
              @click="selectDomain()"
            >
              查看全部
            </el-button>
          </header>

          <el-skeleton v-if="moduleStates.domain.state === 'loading'" :rows="3" animated />
          <el-result
            v-else-if="moduleStates.domain.state === 'error'"
            icon="warning"
            title="主题域暂不可用"
          />
          <el-empty v-else-if="domains.length === 0" :image-size="64" description="暂无主题域" />
          <el-scrollbar v-else class="catalog-domain-list">
            <button
              v-for="domain in domains"
              :key="domain.id ?? domain.code"
              :data-testid="`domain-${domain.code}`"
              class="catalog-domain"
              :class="{ 'is-active': query.subjectDomainId === domain.id }"
              type="button"
              @click="selectDomain(domain.id)"
            >
              <span class="catalog-domain__code">{{ domain.code }}</span>
              <span class="catalog-domain__content">
                <strong>{{ domain.name }}</strong>
                <small>{{ domain.description || '暂无说明' }}</small>
              </span>
            </button>
          </el-scrollbar>
        </section>

        <section v-if="tagAvailable" class="catalog-side-card catalog-tag-card">
          <header class="catalog-side-card__header">
            <h2>标准标签</h2>
          </header>

          <el-skeleton v-if="moduleStates.tag.state === 'loading'" :rows="2" animated />
          <el-result
            v-else-if="moduleStates.tag.state === 'error'"
            icon="warning"
            title="标签暂不可用"
          />
          <el-empty v-else-if="tags.length === 0" :image-size="56" description="暂无标准标签" />
          <div v-else class="catalog-tags">
            <el-tag
              v-for="tag in tags"
              :key="tag.id ?? tag.code"
              class="catalog-tag"
              effect="plain"
              :style="getTagStyle(tag.color)"
              disable-transitions
            >
              {{ tag.name }}
            </el-tag>
          </div>
        </section>
      </aside>

      <section v-if="datasetAvailable" class="catalog-dataset-card" aria-label="数据集目录">
        <el-form class="catalog-filters" :model="query" @submit.prevent>
          <el-form-item class="catalog-search-field">
            <el-input
              v-model="query.keyword"
              clearable
              placeholder="搜索数据集名称、编码或物理表名"
              @keyup.enter="handleSearch"
            >
              <template #prefix><Icon icon="ep:search" /></template>
            </el-input>
          </el-form-item>

          <el-form-item v-if="domainAvailable">
            <el-select
              v-model="query.subjectDomainId"
              clearable
              placeholder="全部主题域"
              :loading="moduleStates.domain.state === 'loading'"
            >
              <el-option
                v-for="domain in domains"
                :key="domain.id ?? domain.code"
                :label="domain.name"
                :value="domain.id"
              />
            </el-select>
          </el-form-item>

          <el-form-item v-if="sourceAvailable">
            <el-select
              v-model="query.sourceSystemId"
              clearable
              placeholder="全部来源系统"
              :loading="moduleStates.source.state === 'loading'"
            >
              <el-option
                v-for="source in sourceSystems"
                :key="source.id ?? source.code"
                :label="source.name"
                :value="source.id"
              />
            </el-select>
          </el-form-item>

          <el-form-item>
            <el-select v-model="query.publishStatus" clearable placeholder="发布状态">
              <el-option label="已发布" :value="1" />
              <el-option label="草稿" :value="0" />
            </el-select>
          </el-form-item>

          <el-form-item class="catalog-filter-actions">
            <el-button type="primary" @click="handleSearch">查询</el-button>
          </el-form-item>
        </el-form>

        <div class="catalog-table-wrap">
          <el-table
            v-loading="moduleStates.dataset.state === 'loading'"
            :data="datasets"
            :empty-text="datasetEmptyText"
            row-key="id"
            table-layout="fixed"
          >
            <el-table-column label="数据集名称" min-width="190">
              <template #default="{ row }">
                <div class="dataset-name">
                  <strong>{{ row.businessName }}</strong>
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="datasetCode" label="编码" min-width="130">
              <template #default="{ row }">{{ row.datasetCode || '—' }}</template>
            </el-table-column>
            <el-table-column label="来源系统" min-width="150">
              <template #default="{ row }">
                {{ resolveSourceSystemName(row) }}
              </template>
            </el-table-column>
            <el-table-column label="主题域" min-width="130">
              <template #default="{ row }">
                {{ resolveDomainName(row) }}
              </template>
            </el-table-column>
            <el-table-column label="敏感级别" width="112">
              <template #default="{ row }">
                <el-tag
                  v-if="row.sensitivityLevel !== undefined && row.sensitivityLevel !== null"
                  :type="getSensitivityType(row.sensitivityLevel)"
                  effect="light"
                  round
                >
                  敏感级{{ row.sensitivityLevel }}
                </el-tag>
                <span v-else>—</span>
              </template>
            </el-table-column>
            <el-table-column label="发布状态" width="106" align="center">
              <template #default="{ row }">
                <el-tag :type="row.publishStatus === 1 ? 'success' : 'info'" effect="light">
                  {{ row.publishStatus === 1 ? '已发布' : '草稿' }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <footer class="catalog-pagination">
          <el-pagination
            v-model:current-page="query.pageNo"
            v-model:page-size="query.pageSize"
            :page-sizes="[10, 20, 50]"
            :total="datasetTotal"
            layout="total, prev, pager, next, sizes"
            background
            @current-change="handlePageChange"
            @size-change="handleSizeChange"
          />
        </footer>
      </section>
    </section>

    <el-empty v-else class="catalog-no-access" description="暂无可访问的目录模块" />
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import * as CatalogApi from '@/api/dataMarket/catalog'
import type { DatasetVO, SourceSystemVO, SubjectDomainVO, TagVO } from '@/api/dataMarket/types'
import { useUserStore } from '@/store/modules/user'

defineOptions({ name: 'DataMarketCatalog' })

type LoadState = 'idle' | 'loading' | 'ready' | 'error'
type ModuleKey = 'dataset' | 'domain' | 'tag' | 'source'
type ElementTagType = 'primary' | 'success' | 'info' | 'warning' | 'danger'

interface Capability {
  routeName: string
  permission: string
}

interface MetricDefinition {
  key: ModuleKey
  label: string
  icon: string
  color: string
  capability: Capability
}

interface ModuleState {
  state: LoadState
  value: number
}

const CAPABILITIES: Record<ModuleKey, Capability> = {
  dataset: {
    routeName: 'DataMarketDataset',
    permission: 'data-market:dataset:query'
  },
  domain: {
    routeName: 'DataMarketDomain',
    permission: 'data-market:domain:query'
  },
  tag: {
    routeName: 'DataMarketTag',
    permission: 'data-market:tag:query'
  },
  source: {
    routeName: 'DataMarketSourceSystem',
    permission: 'data-market:source-system:query'
  }
}

const METRICS: MetricDefinition[] = [
  {
    key: 'dataset',
    label: '数据集',
    icon: 'ep:coin',
    color: '#1677ff',
    capability: CAPABILITIES.dataset
  },
  {
    key: 'domain',
    label: '主题域',
    icon: 'ep:collection-tag',
    color: '#2f7df4',
    capability: CAPABILITIES.domain
  },
  {
    key: 'tag',
    label: '标准标签',
    icon: 'ep:price-tag',
    color: '#4f8df7',
    capability: CAPABILITIES.tag
  },
  {
    key: 'source',
    label: '来源系统',
    icon: 'ep:monitor',
    color: '#1769e0',
    capability: CAPABILITIES.source
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
const canAccess = (capability: Capability) =>
  routeNames.has(capability.routeName) && hasPermission(capability.permission)

const datasetAvailable = canAccess(CAPABILITIES.dataset)
const domainAvailable = canAccess(CAPABILITIES.domain)
const tagAvailable = canAccess(CAPABILITIES.tag)
const sourceAvailable = canAccess(CAPABILITIES.source)
const hasSidebar = domainAvailable || tagAvailable
const hasAnyModule = datasetAvailable || hasSidebar || sourceAvailable
const availableMetrics = METRICS.filter((metric) => canAccess(metric.capability))

const moduleStates = reactive<Record<ModuleKey, ModuleState>>({
  dataset: { state: datasetAvailable ? 'loading' : 'idle', value: 0 },
  domain: { state: domainAvailable ? 'loading' : 'idle', value: 0 },
  tag: { state: tagAvailable ? 'loading' : 'idle', value: 0 },
  source: { state: sourceAvailable ? 'loading' : 'idle', value: 0 }
})

const domains = ref<SubjectDomainVO[]>([])
const tags = ref<TagVO[]>([])
const sourceSystems = ref<SourceSystemVO[]>([])
const datasets = ref<DatasetVO[]>([])
const datasetTotal = ref(0)
const refreshing = ref(false)
let datasetRequestSequence = 0

const query = reactive<{
  pageNo: number
  pageSize: number
  keyword: string
  subjectDomainId?: number
  sourceSystemId?: number
  publishStatus?: number
}>({
  pageNo: 1,
  pageSize: 10,
  keyword: ''
})

const overviewStatus = computed<{ label: string; type: ElementTagType }>(() => {
  if (
    refreshing.value ||
    availableMetrics.some((metric) => moduleStates[metric.key].state === 'loading')
  ) {
    return { label: '数据加载中', type: 'info' }
  }
  if (availableMetrics.some((metric) => moduleStates[metric.key].state === 'error')) {
    return { label: '部分数据不可用', type: 'warning' }
  }
  if (availableMetrics.some((metric) => moduleStates[metric.key].state === 'ready')) {
    return { label: '数据状态：实时', type: 'success' }
  }
  return { label: '暂无可用数据', type: 'info' }
})

const sourceSystemMap = computed(() => {
  const map = new Map<number, string>()
  sourceSystems.value.forEach((source) => {
    if (source.id !== undefined) map.set(source.id, source.name)
  })
  return map
})

const domainMap = computed(() => {
  const map = new Map<number, string>()
  domains.value.forEach((domain) => {
    if (domain.id !== undefined) map.set(domain.id, domain.name)
  })
  return map
})

const datasetEmptyText = computed(() =>
  moduleStates.dataset.state === 'error' ? '数据集暂不可用' : '暂无匹配的数据集'
)

const buildDatasetQuery = () => ({
  pageNo: query.pageNo,
  pageSize: query.pageSize,
  ...(query.keyword.trim() ? { keyword: query.keyword.trim() } : {}),
  ...(query.subjectDomainId !== undefined ? { subjectDomainId: query.subjectDomainId } : {}),
  ...(query.sourceSystemId !== undefined ? { sourceSystemId: query.sourceSystemId } : {}),
  ...(query.publishStatus !== undefined ? { publishStatus: query.publishStatus } : {})
})

const loadDatasets = async () => {
  if (!datasetAvailable) return
  const requestSequence = ++datasetRequestSequence
  moduleStates.dataset.state = 'loading'
  try {
    const page = await CatalogApi.getDatasetPage(buildDatasetQuery())
    if (requestSequence !== datasetRequestSequence) return
    datasets.value = page.list || []
    datasetTotal.value = page.total ?? 0
    moduleStates.dataset.value = datasetTotal.value
    moduleStates.dataset.state = 'ready'
  } catch (_error) {
    if (requestSequence !== datasetRequestSequence) return
    moduleStates.dataset.state = 'error'
  }
}

const loadDomains = async () => {
  if (!domainAvailable) return
  moduleStates.domain.state = 'loading'
  try {
    domains.value = (await CatalogApi.getSubjectDomainList()) || []
    moduleStates.domain.value = domains.value.length
    moduleStates.domain.state = 'ready'
  } catch (_error) {
    moduleStates.domain.state = 'error'
  }
}

const loadTags = async () => {
  if (!tagAvailable) return
  moduleStates.tag.state = 'loading'
  try {
    tags.value = (await CatalogApi.getTags()) || []
    moduleStates.tag.value = tags.value.length
    moduleStates.tag.state = 'ready'
  } catch (_error) {
    moduleStates.tag.state = 'error'
  }
}

const loadSourceSystems = async () => {
  if (!sourceAvailable) return
  moduleStates.source.state = 'loading'
  try {
    const page = await CatalogApi.getSourceSystemPage({ pageNo: 1, pageSize: 100 })
    sourceSystems.value = page.list || []
    moduleStates.source.value = page.total ?? 0
    moduleStates.source.state = 'ready'
  } catch (_error) {
    moduleStates.source.state = 'error'
  }
}

const loadOverview = async () => {
  if (refreshing.value) return
  refreshing.value = true
  await Promise.all([loadDomains(), loadTags(), loadSourceSystems(), loadDatasets()])
  refreshing.value = false
}

const handleSearch = async () => {
  query.pageNo = 1
  await loadDatasets()
}

const selectDomain = async (domainId?: number) => {
  query.subjectDomainId = domainId
  await handleSearch()
}

const handlePageChange = async (pageNo: number) => {
  query.pageNo = pageNo
  await loadDatasets()
}

const handleSizeChange = async (pageSize: number) => {
  query.pageSize = pageSize
  query.pageNo = 1
  await loadDatasets()
}

const navigateTo = (routeName: string) => router.push({ name: routeName })

const resolveSourceSystemName = (dataset: DatasetVO) => {
  if (dataset.sourceSystemName) return dataset.sourceSystemName
  if (dataset.sourceSystemId === undefined || dataset.sourceSystemId === null) return '—'
  return sourceSystemMap.value.get(dataset.sourceSystemId) || '已停用或不可见'
}

const resolveDomainName = (dataset: DatasetVO) => {
  if (dataset.subjectDomainName) return dataset.subjectDomainName
  if (dataset.subjectDomainId === undefined || dataset.subjectDomainId === null) return '—'
  return domainMap.value.get(dataset.subjectDomainId) || '已停用或不可见'
}

const getSensitivityType = (level: number): ElementTagType => {
  if (level >= 4) return 'danger'
  if (level === 3) return 'warning'
  if (level === 2) return 'primary'
  return 'info'
}

const getTagStyle = (color?: string) => {
  const safeColor = color && /^#[0-9a-fA-F]{6}$/.test(color) ? color : '#5f6b7a'
  return {
    color: safeColor,
    borderColor: `${safeColor}66`,
    backgroundColor: `${safeColor}24`
  }
}

onMounted(loadOverview)
</script>

<style scoped lang="scss">
.catalog-overview {
  min-height: calc(100vh - 150px);
  padding: 16px;
  color: #17233d;
  background: #f5f7fa;
}

.catalog-hero,
.catalog-metrics,
.catalog-side-card,
.catalog-dataset-card {
  background: #fff;
  border: 1px solid #e3e9f1;
  box-shadow: 0 4px 16px rgb(23 35 61 / 3%);
}

.catalog-hero {
  display: flex;
  min-height: 104px;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-radius: 12px;

  h1 {
    margin: 0;
    font-size: 28px;
    font-weight: 700;
    line-height: 1.25;
    letter-spacing: -0.5px;
    color: #0c2b57;
  }

  p {
    margin: 6px 0 0;
    font-size: 14px;
    color: #637083;
  }
}

.catalog-hero__actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.catalog-status {
  display: inline-flex;
  align-items: center;
  gap: 7px;
}

.catalog-status__dot {
  width: 7px;
  height: 7px;
  background: currentcolor;
  border-radius: 50%;
}

.catalog-refresh {
  width: 42px;
  height: 42px;
  padding: 0;
  font-size: 18px;
}

.catalog-primary-action {
  height: 42px;
  padding: 0 20px;
  box-shadow: 0 7px 15px rgb(22 119 255 / 18%);
}

.catalog-primary-action__icon {
  margin-left: 6px;
}

.catalog-metrics {
  display: grid;
  padding: 14px 0;
  margin-top: 14px;
  border-radius: 12px;
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.catalog-metric {
  position: relative;
  display: flex;
  min-width: 0;
  padding: 4px 24px;
  font: inherit;
  color: inherit;
  text-align: left;
  cursor: pointer;
  background: transparent;
  border: 0;
  align-items: center;
  gap: 16px;

  &::after {
    position: absolute;
    top: 8px;
    right: 0;
    bottom: 8px;
    width: 1px;
    background: #e7ebf1;
    content: '';
  }

  &:last-child::after {
    display: none;
  }

  &:focus-visible {
    outline: 2px solid #1677ff;
    outline-offset: -4px;
  }
}

.catalog-metric__icon {
  display: grid;
  width: 58px;
  height: 58px;
  color: var(--metric-color);
  background: color-mix(in srgb, var(--metric-color) 9%, white);
  border-radius: 50%;
  flex: 0 0 58px;
  place-items: center;
}

.catalog-metric__content {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 4px;

  strong {
    font-size: 25px;
    font-weight: 700;
    line-height: 1;
    color: #0c2b57;
  }
}

.catalog-metric__label {
  font-size: 14px;
  color: #536074;
}

.catalog-metric__skeleton {
  width: 46px;
  height: 24px;
}

.catalog-metric__error {
  font-size: 13px;
  font-weight: 600;
  color: #d48806;
}

.catalog-workspace {
  display: grid;
  grid-template-columns: 230px minmax(0, 1fr);
  gap: 14px;
  margin-top: 14px;
}

.catalog-sidebar {
  display: grid;
  grid-template-rows: minmax(230px, auto) minmax(180px, 1fr);
  gap: 14px;
}

.catalog-side-card,
.catalog-dataset-card {
  min-width: 0;
  border-radius: 10px;
}

.catalog-side-card {
  padding: 18px 16px;
}

.catalog-side-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;

  h2 {
    margin: 0;
    font-size: 16px;
    font-weight: 650;
    color: #20314d;
  }
}

.catalog-domain-list {
  max-height: 320px;
}

.catalog-domain {
  display: flex;
  width: 100%;
  padding: 10px 8px;
  font: inherit;
  color: inherit;
  text-align: left;
  cursor: pointer;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 9px;
  transition:
    border-color 160ms ease,
    background-color 160ms ease;
  align-items: center;
  gap: 12px;

  & + & {
    margin-top: 4px;
  }

  &:hover,
  &.is-active {
    background: #f5f9ff;
    border-color: #dbe9ff;
  }

  &:focus-visible {
    outline: 2px solid #1677ff;
    outline-offset: 1px;
  }
}

.catalog-domain__code {
  display: grid;
  width: 40px;
  height: 40px;
  font-size: 14px;
  font-weight: 650;
  color: #1677ff;
  background: #eaf3ff;
  border-radius: 9px;
  flex: 0 0 40px;
  place-items: center;
}

.catalog-domain__content {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 4px;

  strong {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  strong {
    font-size: 14px;
    font-weight: 600;
    color: #26364f;
  }

  small {
    font-size: 12px;
    color: #8a96a8;
  }
}

.catalog-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.catalog-tag {
  height: 30px;
  padding: 0 11px;
  border-radius: 7px;
}

.catalog-dataset-card {
  min-height: max(540px, calc(100vh - 385px));
  padding: 18px;
}

.catalog-filters {
  display: grid;
  grid-template-columns:
    minmax(260px, 1.6fr) minmax(150px, 0.75fr) minmax(160px, 0.85fr) minmax(132px, 0.65fr)
    auto;
  gap: 10px;
  align-items: center;

  :deep(.el-form-item) {
    min-width: 0;
    margin: 0;
  }

  :deep(.el-select) {
    width: 100%;
  }

  :deep(.el-input__wrapper),
  :deep(.el-select__wrapper) {
    min-height: 38px;
    box-shadow: 0 0 0 1px #dfe5ed inset;
  }
}

.catalog-filter-actions {
  :deep(.el-form-item__content) {
    flex-wrap: nowrap;
  }
}

.catalog-table-wrap {
  margin-top: 16px;
  overflow: hidden;
  border: 1px solid #e5eaf1;
  border-radius: 8px;

  :deep(.el-table__header th.el-table__cell) {
    height: 46px;
    font-weight: 600;
    color: #43516a;
    background: #f5f7fa;
  }

  :deep(.el-table__row td.el-table__cell) {
    height: 62px;
    color: #33415c;
  }

  :deep(.el-table::before) {
    display: none;
  }
}

.dataset-name {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 3px;

  strong,
  small {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  strong {
    font-weight: 550;
    color: #24344f;
  }
}

.catalog-pagination {
  display: flex;
  justify-content: flex-end;
  padding-top: 18px;
}

.catalog-no-access {
  min-height: 420px;
}

:deep(.el-result) {
  padding: 16px 0;

  .el-result__icon svg {
    width: 42px;
    height: 42px;
  }

  .el-result__title p {
    font-size: 13px;
  }
}

@media (width <= 1240px) {
  .catalog-filters {
    grid-template-columns: minmax(240px, 1.6fr) repeat(2, minmax(145px, 0.8fr));
  }

  .catalog-filter-actions {
    justify-self: end;
  }
}

@media (width <= 1180px) {
  .catalog-overview {
    padding: 12px;
  }

  .catalog-hero {
    align-items: flex-start;
    gap: 18px;
  }

  .catalog-hero__actions {
    flex-wrap: wrap;
    justify-content: flex-end;
  }

  .catalog-metrics {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .catalog-metric:nth-child(2)::after {
    display: none;
  }

  .catalog-metric:nth-child(n + 3) {
    padding-top: 16px;
    margin-top: 12px;
    border-top: 1px solid #e7ebf1;
  }

  .catalog-workspace {
    grid-template-columns: 1fr;
  }

  .catalog-sidebar {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    grid-template-rows: auto;
  }

  .catalog-domain-list {
    max-height: 190px;
  }
}

@media (width <= 720px) {
  .catalog-hero {
    flex-direction: column;
    padding: 18px;

    h1 {
      font-size: 24px;
    }
  }

  .catalog-hero__actions {
    width: 100%;
    justify-content: flex-start;
  }

  .catalog-primary-action {
    flex: 1;
  }

  .catalog-metrics {
    grid-template-columns: 1fr;
    padding: 8px 0;
  }

  .catalog-metric {
    padding: 12px 18px;
    border-top: 1px solid #e7ebf1;

    &::after {
      display: none;
    }

    &:first-child {
      border-top: 0;
    }
  }

  .catalog-sidebar {
    grid-template-columns: 1fr;
  }

  .catalog-dataset-card {
    min-height: 0;
    padding: 14px;
  }

  .catalog-filters {
    grid-template-columns: 1fr;
  }

  .catalog-filter-actions {
    justify-self: stretch;

    :deep(.el-form-item__content) {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 8px;

      .el-button {
        width: 100%;
        margin: 0;
      }
    }
  }

  .catalog-pagination {
    overflow-x: auto;
    justify-content: flex-start;
  }
}

@media (prefers-reduced-motion: reduce) {
  .catalog-domain {
    transition: none;
  }
}
</style>
