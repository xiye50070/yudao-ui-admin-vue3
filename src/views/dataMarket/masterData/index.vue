<template>
  <div class="master-data-page">
    <ContentWrap>
      <div class="page-heading">
        <div>
          <span>MASTER DATA MANAGEMENT</span>
          <h2>主数据对象</h2>
          <p>以已发布数据集为组件，构建可版本化、可申请的逻辑主数据模型。</p>
        </div>
        <el-button
          v-hasPermi="['data-market:master-data:create']"
          type="primary"
          @click="openEditor()"
        >
          <Icon icon="ep:plus" class="mr-5px" />新建主数据对象
        </el-button>
      </div>
    </ContentWrap>

    <ContentWrap>
      <el-form :inline="true" class="query-form">
        <el-form-item label="关键词">
          <el-input
            v-model="query.keyword"
            clearable
            placeholder="对象名称或编码"
            @keyup.enter="getList"
          />
        </el-form-item>
        <el-form-item label="业务主题域">
          <SubjectDomainSelect v-model="query.subjectDomainId" :domains="domains" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="query.status" clearable placeholder="全部状态">
            <el-option label="草稿" value="DRAFT" />
            <el-option label="已发布" value="PUBLISHED" />
            <el-option label="已停用" value="DISABLED" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="getList">查询</el-button>
          <el-button @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
    </ContentWrap>

    <ContentWrap>
      <el-table v-loading="loading" :data="list" row-key="id">
        <el-table-column label="主数据对象" min-width="260">
          <template #default="{ row }">
            <div class="object-cell">
              <span class="object-icon"><Icon icon="ep:share" /></span>
              <div
                ><b>{{ row.objectName }}</b
                ><code>{{ row.objectCode }}</code></div
              >
            </div>
          </template>
        </el-table-column>
        <el-table-column label="业务主题域" min-width="150">
          <template #default="{ row }">{{ domainName(row.subjectDomainId) }}</template>
        </el-table-column>
        <el-table-column label="当前版本" width="120">
          <template #default="{ row }">
            <div class="version-cell"
              ><b>V{{ row.versionNo }}</b
              ><small>{{ row.versionStatus }}</small></div
            >
          </template>
        </el-table-column>
        <el-table-column label="模型组成" width="190">
          <template #default="{ row }">
            <div class="metric-pills">
              <span
                ><b>{{ row.componentCount }}</b> 组件</span
              >
              <span
                ><b>{{ row.relationCount }}</b> 关系</span
              >
            </div>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="150">
          <template #default="{ row }">
            <el-tag :type="statusType(row.status)">{{ statusLabel(row.status) }}</el-tag>
            <el-tag v-if="row.hasDraft && row.status === 'PUBLISHED'" type="warning" class="ml-6px">
              有新草稿
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="updateTime" label="更新时间" width="170" />
        <el-table-column label="操作" width="250" fixed="right">
          <template #default="{ row }">
            <el-button
              v-hasPermi="['data-market:master-data:query']"
              link
              type="primary"
              @click="openEditor(row.id)"
              >查看</el-button
            >
            <el-button
              v-hasPermi="['data-market:master-data:update']"
              link
              type="primary"
              @click="openEditor(row.id)"
              >配置</el-button
            >
            <el-button
              v-if="row.hasDraft"
              v-hasPermi="['data-market:master-data:publish']"
              link
              type="success"
              @click="publish(row.id)"
              >发布</el-button
            >
            <el-button
              v-if="row.status === 'PUBLISHED'"
              v-hasPermi="['data-market:master-data:disable']"
              link
              type="danger"
              @click="disable(row.id)"
              >停用</el-button
            >
          </template>
        </el-table-column>
      </el-table>
      <Pagination
        v-model:limit="query.pageSize"
        v-model:page="query.pageNo"
        :total="total"
        @pagination="getList"
      />
    </ContentWrap>

    <MasterObjectEditor v-model="editorVisible" :object-id="editingId" @saved="getList" />
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import * as CatalogApi from '@/api/dataMarket/catalog'
import * as MasterApi from '@/api/dataMarket/masterData'
import type { MasterObjectStatus, MasterObjectSummary } from '@/api/dataMarket/masterData'
import type { SubjectDomainVO } from '@/api/dataMarket/types'
import SubjectDomainSelect from '@/views/dataMarket/components/SubjectDomainSelect.vue'
import MasterObjectEditor from './MasterObjectEditor.vue'
import { useMessage } from '@/hooks/web/useMessage'

