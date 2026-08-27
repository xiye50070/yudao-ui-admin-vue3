<template>
  <DataMarketManagementPage
    page-key="application"
    title="申请管理"
    description="跟踪数据申请、审批与交付衔接状态"
    icon="ep:document"
  >
    <template #actions>
      <el-button :loading="loading" @click="getList"><Icon icon="ep:refresh" />刷新</el-button>
    </template>

    <template #summary>
      <div class="dm-summary-item"
        ><span class="dm-summary-item__icon"><Icon icon="ep:document" /></span
        ><span class="dm-summary-item__content"
          ><small>申请总数</small><strong>{{ total }}</strong></span
        ></div
      >
      <div class="dm-summary-item"
        ><span class="dm-summary-item__icon"><Icon icon="ep:files" /></span
        ><span class="dm-summary-item__content"
          ><small>本页申请数据集</small><strong>{{ currentDatasetCount }}</strong></span
        ></div
      >
      <div class="dm-summary-item"
        ><span class="dm-summary-item__icon"><Icon icon="ep:box" /></span
        ><span class="dm-summary-item__content"
          ><small>本页待交付</small><strong>{{ currentConfiguringCount }}</strong></span
        ></div
      >
    </template>

    <section v-if="!approvalContext" class="dm-panel application-filter-panel">
      <header class="dm-panel__header"
        ><div><h2>筛选申请</h2><p>按状态、申请人和更新时间定位申请记录</p></div></header
      >
      <el-form :inline="true" :model="query" class="application-filter-form">
        <el-form-item label="申请状态">
          <el-select
            v-model="query.statuses"
            data-testid="application-status-filter"
            multiple
            clearable
            filterable
            collapse-tags
            collapse-tags-tooltip
            placeholder="全部状态"
            class="!w-260px"
          >
            <el-option
              v-for="option in APPLICATION_STATUS_OPTIONS"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="申请人">
          <el-cascader
            v-model="applicantNodeValue"
            data-testid="application-applicant-filter"
            :options="applicantOptions"
            :props="applicantCascaderProps"
            :disabled="referenceLoading || Boolean(referenceError)"
            clearable
            filterable
            placeholder="部门 / 申请人"
            class="!w-260px"
          />
        </el-form-item>
        <el-form-item label="更新时间">
          <el-date-picker
            v-model="query.updateTime"
            data-testid="application-update-time-filter"
            type="datetimerange"
            value-format="YYYY-MM-DD HH:mm:ss"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            class="!w-380px"
          />
        </el-form-item>
        <el-form-item label="日期排序">
          <el-select
            v-model="query.updateTimeSort"
            data-testid="application-update-time-sort"
            class="!w-150px"
            ><el-option label="最新优先" value="DESC" /><el-option label="最早优先" value="ASC"
          /></el-select>
        </el-form-item>
        <el-form-item
          ><el-button
            v-hasPermi="['data-market:application:management-query']"
            data-testid="application-filter-submit"
            type="primary"
            @click="submitFilters"
            >查询</el-button
          ><el-button @click="resetFilters">重置</el-button></el-form-item
        >
      </el-form>
      <el-alert
        v-if="referenceError"
        title="申请人数据加载失败"
        :description="referenceError"
        type="warning"
        :closable="false"
        show-icon
      />
    </section>

    <section class="dm-panel">
      <header class="dm-panel__header"
        ><div
          ><h2>{{ approvalContext ? '审批上下文' : '申请列表' }}</h2
          ><p v-if="!loadError">共 {{ total }} 条申请记录</p><p v-else>申请记录暂不可用</p></div
        ></header
      >
      <el-result
        v-if="loadError"
        class="dm-load-result"
        icon="warning"
        title="申请列表加载失败"
        sub-title="暂时无法获取申请记录，请稍后重试"
        ><template #extra
          ><el-button type="primary" @click="getList">重新加载</el-button></template
        ></el-result
      >
      <template v-else>
        <div class="dm-table-wrap">
          <el-table v-loading="loading" :data="list" empty-text="暂无申请" table-layout="fixed">
            <el-table-column label="申请单号" width="220">
              <template #default="{ row }"
                ><el-button
                  v-hasPermi="['data-market:application:management-query']"
                  :data-testid="`application-no-${row.id}`"
                  link
                  type="primary"
                  class="application-no"
                  @click="openDetail(row.id)"
                  >{{ row.applicationNo }}</el-button
                ></template
              >
            </el-table-column>
            <el-table-column prop="name" label="申请名称" min-width="240" show-overflow-tooltip />
            <el-table-column label="申请人" min-width="150"
              ><template #default="{ row }">{{ getApplicantName(row) }}</template></el-table-column
            >
            <el-table-column label="状态" width="110" align="center"
              ><template #default="{ row }"
                ><el-tag effect="plain" round>{{
                  getApplicationStatusLabel(row.status)
                }}</el-tag></template
              ></el-table-column
            >
            <el-table-column prop="datasetCount" label="申请数量" width="100" align="center" />
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
                  @click="openDetail(row.id)"
                  >查看详情<Icon icon="ep:arrow-right" /></el-button></template
            ></el-table-column>
          </el-table>
        </div>
        <Pagination
          v-if="!approvalContext"
          v-model:limit="query.pageSize"
          v-model:page="query.pageNo"
          :total="total"
          @pagination="getList"
        />
      </template>
    </section>
  </DataMarketManagementPage>
  <el-drawer v-model="detailVisible" title="申请完整详情" size="70%"
    ><div v-if="detailLoading" v-loading="true" class="dm-drawer-loading"></div
    ><el-empty v-else-if="!detail" description="请选择申请" /><template v-else
      ><el-descriptions title="基本信息" :column="3" border
        ><el-descriptions-item label="申请单号">{{ detail.applicationNo }}</el-descriptions-item
        ><el-descriptions-item label="名称">申请：{{ detail.name }}</el-descriptions-item
        ><el-descriptions-item label="状态">{{ detail.status }}</el-descriptions-item
        ><el-descriptions-item label="版本">{{
          detail.currentVersionNo
        }}</el-descriptions-item></el-descriptions
      ><el-divider content-position="left">申请使用信息</el-divider
      ><el-descriptions :column="3" border
        ><el-descriptions-item
          v-for="item in detailBaseInfo"
          :key="item.label"
          :label="item.label"
          >{{
            item.label === '申请名称' ? `申请：${item.value}` : item.value
          }}</el-descriptions-item
        ></el-descriptions
      ><el-divider content-position="left">数据集、字段与查询条件</el-divider
      ><ApplicationResourceDetail :detail="detail" /> ><template v-if="detail.cleaningRules?.length"
        ><el-divider content-position="left">历史清洗规则（只读）</el-divider
        ><el-table :data="detail.cleaningRules" size="small"
          ><el-table-column prop="datasetId" label="数据集" /><el-table-column
            prop="fieldId"
            label="字段" /><el-table-column
            prop="ruleTemplateId"
            label="规则模板" /><el-table-column prop="customDescription" label="说明" /></el-table
      ></template>
      ><el-divider content-position="left">加工需求</el-divider
      ><el-table :data="detail.processingItems" size="small"
        ><el-table-column prop="itemNo" label="序号" width="80" /><el-table-column
          prop="businessGoal"
          label="业务目标" /><el-table-column prop="expectedResult" label="预期结果" /></el-table
      ><el-collapse class="mt-12px"
        ><el-collapse-item
          v-for="item in detail.processingItems"
          :key="item.itemNo"
          :title="`加工项 ${item.itemNo} 高级配置`"
          ><el-descriptions :column="1" border
            ><el-descriptions-item
              v-for="setting in describeProcessingAdvancedSettings(item.advancedSettings)"
              :key="setting.label"
              :label="setting.label"
              >{{ setting.value }}</el-descriptions-item
            ><el-descriptions-item
              v-if="!describeProcessingAdvancedSettings(item.advancedSettings).length"
              label="高级配置"
              >未配置</el-descriptions-item
            ></el-descriptions
          ></el-collapse-item
        ></el-collapse
      ><el-divider content-position="left">业务与审批时间线</el-divider
      ><el-timeline
        ><el-timeline-item
          v-for="item in timeline"
          :key="`${item.eventType}-${item.occurredAt}`"
          :timestamp="item.occurredAt"
          >{{ item.title }} <span v-if="item.operatorName">· {{ item.operatorName }}</span
          ><div>{{ item.description }}</div></el-timeline-item
        ></el-timeline
      ><el-empty v-if="!timeline.length" description="暂无时间线记录" /><el-divider /><el-button
        v-if="detail.status === 'CONFIGURING'"
        v-hasPermi="['data-market:delivery:create']"
        :data-testid="`create-delivery-${detail.id}`"
        type="primary"
        @click="goToDeliveryConfiguration"
        >创建交付方案</el-button
      ></template
    ></el-drawer
  >
