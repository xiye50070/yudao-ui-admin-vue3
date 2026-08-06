<template>
  <ContentWrap
    v-if="!approvalContext"
    ><el-form :inline="true"
      ><el-form-item
        ><el-input
          v-model="query.status"
          placeholder="申请状态"
          clearable
          @keyup.enter="getList" /></el-form-item
      ><el-form-item
        ><el-input-number
          v-model="query.applicantUserId"
          :min="1"
          placeholder="申请人 ID" /></el-form-item
      ><el-form-item
        ><el-button v-hasPermi="['data-market:application:management-query']" @click="getList"
          >查询</el-button
        ></el-form-item
      ></el-form
    ></ContentWrap
  >
  <ContentWrap
    ><el-table v-loading="loading" :data="list" empty-text="暂无申请"
      ><el-table-column label="申请单号"
        ><template #default="{ row }"
          ><el-button
            v-hasPermi="['data-market:application:management-query']"
            :data-testid="`application-no-${row.id}`"
            link
            type="primary"
            @click="openDetail(row.id)"
            >{{ row.applicationNo }}</el-button
          ></template
        ></el-table-column
      ><el-table-column
        prop="name"
        label="申请名称"
      /><el-table-column prop="applicationType" label="类型" width="100" /><el-table-column
        prop="status"
        label="状态"
        width="130"
      /><el-table-column prop="datasetCount" label="数据集" width="80" /><el-table-column
        prop="updateTime"
        label="更新时间"
        width="180"
      /><el-table-column label="操作" width="120"
        ><template #default="{ row }"
          ><el-button
            v-hasPermi="['data-market:application:management-query']"
            link
            type="primary"
            @click="openDetail(row.id)"
            >详情</el-button
          ></template
        ></el-table-column
      ></el-table
    ><Pagination
      v-if="!approvalContext"
      v-model:limit="query.pageSize"
      v-model:page="query.pageNo"
      :total="total"
      @pagination="getList"
  /></ContentWrap>
  <el-drawer v-model="detailVisible" title="申请完整详情" size="70%" v-loading="detailLoading"
    ><el-empty v-if="!detail" description="请选择申请" /><template v-else
      ><el-descriptions title="基本信息" :column="3" border
        ><el-descriptions-item label="申请单号">{{ detail.applicationNo }}</el-descriptions-item
        ><el-descriptions-item label="名称">{{ detail.name }}</el-descriptions-item
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
          >{{ item.value }}</el-descriptions-item
        ></el-descriptions
      ><el-divider content-position="left">数据集、字段与查询条件</el-divider
      ><el-collapse
        ><el-collapse-item
          v-for="dataset in detail.datasets"
          :key="dataset.applicationDatasetId"
          :title="dataset.datasetSnapshot.businessName || dataset.datasetSnapshot.datasetCode"
          ><el-table :data="dataset.fields" size="small"
            ><el-table-column prop="fieldName" label="字段" /><el-table-column
              prop="dataType"
              label="类型"
            /><el-table-column prop="sensitivityLevel" label="敏感级" /><el-table-column
              label="返回"
              ><template #default="{ row }"
                ><el-tag :type="row.returnSelected ? 'success' : 'info'">{{
                  row.returnSelected ? '是' : '否'
                }}</el-tag></template
              ></el-table-column
            ><el-table-column label="查询条件"
              ><template #default="{ row }">{{
                row.querySelected ? (row.queryCapabilities || []).join('、') : '否'
              }}</template></el-table-column
            ></el-table
          ></el-collapse-item
        ></el-collapse
      ><template v-if="detail.cleaningRules?.length"
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
import { useRouter } from 'vue-router'
import * as DeliveryApi from '@/api/dataMarket/delivery'
import type {
  ApplicationDetailVO,
  ApplicationSummaryVO,
  TimelineItem
} from '@/api/dataMarket/types'
import { describeApplicationBaseInfo, describeProcessingAdvancedSettings } from './presentation'
defineOptions({ name: 'DataMarketApplication' })
const props = defineProps<{
  id?: string | number
}>()
const router = useRouter()
const loading = ref(false)
const list = ref<ApplicationSummaryVO[]>([])
const total = ref(0)
const query = reactive({
  pageNo: 1,
  pageSize: 10,
  status: '',
  applicantUserId: undefined as number | undefined
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
    const data = await DeliveryApi.getApplicationPage(query)
    list.value = data.list
    total.value = data.total
  } catch {
    list.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
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
onMounted(getList)
</script>
