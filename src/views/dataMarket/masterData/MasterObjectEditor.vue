<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { Connection, DataAnalysis, Plus, Select, Warning } from '@element-plus/icons-vue'
import * as CatalogApi from '@/api/dataMarket/catalog'
import * as MasterApi from '@/api/dataMarket/masterData'
import type { DatasetFieldVO, DatasetVO, SubjectDomainVO } from '@/api/dataMarket/types'
import type {
  MasterComponentDetail,
  MasterComponentSaveReq,
  MasterRelationSaveReq,
  MasterValidationResult
} from '@/api/dataMarket/masterData'
import SourceSystemSelect from '@/views/dataMarket/components/SourceSystemSelect.vue'
import SubjectDomainSelect from '@/views/dataMarket/components/SubjectDomainSelect.vue'
import {
  mergeSourceSystemOptions,
  type SourceSystemOption
} from '@/views/dataMarket/referenceSelectors'
import { useMessage } from '@/hooks/web/useMessage'

defineOptions({ name: 'DataMarketMasterObjectEditor' })

const props = defineProps<{ modelValue: boolean; objectId?: number }>()
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  saved: []
}>()

type EditorComponent = MasterComponentSaveReq & Partial<MasterComponentDetail>

const message = useMessage()
const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})
const loading = ref(false)
const saving = ref(false)
const currentObjectId = ref<number>()
const detail = ref<MasterApi.MasterObjectDetail>()
const activeTab = ref('model')
const subjectDomains = ref<SubjectDomainVO[]>([])
const components = ref<EditorComponent[]>([])
const relations = ref<MasterRelationSaveReq[]>([])
const selectedComponentKey = ref('')
const fieldsByDataset = ref<Record<number, DatasetFieldVO[]>>({})
const fieldsLoading = ref(false)
const validation = ref<MasterValidationResult>()

const basic = reactive<MasterApi.MasterObjectSaveReq>({
  objectCode: '',
  objectName: '',
  subjectDomainId: undefined,
  description: ''
})

const candidateVisible = ref(false)
const candidateLoading = ref(false)
const candidates = ref<DatasetVO[]>([])
const candidateTotal = ref(0)
const candidateQuery = reactive({
  pageNo: 1,
  pageSize: 8,
  keyword: '',
  sourceSystemId: undefined as number | undefined,
  subjectDomainId: undefined as number | undefined,
  publishStatus: 1
})
const sourceSystemOptions = ref<SourceSystemOption[]>([])
const sourceSystemLoading = ref(false)
let sourceSearchSequence = 0

const mappingVisible = ref(false)
const editingRelationIndex = ref(-1)
const mappingDraft = ref<Array<{ parentFieldId?: number; childFieldId?: number }>>([])

const selectedComponent = computed(() =>
  components.value.find((item) => item.componentKey === selectedComponentKey.value)
)
const selectedFields = computed(() => {
  const datasetId = selectedComponent.value?.datasetId
  return datasetId ? (fieldsByDataset.value[datasetId] ?? []) : []
})
const coreComponent = computed(() => components.value.find((item) => item.levelCode === 'M1'))
const mappingRelation = computed(() => relations.value[editingRelationIndex.value])
const mappingParent = computed(() =>
  components.value.find((item) => item.componentKey === mappingRelation.value?.parentComponentKey)
)
const mappingChild = computed(() =>
  components.value.find((item) => item.componentKey === mappingRelation.value?.childComponentKey)
)
const parentFields = computed(() =>
  mappingParent.value ? (fieldsByDataset.value[mappingParent.value.datasetId] ?? []) : []
)
const childFields = computed(() =>
  mappingChild.value ? (fieldsByDataset.value[mappingChild.value.datasetId] ?? []) : []
)
const standardCoverage = computed(() => {
  const fields = selectedFields.value
  if (!fields.length) return '0 / 0'
  return `${fields.filter((field) => field.standard).length} / ${fields.length}`
})
const validationPresentation = computed(() => {
  if (!validation.value) return undefined
  if (validation.value.errors.length) {
    return {
      title: `结构校验失败：${validation.value.errors.length} 个问题`,
      type: 'error' as const
    }
  }
  if (validation.value.warnings.length) {
    return {
      title: `结构校验通过：${validation.value.warnings.length} 条提醒`,
      type: 'warning' as const
    }
  }
  return { title: '结构校验通过', type: 'success' as const }
})

function normalizeValidation(result: MasterValidationResult): MasterValidationResult {
  return {
    ...result,
    valid: result.valid ?? result.errors.length === 0
  }
}

