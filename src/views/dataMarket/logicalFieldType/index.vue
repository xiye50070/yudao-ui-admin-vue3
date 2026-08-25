<template>
  <ContentWrap>
    <el-form :model="query" inline>
      <el-form-item label="关键词">
        <el-input
          v-model="query.keyword"
          clearable
          placeholder="搜索字段类型名称、编码或说明"
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="状态">
        <el-select v-model="query.status" clearable placeholder="全部状态" style="width: 120px">
          <el-option label="启用" :value="0" />
          <el-option label="停用" :value="1" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="handleQuery">查询</el-button>
        <el-button @click="resetQuery">重置</el-button>
        <el-button
          v-hasPermi="['data-market:logical-field-type:create']"
          type="primary"
          plain
          @click="open()"
        >
          新增字段类型
        </el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>

  <ContentWrap>
    <el-table v-loading="loading" :data="list">
      <el-table-column prop="name" label="类型名称" min-width="150" />
      <el-table-column prop="code" label="类型编码" min-width="130" />
      <el-table-column label="实际类型匹配" min-width="260">
        <template #default="{ row }">
          <div v-if="row.matchers?.length" class="tag-list">
            <el-tag
              v-for="matcher in row.matchers"
              :key="matcher.id || matcher.sort"
              effect="plain"
            >
              {{ matcher.matchMode === 'EXACT' ? '精确' : '正则' }}：{{ matcher.matchExpression }}
            </el-tag>
          </div>
          <span v-else class="muted">仅支持手动选择</span>
        </template>
      </el-table-column>
      <el-table-column label="适用预处理规则" min-width="240">
        <template #default="{ row }">
          <div v-if="row.ruleTemplates?.length" class="tag-list">
            <el-tag
              v-for="rule in row.ruleTemplates"
              :key="rule.id || rule.code"
              type="success"
              effect="plain"
            >
              {{ rule.name }}（{{ rule.code }}）
            </el-tag>
          </div>
          <span v-else class="muted">未关联规则</span>
        </template>
      </el-table-column>
      <el-table-column label="状态" width="90">
        <template #default="{ row }">
          <el-tag :type="row.status === 0 ? 'success' : 'info'">
            {{ row.status === 0 ? '启用' : '停用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="sort" label="排序" width="80" />
      <el-table-column label="操作" width="150" fixed="right">
        <template #default="{ row }">
          <el-button
            v-hasPermi="['data-market:logical-field-type:update']"
            link
            type="primary"
            @click="open(row)"
          >
            编辑
          </el-button>
          <el-button
            v-hasPermi="['data-market:logical-field-type:delete']"
            link
            type="danger"
            @click="remove(row.id)"
          >
            删除
          </el-button>
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

  <Dialog v-model="visible" :title="form.id ? '编辑字段类型' : '新增字段类型'" width="1040px">
    <el-form ref="formRef" :model="form" :rules="rules" label-width="112px">
      <section class="editor-section">
        <div class="section-heading">
          <div>
            <h3>类型基本信息</h3>
            <p>字段配置时，用户将按名称和编码选择该逻辑类型。</p>
          </div>
        </div>
        <div class="base-grid">
          <el-form-item label="类型编码" prop="code">
            <el-input v-model="form.code" maxlength="64" placeholder="例如 TEXT" />
          </el-form-item>
          <el-form-item label="类型名称" prop="name">
            <el-input v-model="form.name" maxlength="128" placeholder="例如 文本" />
          </el-form-item>
          <el-form-item label="排序" prop="sort">
            <el-input-number
              v-model="form.sort"
              aria-label="字段类型排序"
              :min="0"
              :max="9999"
              controls-position="right"
            />
          </el-form-item>
          <el-form-item label="状态" prop="status">
            <el-switch
              v-model="form.status"
              :active-value="0"
              :inactive-value="1"
              active-text="启用"
              inactive-text="停用"
            />
          </el-form-item>
          <el-form-item class="grid-span" label="类型说明" prop="description">
            <el-input
              v-model="form.description"
              type="textarea"
              :rows="2"
              maxlength="1000"
              show-word-limit
              placeholder="说明该逻辑类型的业务含义和适用范围"
            />
          </el-form-item>
        </div>
      </section>

      <section class="editor-section">
        <div class="section-heading">
          <div>
            <h3>实际类型匹配</h3>
            <p>精确匹配优先于正则匹配；优先级数值越大越优先。</p>
          </div>
          <el-button type="primary" plain @click="addMatcher">新增匹配条件</el-button>
        </div>

        <div v-if="form.matchers.length" class="matcher-list">
          <div
            v-for="(matcher, index) in form.matchers"
            :key="matcherKey(matcher, index)"
            class="matcher-card"
          >
            <div class="matcher-title">
              <strong>匹配条件 {{ index + 1 }}</strong>
              <el-button link type="danger" @click="removeMatcher(index)">移除</el-button>
            </div>
            <div class="matcher-grid">
              <el-form-item label="匹配方式">
                <el-select
                  v-model="matcher.matchMode"
                  :aria-label="`匹配方式 ${index + 1}`"
                  style="width: 100%"
                >
                  <el-option label="精确匹配" value="EXACT" />
                  <el-option label="正则匹配" value="REGEX" />
                </el-select>
              </el-form-item>
              <el-form-item class="matcher-expression" label="匹配表达式">
                <el-input
                  v-model="matcher.matchExpression"
                  :aria-label="`匹配表达式 ${index + 1}`"
                  :placeholder="
                    matcher.matchMode === 'EXACT' ? '例如 VARCHAR' : '例如 ^VARCHAR2\\(\\d+\\)$'
                  "
                />
              </el-form-item>
              <el-form-item label="优先级">
                <el-input-number
                  v-model="matcher.priority"
                  :aria-label="`优先级 ${index + 1}`"
                  :min="0"
                  :max="9999"
                  controls-position="right"
                />
              </el-form-item>
              <el-form-item label="排序">
                <el-input-number
                  v-model="matcher.sort"
                  :aria-label="`匹配排序 ${index + 1}`"
                  :min="0"
                  :max="9999"
                  controls-position="right"
                />
              </el-form-item>
              <el-form-item label="状态">
                <el-switch
                  v-model="matcher.status"
                  :active-value="0"
                  :inactive-value="1"
                  active-text="启用"
                  inactive-text="停用"
                />
              </el-form-item>
              <el-form-item class="matcher-description" label="说明">
                <el-input
                  v-model="matcher.description"
                  maxlength="1000"
                  placeholder="可选：说明数据库来源或匹配边界"
                />
              </el-form-item>
            </div>
          </div>
        </div>
        <div v-else class="empty-state">当前类型仅支持人工选择；可按需新增实际类型匹配条件。</div>
      </section>

      <section class="editor-section">
        <div class="section-heading">
          <div>
            <h3>适用预处理规则</h3>
            <p>这里选择的规则，才会在该类型字段的“数据预处理”步骤中出现。</p>
          </div>
        </div>
        <el-form-item label="预处理规则" prop="ruleTemplateIds">
          <el-select
            v-model="form.ruleTemplateIds"
            aria-label="适用预处理规则"
            multiple
            filterable
            collapse-tags
            collapse-tags-tooltip
            placeholder="请选择已配置的规则"
            style="width: 100%"
          >
            <el-option
              v-for="rule in ruleOptions"
              :key="rule.id"
              :label="ruleLabel(rule)"
              :value="rule.id"
              :disabled="rule.status !== 0"
            />
          </el-select>
        </el-form-item>
      </section>

      <section class="preview-panel">
        <div>
          <h3>匹配试算</h3>
          <p>输入数据库返回的实际字段类型，检查当前已保存配置的匹配结果。</p>
        </div>
        <div class="preview-action">
          <el-input
            v-model="previewActualType"
            aria-label="实际类型试算"
            placeholder="例如 VARCHAR2(100)"
            @keyup.enter="preview"
          />
          <el-button type="primary" :loading="previewing" @click="preview">试算</el-button>
        </div>
        <div
          v-if="previewResult"
          :class="['preview-result', `is-${previewResult.status.toLowerCase()}`]"
        >
          {{ previewText }}
        </div>
      </section>
    </el-form>

    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" :loading="saving" @click="save">保存</el-button>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import * as PreprocessingApi from '@/api/dataMarket/preprocessing'
import type {
  FieldTypeMatcherVO,
  FieldTypeMatchPreviewVO,
  LogicalFieldTypeVO,
  PreprocessingRuleVO
} from '@/api/dataMarket/preprocessing'
import { useMessage } from '@/hooks/web/useMessage'

defineOptions({ name: 'DataMarketLogicalFieldType' })

const message = useMessage()
const loading = ref(false)
const saving = ref(false)
const previewing = ref(false)
const list = ref<LogicalFieldTypeVO[]>([])
const total = ref(0)
const visible = ref(false)
const formRef = ref<any>()
const ruleOptions = ref<PreprocessingRuleVO[]>([])
const previewActualType = ref('')
const previewResult = ref<FieldTypeMatchPreviewVO>()
const query = reactive<{ pageNo: number; pageSize: number; keyword: string; status?: number }>({
  pageNo: 1,
  pageSize: 10,
  keyword: '',
  status: undefined
})
const form = reactive<LogicalFieldTypeVO>(emptyForm())
const rules = {
  code: [{ required: true, message: '请输入类型编码', trigger: 'blur' }],
  name: [{ required: true, message: '请输入类型名称', trigger: 'blur' }],
  status: [{ required: true, message: '请选择状态', trigger: 'change' }],
  sort: [{ required: true, message: '请输入排序', trigger: 'change' }]
}

function emptyForm(): LogicalFieldTypeVO {
  return {
    id: undefined,
    code: '',
    name: '',
    description: '',
    sort: 0,
    status: 0,
    matchers: [],
    ruleTemplateIds: []
  }
}

function emptyMatcher(index: number): FieldTypeMatcherVO {
  return {
    matchMode: 'EXACT',
    matchExpression: '',
    priority: 100,
    sort: (index + 1) * 10,
    status: 0,
    description: ''
  }
}

const previewText = computed(() => {
  const result = previewResult.value
  if (!result) return ''
  if (result.status === 'MATCHED' && result.logicalType) {
    return `匹配结果：${result.logicalType.name}（${result.logicalType.code}）`
  }
  if (result.status === 'CONFLICT') {
    const candidates = result.candidates.map((item) => `${item.name}（${item.code}）`).join('、')
    return `匹配冲突：${candidates || '存在多个同优先级类型'}`
  }
  return '未匹配到逻辑字段类型'
})

const getList = async () => {
  loading.value = true
  try {
    const data = await PreprocessingApi.getLogicalFieldTypePage(query)
    list.value = data.list
    total.value = data.total
  } catch {
    list.value = []
    total.value = 0
    message.error('字段类型配置加载失败，请稍后重试')
  } finally {
    loading.value = false
  }
}

const loadRules = async () => {
  try {
    ruleOptions.value = await PreprocessingApi.getEnabledPreprocessingRules()
  } catch {
    ruleOptions.value = []
    message.error('预处理规则选项加载失败，请稍后重试')
  }
}

const handleQuery = () => {
  query.pageNo = 1
  getList()
}

const resetQuery = () => {
  query.keyword = ''
  query.status = undefined
  handleQuery()
}

const open = async (row?: LogicalFieldTypeVO) => {
  let detail = row
  if (row?.id) {
    detail = await PreprocessingApi.getLogicalFieldType(row.id)
  }
  const next = detail || emptyForm()
  Object.assign(form, emptyForm(), next, {
    matchers: (next.matchers || []).map((matcher) => ({ ...matcher })),
    ruleTemplateIds: [...(next.ruleTemplateIds || [])]
  })

  // 已停用的历史规则仍需按名称展示，但不能被其他类型重新选择。
  for (const historicalRule of next.ruleTemplates || []) {
    if (!ruleOptions.value.some((rule) => rule.id === historicalRule.id)) {
      ruleOptions.value.push({ ...historicalRule })
    }
  }
  previewActualType.value = ''
  previewResult.value = undefined
  visible.value = true
}

const addMatcher = () => {
  form.matchers.push(emptyMatcher(form.matchers.length))
}

const removeMatcher = (index: number) => {
  form.matchers.splice(index, 1)
}

const matcherKey = (matcher: FieldTypeMatcherVO, index: number) => matcher.id || `new-${index}`

const matcherError = () => {
  for (let index = 0; index < form.matchers.length; index += 1) {
    const matcher = form.matchers[index]
    if (!matcher.matchExpression.trim()) return `请填写匹配条件 ${index + 1} 的表达式`
    if (matcher.matchMode === 'REGEX') {
      try {
        new RegExp(matcher.matchExpression)
      } catch {
        return `匹配条件 ${index + 1} 的正则表达式无效`
      }
    }
  }
  return ''
}

const save = async () => {
  if (!(await formRef.value.validate())) return
  const invalidMatcherMessage = matcherError()
  if (invalidMatcherMessage) {
    message.warning(invalidMatcherMessage)
    return
  }

  // 页面只展示名称和编码；内部关联值仅作为接口载荷提交。
  const payload: LogicalFieldTypeVO = {
    code: form.code,
    name: form.name,
    description: form.description,
    sort: form.sort,
    status: form.status,
    matchers: form.matchers.map((matcher) => ({
      matchMode: matcher.matchMode,
      matchExpression: matcher.matchExpression,
      priority: matcher.priority,
      sort: matcher.sort,
      status: matcher.status,
      description: matcher.description
    })),
    ruleTemplateIds: [...form.ruleTemplateIds]
  }

  saving.value = true
  try {
    form.id
      ? await PreprocessingApi.updateLogicalFieldType(form.id, payload)
      : await PreprocessingApi.createLogicalFieldType(payload)
    visible.value = false
    message.success('保存成功')
    await getList()
  } finally {
    saving.value = false
  }
}

const preview = async () => {
  const actualType = previewActualType.value.trim()
  if (!actualType) {
    message.warning('请输入实际字段类型')
    return
  }
  previewing.value = true
  try {
    previewResult.value = await PreprocessingApi.previewFieldType(actualType)
  } catch {
    previewResult.value = undefined
    message.error('匹配试算失败，请稍后重试')
  } finally {
    previewing.value = false
  }
}

const remove = async (id: number) => {
  await message.delConfirm()
  await PreprocessingApi.deleteLogicalFieldType(id)
  message.success('删除成功')
  await getList()
}

const ruleLabel = (rule: PreprocessingRuleVO) =>
  `${rule.name}（${rule.code}）${rule.status === 0 ? '' : ' · 已停用'}`

onMounted(() => {
  getList()
  loadRules()
})
</script>

<style scoped>
.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.muted,
.editor-section p,
.preview-panel p {
  margin: 4px 0 0;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.editor-section {
  padding: 16px 18px 4px;
  margin-bottom: 16px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
}

.section-heading,
.matcher-title {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 14px;
}

.section-heading h3,
.preview-panel h3 {
  margin: 0;
  font-size: 15px;
  color: var(--el-text-color-primary);
}

.base-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  column-gap: 20px;
}

.grid-span {
  grid-column: 1 / -1;
}

.matcher-list {
  display: grid;
  gap: 10px;
  margin-bottom: 14px;
}

.matcher-card {
  padding: 12px 14px 2px;
  background: var(--el-fill-color-lighter);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 7px;
}

.matcher-title {
  align-items: center;
  margin-bottom: 8px;
}

.matcher-grid {
  display: grid;
  grid-template-columns: minmax(160px, 0.8fr) minmax(260px, 1.5fr) minmax(150px, 0.7fr);
  column-gap: 14px;
}

.matcher-description {
  grid-column: span 2;
}

.empty-state {
  padding: 18px;
  margin-bottom: 14px;
  color: var(--el-text-color-secondary);
  text-align: center;
  border: 1px dashed var(--el-border-color);
  border-radius: 7px;
}

.preview-panel {
  display: grid;
  padding: 16px 18px;
  background: var(--el-fill-color-light);
  border-radius: 8px;
  grid-template-columns: minmax(240px, 0.8fr) minmax(360px, 1.2fr);
  gap: 14px 24px;
}

.preview-action {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 10px;
  align-items: center;
}

.preview-result {
  padding: 10px 12px;
  font-weight: 500;
  border-radius: 6px;
  grid-column: 1 / -1;
}

.preview-result.is-matched {
  color: var(--el-color-success-dark-2);
  background: var(--el-color-success-light-9);
}

.preview-result.is-unmatched {
  color: var(--el-text-color-regular);
  background: var(--el-fill-color);
}

.preview-result.is-conflict {
  color: var(--el-color-warning-dark-2);
  background: var(--el-color-warning-light-9);
}

@media (width <= 900px) {
  .base-grid,
  .matcher-grid,
  .preview-panel {
    grid-template-columns: 1fr;
  }

  .grid-span,
  .matcher-description,
  .preview-result {
    grid-column: auto;
  }
}
</style>
