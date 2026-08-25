<template>
  <ContentWrap>
    <el-form :model="query" inline>
      <el-form-item label="关键词">
        <el-input
          v-model="query.keyword"
          clearable
          placeholder="搜索规则名称、编码、分类或说明"
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
          v-hasPermi="['data-market:preprocessing-rule:create']"
          type="primary"
          plain
          @click="open()"
        >
          新增预处理规则
        </el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>

  <ContentWrap>
    <el-table v-loading="loading" :data="list">
      <el-table-column prop="name" label="规则名称" min-width="180" />
      <el-table-column prop="code" label="规则编码" min-width="150" />
      <el-table-column prop="category" label="分类" min-width="130" />
      <el-table-column prop="description" label="规则说明" min-width="220" show-overflow-tooltip />
      <el-table-column label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="row.status === 0 ? 'success' : 'info'">
            {{ row.status === 0 ? '启用' : '停用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="sort" label="排序" width="90" />
      <el-table-column label="操作" width="150" fixed="right">
        <template #default="{ row }">
          <el-button
            v-hasPermi="['data-market:preprocessing-rule:update']"
            link
            type="primary"
            @click="open(row)"
          >
            编辑
          </el-button>
          <el-button
            v-hasPermi="['data-market:preprocessing-rule:delete']"
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

  <Dialog v-model="visible" :title="form.id ? '编辑预处理规则' : '新增预处理规则'" width="660px">
    <el-form ref="formRef" :model="form" :rules="rules" label-width="120px">
      <el-form-item label="规则编码" prop="code">
        <el-input v-model="form.code" maxlength="64" placeholder="例如 TRIM" />
      </el-form-item>
      <el-form-item label="规则名称" prop="name">
        <el-input v-model="form.name" maxlength="128" placeholder="例如 去除首尾空格" />
      </el-form-item>
      <el-form-item label="分类" prop="category">
        <el-input v-model="form.category" maxlength="64" placeholder="例如 STANDARDIZE" />
      </el-form-item>
      <el-form-item label="规则说明" prop="description">
        <el-input
          v-model="form.description"
          type="textarea"
          :rows="3"
          maxlength="2000"
          show-word-limit
          placeholder="说明规则用途、适用边界和预期结果"
        />
      </el-form-item>
      <el-form-item label="参数结构 JSON" prop="parameterSchema">
        <el-input
          v-model="form.parameterSchema"
          aria-label="参数结构 JSON"
          type="textarea"
          :rows="5"
          :placeholder="parameterSchemaPlaceholder"
          @input="schemaError = ''"
        />
      </el-form-item>
      <el-alert
        v-if="schemaError"
        class="schema-alert"
        :title="schemaError"
        type="error"
        :closable="false"
        show-icon
      />
      <div class="form-grid">
        <el-form-item label="排序" prop="sort">
          <el-input-number v-model="form.sort" :min="0" :max="9999" controls-position="right" />
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
      </div>
    </el-form>
    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" :loading="saving" @click="save">保存</el-button>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import * as PreprocessingApi from '@/api/dataMarket/preprocessing'
import type { PreprocessingRuleVO } from '@/api/dataMarket/preprocessing'
import { useMessage } from '@/hooks/web/useMessage'

defineOptions({ name: 'DataMarketPreprocessingRule' })

const message = useMessage()
const parameterSchemaPlaceholder = '例如 {"type":"object","properties":{}}'
const loading = ref(false)
const saving = ref(false)
const list = ref<PreprocessingRuleVO[]>([])
const total = ref(0)
const visible = ref(false)
const schemaError = ref('')
const formRef = ref<any>()
const query = reactive<{ pageNo: number; pageSize: number; keyword: string; status?: number }>({
  pageNo: 1,
  pageSize: 10,
  keyword: '',
  status: undefined
})
const form = reactive<PreprocessingRuleVO>(emptyForm())
const rules = {
  code: [{ required: true, message: '请输入规则编码', trigger: 'blur' }],
  name: [{ required: true, message: '请输入规则名称', trigger: 'blur' }],
  category: [{ required: true, message: '请输入规则分类', trigger: 'blur' }],
  status: [{ required: true, message: '请选择状态', trigger: 'change' }],
  sort: [{ required: true, message: '请输入排序', trigger: 'change' }]
}

function emptyForm(): PreprocessingRuleVO {
  return {
    id: undefined,
    code: '',
    name: '',
    category: '',
    description: '',
    parameterSchema: '{}',
    sort: 0,
    status: 0
  }
}

const getList = async () => {
  loading.value = true
  try {
    const data = await PreprocessingApi.getPreprocessingRulePage(query)
    list.value = data.list
    total.value = data.total
  } catch {
    list.value = []
    total.value = 0
    message.error('预处理规则配置加载失败，请稍后重试')
  } finally {
    loading.value = false
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

const open = (row?: PreprocessingRuleVO) => {
  Object.assign(form, emptyForm(), row || {})
  schemaError.value = ''
  visible.value = true
}

const isParameterSchemaValid = () => {
  schemaError.value = ''
  if (!form.parameterSchema?.trim()) return true
  try {
    JSON.parse(form.parameterSchema)
    return true
  } catch {
    schemaError.value = '参数结构必须是合法 JSON'
    return false
  }
}

const save = async () => {
  if (!(await formRef.value.validate()) || !isParameterSchemaValid()) return
  saving.value = true
  try {
    form.id
      ? await PreprocessingApi.updatePreprocessingRule(form.id, form)
      : await PreprocessingApi.createPreprocessingRule(form)
    visible.value = false
    message.success('保存成功')
    await getList()
  } finally {
    saving.value = false
  }
}

const remove = async (id: number) => {
  await message.delConfirm()
  await PreprocessingApi.deletePreprocessingRule(id)
  message.success('删除成功')
  await getList()
}

onMounted(getList)
</script>

<style scoped>
.schema-alert {
  width: calc(100% - 120px);
  margin: -4px 0 18px 120px;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}
</style>