function reset() {
  currentObjectId.value = props.objectId
  detail.value = undefined
  Object.assign(basic, {
    objectCode: '',
    objectName: '',
    subjectDomainId: undefined,
    description: ''
  })
  components.value = []
  relations.value = []
  selectedComponentKey.value = ''
  fieldsByDataset.value = {}
  validation.value = undefined
  activeTab.value = props.objectId ? 'model' : 'basic'
}

async function loadReferenceData() {
  if (!subjectDomains.value.length) subjectDomains.value = await CatalogApi.getSubjectDomainList()
  await searchSourceSystems('')
}

async function loadDetail() {
  if (!currentObjectId.value) return
  loading.value = true
  try {
    const value = await MasterApi.getMasterObject(currentObjectId.value)
    detail.value = value
    Object.assign(basic, {
      objectCode: value.objectCode,
      objectName: value.objectName,
      subjectDomainId: value.subjectDomainId,
      description: value.description ?? ''
    })
    components.value = value.components.map((component) => ({ ...component }))
    relations.value = value.relations.map((relation) => ({
      parentComponentKey: relation.parentComponentKey,
      childComponentKey: relation.childComponentKey,
      relationName: relation.relationName,
      cardinality: relation.cardinality,
      displayOrder: relation.displayOrder,
      fieldMappings: relation.fieldMappings.map((mapping) => ({
        parentFieldId: mapping.parentFieldId,
        childFieldId: mapping.childFieldId,
        displayOrder: mapping.displayOrder
      }))
    }))
    selectedComponentKey.value = components.value[0]?.componentKey ?? ''
    if (selectedComponent.value) await loadComponentFields(selectedComponent.value)
  } finally {
    loading.value = false
  }
}

async function initialize() {
  reset()
  loading.value = true
  try {
    await loadReferenceData()
    if (currentObjectId.value) await loadDetail()
  } finally {
    loading.value = false
  }
}

async function searchSourceSystems(keyword: string) {
  const sequence = ++sourceSearchSequence
  sourceSystemLoading.value = true
  try {
    const page = await CatalogApi.getSourceSystemPage({ pageNo: 1, pageSize: 50, keyword })
    if (sequence === sourceSearchSequence) {
      sourceSystemOptions.value = mergeSourceSystemOptions(sourceSystemOptions.value, page.list)
    }
  } finally {
    if (sequence === sourceSearchSequence) sourceSystemLoading.value = false
  }
}

async function saveBasic() {
  if (!basic.objectCode.trim() || !basic.objectName.trim() || !basic.subjectDomainId) {
    message.warning('请完整填写对象编码、名称和业务主题域')
    return
  }
  saving.value = true
  try {
    if (currentObjectId.value) {
      await MasterApi.updateMasterObject(currentObjectId.value, basic)
    } else {
      currentObjectId.value = await MasterApi.createMasterObject(basic)
    }
    message.success('基本信息已保存')
    await loadDetail()
    activeTab.value = 'model'
    emit('saved')
  } finally {
    saving.value = false
  }
}

async function openCandidates() {
  candidateVisible.value = true
  candidateQuery.pageNo = 1
  await loadCandidates()
}

async function loadCandidates() {
  candidateLoading.value = true
  try {
    const page = await CatalogApi.getDatasetPage({ ...candidateQuery, publishStatus: 1 })
    candidates.value = page.list
    candidateTotal.value = page.total
  } finally {
    candidateLoading.value = false
  }
}

function uniqueComponentKey(dataset: DatasetVO) {
  const base = (dataset.datasetCode || dataset.physicalName || `dataset_${dataset.id}`)
    .replace(/[^A-Za-z0-9_-]/g, '_')
    .replace(/^[^A-Za-z]+/, 'D_')
  let key = base || `dataset_${dataset.id}`
  let index = 2
  while (components.value.some((component) => component.componentKey === key)) {
    key = `${base}_${index++}`
  }
  return key
}

