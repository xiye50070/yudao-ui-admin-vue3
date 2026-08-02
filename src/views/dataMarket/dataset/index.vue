<template>
  <ContentWrap
    ><el-form :inline="true"
      ><el-form-item
        ><el-input
          v-model="query.keyword"
          placeholder="数据集名称或编码"
          clearable
          @keyup.enter="getList" /></el-form-item
      ><el-form-item
        ><el-button @click="getList">查询</el-button
        ><el-button
          v-hasPermi="['data-market:dataset:create']"
          type="primary"
          plain
          @click="openDrawer()"
          ><Icon icon="ep:plus" class="mr-5px" />新增数据集</el-button
        ></el-form-item
      ></el-form
    ></ContentWrap
  >
  <ContentWrap
    ><el-table v-loading="loading" :data="list"
      ><el-table-column prop="businessName" label="数据集名称" /><el-table-column
        prop="datasetCode"
        label="编码"
      /><el-table-column label="来源系统" min-width="140"
        ><template #default="{ row }">{{
          row.sourceSystemName || resolveSourceSystemName(row.sourceSystemId)
        }}</template></el-table-column
      ><el-table-column label="业务主题域" min-width="140"
        ><template #default="{ row }">{{
          row.subjectDomainName || resolveSubjectDomainName(row.subjectDomainId)
        }}</template></el-table-column
      ><el-table-column prop="sensitivityLevel" label="敏感级" width="90" /><el-table-column
        label="状态"
        width="100"
        ><template #default="{ row }">{{
          row.publishStatus === 1 ? '已发布' : '草稿'
        }}</template></el-table-column
      ><el-table-column label="操作" width="250"
        ><template #default="{ row }"
          ><el-button
            v-hasPermi="['data-market:dataset:update']"
            link
            type="primary"
            @click="openDrawer(row)"
            >编辑</el-button
          ><el-button
            v-hasPermi="['data-market:dataset:update']"
            link
            type="primary"
            @click="openFields(row)"
            >字段</el-button
          ><el-button
            v-hasPermi="['data-market:access-policy:update']"
            link
            type="primary"
            @click="openAcl(row)"
            >ACL</el-button
          ><el-button
            v-hasPermi="['data-market:dataset:publish']"
            link
            type="success"
            @click="openPublish(row)"
            >发布</el-button
          ><el-button
            v-hasPermi="['data-market:dataset:delete']"
            link
            type="danger"
            @click="remove(row.id)"
            >删除</el-button
          ></template
        ></el-table-column
      ></el-table
    ><Pagination
      v-model:limit="query.pageSize"
      v-model:page="query.pageNo"
      :total="total"
      @pagination="getList"
  /></ContentWrap>
  <el-drawer v-model="drawer" :title="form.id ? '编辑数据集' : '新增数据集'" size="560px"
    ><el-form ref="formRef" :model="form" :rules="rules" label-width="100px"
      ><el-form-item label="数据集名称" prop="businessName"
        ><el-input v-model="form.businessName" /></el-form-item
      ><el-form-item label="数据集编码" prop="datasetCode"
        ><el-input v-model="form.datasetCode" /></el-form-item
      ><el-form-item label="来源系统" prop="sourceSystemId"
        ><SourceSystemSelect
          v-model="form.sourceSystemId"
          :options="sourceSystemOptions"
          :loading="sourceSystemLoading"
          @search="searchSourceSystems" /></el-form-item
      ><el-form-item label="物理表名" prop="physicalName"
        ><el-input v-model="form.physicalName" /></el-form-item
      ><el-form-item label="业务主题域" prop="subjectDomainId"
        ><SubjectDomainSelect
          v-model="form.subjectDomainId"
          :domains="subjectDomains" /></el-form-item
      ><el-form-item label="敏感级别" prop="sensitivityLevel"
        ><el-select v-model="form.sensitivityLevel"
          ><el-option
            v-for="level in [1, 2, 3, 4]"
            :key="level"
            :label="`L${level}`"
            :value="level" /></el-select></el-form-item
      ><el-form-item label="说明"
        ><el-input v-model="form.description" type="textarea" /></el-form-item></el-form
    ><template #footer
      ><el-button @click="drawer = false">取消</el-button
      ><DatasetActions
        :editing="Boolean(form.id)"
        @save="save"
        @publish="openPublish(form)" /></template
  ></el-drawer>
  <Dialog v-model="fieldVisible" title="字段编辑" width="min(1280px, 96vw)"
    ><el-alert
      title="可返回、可查询由申请人按申请单选择；此处只维护数据表字段元数据。"
      type="info"
      :closable="false"
      class="mb-12px"
    />
    <el-table :data="fields"
      ><el-table-column label="字段编码"
        ><template #default="{ row }"
          ><el-input v-model="row.fieldCode" /></template></el-table-column
      ><el-table-column label="字段名称"
        ><template #default="{ row }"
          ><el-input v-model="row.fieldName" /></template></el-table-column
      ><el-table-column label="类型"
        ><template #default="{ row }"
          ><el-input v-model="row.dataType" /></template></el-table-column
      ><el-table-column label="敏感级"
        ><template #default="{ row }"
          ><el-input-number
            v-model="row.sensitivityLevel"
            :min="1"
            :max="4" /></template></el-table-column
      ><el-table-column label="说明"
        ><template #default="{ row }"
          ><el-input v-model="row.businessDescription" /></template></el-table-column
      ><el-table-column label="可空" width="72"
        ><template #default="{ row }"
          ><el-switch v-model="row.nullable" /></template></el-table-column
      ><el-table-column label="主键" width="72"
        ><template #default="{ row }"
          ><el-switch v-model="row.primaryKey" /></template></el-table-column
      ><el-table-column label="关联键" width="82"
        ><template #default="{ row }"
          ><el-switch v-model="row.joinKey" /></template></el-table-column
      ><el-table-column label="启用" width="72"
        ><template #default="{ row }"
          ><el-switch
            v-model="row.status"
            :active-value="0"
            :inactive-value="1" /></template></el-table-column></el-table
    ><el-button v-hasPermi="['data-market:dataset:update']" class="mt-12px" @click="addField"
      >新增字段</el-button
    ><template #footer
      ><el-button v-hasPermi="['data-market:dataset:update']" type="primary" @click="saveFields"
        >保存字段</el-button
      ></template
    ></Dialog
  >
  <Dialog v-model="aclVisible" title="数据集 ACL" width="620px"
    ><el-table :data="aclRules"
      ><el-table-column label="主体类型"
        ><template #default="{ row }"
          ><el-select v-model="row.principalType"
            ><el-option value="DEPT" label="部门" /><el-option
              value="ROLE"
              label="角色" /></el-select></template></el-table-column
      ><el-table-column label="主体 ID"
        ><template #default="{ row }"
          ><el-input-number v-model="row.principalId" :min="1" /></template></el-table-column
      ><el-table-column label="含子部门"
        ><template #default="{ row }"
          ><el-switch
            v-model="row.includeChildDept"
            :disabled="row.principalType === 'ROLE'" /></template></el-table-column></el-table
    ><el-button v-hasPermi="['data-market:access-policy:update']" class="mt-12px" @click="addAcl"
      >新增 ACL</el-button
    ><template #footer
      ><el-button v-hasPermi="['data-market:access-policy:update']" type="primary" @click="saveAcl"
        >保存 ACL</el-button
      ></template
    ></Dialog
  >
  <Dialog v-model="publishVisible" title="发布数据集" width="560px"
    ><el-form ref="publishFormRef" :model="publishForm" :rules="publishRules" label-width="100px"
      ><el-form-item label="业务主题域" prop="subjectDomainId"
        ><SubjectDomainSelect
          v-model="publishForm.subjectDomainId"
          :domains="subjectDomains" /></el-form-item
      ><el-form-item label="标签 ID" prop="tagIdsText"
        ><el-input
          v-model="publishForm.tagIdsText"
          placeholder="多个标签用逗号分隔" /></el-form-item
      ><el-form-item label="敏感级别" prop="sensitivityLevel"
        ><el-select v-model="publishForm.sensitivityLevel"
          ><el-option
            v-for="level in [1, 2, 3, 4]"
            :key="level"
            :label="`L${level}`"
            :value="level" /></el-select></el-form-item
      ><el-form-item label="发布说明"
        ><el-input v-model="publishForm.publishComment" type="textarea" /></el-form-item></el-form
    ><template #footer
      ><el-button v-hasPermi="['data-market:dataset:publish']" type="success" @click="publish"
        >确认发布</el-button
      ></template
    ></Dialog
  >
