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
      ><el-table-column label="操作" width="340"
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
            v-hasPermi="['data-market:data-standard:query']"
            link
            type="primary"
            @click="openStandards(row)"
            >数据标准</el-button
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
  <DatasetStandardDrawer
    v-model="standardVisible"
    :dataset-id="standardDatasetId"
    :dataset-name="standardDatasetName"
  />
  <Dialog v-model="fieldVisible" title="字段编辑" width="min(1480px, 96vw)"
    ><el-alert
      title="物理字段名对应来源数据表的列名，并非系统主键 ID；实际类型保留数据库返回值，逻辑类型请从后台配置中选择。草稿允许暂不选择，发布前必须补齐。"
      type="info"
      :closable="false"
      class="mb-12px"
    />
    <el-table :data="fields"
      ><el-table-column label="物理字段名" min-width="150"
        ><template #default="{ row }"
          ><el-input v-model="row.fieldCode" placeholder="例如 EMPLOYEE_ID" /></template
      ></el-table-column>
      <el-table-column label="业务名称" min-width="150"
        ><template #default="{ row }"
          ><el-input v-model="row.fieldName" placeholder="例如 员工编号" /></template
      ></el-table-column>
      ><el-table-column label="实际类型" min-width="170"
        ><template #default="{ row }"
          ><el-input
            v-model="row.dataType"
            :aria-label="`${fieldDisplayName(row)}实际类型`"
            placeholder="例如 VARCHAR2(100)"
            @change="onActualTypeChange(row)" /></template></el-table-column
      ><el-table-column label="逻辑类型" min-width="230"
        ><template #default="{ row }"
          ><div class="logical-type-cell"
            ><el-select
              v-model="row.logicalTypeId"
              :aria-label="`${fieldDisplayName(row)}逻辑类型`"
              :loading="logicalTypeLoading"
              clearable
              filterable
              placeholder="请选择已配置类型"
              @change="(value) => onLogicalTypeChange(row, value)"
              ><el-option
                v-for="option in logicalTypeOptionsFor(row)"
                :key="option.id"
                :label="logicalTypeLabel(option)"
                :value="option.id"
                :disabled="option.status !== 0" /></el-select
            ><div class="logical-type-status"
              ><el-tag
                v-if="row.logicalTypeMatchStatus"
                size="small"
                effect="plain"
                :type="logicalTypeStatusTag(row)"
                >{{ logicalTypeStatusText(row) }}</el-tag
              ><el-button
                link
                type="primary"
                :loading="fieldTypePreviewing"
                @click="rematchField(row)"
                >重新匹配</el-button
              ></div
            ></div
          ></template
        ></el-table-column
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
      ><el-form-item label="标准标签" prop="tagIds"
        ><el-select
          v-model="publishForm.tagIds"
          :loading="tagLoading"
          :disabled="tagLoading"
          class="!w-1/1"
          multiple
          filterable
          collapse-tags
          collapse-tags-tooltip
          placeholder="请选择标准标签"
        >
          <el-option
            v-for="tag in tagOptions"
            :key="tag.id"
            :label="formatTagLabel(tag)"
            :value="tag.id"
            :disabled="tag.status !== 0"
          /> </el-select></el-form-item
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
import * as PreprocessingApi from '@/api/dataMarket/preprocessing'
import type {
  FieldTypeMatchPreviewVO,
  LogicalFieldTypeSimpleVO
} from '@/api/dataMarket/preprocessing'
import type {
  DatasetAclRule,
  DatasetFieldVO,
  DatasetVO,
  SubjectDomainVO,
  TagVO
} from '@/api/dataMarket/types'
import * as SecurityApi from '@/api/dataMarket/security'
import SourceSystemSelect from '@/views/dataMarket/components/SourceSystemSelect.vue'
import SubjectDomainSelect from '@/views/dataMarket/components/SubjectDomainSelect.vue'
import {
  mergeSourceSystemOptions,
  type SourceSystemOption
} from '@/views/dataMarket/referenceSelectors'
import DatasetActions from './DatasetActions.vue'
import DatasetStandardDrawer from './DatasetStandardDrawer.vue'
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
const standardVisible = ref(false)
const aclVisible = ref(false)
const publishVisible = ref(false)
const subjectDomains = ref<SubjectDomainVO[]>([])
const tags = ref<TagVO[]>([])
const tagLoading = ref(false)
const sourceSystemOptions = ref<SourceSystemOption[]>([])
const sourceSystemLoading = ref(false)
const formRef = ref<any>()
const currentId = ref<number>()
const standardDatasetId = ref<number>()
const standardDatasetName = ref('')
const fields = ref<DatasetFieldVO[]>([])
const logicalTypeOptions = ref<LogicalFieldTypeSimpleVO[]>([])
const logicalTypeLoading = ref(false)
const fieldTypePreviewing = ref(false)
const aclRules = ref<DatasetAclRule[]>([])
const aclDatasetId = ref<number>()
const publishingId = ref<number>()
const publishFormRef = ref<any>()
let subjectDomainRequest: Promise<void> | undefined
let tagRequest: Promise<void> | undefined
let sourceSearchSequence = 0
const publishForm = reactive({
  subjectDomainId: undefined as number | undefined,
  tagIds: [] as number[],
  sensitivityLevel: 1,
  publishComment: ''
})
const publishRules = {
  subjectDomainId: [{ required: true, message: '请选择主题域', trigger: 'change' }],
  tagIds: [{ required: true, message: '请选择至少一个标准标签', trigger: 'change' }],
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
const tagOptions = computed(() =>
  tags.value.filter((tag): tag is TagVO & { id: number } => tag.id !== undefined)
)

const resolveSourceSystemName = (id?: number) =>
  id === undefined ? '—' : sourceSystemNameMap.value.get(id) || '已停用或不可见'
const resolveSubjectDomainName = (id?: number) =>
  id === undefined ? '—' : subjectDomainNameMap.value.get(id) || '已停用或不可见'

const loadSubjectDomains = () => {
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

const formatTagLabel = (tag: Pick<TagVO, 'name' | 'code'>) => `${tag.name}（${tag.code}）`

const loadTags = () => {
  if (tagRequest) return tagRequest
  tagLoading.value = true
  tagRequest = CatalogApi.getTags()
    .then((data) => {
      tags.value = data
    })
    .catch(() => {
      message.error('标准标签数据加载失败，请重试')
    })
    .finally(() => {
      tagLoading.value = false
      tagRequest = undefined
    })
  return tagRequest
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
  if (!row.id) {
    fields.value = []
    return
  }
  logicalTypeLoading.value = true
  try {
    const [datasetFields, typeOptions] = await Promise.all([
      CatalogApi.getDatasetFields(row.id),
      PreprocessingApi.getEnabledLogicalFieldTypes()
    ])
    fields.value = datasetFields
    logicalTypeOptions.value = typeOptions
  } catch {
    fields.value = []
    logicalTypeOptions.value = []
    message.error('字段或逻辑类型配置加载失败，请稍后重试')
  } finally {
    logicalTypeLoading.value = false
  }
  fieldVisible.value = true
}

type LogicalTypeDisplayOption = LogicalFieldTypeSimpleVO & { historical?: boolean }

const fieldDisplayName = (field: DatasetFieldVO) =>
  field.fieldName || field.fieldCode || '未命名字段'

const logicalTypeOptionsFor = (field: DatasetFieldVO): LogicalTypeDisplayOption[] => {
  const options: LogicalTypeDisplayOption[] = logicalTypeOptions.value.map((item) => ({ ...item }))
  if (field.logicalTypeId && !options.some((item) => item.id === field.logicalTypeId)) {
    options.push({
      id: field.logicalTypeId,
      code: field.logicalTypeCode || '',
      name: field.logicalTypeName || '已停用或不可见类型',
      sort: Number.MAX_SAFE_INTEGER,
      status: field.logicalTypeStatus ?? 1,
      historical: true
    })
  }
  return options
}

const logicalTypeLabel = (option: LogicalTypeDisplayOption) => {
  const code = option.code ? `（${option.code}）` : ''
  return `${option.name}${code}${option.status === 0 ? '' : ' · 已停用'}`
}

const onLogicalTypeChange = (field: DatasetFieldVO, value?: number | string) => {
  const logicalTypeId = value === '' || value === undefined ? undefined : Number(value)
  field.logicalTypeId = logicalTypeId
  if (!logicalTypeId) {
    field.logicalTypeCode = undefined
    field.logicalTypeName = undefined
    field.logicalTypeStatus = undefined
    field.logicalTypeMatchStatus = 'UNMATCHED'
    field.logicalTypeCandidates = []
    return
  }
  const selected = logicalTypeOptionsFor(field).find((option) => option.id === logicalTypeId)
  if (!selected) return
  field.logicalTypeCode = selected.code
  field.logicalTypeName = selected.name
  field.logicalTypeStatus = selected.status
  field.logicalTypeMatchStatus = 'ASSIGNED'
  field.logicalTypeCandidates = [{ id: selected.id, code: selected.code, name: selected.name }]
}

const applyMatchResult = (field: DatasetFieldVO, result: FieldTypeMatchPreviewVO) => {
  field.logicalTypeMatchStatus = result.status
  field.logicalTypeCandidates = result.candidates.map((candidate) => ({
    id: candidate.id,
    code: candidate.code,
    name: candidate.name
  }))
  if (result.status === 'MATCHED' && result.logicalType) {
    field.logicalTypeId = result.logicalType.id
    field.logicalTypeCode = result.logicalType.code
    field.logicalTypeName = result.logicalType.name
    field.logicalTypeStatus = result.logicalType.status
    return
  }
  field.logicalTypeId = undefined
  field.logicalTypeCode = undefined
  field.logicalTypeName = undefined
  field.logicalTypeStatus = undefined
}

const previewField = async (field: DatasetFieldVO, force: boolean) => {
  if (!force && field.logicalTypeId) return
  const actualType = field.dataType?.trim()
  if (!actualType) return
  fieldTypePreviewing.value = true
  try {
    applyMatchResult(field, await PreprocessingApi.previewFieldType(actualType))
  } catch {
    message.error('字段类型匹配失败，请稍后重试')
  } finally {
    fieldTypePreviewing.value = false
  }
}

const onActualTypeChange = (field: DatasetFieldVO) => previewField(field, false)
const rematchField = (field: DatasetFieldVO) => previewField(field, true)

const logicalTypeStatusText = (field: DatasetFieldVO) => {
  switch (field.logicalTypeMatchStatus) {
    case 'ASSIGNED':
      return '已选择'
    case 'MATCHED':
      return '已自动匹配'
    case 'CONFLICT':
      return field.logicalTypeCandidates?.length
        ? `匹配冲突：${field.logicalTypeCandidates.map((item) => item.name).join('、')}`
        : '匹配冲突'
    case 'INVALID':
      return '原配置已失效'
    default:
      return '未匹配'
  }
}

const logicalTypeStatusTag = (field: DatasetFieldVO) => {
  if (field.logicalTypeMatchStatus === 'ASSIGNED' || field.logicalTypeMatchStatus === 'MATCHED')
    return 'success'
  if (field.logicalTypeMatchStatus === 'CONFLICT') return 'warning'
  if (field.logicalTypeMatchStatus === 'INVALID') return 'danger'
  return 'info'
}
const openStandards = (row: DatasetVO) => {
  if (!row.id) return message.warning('请先保存数据集')
  standardDatasetId.value = row.id
  standardDatasetName.value = row.businessName
  standardVisible.value = true
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
  await Promise.all([loadSubjectDomains(), loadTags()])
  publishingId.value = row.id
  Object.assign(publishForm, {
    subjectDomainId: row.subjectDomainId,
    tagIds: [...(row.tagIds || [])],
    sensitivityLevel: row.sensitivityLevel || 1,
    publishComment: ''
  })
  publishVisible.value = true
}
const publish = async () => {
  if (!(await publishFormRef.value.validate()) || !publishingId.value) return
  await message.confirm('确认发布该数据集吗？')
  await CatalogApi.publishDataset(publishingId.value, {
    subjectDomainId: publishForm.subjectDomainId!,
    tagIds: [...publishForm.tagIds],
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
<style scoped>
.logical-type-cell {
  display: grid;
  gap: 6px;
}

.logical-type-status {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
}

.logical-type-status :deep(.el-tag) {
  max-width: 165px;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
