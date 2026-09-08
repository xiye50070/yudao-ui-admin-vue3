<template>
  <DataMarketManagementPage
    page-key="indicator"
    title="指标配置"
    description="维护指标定义、说明、领域、标签、状态与访问范围"
    icon="ep:trend-charts"
    tone="blue"
  >
    <template #actions>
      <el-tooltip content="刷新指标" placement="bottom">
        <el-button :loading="loading" aria-label="刷新指标" @click="loadPage">
          <Icon v-if="!loading" icon="ep:refresh" />
        </el-button>
      </el-tooltip>
      <el-button
        v-hasPermi="['data-market:indicator:create']"
        type="primary"
        aria-label="新增指标"
        @click="openCreate"
      >
        <Icon icon="ep:plus" />新增指标
      </el-button>
    </template>

    <template #summary>
      <div class="dm-summary-item">
        <span class="dm-summary-item__icon"><Icon icon="ep:data-analysis" /></span>
        <span class="dm-summary-item__content">
          <small>指标总数</small>
          <strong>{{ total }}</strong>
        </span>
      </div>
      <div class="dm-summary-item">
        <span class="dm-summary-item__icon"><Icon icon="ep:circle-check" /></span>
        <span class="dm-summary-item__content">
          <small>当前页已启用</small>
          <strong>{{ pageSummary.enabled }}</strong>
        </span>
      </div>
      <div class="dm-summary-item">
        <span class="dm-summary-item__icon"><Icon icon="ep:circle-close" /></span>
        <span class="dm-summary-item__content">
          <small>当前页已停用</small>
          <strong>{{ pageSummary.disabled }}</strong>
        </span>
      </div>
    </template>

    <section class="dm-panel indicator-filter-panel">
      <header class="dm-panel__header">
        <div>
          <h2>指标目录</h2>
          <p>仅维护指标定义和说明；启用状态决定前台是否可见</p>
        </div>
      </header>
      <el-form class="indicator-filters" :inline="true" @submit.prevent="handleQuery">
        <el-form-item label="关键词">
          <el-input
            v-model="query.keyword"
            clearable
            aria-label="关键词"
            placeholder="搜索指标名称或编码"
            @keyup.enter="handleQuery"
          />
        </el-form-item>
        <el-form-item label="指标领域">
          <el-select
            v-model="query.indicatorDomainId"
            clearable
            aria-label="筛选指标领域"
            placeholder="全部领域"
          >
            <el-option
              v-for="domain in domains"
              :key="domain.id"
              :label="domain.name"
              :value="domain.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="标准标签">
          <el-select
            v-model="query.tagId"
            clearable
            filterable
            aria-label="筛选标准标签"
            placeholder="全部标签"
          >
            <el-option v-for="tag in tags" :key="tag.id" :label="tag.name" :value="tag.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="query.status" clearable aria-label="筛选状态" placeholder="全部状态">
            <el-option label="启用" :value="0" />
            <el-option label="停用" :value="1" />
          </el-select>
        </el-form-item>
        <el-form-item class="indicator-filter-actions">
          <el-button type="primary" @click="handleQuery"><Icon icon="ep:search" />查询</el-button>
          <el-button @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
    </section>

    <section class="dm-panel dm-panel--flush indicator-table-panel">
      <el-result
        v-if="loadError"
        icon="warning"
        title="指标加载失败"
        sub-title="暂时无法获取指标数据，请稍后重试"
      >
        <template #extra>
          <el-button type="primary" @click="loadPage">重新加载</el-button>
        </template>
      </el-result>
      <template v-else>
        <el-table
          v-loading="loading"
          :data="indicators"
          empty-text="暂无指标"
          row-key="id"
          table-layout="fixed"
        >
          <el-table-column label="指标" min-width="250">
            <template #default="{ row }">
              <div class="indicator-identity">
                <span class="indicator-identity__icon"><Icon icon="ep:trend-charts" /></span>
                <span class="indicator-identity__text">
                  <strong :title="row.indicatorName">{{ row.indicatorName }}</strong>
                  <code>{{ row.indicatorCode }}</code>
                </span>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="指标领域" min-width="132">
            <template #default="{ row }">
              <el-tag effect="plain">{{ row.indicatorDomain?.name || '领域已失效' }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="标准标签" min-width="240">
            <template #default="{ row }">
              <div v-if="row.tags?.length" class="indicator-tags">
                <el-tag v-for="tag in row.tags" :key="tag.id" size="small" effect="light">
                  {{ tag.name }}
                </el-tag>
              </div>
              <span v-else class="empty-value">暂无标签</span>
            </template>
          </el-table-column>
          <el-table-column label="状态" width="96" align="center">
            <template #default="{ row }">
              <el-tag :type="row.status === 0 ? 'success' : 'info'" effect="light" round>
                {{ row.status === 0 ? '启用' : '停用' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="更新时间" width="168">
            <template #default="{ row }">
              <span class="update-time">{{
                row.updateTime ? formatDate(row.updateTime) : '—'
              }}</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="306" fixed="right" align="right">
            <template #default="{ row }">
              <el-button
                v-hasPermi="['data-market:indicator:update']"
                link
                type="primary"
                @click="openEdit(row)"
              >
                编辑
              </el-button>
              <el-button
                v-hasPermi="['data-market:access-policy:query']"
                link
                type="primary"
                @click="openAcl(row)"
              >
                ACL
              </el-button>
              <el-button
                v-hasPermi="['data-market:indicator:update']"
                link
                :type="row.status === 0 ? 'warning' : 'success'"
                @click="requestStatusChange(row)"
              >
                {{ row.status === 0 ? '停用' : '启用' }}
              </el-button>
              <el-button
                v-hasPermi="['data-market:indicator:delete']"
                link
                type="danger"
                @click="removeIndicator(row)"
              >
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>

        <div class="indicator-pagination">
          <el-pagination
            v-model:current-page="query.pageNo"
            v-model:page-size="query.pageSize"
            :total="total"
            :page-sizes="[10, 20, 50]"
            layout="total, sizes, prev, pager, next, jumper"
            @current-change="loadPage"
            @size-change="handlePageSizeChange"
          />
        </div>
      </template>
    </section>
  </DataMarketManagementPage>

  <el-drawer
    v-model="drawerVisible"
    :title="drawerTitle"
    :aria-label="drawerTitle"
    size="min(760px, 94vw)"
    destroy-on-close
  >
    <el-skeleton v-if="detailLoading" :rows="12" animated />
    <el-form
      v-else
      ref="formRef"
      class="indicator-editor"
      :model="form"
      :rules="rules"
      label-position="top"
    >
      <section class="editor-section">
        <header>
          <span><Icon icon="ep:document" /></span>
          <div><h3>基础信息</h3><p>编码保存后建议保持稳定，新建指标默认停用。</p></div>
        </header>
        <div class="editor-grid editor-grid--two">
          <el-form-item label="指标编码" prop="indicatorCode">
            <el-input v-model="form.indicatorCode" maxlength="64" placeholder="例如 GZJG-030" />
          </el-form-item>
          <el-form-item label="指标名称" prop="indicatorName">
            <el-input v-model="form.indicatorName" maxlength="256" placeholder="请输入指标名称" />
          </el-form-item>
          <el-form-item label="指标领域" prop="indicatorDomainId">
            <el-select
              v-model="form.indicatorDomainId"
              aria-label="指标领域"
              placeholder="请选择指标领域"
            >
              <el-option
                v-for="domain in enabledDomains"
                :key="domain.id"
                :label="domain.name"
                :value="domain.id"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="排序" prop="sort">
            <el-input-number v-model="form.sort" :min="0" controls-position="right" />
          </el-form-item>
        </div>
        <el-form-item label="标准标签">
          <el-select
            v-model="form.tagIds"
            multiple
            filterable
            collapse-tags
            collapse-tags-tooltip
            aria-label="标准标签"
            placeholder="请选择标准标签"
          >
            <el-option-group v-for="group in tagGroups" :key="group.id" :label="group.name">
              <el-option
                v-for="tag in group.options"
                :key="tag.id"
                :label="tag.name"
                :value="tag.id"
                :disabled="(group.disabled || tag.status !== 0) && !form.tagIds.includes(tag.id!)"
              />
            </el-option-group>
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-tag :type="form.status === 0 ? 'success' : 'info'" effect="light">
            {{
              form.id
                ? form.status === 0
                  ? '启用'
                  : '停用'
                : '停用（保存后可配置 ACL，再从列表启用）'
            }}
          </el-tag>
        </el-form-item>
      </section>

      <section class="editor-section">
        <header>
          <span><Icon icon="ep:reading" /></span>
          <div><h3>指标定义</h3><p>仅记录定义文本，本模块不产生指标值或阈值判断结果。</p></div>
        </header>
        <el-form-item label="计算方式">
          <el-input
            v-model="form.calculationDescription"
            type="textarea"
            :rows="4"
            maxlength="20000"
            show-word-limit
            placeholder="填写指标口径、公式或原文定义"
          />
        </el-form-item>
        <el-form-item label="指标阈值">
          <el-input
            v-model="form.thresholdDescription"
            type="textarea"
            :rows="3"
            maxlength="20000"
            show-word-limit
            placeholder="填写阈值或预警条件说明"
          />
        </el-form-item>
      </section>

      <section class="editor-section">
        <header>
          <span><Icon icon="ep:info-filled" /></span>
          <div><h3>指标说明</h3><p>记录数据来源、业务穿透关系和补充说明。</p></div>
        </header>
        <el-form-item label="落地数据来源">
          <el-input
            v-model="form.dataSourceDescription"
            type="textarea"
            :rows="3"
            maxlength="20000"
            show-word-limit
            placeholder="填写文件中的落地数据来源"
          />
        </el-form-item>
        <el-form-item label="业务穿透">
          <el-input
            v-model="form.businessPenetration"
            type="textarea"
            :rows="4"
            maxlength="20000"
            show-word-limit
            placeholder="填写业务穿透说明"
          />
        </el-form-item>
        <el-form-item label="补充说明">
          <el-input
            v-model="form.supplementaryDescription"
            type="textarea"
            :rows="3"
            maxlength="20000"
            show-word-limit
            placeholder="填写其他定义或口径说明"
          />
        </el-form-item>
      </section>
    </el-form>
    <template #footer>
      <el-button @click="drawerVisible = false">取消</el-button>
      <el-button
        v-hasPermi="[form.id ? 'data-market:indicator:update' : 'data-market:indicator:create']"
        type="primary"
        :loading="saving"
        :disabled="detailLoading"
        @click="saveIndicator"
      >
        保存
      </el-button>
    </template>
  </el-drawer>

  <IndicatorAclDialog
    v-model="aclVisible"
    :indicator-id="aclIndicator?.id"
    :indicator-name="aclIndicator?.indicatorName"
  />

  <el-dialog
    v-model="statusConfirmVisible"
    title="确认启用指标"
    aria-label="确认启用指标"
    width="min(520px, calc(100vw - 32px))"
  >
    <el-alert
      title="启用后，租户内拥有指标浏览权限的用户均可查看"
      description="若尚未配置 ACL，该指标将在当前租户内开放；可取消并先配置 ACL。"
      type="warning"
      :closable="false"
      show-icon
    />
    <template #footer>
      <el-button @click="statusConfirmVisible = false">取消</el-button>
      <el-button type="primary" :loading="statusSaving" @click="confirmEnable">确认启用</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import * as IndicatorApi from '@/api/dataMarket/indicator'
import type { IndicatorDomainVO, IndicatorPageReq, IndicatorVO } from '@/api/dataMarket/indicator'
import type { FilterDimensionVO, TagVO } from '@/api/dataMarket/types'
import { useMessage } from '@/hooks/web/useMessage'
import { formatDate } from '@/utils/formatTime'
import DataMarketManagementPage from '@/views/dataMarket/components/DataMarketManagementPage.vue'
import IndicatorAclDialog from './IndicatorAclDialog.vue'

defineOptions({ name: 'DataMarketIndicator' })

type EditableIndicator = Omit<IndicatorVO, 'indicatorDomainId'> & {
  indicatorDomainId?: number
}

interface TagGroup {
  id: string
  name: string
  disabled: boolean
  options: TagVO[]
}

const message = useMessage()
const loading = ref(false)
const loadError = ref(false)
const indicators = ref<IndicatorVO[]>([])
const total = ref(0)
const domains = ref<IndicatorDomainVO[]>([])
const tags = ref<TagVO[]>([])
const dimensions = ref<FilterDimensionVO[]>([])
let pageLoadSequence = 0
const query = reactive<IndicatorPageReq>({
  pageNo: 1,
  pageSize: 10,
  keyword: '',
  indicatorDomainId: undefined,
  tagId: undefined,
  status: undefined
})

const pageSummary = computed(() => ({
  enabled: indicators.value.filter((item) => item.status === 0).length,
  disabled: indicators.value.filter((item) => item.status !== 0).length
}))
const enabledDomains = computed(() =>
  domains.value.filter((domain) => domain.status === 0 || domain.id === form.indicatorDomainId)
)
const tagGroups = computed<TagGroup[]>(() => {
  const groups = dimensions.value
    .map((dimension) => ({
      id: String(dimension.id),
      name: dimension.name,
      disabled: dimension.status !== 0,
      options: tags.value.filter((tag) => tag.dimensionId === dimension.id)
    }))
    .filter((group) => group.options.length)
  const assigned = new Set(groups.flatMap((group) => group.options.map((tag) => tag.id)))
  const ungrouped = tags.value.filter((tag) => !assigned.has(tag.id))
  return ungrouped.length
    ? [...groups, { id: 'ungrouped', name: '其他标签', disabled: true, options: ungrouped }]
    : groups
})

const loadReferences = async () => {
  try {
    const options = await IndicatorApi.getIndicatorReferenceOptions()
    domains.value = options?.domains || []
    tags.value = options?.tags || []
    dimensions.value = options?.filterDimensions || []
  } catch {
    message.error('指标领域或标准标签加载失败，请重试')
  }
}

const loadPage = async () => {
  const sequence = ++pageLoadSequence
  loading.value = true
  loadError.value = false
  try {
    const result = await IndicatorApi.getIndicatorPage({ ...query })
    if (sequence !== pageLoadSequence) return
    indicators.value = result?.list || []
    total.value = result?.total || 0
  } catch {
    if (sequence === pageLoadSequence) loadError.value = true
  } finally {
    if (sequence === pageLoadSequence) loading.value = false
  }
}

const handleQuery = () => {
  query.pageNo = 1
  void loadPage()
}

const resetQuery = () => {
  Object.assign(query, {
    pageNo: 1,
    pageSize: query.pageSize,
    keyword: '',
    indicatorDomainId: undefined,
    tagId: undefined,
    status: undefined
  })
  void loadPage()
}

const handlePageSizeChange = () => {
  query.pageNo = 1
  void loadPage()
}

const emptyIndicator = (): EditableIndicator => ({
  indicatorCode: '',
  indicatorName: '',
  indicatorDomainId: undefined,
  calculationDescription: '',
  thresholdDescription: '',
  dataSourceDescription: '',
  businessPenetration: '',
  supplementaryDescription: '',
  tagIds: [],
  status: 1,
  sort: 0
})

const drawerVisible = ref(false)
const detailLoading = ref(false)
const saving = ref(false)
const formRef = ref<FormInstance>()
const form = reactive<EditableIndicator>(emptyIndicator())
const drawerTitle = computed(() => (form.id ? '编辑指标' : '新增指标'))
const rules: FormRules<EditableIndicator> = {
  indicatorCode: [{ required: true, message: '请输入指标编码', trigger: 'blur' }],
  indicatorName: [{ required: true, message: '请输入指标名称', trigger: 'blur' }],
  indicatorDomainId: [{ required: true, message: '请选择指标领域', trigger: 'change' }]
}

const openCreate = () => {
  Object.assign(form, emptyIndicator(), { id: undefined })
  drawerVisible.value = true
}

const openEdit = async (row: IndicatorVO) => {
  if (!row.id) return
  Object.assign(form, emptyIndicator(), row)
  drawerVisible.value = true
  detailLoading.value = true
  try {
    const detail = await IndicatorApi.getIndicator(row.id)
    Object.assign(form, emptyIndicator(), detail, { tagIds: detail.tagIds || [] })
  } catch {
    drawerVisible.value = false
    message.error('指标详情加载失败，请重试')
  } finally {
    detailLoading.value = false
  }
}

const toSavePayload = (): IndicatorVO => ({
  id: form.id,
  indicatorCode: form.indicatorCode.trim(),
  indicatorName: form.indicatorName.trim(),
  indicatorDomainId: form.indicatorDomainId!,
  calculationDescription: form.calculationDescription?.trim() || null,
  thresholdDescription: form.thresholdDescription?.trim() || null,
  dataSourceDescription: form.dataSourceDescription?.trim() || null,
  businessPenetration: form.businessPenetration?.trim() || null,
  supplementaryDescription: form.supplementaryDescription?.trim() || null,
  tagIds: [...form.tagIds],
  status: form.status,
  sort: form.sort
})

const saveIndicator = async () => {
  if (saving.value || detailLoading.value) return
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  saving.value = true
  try {
    const payload = toSavePayload()
    if (form.id) await IndicatorApi.updateIndicator(form.id, payload)
    else await IndicatorApi.createIndicator(payload)
    drawerVisible.value = false
    message.success('保存成功')
    await loadPage()
  } catch {
    message.error('指标保存失败，请重试')
  } finally {
    saving.value = false
  }
}

const removeIndicator = async (row: IndicatorVO) => {
  if (!row.id) return
  try {
    await message.delConfirm()
    await IndicatorApi.deleteIndicator(row.id)
    message.success('删除成功')
    await loadPage()
  } catch (error) {
    if (error !== 'cancel' && error !== 'close') message.error('指标删除失败，请重试')
  }
}

const aclVisible = ref(false)
const aclIndicator = ref<IndicatorVO>()
const openAcl = (row: IndicatorVO) => {
  aclIndicator.value = row
  aclVisible.value = true
}

const statusConfirmVisible = ref(false)
const statusCandidate = ref<IndicatorVO>()
const statusSaving = ref(false)

const applyStatus = async (row: IndicatorVO, status: number) => {
  if (!row.id || statusSaving.value) return
  statusSaving.value = true
  try {
    await IndicatorApi.updateIndicatorStatus(row.id, status)
    message.success(status === 0 ? '指标已启用' : '指标已停用')
    statusConfirmVisible.value = false
    statusCandidate.value = undefined
    await loadPage()
  } catch {
    message.error('指标状态更新失败，请重试')
  } finally {
    statusSaving.value = false
  }
}

const requestStatusChange = (row: IndicatorVO) => {
  if (row.status === 0) {
    void applyStatus(row, 1)
    return
  }
  statusCandidate.value = row
  statusConfirmVisible.value = true
}

const confirmEnable = () => {
  if (statusCandidate.value) void applyStatus(statusCandidate.value, 0)
}

onMounted(() => {
  void Promise.all([loadReferences(), loadPage()])
})
</script>

<style scoped lang="scss">
.indicator-filter-panel,
.indicator-table-panel {
  overflow: hidden;
}

.dm-panel__header h2 {
  margin: 0;
  font-size: 17px;
  color: #17233d;
}

.dm-panel__header p {
  margin: 5px 0 0;
  font-size: 12px;
  color: #7a8799;
}

.indicator-filters {
  display: grid;
  grid-template-columns: minmax(210px, 1.25fr) repeat(3, minmax(150px, 1fr)) auto;
  align-items: end;
  gap: 12px;
}

.indicator-filters :deep(.el-form-item) {
  margin: 0;
}

.indicator-filters :deep(.el-form-item__content),
.indicator-filters :deep(.el-input),
.indicator-filters :deep(.el-select) {
  width: 100%;
}

.indicator-filter-actions :deep(.el-form-item__content) {
  display: flex;
  flex-wrap: nowrap;
}

.indicator-table-panel :deep(.el-table) {
  border-radius: 10px 10px 0 0;
}

.indicator-identity,
.indicator-tags,
.editor-section header,
.editor-grid {
  display: flex;
  align-items: center;
}

.indicator-identity {
  min-width: 0;
  gap: 11px;
}

.indicator-identity__icon {
  display: grid;
  width: 38px;
  height: 38px;
  color: #1677ff;
  background: #edf5ff;
  border-radius: 11px;
  flex: 0 0 38px;
  place-items: center;
}

.indicator-identity__text {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 5px;
}

.indicator-identity__text strong {
  overflow: hidden;
  color: #17233d;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.indicator-identity__text code {
  font-size: 11px;
  font-weight: 650;
  letter-spacing: 0.04em;
  color: #6f7d90;
}

.indicator-tags {
  flex-wrap: wrap;
  gap: 5px;
}

.empty-value,
.update-time {
  font-size: 12px;
  color: #8a96a6;
}

.indicator-pagination {
  display: flex;
  padding: 15px 18px;
  border-top: 1px solid #edf0f4;
  justify-content: flex-end;
}

.indicator-editor {
  display: grid;
  gap: 16px;
}

.editor-section {
  padding: 18px;
  background: #fff;
  border: 1px solid #e4e9f0;
  border-radius: 12px;
}

.editor-section header {
  padding-bottom: 14px;
  margin-bottom: 16px;
  border-bottom: 1px solid #edf0f4;
  align-items: flex-start;
  gap: 11px;
}

.editor-section header > span {
  display: grid;
  width: 34px;
  height: 34px;
  color: #1677ff;
  background: #edf5ff;
  border-radius: 9px;
  flex: 0 0 34px;
  place-items: center;
}

.editor-section h3 {
  margin: 0;
  font-size: 15px;
  color: #17233d;
}

.editor-section header p {
  margin: 4px 0 0;
  font-size: 12px;
  color: #7a8799;
}

.editor-grid--two {
  display: grid;
  grid-template-columns: 1fr 1fr;
  align-items: start;
  gap: 0 16px;
}

.indicator-editor :deep(.el-select),
.indicator-editor :deep(.el-input-number) {
  width: 100%;
}

@media (width <= 1200px) {
  .indicator-filters {
    grid-template-columns: repeat(2, minmax(190px, 1fr));
  }
}

@media (width <= 760px) {
  .indicator-filters,
  .editor-grid--two {
    grid-template-columns: 1fr;
  }
}
</style>