function addCandidate(dataset: DatasetVO) {
  if (!dataset.id || components.value.some((component) => component.datasetId === dataset.id))
    return
  const isCore = components.value.length === 0
  const component: EditorComponent = {
    componentKey: uniqueComponentKey(dataset),
    datasetId: dataset.id,
    levelCode: isCore ? 'M1' : 'M2',
    componentCategory: isCore ? 'CORE' : 'RELATION',
    displayName: dataset.businessName,
    businessGrain: '',
    displayOrder: components.value.length + 1,
    datasetCode: dataset.datasetCode,
    datasetName: dataset.businessName,
    physicalName: dataset.physicalName,
    sourceSystemId: dataset.sourceSystemId,
    subjectDomainId: dataset.subjectDomainId,
    fieldCount: dataset.fieldCount ?? 0,
    standardBoundFieldCount: 0
  }
  components.value.push(component)
  selectedComponentKey.value = component.componentKey
  if (!isCore && coreComponent.value) {
    relations.value.push({
      parentComponentKey: coreComponent.value.componentKey,
      childComponentKey: component.componentKey,
      relationName: `${coreComponent.value.displayName} - ${component.displayName}`,
      cardinality: 'ONE_TO_MANY',
      displayOrder: relations.value.length + 1,
      fieldMappings: []
    })
  }
  candidateVisible.value = false
  void loadComponentFields(component)
}

function setLevel(component: EditorComponent, level: 'M1' | 'M2') {
  if (level === 'M1') {
    components.value.forEach((item) => {
      if (item !== component && item.levelCode === 'M1') {
        item.levelCode = 'M2'
        item.componentCategory = 'RELATION'
      }
    })
    component.componentCategory = 'CORE'
  } else if (component.levelCode === 'M1' && components.value.length > 1) {
    message.warning('请先将另一个组件设为 M1 核心模型')
    return
  }
  component.levelCode = level
}

function removeComponent(component: EditorComponent) {
  components.value = components.value.filter((item) => item.componentKey !== component.componentKey)
  relations.value = relations.value.filter(
    (relation) =>
      relation.parentComponentKey !== component.componentKey &&
      relation.childComponentKey !== component.componentKey
  )
  components.value.forEach((item, index) => (item.displayOrder = index + 1))
  selectedComponentKey.value = components.value[0]?.componentKey ?? ''
}

async function selectComponent(component: EditorComponent) {
  selectedComponentKey.value = component.componentKey
  await loadComponentFields(component)
}

async function loadComponentFields(component: EditorComponent) {
  if (fieldsByDataset.value[component.datasetId]) return
  fieldsLoading.value = true
  try {
    const fields = await CatalogApi.getDatasetFields(component.datasetId)
    fieldsByDataset.value = { ...fieldsByDataset.value, [component.datasetId]: fields }
    component.fieldCount = fields.filter((field) => field.status === 0).length
    component.standardBoundFieldCount = fields.filter(
      (field) => field.status === 0 && field.standard
    ).length
  } finally {
    fieldsLoading.value = false
  }
}

function addRelation() {
  if (components.value.length < 2) {
    message.warning('至少需要两个组件才能新增关系')
    return
  }
  const parent = coreComponent.value ?? components.value[0]
  const child = components.value.find((component) => component !== parent)
  if (!parent || !child) return
  relations.value.push({
    parentComponentKey: parent.componentKey,
    childComponentKey: child.componentKey,
    relationName: `${parent.displayName} - ${child.displayName}`,
    cardinality: 'ONE_TO_MANY',
    displayOrder: relations.value.length + 1,
    fieldMappings: []
  })
}

async function openMappings(index: number) {
  editingRelationIndex.value = index
  const relation = relations.value[index]
  const parent = components.value.find((item) => item.componentKey === relation.parentComponentKey)
  const child = components.value.find((item) => item.componentKey === relation.childComponentKey)
  if (parent) await loadComponentFields(parent)
  if (child) await loadComponentFields(child)
  mappingDraft.value = relation.fieldMappings.length
    ? relation.fieldMappings.map((mapping) => ({ ...mapping }))
    : [{ parentFieldId: undefined, childFieldId: undefined }]
  mappingVisible.value = true
}

function saveMappings() {
  const relation = relations.value[editingRelationIndex.value]
  if (!relation) return
  const complete = mappingDraft.value.filter(
    (mapping) => mapping.parentFieldId && mapping.childFieldId
  ) as Array<{ parentFieldId: number; childFieldId: number }>
  relation.fieldMappings = complete.map((mapping, index) => ({
    ...mapping,
    displayOrder: index + 1
  }))
  mappingVisible.value = false
}

function currentAssemblyRequest(): MasterApi.MasterAssemblySaveReq {
  return {
    components: components.value.map((component) => ({
      componentKey: component.componentKey,
      datasetId: component.datasetId,
      levelCode: component.levelCode,
      componentCategory: component.componentCategory,
      displayName: component.displayName,
      businessGrain: component.businessGrain,
      displayOrder: component.displayOrder
    })),
    relations: relations.value
  }
}