defineOptions({ name: 'DataMarketMasterData' })

const message = useMessage()
const loading = ref(false)
const list = ref<MasterObjectSummary[]>([])
const total = ref(0)
const domains = ref<SubjectDomainVO[]>([])
const editorVisible = ref(false)
const editingId = ref<number>()
const query = reactive({
  pageNo: 1,
  pageSize: 10,
  keyword: '',
  subjectDomainId: undefined as number | undefined,
  status: undefined as MasterObjectStatus | undefined
})

async function getList() {
  loading.value = true
  try {
    const page = await MasterApi.getMasterObjectPage(query)
    list.value = page.list
    total.value = page.total
  } finally {
    loading.value = false
  }
}

function resetQuery() {
  Object.assign(query, { pageNo: 1, keyword: '', subjectDomainId: undefined, status: undefined })
  void getList()
}

function openEditor(id?: number) {
  editingId.value = id
  editorVisible.value = true
}

function domainName(id?: number) {
  return domains.value.find((domain) => domain.id === id)?.name ?? '-'
}

function statusLabel(status: MasterObjectStatus) {
  return status === 'PUBLISHED' ? '已发布' : status === 'DISABLED' ? '已停用' : '草稿'
}

function statusType(status: MasterObjectStatus) {
  return status === 'PUBLISHED' ? 'success' : status === 'DISABLED' ? 'danger' : 'info'
}

async function publish(id: number) {
  const result = await MasterApi.validateMasterObject(id)
  if (!result.valid) {
    message.error(`发布校验未通过：${result.errors.map((issue) => issue.message).join('；')}`)
    return
  }
  await MasterApi.publishMasterObject(id)
  message.success('主数据对象已发布')
  await getList()
}

async function disable(id: number) {
  await message.confirm('停用后门户将不再展示该主数据对象，是否继续？')
  await MasterApi.disableMasterObject(id)
  message.success('主数据对象已停用')
  await getList()
}

onMounted(async () => {
  domains.value = await CatalogApi.getSubjectDomainList()
  await getList()
})
</script>

<style scoped>
.master-data-page {
  display: grid;
  gap: 0;
}

.page-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
}

.page-heading > div > span {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.13em;
  color: var(--el-color-primary);
}

.page-heading h2 {
  margin: 5px 0 4px;
  font-size: 22px;
}

.page-heading p {
  margin: 0;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.query-form :deep(.el-input),
.query-form :deep(.el-select),
.query-form :deep(.el-tree-select) {
  width: 210px;
}

.object-cell {
  display: flex;
  align-items: center;
  gap: 10px;
}

.object-icon {
  display: grid;
  width: 38px;
  height: 38px;
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
  border-radius: 9px;
  place-items: center;
}

.object-cell > div {
  display: grid;
  gap: 3px;
}

.object-cell b {
  font-size: 13px;
}

.object-cell code {
  font-size: 10px;
  color: var(--el-text-color-secondary);
}

.version-cell {
  display: grid;
  gap: 2px;
}

.version-cell small {
  font-size: 10px;
  color: var(--el-text-color-secondary);
}

.metric-pills {
  display: flex;
  gap: 6px;
}

.metric-pills span {
  padding: 5px 8px;
  font-size: 10px;
  color: var(--el-text-color-secondary);
  background: var(--el-fill-color-light);
  border-radius: 6px;
}

.metric-pills b {
  font-size: 12px;
  color: var(--el-text-color-primary);
}
</style>
