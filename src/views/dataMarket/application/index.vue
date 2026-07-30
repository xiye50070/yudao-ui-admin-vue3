<template>
  <ContentWrap
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
      ><el-table-column prop="applicationNo" label="申请单号" /><el-table-column
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
      ><el-divider content-position="left">清洗规则</el-divider
      ><el-table :data="detail.cleaningRules" size="small"
        ><el-table-column prop="datasetId" label="数据集" /><el-table-column
          prop="fieldId"
          label="字段" /><el-table-column prop="ruleTemplateId" label="规则模板" /><el-table-column
          prop="customDescription"
          label="说明" /></el-table
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
        v-hasPermi="['data-market:delivery:create']"
        type="primary"
        @click="deliveryVisible = true"
        >创建交付方案</el-button
      ></template
    ></el-drawer
  >
  <Dialog v-model="deliveryVisible" title="创建交付方案"
    ><el-form ref="deliveryFormRef" :model="deliveryForm" :rules="deliveryRules" label-width="100px"
      ><el-form-item label="方案说明" prop="planDescription"
        ><el-input v-model="deliveryForm.planDescription" type="textarea" /></el-form-item
      ><el-form-item label="负责人 ID" prop="ownerUserId"
        ><el-input-number v-model="deliveryForm.ownerUserId" :min="1" /></el-form-item></el-form
    ><template #footer
      ><el-button
        v-hasPermi="['data-market:delivery:create']"
        type="primary"
        :loading="submitting"
        @click="createDelivery"
        >创建</el-button
      ></template
    ></Dialog
  >
</template>
<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import * as DeliveryApi from '@/api/dataMarket/delivery'
import type {
  ApplicationDetailVO,
  ApplicationSummaryVO,
  TimelineItem
} from '@/api/dataMarket/types'
import { useMessage } from '@/hooks/web/useMessage'
import { describeApplicationBaseInfo, describeProcessingAdvancedSettings } from './presentation'
defineOptions({ name: 'DataMarketApplication' })
const message = useMessage()
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
const selectedId = ref<number>()
const deliveryVisible = ref(false)
const submitting = ref(false)
const deliveryFormRef = ref<any>()
const deliveryForm = reactive({ planDescription: '', ownerUserId: undefined as number | undefined })
const deliveryRules = {
  planDescription: [{ required: true, message: '请输入交付方案说明', trigger: 'blur' }],
  ownerUserId: [{ required: true, message: '请输入负责人 ID', trigger: 'change' }]
}
const getList = async () => {
  loading.value = true
  try {
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
  selectedId.value = id
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
const createDelivery = async () => {
  if (!(await deliveryFormRef.value.validate()) || !selectedId.value) return
  submitting.value = true
  try {
    await DeliveryApi.createDelivery(
      selectedId.value,
      deliveryForm as { planDescription: string; ownerUserId: number }
    )
    deliveryVisible.value = false
    message.success('交付方案已创建')
  } finally {
    submitting.value = false
  }
}
onMounted(getList)
</script>