async function persistCurrentAssembly() {
  if (!currentObjectId.value) {
    message.warning('请先保存基本信息')
    activeTab.value = 'basic'
    return false
  }
  if (components.value.filter((component) => component.levelCode === 'M1').length !== 1) {
    message.warning('模型必须且只能有一个 M1 核心组件')
    return false
  }
  await MasterApi.saveMasterAssembly(currentObjectId.value, currentAssemblyRequest())
  return true
}

async function saveAssembly() {
  saving.value = true
  try {
    if (!(await persistCurrentAssembly())) return
    message.success('模型组成已保存')
    validation.value = normalizeValidation(
      await MasterApi.validateMasterObject(currentObjectId.value as number)
    )
    await loadDetail()
    emit('saved')
  } finally {
    saving.value = false
  }
}

async function validateCurrentAssembly() {
  if (!(await persistCurrentAssembly())) return false
  validation.value = normalizeValidation(
    await MasterApi.validateMasterObject(currentObjectId.value as number)
  )
  emit('saved')
  if (validation.value.valid) {
    message.success(
      validation.value.warnings.length
        ? `结构校验通过，存在 ${validation.value.warnings.length} 条提醒`
        : '结构校验通过，可以发布'
    )
  }
  return Boolean(validation.value.valid)
}

async function validateDraft() {
  saving.value = true
  try {
    await validateCurrentAssembly()
  } finally {
    saving.value = false
  }
}

async function publishDraft() {
  if (!currentObjectId.value) return
  saving.value = true
  try {
    if (!(await validateCurrentAssembly())) return
    await MasterApi.publishMasterObject(currentObjectId.value)
    message.success('主数据对象已发布')
    await loadDetail()
    emit('saved')
  } finally {
    saving.value = false
  }
}

watch(
  () => [props.modelValue, props.objectId] as const,
  ([opened]) => {
    if (opened) void initialize()
  },
  { immediate: true }
)
</script>