</template>
<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import * as CatalogApi from '@/api/dataMarket/catalog'
import type {
  DatasetAclRule,
  DatasetFieldVO,
  DatasetVO,
  SubjectDomainVO
} from '@/api/dataMarket/types'
import * as SecurityApi from '@/api/dataMarket/security'
import SourceSystemSelect from '@/views/dataMarket/components/SourceSystemSelect.vue'
import SubjectDomainSelect from '@/views/dataMarket/components/SubjectDomainSelect.vue'
import {
  mergeSourceSystemOptions,
  type SourceSystemOption
} from '@/views/dataMarket/referenceSelectors'
import DatasetActions from './DatasetActions.vue'
import { createEmptyDatasetField, toDatasetFieldSaveReq } from './contracts'
import { useMessage } from '@/hooks/web/useMessage'
defineOptions({ name: 'DataMarketDataset' })
const message = useMessage()
const loading = ref(false)
const list = ref<DatasetVO[]>([])
const total = ref(0)
const query = reactive({ pageNo: 1, pageSize: 10, keyword: '' })
const drawer = ref(false)
const fieldVisible = ref(false)
const aclVisible = ref(false)
const publishVisible = ref(false)
const subjectDomains = ref<SubjectDomainVO[]>([])
const sourceSystemOptions = ref<SourceSystemOption[]>([])
const sourceSystemLoading = ref(false)
const formRef = ref<any>()
const currentId = ref<number>()
const fields = ref<DatasetFieldVO[]>([])
const aclRules = ref<DatasetAclRule[]>([])
const aclDatasetId = ref<number>()
const publishingId = ref<number>()
const publishFormRef = ref<any>()
let subjectDomainRequest: Promise<void> | undefined
let sourceSearchSequence = 0
const publishForm = reactive({
  subjectDomainId: undefined as number | undefined,
  tagIdsText: '',
  sensitivityLevel: 1,
  publishComment: ''
})
const publishRules = {
  subjectDomainId: [{ required: true, message: '请选择主题域', trigger: 'change' }],
  tagIdsText: [{ required: true, message: '请输入至少一个标签 ID', trigger: 'blur' }],
  sensitivityLevel: [{ required: true, message: '请选择敏感级别', trigger: 'change' }]
}
const form = reactive<DatasetVO>({
  datasetCode: '',
  businessName: '',
  sourceSystemId: undefined,
  physicalName: '',
  subjectDomainId: undefined,
  sensitivityLevel: 1,
  description: ''
})
const rules = {
  datasetCode: [{ required: true, message: '请输入数据集编码', trigger: 'blur' }],
  businessName: [{ required: true, message: '请输入数据集名称', trigger: 'blur' }],
  sourceSystemId: [{ required: true, message: '请选择来源系统', trigger: 'change' }],
  physicalName: [{ required: true, message: '请输入物理表名', trigger: 'blur' }],
  subjectDomainId: [{ required: true, message: '请选择主题域', trigger: 'change' }],
  sensitivityLevel: [{ required: true, message: '请选择敏感级别', trigger: 'change' }]
}
const sourceSystemNameMap = computed(
  () => new Map(sourceSystemOptions.value.map((item) => [item.id, item.name]))
)
const subjectDomainNameMap = computed(
  () => new Map(subjectDomains.value.map((item) => [item.id, item.name]))
)