</template>
<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import type { CascaderOption } from 'element-plus'
import { useRouter } from 'vue-router'
import * as DeptApi from '@/api/system/dept'
import * as UserApi from '@/api/system/user'
import * as DeliveryApi from '@/api/dataMarket/delivery'
import type {
  ApplicationDetailVO,
  ApplicationManagementPageReq,
  ApplicationSummaryVO,
  TimelineItem
} from '@/api/dataMarket/types'
import { formatDate } from '@/utils/formatTime'
import ApplicationResourceDetail from './ApplicationResourceDetail.vue'
import { describeApplicationBaseInfo, describeProcessingAdvancedSettings } from './presentation'
import DataMarketManagementPage from '@/views/dataMarket/components/DataMarketManagementPage.vue'
import {
  APPLICATION_STATUS_OPTIONS,
  buildApplicantCascadeOptions,
  formatApplicantName,
  getApplicationStatusLabel,
  parseApplicantNodeValue,
  type ApplicantDepartmentReference,
  type ApplicantUserReference
} from './filters'
defineOptions({ name: 'DataMarketApplication' })
const props = defineProps<{
  id?: string | number
}>()
const router = useRouter()
const loading = ref(false)
const loadError = ref(false)
const list = ref<ApplicationSummaryVO[]>([])
const total = ref(0)
const query = reactive<ApplicationManagementPageReq>({
  pageNo: 1,
  pageSize: 10,
  statuses: [],
  applicantUserId: undefined,
  updateTime: undefined,
  updateTimeSort: 'DESC'
})
const departments = ref<ApplicantDepartmentReference[]>([])
const users = ref<ApplicantUserReference[]>([])
const referenceLoading = ref(false)
const referenceError = ref('')
const applicantCascaderProps = {
  value: 'value',
  label: 'label',
  children: 'children',
  disabled: 'disabled',
  emitPath: false,
  checkStrictly: false
}
const applicantNodeValue = computed<string | undefined>({
  get: () => (query.applicantUserId === undefined ? undefined : `user:${query.applicantUserId}`),
  set: (value) => {
    query.applicantUserId = parseApplicantNodeValue(value)
  }
})
const applicantOptions = computed<CascaderOption[]>(
  () =>
    buildApplicantCascadeOptions(
      departments.value,
      users.value,
      query.applicantUserId
    ) as unknown as CascaderOption[]
)
const applicantUserMap = computed(
  () => new Map(users.value.map((user) => [user.id, user] as const))
)
const currentDatasetCount = computed(() =>
  list.value.reduce((sum, application) => sum + (application.datasetCount || 0), 0)
)
const currentConfiguringCount = computed(
  () => list.value.filter((application) => application.status === 'CONFIGURING').length
)
const getApplicantName = (row: ApplicationSummaryVO) => {
  if (row.applicantUserId === undefined) return formatApplicantName()
  return formatApplicantName(applicantUserMap.value.get(row.applicantUserId), row.applicantUserId)
}
const buildPageRequest = (): ApplicationManagementPageReq => ({
  pageNo: query.pageNo,
  pageSize: query.pageSize,
  ...(query.statuses?.length ? { statuses: query.statuses } : {}),
  ...(query.applicantUserId !== undefined ? { applicantUserId: query.applicantUserId } : {}),
  ...(query.updateTime?.length === 2 ? { updateTime: query.updateTime } : {}),
  updateTimeSort: query.updateTimeSort || 'DESC'
})
const detailVisible = ref(false)
const detailLoading = ref(false)
const detail = ref<ApplicationDetailVO>()
const detailBaseInfo = computed(() =>
  detail.value ? describeApplicationBaseInfo(detail.value.baseInfo) : []
)
const timeline = ref<TimelineItem[]>([])
const approvalContext = computed(() => props.id !== undefined && props.id !== null)
const approvalApplicationId = computed(() => {
  if (!approvalContext.value) return undefined
  const match = String(props.id).match(/^(?:DATA_MARKET:)?(\d+)$/)
  if (!match) return undefined
  const id = Number(match[1])
  return Number.isSafeInteger(id) && id > 0 ? id : undefined
})
const getList = async () => {
  loading.value = true
  loadError.value = false
  try {
    if (approvalContext.value) {
      if (!approvalApplicationId.value) {
        list.value = []
        total.value = 0
        return
      }
      const application = await DeliveryApi.getApplication(approvalApplicationId.value)
      list.value = [application]
      total.value = 1
      return
    }
    const data = await DeliveryApi.getApplicationPage(buildPageRequest())
    list.value = data.list
    total.value = data.total
  } catch {
    list.value = []
    total.value = 0
    loadError.value = true
  } finally {
    loading.value = false
  }
}
const loadApplicantReferences = async () => {
  referenceLoading.value = true
  referenceError.value = ''
  try {
    const [departmentItems, userItems] = await Promise.all([
      DeptApi.getSimpleDeptList(),
      UserApi.getSimpleUserList()
    ])
    departments.value = departmentItems
    users.value = userItems
  } catch {
    departments.value = []
    users.value = []
    referenceError.value = '仍可查看申请列表，请稍后重试加载部门与用户数据。'
  } finally {
    referenceLoading.value = false
  }
}
const submitFilters = () => {
  query.pageNo = 1
  void getList()
}
const resetFilters = () => {
  query.pageNo = 1
  query.statuses = []
  query.applicantUserId = undefined
  query.updateTime = undefined
  query.updateTimeSort = 'DESC'
  void getList()
}
const openDetail = async (id: number) => {
  detailVisible.value = true
  detailLoading.value = true
  try {
    const [application, items] = await Promise.all([
      DeliveryApi.getApplication(id),
      DeliveryApi.getApplicationTimeline(id)
    ])
    detail.value = application
    timeline.value = items
  } catch {
    detail.value = undefined
    timeline.value = []
  } finally {
    detailLoading.value = false
  }
}
const goToDeliveryConfiguration = () => {
  if (!detail.value) return
  detailVisible.value = false
  void router.push({
    name: 'DataMarketDeliveryWorkbench',
    query: { applicationId: String(detail.value.id) }
  })
}
onMounted(() => {
  void getList()
  if (!approvalContext.value) {
    void loadApplicantReferences()
  }
})
</script>

<style scoped lang="scss">
.application-filter-panel {
  padding-bottom: 8px !important;
}

.application-filter-form :deep(.el-form-item) {
  margin-bottom: 14px;
}

.application-no {
  max-width: 100%;
  font-family: SFMono-Regular, Consolas, monospace;
  font-weight: 600;
}

:deep(.el-drawer__header) {
  padding: 20px 24px;
  margin-bottom: 0;
  border-bottom: 1px solid #e8ecf2;
}

:deep(.el-drawer__body) {
  padding: 24px;
  background: #f8fafc;
}

.dm-drawer-loading {
  min-height: 180px;
}
</style>