<template>
  <el-drawer v-model="visible" size="min(1180px, 96vw)" class="master-object-editor">
    <template #header>
      <div class="editor-header">
        <div>
          <span>MASTER DATA OBJECT</span>
          <h2>{{ currentObjectId ? basic.objectName || '主数据对象' : '新建主数据对象' }}</h2>
        </div>
        <div class="header-status">
          <el-tag v-if="detail" :type="detail.status === 'PUBLISHED' ? 'success' : 'info'">
            {{
              detail.status === 'PUBLISHED'
                ? '已发布'
                : detail.status === 'DISABLED'
                  ? '已停用'
                  : '草稿'
            }}
          </el-tag>
          <el-tag v-if="detail?.hasDraft" type="warning">V{{ detail.versionNo }} 编辑草稿</el-tag>
        </div>
      </div>
    </template>

    <div v-loading="loading" class="editor-body">
      <el-alert
        v-if="detail?.publishedVersionId && detail.hasDraft"
        title="当前正在编辑新版本，已发布版本继续在线；只有再次发布后门户才会切换。"
        type="info"
        :closable="false"
        show-icon
      />

      <el-tabs v-model="activeTab" class="editor-tabs">
        <el-tab-pane label="基本信息" name="basic">
          <el-card shadow="never" class="panel-card">
            <template #header><b>对象定义</b><span>使用现有业务主题域进行分类</span></template>
            <el-form :model="basic" label-width="112px" class="basic-form">
              <el-form-item label="对象编码" required>
                <el-input
                  v-model="basic.objectCode"
                  :disabled="Boolean(detail?.publishedVersionId)"
                  placeholder="例如 ORG"
                />
              </el-form-item>
              <el-form-item label="对象名称" required>
                <el-input v-model="basic.objectName" placeholder="例如 组织机构主数据" />
              </el-form-item>
              <el-form-item label="业务主题域" required>
                <SubjectDomainSelect v-model="basic.subjectDomainId" :domains="subjectDomains" />
              </el-form-item>
              <el-form-item label="业务说明">
                <el-input v-model="basic.description" type="textarea" :rows="4" />
              </el-form-item>
            </el-form>
            <div class="panel-actions">
              <el-button type="primary" :loading="saving" @click="saveBasic"
                >保存基本信息</el-button
              >
            </div>
          </el-card>
        </el-tab-pane>

        <el-tab-pane label="模型组成" name="model" :disabled="!currentObjectId">
          <div class="model-toolbar">
            <div>
              <h3>模型组成</h3>
              <p>一个 M1 核心组件与零到多个 M2 关系/历史组件，形成逻辑主数据对象。</p>
            </div>
            <div>
              <el-button :icon="Plus" @click="openCandidates">从已发布数据集中选择</el-button>
              <el-button type="primary" :loading="saving" @click="saveAssembly"
                >保存模型组成</el-button
              >
            </div>
          </div>

          <div class="model-layout">
            <el-card shadow="never" class="component-tree-card">
              <template #header>
                <div class="card-heading"
                  ><b>组件目录</b><span>{{ components.length }} 个组件</span></div
                >
              </template>
              <el-empty v-if="!components.length" description="尚未选择组成数据集" />
              <button
                v-for="component in components"
                :key="component.componentKey"
                type="button"
                class="component-node"
                :class="{ active: selectedComponentKey === component.componentKey }"
                @click="selectComponent(component)"
              >
                <span class="node-icon"
                  ><el-icon><DataAnalysis /></el-icon
                ></span>
                <span class="node-copy">
                  <b>{{ component.displayName }}</b>
                  <small>{{ component.datasetCode || component.componentKey }}</small>
                </span>
                <el-tag :type="component.levelCode === 'M1' ? 'primary' : 'success'" size="small">
                  {{ component.levelCode }}
                </el-tag>
              </button>
            </el-card>

            <el-card shadow="never" class="component-detail-card">
              <template v-if="selectedComponent">
                <div class="component-title">
                  <div>
                    <span
                      >{{ selectedComponent.levelCode }} ·
                      {{ selectedComponent.componentCategory }}</span
                    >
                    <h3>{{ selectedComponent.displayName }}</h3>
                    <code>{{
                      selectedComponent.physicalName || selectedComponent.datasetCode
                    }}</code>
                  </div>
                  <el-button type="danger" link @click="removeComponent(selectedComponent)"
                    >移除组件</el-button
                  >
                </div>

                <el-descriptions :column="4" border size="small">
                  <el-descriptions-item label="来源数据集">{{
                    selectedComponent.datasetName
                  }}</el-descriptions-item>
                  <el-descriptions-item label="字段数">{{
                    selectedComponent.fieldCount || 0
                  }}</el-descriptions-item>
                  <el-descriptions-item label="标准覆盖">
                    {{ selectedComponent.standardBoundFieldCount || 0 }} /
                    {{ selectedComponent.fieldCount || 0 }}
                  </el-descriptions-item>
                  <el-descriptions-item label="元数据版本">{{
                    selectedComponent.datasetMetadataVersion || '-'
                  }}</el-descriptions-item>
                </el-descriptions>

                <div class="component-config">
                  <el-form-item label="层级">
                    <el-radio-group
                      :model-value="selectedComponent.levelCode"
                      @change="setLevel(selectedComponent, $event as 'M1' | 'M2')"
                    >
                      <el-radio-button value="M1">M1 核心</el-radio-button>
                      <el-radio-button value="M2">M2 从属</el-radio-button>
                    </el-radio-group>
                  </el-form-item>
                  <el-form-item label="组件类型">
                    <el-select v-model="selectedComponent.componentCategory">
                      <el-option
                        label="核心模型"
                        value="CORE"
                        :disabled="selectedComponent.levelCode !== 'M1'"
                      />
                      <el-option
                        label="关系模型"
                        value="RELATION"
                        :disabled="selectedComponent.levelCode === 'M1'"
                      />
                      <el-option
                        label="历史模型"
                        value="HISTORY"
                        :disabled="selectedComponent.levelCode === 'M1'"
                      />
                    </el-select>
                  </el-form-item>
                  <el-form-item label="展示名称"
                    ><el-input v-model="selectedComponent.displayName"
                  /></el-form-item>
                  <el-form-item label="业务粒度"
                    ><el-input
                      v-model="selectedComponent.businessGrain"
                      placeholder="例如 一条记录代表一个组织节点"
                  /></el-form-item>
                </div>

                <div class="field-heading">
                  <div
                    ><b>字段与数据标准</b><span>标准覆盖 {{ standardCoverage }}</span></div
                  >
                  <el-tag type="info">实时继承数据集字段</el-tag>
                </div>
                <el-table
                  v-loading="fieldsLoading"
                  :data="selectedFields"
                  height="300"
                  size="small"
                >
                  <el-table-column prop="fieldCode" label="字段编码" min-width="150" />
                  <el-table-column prop="fieldName" label="中文名称" min-width="140" />
                  <el-table-column prop="dataType" label="类型" width="110" />
                  <el-table-column label="字段角色" width="120">
                    <template #default="{ row }">
                      <el-tag v-if="row.primaryKey" size="small">主键</el-tag>
                      <el-tag v-else-if="row.joinKey" size="small" type="success">关联键</el-tag>
                      <span v-else>-</span>
                    </template>
                  </el-table-column>
                  <el-table-column label="数据标准" min-width="210">
                    <template #default="{ row }">
                      <div v-if="row.standard" class="standard-cell">
                        <b>{{ row.standard.standardName }}</b
                        ><code>{{ row.standard.standardCode }}</code>
                      </div>
                      <el-tag v-else size="small" type="warning">未绑定</el-tag>
                    </template>
                  </el-table-column>
                </el-table>
              </template>
              <el-empty v-else description="请选择左侧组件" />
            </el-card>
          </div>

          <el-card shadow="never" class="relation-card">
            <template #header>
              <div class="card-heading">
                <div><b>对象关系与关联字段映射</b><span>支持 M2 → M2 与多父节点 DAG</span></div>
                <el-button :icon="Connection" @click="addRelation">新增关系</el-button>
              </div>
            </template>
            <el-table :data="relations" empty-text="暂无组件关系">
              <el-table-column label="父组件" min-width="170">
                <template #default="{ row }">
                  <el-select v-model="row.parentComponentKey">
                    <el-option
                      v-for="component in components.filter(
                        (item) => item.componentKey !== row.childComponentKey
                      )"
                      :key="component.componentKey"
                      :label="component.displayName"
                      :value="component.componentKey"
                    />
                  </el-select>
                </template>
              </el-table-column>
              <el-table-column label="子组件" min-width="170">
                <template #default="{ row }">
                  <el-select v-model="row.childComponentKey">
                    <el-option
                      v-for="component in components.filter(
                        (item) => item.componentKey !== row.parentComponentKey
                      )"
                      :key="component.componentKey"
                      :label="component.displayName"
                      :value="component.componentKey"
                    />
                  </el-select>
                </template>
              </el-table-column>
              <el-table-column label="关系名称" min-width="200">
                <template #default="{ row }"><el-input v-model="row.relationName" /></template>
              </el-table-column>
              <el-table-column label="基数" width="160">
                <template #default="{ row }">
                  <el-select v-model="row.cardinality">
                    <el-option value="ONE_TO_ONE" label="一对一" />
                    <el-option value="ONE_TO_MANY" label="一对多" />
                    <el-option value="MANY_TO_ONE" label="多对一" />
                    <el-option value="MANY_TO_MANY" label="多对多" />
                  </el-select>
                </template>
              </el-table-column>
              <el-table-column label="关联字段映射" width="150">
                <template #default="{ row, $index }">
                  <el-button link type="primary" @click="openMappings($index)">
                    配置（{{ row.fieldMappings.length }}）
                  </el-button>
                </template>
              </el-table-column>
              <el-table-column width="72">
                <template #default="{ $index }">
                  <el-button link type="danger" @click="relations.splice($index, 1)"
                    >删除</el-button
                  >
                </template>
              </el-table-column>
            </el-table>
          </el-card>

          <el-card
            v-if="validation && validationPresentation"
            shadow="never"
            class="validation-card"
          >
            <el-alert
              :title="validationPresentation.title"
              :type="validationPresentation.type"
              :closable="false"
              show-icon
            />
            <ul v-if="validation.errors.length || validation.warnings.length">
              <li v-for="issue in validation.errors" :key="issue.code" class="error">{{
                issue.message
              }}</li>
              <li v-for="issue in validation.warnings" :key="issue.code" class="warning">{{
                issue.message
              }}</li>
            </ul>
          </el-card>
        </el-tab-pane>

        <el-tab-pane label="版本记录" name="versions" :disabled="!currentObjectId">
          <el-timeline v-if="detail?.versions.length" class="version-timeline">
            <el-timeline-item
              v-for="version in detail.versions"
              :key="version.id"
              :timestamp="version.publishedAt || '尚未发布'"
              :type="
                version.versionStatus === 'PUBLISHED'
                  ? 'success'
                  : version.versionStatus === 'DRAFT'
                    ? 'warning'
                    : 'info'
              "
            >
              <b>V{{ version.versionNo }} · {{ version.objectName }}</b>
              <p>{{ version.versionStatus }}</p>
            </el-timeline-item>
          </el-timeline>
          <el-empty v-else description="暂无版本记录" />
        </el-tab-pane>
      </el-tabs>
    </div>

    <template #footer>
      <div class="drawer-footer">
        <span>主数据对象只保存逻辑组成配置，不新建物理大宽表。</span>
        <div>
          <el-button @click="visible = false">关闭</el-button>
          <el-button v-if="currentObjectId" :icon="Select" @click="validateDraft">校验</el-button>
          <el-button
            v-if="currentObjectId"
            v-hasPermi="['data-market:master-data:publish']"
            type="success"
            @click="publishDraft"
            >发布新版本</el-button
          >
        </div>
      </div>
    </template>
  </el-drawer>

  <Dialog v-model="candidateVisible" title="从已发布数据集中选择" width="min(1080px, 94vw)">
    <el-form :inline="true" class="candidate-filter">
      <el-form-item label="关键词">
        <el-input
          v-model="candidateQuery.keyword"
          clearable
          placeholder="数据集名称、编码或物理表名"
        />
      </el-form-item>
      <el-form-item label="来源系统">
        <SourceSystemSelect
          v-model="candidateQuery.sourceSystemId"
          :options="sourceSystemOptions"
          :loading="sourceSystemLoading"
          @search="searchSourceSystems"
        />
      </el-form-item>
      <el-form-item label="业务主题域">
        <SubjectDomainSelect v-model="candidateQuery.subjectDomainId" :domains="subjectDomains" />
      </el-form-item>
      <el-form-item
        ><el-button type="primary" @click="loadCandidates">筛选</el-button></el-form-item
      >
    </el-form>
    <el-alert
      title="候选范围仅包含已发布数据集；主数据对象不会复制表或字段元数据。"
      type="info"
      :closable="false"
      class="mb-12px"
    />
    <el-table v-loading="candidateLoading" :data="candidates">
      <el-table-column prop="businessName" label="数据集" min-width="190" />
      <el-table-column prop="datasetCode" label="编码" min-width="150" />
      <el-table-column prop="physicalName" label="物理表" min-width="160" />
      <el-table-column prop="fieldCount" label="字段" width="80" />
      <el-table-column label="状态" width="90"
        ><template #default><el-tag type="success">已发布</el-tag></template></el-table-column
      >
      <el-table-column width="100">
        <template #default="{ row }">
          <el-button
            type="primary"
            link
            :disabled="components.some((item) => item.datasetId === row.id)"
            @click="addCandidate(row)"
            >{{
              components.some((item) => item.datasetId === row.id) ? '已选择' : '选择'
            }}</el-button
          >
        </template>
      </el-table-column>
    </el-table>
    <div class="candidate-pagination">
      <Pagination
        v-model:limit="candidateQuery.pageSize"
        v-model:page="candidateQuery.pageNo"
        :total="candidateTotal"
        @pagination="loadCandidates"
      />
    </div>
  </Dialog>

  <Dialog v-model="mappingVisible" title="关联字段映射" width="760px">
    <el-alert
      title="建议选择主键或关联键；未标记的字段允许保存，但发布校验会给出警告。"
      type="warning"
      :icon="Warning"
      :closable="false"
      class="mapping-guidance"
    />
    <div v-for="(mapping, index) in mappingDraft" :key="index" class="mapping-row">
      <el-select v-model="mapping.parentFieldId" filterable placeholder="父组件字段">
        <el-option
          v-for="field in parentFields"
          :key="field.id"
          :label="`${field.fieldName} (${field.fieldCode}) · ${field.dataType}`"
          :value="field.id"
        />
      </el-select>
      <span>＝</span>
      <el-select v-model="mapping.childFieldId" filterable placeholder="子组件字段">
        <el-option
          v-for="field in childFields"
          :key="field.id"
          :label="`${field.fieldName} (${field.fieldCode}) · ${field.dataType}`"
          :value="field.id"
        />
      </el-select>
      <el-button link type="danger" @click="mappingDraft.splice(index, 1)">删除</el-button>
    </div>
    <el-button :icon="Plus" @click="mappingDraft.push({})">新增一组映射</el-button>
    <template #footer
      ><el-button type="primary" @click="saveMappings">确认映射</el-button></template
    >
  </Dialog>