const resolveSourceSystemName = (id?: number) =>
  id === undefined ? '—' : sourceSystemNameMap.value.get(id) || '已停用或不可见'
const resolveSubjectDomainName = (id?: number) =>
  id === undefined ? '—' : subjectDomainNameMap.value.get(id) || '已停用或不可见'

const loadSubjectDomains = () => {
  if (subjectDomains.value.length) return Promise.resolve()
  if (subjectDomainRequest) return subjectDomainRequest
  subjectDomainRequest = CatalogApi.getSubjectDomainList()
    .then((data) => {
      subjectDomains.value = data
    })
    .catch(() => {
      message.error('主题域数据加载失败，请重试')
    })
    .finally(() => {
      subjectDomainRequest = undefined
    })
  return subjectDomainRequest
}

const searchSourceSystems = async (keyword = '') => {
  const sequence = ++sourceSearchSequence
  sourceSystemLoading.value = true
  try {
    const page = await CatalogApi.getSourceSystemPage({ pageNo: 1, pageSize: 50, keyword })
    if (sequence !== sourceSearchSequence) return
    const current = sourceSystemOptions.value.filter((item) => item.id === form.sourceSystemId)
    sourceSystemOptions.value = mergeSourceSystemOptions(current, page.list)
  } catch {
    if (sequence === sourceSearchSequence) message.error('来源系统数据加载失败，请重试')
  } finally {
    if (sequence === sourceSearchSequence) sourceSystemLoading.value = false
  }
}
const getList = async () => {
  loading.value = true
  try {
    const data = await CatalogApi.getDatasetPage(query)
    list.value = data.list
    total.value = data.total
  } finally {
    loading.value = false
  }
}
const openDrawer = async (row?: DatasetVO) => {
  Object.assign(form, {
    id: undefined,
    datasetCode: '',
    businessName: '',
    sourceSystemId: undefined,
    physicalName: '',
    subjectDomainId: undefined,
    sensitivityLevel: 1,
    description: ''
  })
  await Promise.all([
    loadSubjectDomains(),
    sourceSystemOptions.value.length ? Promise.resolve() : searchSourceSystems()
  ])
  if (row?.id) {
    const detail = await CatalogApi.getDataset(row.id)
    Object.assign(form, detail)
    if (
      detail.sourceSystemId &&
      !sourceSystemOptions.value.some((item) => item.id === detail.sourceSystemId)
    ) {
      sourceSystemOptions.value = mergeSourceSystemOptions(sourceSystemOptions.value, [
        {
          id: detail.sourceSystemId,
          name: detail.sourceSystemName || '已停用或不可见'
        }
      ])
    }
  }
  drawer.value = true
}
const save = async () => {
  if (!(await formRef.value.validate())) return
  form.id ? await CatalogApi.updateDataset(form.id, form) : await CatalogApi.createDataset(form)
  drawer.value = false
  message.success('保存成功')
  getList()
}
const openFields = async (row: DatasetVO) => {
  currentId.value = row.id
  fields.value = row.id ? await CatalogApi.getDatasetFields(row.id) : []
  fieldVisible.value = true
}
const openAcl = async (row: DatasetVO) => {
  if (!row.id) return
  aclDatasetId.value = row.id
  aclRules.value = await SecurityApi.getDatasetAcl(row.id)
  aclVisible.value = true
}
const addAcl = () =>
  aclRules.value.push({ principalType: 'DEPT', principalId: 0, includeChildDept: false })
const saveAcl = async () => {
  if (!aclDatasetId.value || aclRules.value.some((item) => !item.principalId))
    return message.warning('ACL 主体 ID 不能为空')
  await SecurityApi.updateDatasetAcl(aclDatasetId.value, aclRules.value)
  aclVisible.value = false
  message.success('ACL 已保存')
}
const addField = () =>
  currentId.value &&
  fields.value.push(createEmptyDatasetField(currentId.value, fields.value.length + 1))
const saveFields = async () => {
  if (
    !currentId.value ||
    fields.value.some((field) => !field.fieldCode || !field.fieldName || !field.dataType)
  )
    return message.warning('字段名称和类型不能为空')
  await CatalogApi.updateDatasetFields(currentId.value, fields.value.map(toDatasetFieldSaveReq))
  fieldVisible.value = false
  message.success('字段已保存')
}
const openPublish = async (row: DatasetVO) => {
  if (!row.id) return message.warning('请先保存数据集')
  await loadSubjectDomains()
  publishingId.value = row.id
  Object.assign(publishForm, {
    subjectDomainId: row.subjectDomainId,
    tagIdsText: (row.tagIds || []).join(','),
    sensitivityLevel: row.sensitivityLevel || 1,
    publishComment: ''
  })
  publishVisible.value = true
}
const publish = async () => {
  if (!(await publishFormRef.value.validate()) || !publishingId.value) return
  await message.confirm('确认发布该数据集吗？')
  const tagIds = publishForm.tagIdsText
    .split(',')
    .map((value) => Number(value.trim()))
    .filter(Boolean)
  if (!tagIds.length) return message.warning('请输入有效标签 ID')
  await CatalogApi.publishDataset(publishingId.value, {
    subjectDomainId: publishForm.subjectDomainId!,
    tagIds,
    sensitivityLevel: publishForm.sensitivityLevel,
    publishComment: publishForm.publishComment
  })
  publishVisible.value = false
  message.success('已发布')
  getList()
}
const remove = async (id: number) => {
  await message.delConfirm()
  await CatalogApi.deleteDataset(id)
  message.success('删除成功')
  getList()
}
onMounted(() => {
  getList()
  loadSubjectDomains()
  searchSourceSystems()
})
</script>