</template>

<style scoped>
.editor-header,
.model-toolbar,
.card-heading,
.component-title,
.field-heading,
.drawer-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.editor-header span {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.12em;
  color: var(--el-color-primary);
}

.editor-header h2 {
  margin: 4px 0 0;
  font-size: 21px;
}

.header-status {
  display: flex;
  gap: 8px;
}

.editor-body {
  display: grid;
  gap: 14px;
  min-height: 680px;
}

.editor-tabs :deep(.el-tabs__header) {
  margin-bottom: 16px;
}

.panel-card :deep(.el-card__header) {
  display: flex;
  justify-content: space-between;
}

.panel-card :deep(.el-card__header) span {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.basic-form {
  max-width: 760px;
  padding: 18px 10px 8px;
}

.panel-actions {
  display: flex;
  justify-content: flex-end;
}

.model-toolbar {
  margin-bottom: 14px;
}

.model-toolbar h3 {
  margin: 0;
  font-size: 18px;
}

.model-toolbar p {
  margin: 5px 0 0;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.model-layout {
  display: grid;
  grid-template-columns: 270px minmax(0, 1fr);
  gap: 14px;
}

.component-tree-card,
.component-detail-card,
.relation-card,
.validation-card {
  border-color: var(--el-border-color-lighter);
}

.card-heading span,
.card-heading > div span {
  margin-left: 8px;
  font-size: 11px;
  color: var(--el-text-color-secondary);
}

.component-node {
  display: grid;
  width: 100%;
  padding: 10px;
  margin-bottom: 8px;
  color: inherit;
  text-align: left;
  cursor: pointer;
  background: var(--el-fill-color-blank);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  grid-template-columns: 36px minmax(0, 1fr) auto;
  align-items: center;
  gap: 9px;
}

.component-node.active {
  background: var(--el-color-primary-light-9);
  border-color: var(--el-color-primary-light-5);
  box-shadow: inset 3px 0 var(--el-color-primary);
}

.node-icon {
  display: grid;
  width: 34px;
  height: 34px;
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
  border-radius: 8px;
  place-items: center;
}

.node-copy {
  display: grid;
  min-width: 0;
  gap: 3px;
}

.node-copy b,
.node-copy small {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.node-copy b {
  font-size: 13px;
}

.node-copy small {
  font-family: monospace;
  font-size: 10px;
  color: var(--el-text-color-secondary);
}

.component-detail-card :deep(.el-card__body) {
  display: grid;
  gap: 16px;
}

.component-title span {
  font-size: 10px;
  font-weight: 700;
  color: var(--el-color-primary);
}

.component-title h3 {
  margin: 4px 0;
}

.component-title code {
  font-size: 11px;
  color: var(--el-text-color-secondary);
}

.component-config {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0 18px;
}

.component-config :deep(.el-form-item) {
  margin-bottom: 8px;
}

.field-heading b {
  margin-right: 10px;
}

.field-heading span {
  font-size: 11px;
  color: var(--el-text-color-secondary);
}

.standard-cell {
  display: grid;
  gap: 2px;
}

.standard-cell b {
  font-size: 12px;
}

.standard-cell code {
  font-size: 10px;
  color: var(--el-text-color-secondary);
}

.relation-card,
.validation-card {
  margin-top: 14px;
}

.validation-card ul {
  padding-left: 20px;
  margin: 12px 0 0;
  font-size: 12px;
}

.validation-card li.error {
  color: var(--el-color-danger);
}

.validation-card li.warning {
  color: var(--el-color-warning);
}

.version-timeline {
  max-width: 760px;
  padding: 18px;
}

.version-timeline p {
  margin: 4px 0 0;
  font-size: 11px;
  color: var(--el-text-color-secondary);
}

.drawer-footer > span {
  font-size: 11px;
  color: var(--el-text-color-secondary);
}

.candidate-filter :deep(.el-form-item) {
  margin-right: 12px;
}

.candidate-filter :deep(.el-input),
.candidate-filter :deep(.el-select) {
  width: 220px;
}

.candidate-pagination {
  display: flex;
  width: 100%;
  min-width: 0;
  overflow-x: auto;
  justify-content: flex-end;
}

.candidate-pagination :deep(.el-pagination) {
  float: none !important;
  flex: 0 0 auto;
  margin-bottom: 0;
}

.mapping-guidance {
  margin-bottom: 22px;
}

.mapping-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 22px minmax(0, 1fr) 48px;
  align-items: center;
  margin-bottom: 10px;
  gap: 8px;
}

.mapping-row > span {
  text-align: center;
}

@media (width <= 900px) {
  .model-layout {
    grid-template-columns: 1fr;
  }

  .component-config {
    grid-template-columns: 1fr;
  }
}
</style>
